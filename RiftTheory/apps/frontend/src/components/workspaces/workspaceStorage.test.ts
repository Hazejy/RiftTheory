import { expect, test } from "bun:test";
import { readLibrary, writeLibrary } from "./workspaceStorage";

test("workspace storage filters invalid records and preserves valid ones", () => {
    let raw = JSON.stringify([
        { id: "one", kind: "draft-prep", name: "Plan", updatedAt: "2026-09-27", data: { picks: [] } },
        { id: 2, kind: "draft-prep", name: "Invalid", data: {} },
    ]);
    const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; } };
    const records = readLibrary(storage);
    expect(records).toHaveLength(1);
    writeLibrary(records, storage);
    expect(readLibrary(storage)).toEqual(records);
});
