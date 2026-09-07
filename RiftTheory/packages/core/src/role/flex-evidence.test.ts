import { describe, expect, test } from "bun:test";
import { assessObservedRoles, flexStrengthForShare } from "./flex-evidence";

describe("observed secondary-role flex policy", () => {
    test.each([
        [0.0499, "none"], [0.05, "niche"], [0.0999, "niche"],
        [0.10, "real"], [0.1999, "real"], [0.20, "strong"],
        [0.3499, "strong"], [0.35, "veryStrong"],
    ] as const)("share %s maps to %s", (share, band) => {
        expect(flexStrengthForShare(share)).toBe(band);
    });

    const assess = (secondaryGames: number, total = 10_000) =>
        assessObservedRoles([
            { role: "mid", games: total - secondaryGames, sampleTotal: total, roleShare: 1 - secondaryGames / total },
            { role: "support", games: secondaryGames, sampleTotal: total, roleShare: secondaryGames / total },
        ]);

    test("niche usage never counts as a real flex pick", () => {
        expect(assess(499).roles[1].tier).toBe("insufficient");
        expect(assess(500).roles[1].tier).toBe("emerging");
        expect(assess(999).isFlexCandidate).toBe(false);
        expect(assess(1000).isFlexCandidate).toBe(true);
    });

    test("large percentages with small samples remain insufficient", () => {
        expect(assess(35, 100).sampleSufficient).toBe(false);
        expect(assess(200, 1000).roles[1].tier).toBe("insufficient");
        expect(assess(200, 1000).isFlexCandidate).toBe(false);
    });
});
