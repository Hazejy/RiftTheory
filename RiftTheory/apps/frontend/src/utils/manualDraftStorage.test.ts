import { expect, test } from "bun:test";
import { hasSavedPicks, nextManualDraftStep, parseManualDraft, serializeManualDraft } from "./manualDraftStorage";
import type { ManualDraft } from "./manualDraftStorage";

const empty = Array.from({ length: 5 }, () => ({ championKey: undefined, role: undefined }));

test("a valid manual board survives serialization without transient hover state", () => {
    const board: ManualDraft = { ally: [{ championKey: "12", role: 4 }, ...empty.slice(1)], opponent: empty };
    expect(parseManualDraft(serializeManualDraft(board))).toEqual(board);
});

test("corrupt, duplicate and impossible saved boards are rejected", () => {
    expect(parseManualDraft("broken")).toBeUndefined();
    expect(parseManualDraft(JSON.stringify({ version: 1, ally: [], opponent: [] }))).toBeUndefined();
    const duplicate: ManualDraft = { ally: [{ championKey: "12", role: 4 }, ...empty.slice(1)], opponent: [{ championKey: "12", role: 0 }, ...empty.slice(1)] };
    expect(parseManualDraft(serializeManualDraft(duplicate))).toBeUndefined();
    const badRole = { ally: [{ championKey: "12", role: 9 }, ...empty.slice(1)], opponent: empty };
    expect(parseManualDraft(JSON.stringify({ version: 1, ...badRole }))).toBeUndefined();
});

test("a restored or redone B1 advances the active decision to R1", () => {
    const board: ManualDraft = { ally: [{ championKey: "22", role: 3 }, ...empty.slice(1)], opponent: empty };
    expect(nextManualDraftStep(board)).toEqual({ team: "opponent", index: 0 });
    expect(nextManualDraftStep({ ally: empty, opponent: empty })).toEqual({ team: "ally", index: 0 });
});

test("an intentional or unexpected clear retains a recoverable nonempty board", () => {
    const prior: ManualDraft = { ally: [{ championKey: "22", role: 3 }, ...empty.slice(1)], opponent: empty };
    expect(hasSavedPicks(prior)).toBe(true);
    expect(hasSavedPicks({ ally: empty, opponent: empty })).toBe(false);
});
