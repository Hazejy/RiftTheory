import { expect, test } from "bun:test";
import { readStoredValue, writeStoredValue } from "./safeStorage";

test("unavailable local storage cannot crash preference loading", () => {
    const unavailable = () => { throw new Error("storage disabled"); };
    expect(readStoredValue("config", unavailable)).toBeNull();
    expect(writeStoredValue("config", "{}", unavailable)).toBe(false);
});
