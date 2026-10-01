type StorageAccess = Pick<Storage, "getItem" | "setItem">;

export function readStoredValue(key: string, access: () => StorageAccess = () => localStorage) {
    try { return access().getItem(key); } catch { return null; }
}

export function writeStoredValue(key: string, value: string, access: () => StorageAccess = () => localStorage) {
    try { access().setItem(key, value); return true; } catch { return false; }
}
