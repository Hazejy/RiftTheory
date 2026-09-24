import { describe, expect, test } from "bun:test";
import { planCampaign } from "./collect-riot-campaign";

describe("multi-page Solo Queue collection", () => {
    test("plans consecutive pages with the same seed cohort", () => {
        expect(planCampaign(["euw1", "DIAMOND", "I", "3", "2", "25", "20", "--plan"])).toEqual([
            ["euw1", "DIAMOND", "I", "3", "25", "20"],
            ["euw1", "DIAMOND", "I", "4", "25", "20"],
        ]);
    });

    test("rejects invalid regions and unpaged top tiers before any API call", () => {
        expect(() => planCampaign(["invalid", "DIAMOND", "I", "1", "2", "25", "20"])).toThrow();
        expect(() => planCampaign(["euw1", "MASTER", "I", "1", "2", "25", "20"])).toThrow();
    });
});
