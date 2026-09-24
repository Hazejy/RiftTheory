import { describe, expect, test } from "bun:test";
import { assessStrategyOutcome } from "./strategyOutcome";
import type { StrategyReview } from "./strategyReview";

const review = (complete: boolean, issues: string[] = []) =>
    ({ complete, issues }) as StrategyReview;

describe("strategy outcome evidence gate", () => {
    test("withholds a winner for partial, invalid and detached live drafts", () => {
        expect(assessStrategyOutcome(review(false), 0.8, false).modelIndex).toBeUndefined();
        expect(assessStrategyOutcome(review(true, ["duplicate"]), 0.8, false).modelIndex).toBeUndefined();
        expect(assessStrategyOutcome(review(true), 0.8, true).modelIndex).toBeUndefined();
    });

    test("reports only a model lean for a valid complete main draft", () => {
        const blue = assessStrategyOutcome(review(true), 0.54, false);
        expect(blue.heading).toBe("Rating model leans Blue");
        expect(blue.modelIndex).toBeCloseTo(54);
        expect(blue.explanation).toContain("no validated probability calibration");
        expect(assessStrategyOutcome(review(true), 0.46, false).heading).toBe("Rating model leans Red");
        expect(assessStrategyOutcome(review(true), 0.5, false).heading).toBe("Rating model: level");
    });

    test("rejects unusable rating values", () => {
        for (const value of [undefined, NaN, Infinity, -0.1, 1.1])
            expect(assessStrategyOutcome(review(true), value, false).modelIndex).toBeUndefined();
    });
});
