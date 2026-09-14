import { invoke, isTauri } from "@tauri-apps/api/core";

export async function fetchDatasetJson<T>(url: string): Promise<T> {
    if (
        isTauri() &&
        (url.includes("https://bucket.draftgap.com/datasets/v") ||
            url.includes("/releases/download/datasets-v"))
    ) {
        const text = await invoke<string>("fetch_rank_dataset", { url });
        return JSON.parse(text) as T;
    }

    const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
        throw new Error(`Dataset request failed: ${response.status}`);
    return (await response.json()) as T;
}
