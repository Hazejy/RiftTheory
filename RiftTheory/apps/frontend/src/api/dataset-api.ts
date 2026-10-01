import { invoke, isTauri } from "@tauri-apps/api/core";

export async function fetchDatasetJson<T>(url: string): Promise<T> {
    // The RiftTheory bucket supports browser requests and this is the path used by
    // the known-good desktop releases. Keep it in the WebView: the native HTTP
    // client does not inherit every user's proxy/network configuration.
    // GitHub release assets still need the native bridge to avoid WebView CORS.
    if (isTauri() && url.includes("/releases/download/datasets-v")) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const text = await Promise.race([
            invoke<string>("fetch_rank_dataset", { url }),
            new Promise<never>((_, reject) => {
                // The 30-day high-Elo exports can be close to 50 MB.
                timeout = setTimeout(() => reject(new Error("Dataset request timed out")), 190_000);
            }),
        ]).finally(() => clearTimeout(timeout));
        return JSON.parse(text) as T;
    }

    const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
        throw new Error(`Dataset request failed: ${response.status}`);
    return (await response.json()) as T;
}
