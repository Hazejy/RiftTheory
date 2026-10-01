export type WorkspaceKind = "draft-prep" | "rift-planner";
export type StoredWorkspace<T> = {
    id: string;
    kind: WorkspaceKind;
    name: string;
    updatedAt: string;
    data: T;
};

const STORAGE_KEY = "rifttheory.workspace-library.v1";
type StorageAccess = Pick<Storage, "getItem" | "setItem">;

export function readLibrary<T>(storage: StorageAccess = localStorage): StoredWorkspace<T>[] {
    try {
        const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(value)) return [];
        return value.filter((record): record is StoredWorkspace<T> =>
            record && typeof record === "object" &&
            typeof record.id === "string" &&
            (record.kind === "draft-prep" || record.kind === "rift-planner") &&
            typeof record.name === "string" &&
            typeof record.updatedAt === "string" &&
            record.data !== undefined,
        );
    } catch {
        return [];
    }
}

export function writeLibrary<T>(records: StoredWorkspace<T>[], storage: StorageAccess = localStorage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(records));
}
