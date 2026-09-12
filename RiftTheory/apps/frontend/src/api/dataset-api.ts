import { invoke, isTauri } from "@tauri-apps/api/core";

export async function fetchDatasetJson<T>(url: string): Promise<T> {
    if (isTauri() && url.includes("/releases/download/datasets-v")) {
        const text = await invoke<string>("fetch_rank_dataset", { url });
        return JSON.parse(text) as T;
    }

    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Dataset request failed: ${response.status}`);
    return (await response.json()) as T;
}
