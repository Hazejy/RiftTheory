import { describe, expect, test } from "bun:test";
import {
    STANDARD_DRAFT_SEQUENCE,
    type CompletedLiveDraftGame,
    type LiveDraftSeriesConfig,
    type SeriesTeamId,
} from "@draftgap/core/src/live-draft/series";
import { captureStrategyGame, LIVE_STRATEGY_ORDER } from "./strategyLiveDraft";
import { draftResponseWindow } from "./draftOrder";

const config: LiveDraftSeriesConfig = {
    team1Name: "Alpha",
    team2Name: "Beta",
    gameCount: 5,
    mode: "normal",
    fearlessScope: "team",
    firstSelection: true,
    disabledChampionKeys: ["disabled"],
};
const game = (
    gameNumber: number,
    blue: SeriesTeamId = "team1",
): CompletedLiveDraftGame => {
    const sides = {
        blue,
        red: blue === "team1" ? ("team2" as const) : ("team1" as const),
    };
    return {
        gameNumber,
        sides,
        actions: STANDARD_DRAFT_SEQUENCE.map((step, i) => ({
            ...step,
            teamId: sides[step.side],
            championKey: `g${gameNumber}-${i}`,
        })),
    };
};

describe("explicit live-series strategy handoff", () => {
    test("normal keeps current bans but not previous picks locked", () => {
        const g2 = { ...game(2), actions: game(2).actions.slice(0, 9) };
        const snapshot = captureStrategyGame(config, g2, [game(1)]);
        expect(snapshot.bans).toHaveLength(6);
        expect(snapshot.teams.ally[0].championKey).toBe("g2-6");
        expect(snapshot.teams.opponent[1].championKey).toBe("g2-8");
        expect(snapshot.unavailable.ally).toEqual(["disabled"]);
        expect(snapshot.next).toEqual({ team: "ally", index: 1 });
        expect(
            draftResponseWindow(
                snapshot.next,
                snapshot.teams,
                LIVE_STRATEGY_ORDER,
            ),
        ).toHaveLength(2);
    });

    test("team fearless follows team identity through a side swap", () => {
        const snapshot = captureStrategyGame(
            { ...config, mode: "fearless" },
            { ...game(2, "team2"), actions: [] },
            [game(1)],
        );
        expect(snapshot.names).toEqual({ ally: "Beta", opponent: "Alpha" });
        expect(snapshot.unavailable.ally).toContain("g1-7");
        expect(snapshot.unavailable.ally).not.toContain("g1-6");
        expect(snapshot.unavailable.opponent).toContain("g1-6");
        expect(snapshot.unavailable.ally).not.toContain("g1-0");
    });

    test("global fearless locks picks for both teams but not previous bans", () => {
        const snapshot = captureStrategyGame(
            { ...config, mode: "fearless", fearlessScope: "global" },
            { ...game(2), actions: [] },
            [game(1)],
        );
        expect(snapshot.unavailable.ally).toContain("g1-6");
        expect(snapshot.unavailable.opponent).toContain("g1-6");
        expect(snapshot.unavailable.ally).not.toContain("g1-0");
    });

    test("ironman locks picks and bans; future/incomplete games never contaminate the snapshot", () => {
        const snapshot = captureStrategyGame(
            { ...config, mode: "ironman" },
            { ...game(2), actions: [] },
            [
                game(1),
                game(3),
                { ...game(0), actions: game(0).actions.slice(0, 8) },
            ],
        );
        expect(snapshot.unavailable.ally).toContain("g1-0");
        expect(snapshot.unavailable.ally).toContain("g1-6");
        expect(
            snapshot.unavailable.ally.some(
                (key) => key.startsWith("g3") || key.startsWith("g0"),
            ),
        ).toBe(false);
    });

    test("role edits are detached and pending bans are explicit", () => {
        const current = { ...game(1), actions: game(1).actions.slice(0, 11) };
        const snapshot = captureStrategyGame(config, current, []);
        snapshot.teams.ally[0].role = 1;
        expect(current.actions[6]).not.toHaveProperty("role");
        expect(snapshot.pendingBans).toBe(true);
        expect(snapshot.next).toEqual({ team: "opponent", index: 2 });
        expect(captureStrategyGame(config, game(1), []).next).toBeUndefined();
    });
});
