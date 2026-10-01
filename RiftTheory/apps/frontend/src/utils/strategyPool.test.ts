import { expect, test } from "bun:test";
import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import { buildStrategyPool, toStrategyPicks } from "./strategyPool";

test("Strategy pool preserves champion identity and excludes unsupported roles", () => {
    const dataset = {
        championData: {
            "1": {
                key: "1",
                name: "One",
                statsByRole: { 0: { games: 10_000 } },
            },
            "2": {
                key: "2",
                name: "Two",
                statsByRole: {},
            },
        },
    } as unknown as Dataset;
    const pool = buildStrategyPool(dataset, () => undefined);
    expect(pool.map((pick) => pick.key)).toEqual(["1", "2"]);
    expect(pool[0].possibleRoles).toContain("top");
    expect(pool[1].possibleRoles).toEqual([]);
    expect(toStrategyPicks([
        { championKey: "1", role: 0 },
        { championKey: "missing", role: undefined },
    ], new Map(pool.map((pick) => [pick.key, pick]))).map((pick) => [pick.name, pick.role])).toEqual([
        ["One", "top"], ["missing", undefined],
    ]);
});
