import { expect, test } from "bun:test";
import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import { rateStrategyOption } from "./strategyRating";

test("statistical rating is withheld for an incomplete draft", () => {
    const dataset = { championData: {} } as Dataset;
    const config = { ignoreChampionWinrates: false, riskLevel: "medium", minGames: 100 } as const;
    expect(rateStrategyOption({ picks: [] }, [], [], dataset, dataset, config)).toBeUndefined();
});
