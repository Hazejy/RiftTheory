import { describe, expect, test } from "bun:test";
import { DRAFT_PICK_ORDER } from "./draftOrder";
import { draftCoachWindow, sameSlotAlternative } from "./draftCoach";

const slots = () => ({
    ally: Array.from({ length: 5 }, () => ({ championKey: "" })),
    opponent: Array.from({ length: 5 }, () => ({ championKey: "" })),
});

describe("all-slot draft coach window", () => {
    test("covers every pick with the actual following pick/ban sequence", () => {
        for (const [index, step] of DRAFT_PICK_ORDER.entries()) {
            const teams = slots();
            for (const earlier of DRAFT_PICK_ORDER.slice(0, index))
                teams[earlier.team][earlier.index].championKey = "chosen";
            const result = draftCoachWindow(step, [step], teams);
            expect(result?.questions).toHaveLength(1);
            expect(result?.chronological).toBe(true);
        }
        expect(draftCoachWindow(DRAFT_PICK_ORDER[4], [DRAFT_PICK_ORDER[4]], slots())?.nextActions)
            .toEqual(["R3", "Red ban 4", "Blue ban 4", "Red ban 5", "Blue ban 5", "R4", "B4"]);
        expect(draftCoachWindow(DRAFT_PICK_ORDER[9], [DRAFT_PICK_ORDER[9]], slots())?.nextActions).toEqual([]);
        expect(draftCoachWindow(DRAFT_PICK_ORDER[0], [DRAFT_PICK_ORDER[0]], slots())?.nextOpponentPick).toBe("R1");
        expect(draftCoachWindow(DRAFT_PICK_ORDER[5], [DRAFT_PICK_ORDER[5]], slots())?.nextOpponentPick).toBeUndefined();
        expect(draftCoachWindow(DRAFT_PICK_ORDER[5], [DRAFT_PICK_ORDER[5]], slots())?.bansBeforeReply).toEqual([
            "Red ban 4", "Blue ban 4", "Red ban 5", "Blue ban 5",
        ]);
        expect(draftCoachWindow(DRAFT_PICK_ORDER[6], [DRAFT_PICK_ORDER[6]], slots())?.nextOpponentPick).toBe("B4");
    });

    test("marks a completed-draft replacement as retrospective", () => {
        const teams = slots();
        teams.ally[0].championKey = "old";
        expect(draftCoachWindow(DRAFT_PICK_ORDER[0], [DRAFT_PICK_ORDER[0]], teams)?.chronological).toBe(false);
    });
});

test("same-slot comparison keeps pair windows and role assignments distinct", () => {
    const selected = { picks: [{ key: "A", role: "top" }, { key: "B", role: "mid" }] };
    const reordered = { picks: [{ key: "B", role: "mid" }, { key: "A", role: "top" }] };
    const single = { picks: [{ key: "C", role: "top" }] };
    const roleAlternative = { picks: [{ key: "A", role: "mid" }, { key: "B", role: "top" }] };
    expect(sameSlotAlternative(selected, [reordered, single, roleAlternative]))
        .toBe(roleAlternative);
    expect(sameSlotAlternative(selected, [reordered, single])).toBeUndefined();
});
