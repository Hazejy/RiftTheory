// Browser and Tauri WebView storage for the last successfully loaded datasets.
// Cache failures never block a network result or leave startup waiting forever.
const DATABASE = "rifttheory-statistics-v1";
const STORE = "datasets";

function openCache(): Promise<IDBDatabase | undefined> {
    if (typeof indexedDB === "undefined") return Promise.resolve(undefined);
    return new Promise((resolve) => {
        const request = indexedDB.open(DATABASE, 1);
        let settled = false;
        const finish = (database?: IDBDatabase) => {
            if (settled) { database?.close(); return; }
            settled = true;
            clearTimeout(timeout);
            resolve(database);
        };
        const timeout = setTimeout(() => finish(), 2_000);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE))
                request.result.createObjectStore(STORE);
        };
        request.onsuccess = () => finish(request.result);
        request.onerror = () => finish();
        request.onblocked = () => finish();
    });
}

export async function readCachedDataset(key: string): Promise<unknown> {
    const database = await openCache();
    if (!database) return undefined;
    try {
        return await new Promise((resolve) => {
            const request = database.transaction(STORE, "readonly").objectStore(STORE).get(key);
            const timeout = setTimeout(() => resolve(undefined), 2_000);
            request.onsuccess = () => { clearTimeout(timeout); resolve(request.result); };
            request.onerror = () => { clearTimeout(timeout); resolve(undefined); };
        });
    } catch {
        return undefined;
    } finally {
        database.close();
    }
}

export async function writeCachedDataset(key: string, value: unknown): Promise<void> {
    const database = await openCache();
    if (!database) return;
    try {
        await new Promise<void>((resolve) => {
            const transaction = database.transaction(STORE, "readwrite");
            transaction.objectStore(STORE).put(value, key);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => resolve();
            transaction.onabort = () => resolve();
        });
    } catch {
        // Quota or disabled storage must not affect the current network result.
    } finally {
        database.close();
    }
}
