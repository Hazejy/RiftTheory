#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use reqwest::Client;
use serde::Serialize;
use serde_json::Value;
use std::path::PathBuf;
use tauri::async_runtime::Mutex;

struct AppState {
    lcu_data: Mutex<Option<LcuData>>,
    client: Client,
    data_client: Client,
}

#[derive(Serialize, Debug)]
struct LcuData {
    port: u16,
    password: String,
    username: String,
}

fn parse_lcu_command_line(command_line: &str) -> Option<LcuData> {
    let port = regex::Regex::new(r#"--app-port=["']?([0-9]+)"#)
        .ok()?
        .captures(command_line)?
        .get(1)?
        .as_str()
        .parse()
        .ok()?;
    let password = regex::Regex::new(r#"--remoting-auth-token=["']?([^s"']+)"#)
        .ok()?
        .captures(command_line)?
        .get(1)?
        .as_str()
        .trim_end_matches('"')
        .to_owned();
    Some(LcuData { port, password, username: "riot".to_owned() })
}

fn parse_lockfile(path: &PathBuf) -> Option<LcuData> {
    let contents = std::fs::read_to_string(path).ok()?;
    let fields: Vec<&str> = contents.trim().split(':').collect();
    if fields.len() < 5 { return None; }
    Some(LcuData {
        port: fields.get(2)?.parse().ok()?,
        password: fields.get(3)?.to_string(),
        username: fields.get(4)?.to_string(),
    })
}

#[cfg(target_os = "windows")]
fn windows_lockfile_candidates() -> Vec<PathBuf> {
    let mut paths = vec![
        PathBuf::from(r"C:Riot GamesLeague of Legendslockfile"),
        PathBuf::from(r"C:Program FilesRiot GamesLeague of Legendslockfile"),
        PathBuf::from(r"C:Program Files (x86)Riot GamesLeague of Legendslockfile"),
    ];
    if let Some(root) = std::env::var_os("ProgramFiles") {
        paths.push(PathBuf::from(root).join("Riot Games/League of Legends/lockfile"));
    }
    if let Some(root) = std::env::var_os("ProgramFiles(x86)") {
        paths.push(PathBuf::from(root).join("Riot Games/League of Legends/lockfile"));
    }
    if let Some(root) = std::env::var_os("LOCALAPPDATA") {
        let root = PathBuf::from(root);
        paths.push(root.join("Riot Games/League of Legends/lockfile"));
        paths.push(root.join("Riot Games/Riot Client/Config/lockfile"));
    }
    paths
}

fn get_league_lcu_data() -> Result<LcuData, String> {
    #[cfg(not(target_os = "windows"))]
    let output = std::process::Command::new("sh")
        .arg("-lc")
        .arg("ps axww -o args | grep -F 'LeagueClientUx ' | grep -v grep | head -n 1")
        .output()
        .map_err(|_| "Could not run command")?;

    #[cfg(target_os = "windows")]
    let output = {
        match std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(
                "Get-CimInstance -Query \"SELECT * from Win32_Process WHERE name = 'LeagueClientUx.exe'\" | \
                 Select-Object -ExpandProperty CommandLine",
            )
            .creation_flags(0x08000000)
            .output()
        {
            Ok(output) => Ok(output),
            Err(_) => std::process::Command::new(
                r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
            )
            .arg("-NoProfile")
            .arg("-Command")
            .arg(
                "Get-CimInstance -Query \"SELECT * from Win32_Process WHERE name = 'LeagueClientUx.exe'\" | \
                 Select-Object -ExpandProperty CommandLine",
            )
            .creation_flags(0x08000000)
            .output(),
        }
    }
    .map_err(|e| format!("Could not run command: {e}"))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    if let Some(data) = parse_lcu_command_line(&output_str) {
        return Ok(data);
    }

    #[cfg(target_os = "windows")]
    for path in windows_lockfile_candidates() {
        if let Some(data) = parse_lockfile(&path) {
            return Ok(data);
        }
    }

    Err("League client not found. Start League of Legends and sign in first.".to_owned())
}

async fn get_lcu_response(state: &tauri::State<'_, AppState>, path: &str) -> Result<Value, String> {
    let mut lcu_data_mutex = state.lcu_data.lock().await;

    if lcu_data_mutex.is_none() {
        let new_lcu_data =
            get_league_lcu_data().map_err(|e| format!("Could not get LCU data: {e}"))?;

        *lcu_data_mutex = Some(new_lcu_data);
    }

    let lcu_data = lcu_data_mutex
        .as_ref()
        .ok_or_else(|| "LCU data is unavailable".to_owned())?;

    let url = format!("https://127.0.0.1:{}/{}", lcu_data.port, path);

    let response = state
        .client
        .get(url)
        .basic_auth(&lcu_data.username, Some(&lcu_data.password))
        .send()
        .await;

    let response = match response {
        Ok(response) => response,
        Err(e) => {
            *lcu_data_mutex = None;
            return Err(format!("Could not get LCU response: {e}"));
        }
    };

    let status = response.status();

    let body = response
        .text()
        .await
        .map_err(|e| format!("Could not read response body: {e}"))?;

    let is_champ_select_endpoint = path.starts_with("lol-champ-select");

    if status == reqwest::StatusCode::NOT_FOUND
        || (is_champ_select_endpoint && status == reqwest::StatusCode::FORBIDDEN)
    {
        return Ok(Value::Null);
    }

    if status == reqwest::StatusCode::UNAUTHORIZED {
        *lcu_data_mutex = None;
        return Err("LCU returned Unauthorized".to_owned());
    }

    if !status.is_success() {
        return Err(format!("LCU returned {status}"));
    }

    serde_json::from_str(&body).map_err(|_| "Invalid League client response".to_owned())
}

#[tauri::command]
async fn get_champ_select_session(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let session = get_lcu_response(&state, "lol-champ-select/v1/session").await?;
    if !session.is_null() {
        return Ok(session);
    }
    // Custom / practice champion selection can use the legacy service.
    get_lcu_response(&state, "lol-champ-select-legacy/v1/session").await
}

#[tauri::command]
async fn get_gameflow_phase(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    get_lcu_response(&state, "lol-gameflow/v1/gameflow-phase").await
}

#[tauri::command]
async fn get_current_summoner(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    get_lcu_response(&state, "lol-summoner/v1/current-summoner").await
}

#[tauri::command]
async fn get_grid_champions(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    get_lcu_response(&state, "lol-champ-select/v1/all-grid-champions").await
}

#[tauri::command]
async fn get_pickable_champion_ids(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    get_lcu_response(&state, "lol-champ-select/v1/pickable-champion-ids").await
}

#[tauri::command]
async fn get_league_connection_status(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    match get_lcu_response(&state, "lol-summoner/v1/current-summoner").await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn fetch_rank_dataset(
    state: tauri::State<'_, AppState>,
    url: String,
) -> Result<String, String> {
    const RELEASE_PREFIX: &str =
        "https://github.com/Hazejy/RiftTheory/releases/download/datasets-v5/";
    const BUCKET_PREFIX: &str = "https://bucket.draftgap.com/datasets/v5/";
    let file_name = url
        .strip_prefix(RELEASE_PREFIX)
        .or_else(|| url.strip_prefix(BUCKET_PREFIX))
        .ok_or_else(|| "Rank dataset URL is not allowed".to_owned())?;
    let valid_file =
        regex::Regex::new(
            r"^(current-patch|30-days)(-(diamond_plus|master_plus))?\.json$",
        )
            .map_err(|e| format!("Could not validate rank dataset URL: {e}"))?;
    if !valid_file.is_match(file_name) {
        return Err("Rank dataset file is not allowed".to_owned());
    }

    let response = state
        .data_client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Could not download rank dataset: {e}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Rank dataset server returned {}",
            response.status()
        ));
    }
    response
        .text()
        .await
        .map_err(|e| format!("Could not read rank dataset: {e}"))
}

fn main() {
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .no_proxy()
        .connect_timeout(std::time::Duration::from_secs(2))
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .expect("Could not build HTTP client");

    let state = AppState {
        lcu_data: Mutex::new(None),
        client,
        data_client: Client::builder()
            .connect_timeout(std::time::Duration::from_secs(5))
            // High-Elo 30-day exports can be close to 50 MB. The former
            // 20-second limit incorrectly reported these published files as
            // unavailable on slower connections.
            .timeout(std::time::Duration::from_secs(180))
            .build()
            .expect("Could not build rank dataset client"),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_champ_select_session,
            get_current_summoner,
            get_grid_champions,
            get_pickable_champion_ids,
            get_league_connection_status,
            get_gameflow_phase,
            fetch_rank_dataset
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
