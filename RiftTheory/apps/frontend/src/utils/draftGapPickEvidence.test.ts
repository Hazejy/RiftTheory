import { expect, test } from "bun:test";
import type { Dataset } from "@draftgap/core/src/models/dataset/Dataset";
import type { StrategyPick } from "./strategyReview";
import { draftGapPickEvidence } from "./draftGapPickEvidence";

const pick = (key: string, role: StrategyPick["role"]): StrategyPick => ({
    key, name: key, role, possibleRoles: role ? [role] : [],
});

test("uses existing DraftGap role and pair samples without inventing missing rates", () => {
    const current = {
        championData: {
            Pick: { statsByRole: { 2: { games: 200, wins: 108 } } },
        },
    } as unknown as Dataset;
    const thirtyDays = {
        championData: {
            Pick: { statsByRole: { 2: {
                synergy: { 1: { Ally: { games: 120, wins: 65 } } },
                matchup: {
                    2: { Enemy: { games: 18, wins: 8 } },
                    0: { OtherEnemy: { games: 300, wins: 150 } },
                },
            } } },
        },
    } as unknown as Dataset;
    const result = draftGapPickEvidence(
        current, thirtyDays,
        [pick("Pick", "mid")],
        [pick("Ally", "jungle")],
        [pick("Enemy", "mid"), pick("OtherEnemy", "top")],
        100,
    );
    expect(result).toEqual([{
        champion: "Pick", role: "mid", roleGames: 200, roleThin: false, roleRate: 0.54,
        duos: [{ label: "with Ally · jungle", games: 120, rate: 65 / 120, thin: false }],
        matchups: [
            { label: "vs Enemy · mid", games: 18, rate: 8 / 18, thin: true },
            { label: "vs OtherEnemy · top", games: 300, rate: 0.5, thin: false },
        ],
    }]);
    expect(draftGapPickEvidence(
        { championData: {} } as Dataset, thirtyDays,
        [pick("Pick", "mid")], [], [], 100,
    )[0].roleRate).toBeUndefined();
    expect(draftGapPickEvidence(
        { championData: { Pick: { statsByRole: { 2: { games: 10, wins: 12 } } } } } as unknown as Dataset,
        thirtyDays,
        [pick("Pick", "mid")], [], [], 100,
    )[0].roleRate).toBeUndefined();
});
