#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use reqwest::Client;
use serde::Serialize;
use serde_json::Value;
use tauri::async_runtime::Mutex;

struct AppState {
    lcu_data: Mutex<Option<LcuData>>,
    client: Client,
}

#[derive(Serialize, Debug)]
struct LcuData {
    port: u16,
    password: String,
    username: String,
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

    let port_regex = regex::Regex::new(r#"--app-port=["']?([0-9]+)"#)
        .map_err(|e| format!("Could not create port regex: {e}"))?;

    let password_regex = regex::Regex::new(r#"--remoting-auth-token=["']?([^\s"']+)"#)
        .map_err(|e| format!("Could not create password regex: {e}"))?;

    let port: u16 = port_regex
        .captures(&output_str)
        .ok_or_else(|| {
            "League client not found or its process information is unavailable.".to_owned()
        })?
        .get(1)
        .ok_or_else(|| "Could not find port".to_owned())?
        .as_str()
        .parse()
        .map_err(|_| "Could not parse port".to_owned())?;

    let password = password_regex
        .captures(&output_str)
        .ok_or_else(|| "Could not find LCU authentication token".to_owned())?
        .get(1)
        .ok_or_else(|| "Could not find password".to_owned())?
        .as_str()
        .to_owned();

    Ok(LcuData {
        port,
        password,
        username: "riot".to_owned(),
    })
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
            get_gameflow_phase
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
