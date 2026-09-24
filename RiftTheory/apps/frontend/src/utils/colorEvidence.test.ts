import { expect, test } from "bun:test";
import type { KnowledgeChampion } from "../types/RiftTheoryKnowledge";
import { effectiveColorEvidence } from "./colorEvidence";

test("outdated role colors fall back to a labeled historical baseline", () => {
    const champion = {
        strategicProfiles: [{
            role: "mid", review_status: "outdated", patch_version: "old",
            colors: [], reasoning: "Old role read",
        }],
        colorBaseline: {
            scope: "champion", review_status: "historical",
            source_version: "old", colors: [], reasoning: "Historical reference",
        },
    } as unknown as KnowledgeChampion;
    expect(effectiveColorEvidence(champion, "mid")?.tier).toBe("historical_reference");
    champion.colorBaseline!.review_status = "outdated";
    expect(effectiveColorEvidence(champion, "mid")).toBeUndefined();
});
