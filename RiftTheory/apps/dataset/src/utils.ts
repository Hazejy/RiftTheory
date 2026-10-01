export function bytesToHumanReadable(size: number) {
    const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));

    return `${parseFloat((size / Math.pow(1024, i)).toFixed(2))} ${
        ["B", "kB", "MB", "GB", "TB"][i]
    }`;
}

export async function retry<
    T extends (...args: unknown[]) => Promise<Awaited<ReturnType<T>>>,
>(fn: T, retries = 5, signal?: AbortSignal): Promise<ReturnType<T>> {
    let error: unknown | undefined;
    for (let i = 0; i < retries; i++) {
        signal?.throwIfAborted();
        try {
            return await fn();
        } catch (e) {
            if (signal?.aborted) throw e;
            console.log("Retrying, error:", e);
            error = e;
        }
    }

    throw error;
}
