import { describe, expect, test } from "bun:test";
import {
    STANDARD_DRAFT_SEQUENCE,
    type CompletedLiveDraftGame,
    type LiveDraftSeriesConfig,
    type SeriesTeamId,
    nextDraftStep,
} from "@draftgap/core/src/live-draft/series";
import { captureStrategyGame, LIVE_STRATEGY_ORDER } from "./strategyLiveDraft";
import { DRAFT_PICK_ORDER, draftResponseWindow } from "./draftOrder";

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
    test("tracks all ten picks with the second ban phase after R3", () => {
        expect(STANDARD_DRAFT_SEQUENCE.map((step) => `${step.kind}:${step.side}:${step.slot + 1}`)).toEqual([
            "ban:blue:1", "ban:red:1", "ban:blue:2", "ban:red:2", "ban:blue:3", "ban:red:3",
            "pick:blue:1", "pick:red:1", "pick:red:2", "pick:blue:2", "pick:blue:3", "pick:red:3",
            "ban:red:4", "ban:blue:4", "ban:red:5", "ban:blue:5",
            "pick:red:4", "pick:blue:4", "pick:blue:5", "pick:red:5",
        ]);
        expect(LIVE_STRATEGY_ORDER).toEqual([...DRAFT_PICK_ORDER]);
    });

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
        const current = { ...game(1), actions: game(1).actions.slice(0, 12) };
        const snapshot = captureStrategyGame(config, current, []);
        snapshot.teams.ally[0].role = 1;
        expect(current.actions[6]).not.toHaveProperty("role");
        expect(snapshot.pendingBans).toBe(true);
        expect(snapshot.next).toEqual({ team: "opponent", index: 3 });
        expect(captureStrategyGame(config, game(1), []).next).toBeUndefined();
    });

    test("keeps an older saved draft usable when its bans precede R3", () => {
        const oldActions = [
            ...game(1).actions.slice(0, 11),
            { kind: "ban" as const, side: "red" as const, slot: 3, teamId: "team2" as const, championKey: "old-ban" },
        ];
        expect(nextDraftStep(oldActions)).toEqual({ kind: "pick", side: "red", slot: 2 });
        const snapshot = captureStrategyGame(config, { ...game(1), actions: oldActions }, []);
        expect(snapshot.next).toEqual({ team: "opponent", index: 2 });
        expect(snapshot.pendingBans).toBe(false);
        expect(nextDraftStep([...oldActions, game(1).actions[11]])).toEqual({ kind: "ban", side: "blue", slot: 3 });
    });
});
