import { expect, test } from "bun:test";
import { canAssignPlayerPicks, playerComfort, type DraftPlayerPool } from "./player-pool";

const players: DraftPlayerPool[] = [
    { id: "one", name: "One", roles: ["top", "mid"], availableChampionKeys: ["Flex", "Top"],
        comfortableChampionKeys: ["Flex"], source: "player", updatedAt: "2026-09-27", confidence: "self_reported" },
    { id: "two", name: "Two", roles: ["mid"], availableChampionKeys: ["Mid"],
        source: "player", updatedAt: "2026-09-27", confidence: "self_reported" },
];

test("player ownership is hard while flex and unknown slots remain legal", () => {
    expect(canAssignPlayerPicks([{ key: "Flex", possibleRoles: ["top", "mid"] },
        { key: "Mid", role: "mid", possibleRoles: ["mid"] }], players)).toBe(true);
    expect(canAssignPlayerPicks([{ key: "Flex", role: "mid", possibleRoles: ["top", "mid"] },
        { key: "Top", role: "top", possibleRoles: ["top"] }], players)).toBe(false);
    expect(canAssignPlayerPicks([{ key: "Other", role: "top", possibleRoles: ["top"] }], players)).toBe(false);
    expect(canAssignPlayerPicks([{ key: "Other", role: "jungle", possibleRoles: ["jungle"] }], players)).toBe(true);
    expect(canAssignPlayerPicks([{ key: "Other", role: "top", possibleRoles: ["top"] }], [])).toBe(true);
    expect(playerComfort({ key: "Flex", role: "top", possibleRoles: ["top"] }, players)).toBe("reported");
    expect(playerComfort({ key: "Top", role: "top", possibleRoles: ["top"] }, players)).toBe("unknown");
});
