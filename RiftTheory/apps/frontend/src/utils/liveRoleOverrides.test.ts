import { expect, test } from "bun:test";
import { Role } from "@rifttheory/core/src/models/Role";
import { createLiveRoleOverrides } from "./liveRoleOverrides";

test("manual Ekko Mid survives repeated live Jungle assignments until champion or session changes", () => {
    const overrides = createLiveRoleOverrides();
    overrides.set("opponent", 0, "245", Role.Middle);
    expect(overrides.resolve("opponent", 0, "245", Role.Jungle)).toBe(Role.Middle);
    expect(overrides.resolve("opponent", 0, "245", Role.Jungle)).toBe(Role.Middle);
    expect(overrides.resolve("opponent", 1, "245", Role.Jungle)).toBe(Role.Jungle);
    expect(overrides.resolve("opponent", 0, "64", Role.Jungle)).toBe(Role.Jungle);
    expect(overrides.resolve("opponent", 0, "245", Role.Jungle)).toBe(Role.Jungle);

    overrides.set("opponent", 0, "245", Role.Middle);
    overrides.clear();
    expect(overrides.resolve("opponent", 0, "245", Role.Jungle)).toBe(Role.Jungle);
});

test("manual unlock survives live assignments and another role can be selected directly", () => {
    const overrides = createLiveRoleOverrides();
    overrides.set("ally", 2, "245", undefined);
    expect(overrides.resolve("ally", 2, "245", Role.Jungle)).toBeUndefined();
    overrides.set("ally", 2, "245", Role.Top);
    expect(overrides.resolve("ally", 2, "245", Role.Jungle)).toBe(Role.Top);
    overrides.set("ally", 2, "245", Role.Middle);
    expect(overrides.resolve("ally", 2, "245", Role.Jungle)).toBe(Role.Middle);
});
