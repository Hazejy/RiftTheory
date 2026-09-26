import {
    buildChampionLockState,
    STANDARD_DRAFT_SEQUENCE,
    type CompletedLiveDraftGame,
    type LiveDraftSeriesConfig,
    nextDraftStep,
} from "@rifttheory/core/src/live-draft/series";
import type { Role } from "@rifttheory/core/src/models/Role";
import type { Team } from "@rifttheory/core/src/models/Team";

export type StrategySlot = { championKey?: string; role?: Role };
export type StrategyLiveSnapshot = {
    capturedAt: number;
    gameNumber: number;
    mode: LiveDraftSeriesConfig["mode"];
    names: Record<Team, string>;
    teams: Record<Team, StrategySlot[]>;
    bans: string[];
    unavailable: Record<Team, string[]>;
    next: { team: Team; index: number } | undefined;
    pendingBans: boolean;
};

export const LIVE_STRATEGY_ORDER = STANDARD_DRAFT_SEQUENCE.filter(
    (step) => step.kind === "pick",
).map((step) => ({
    team: (step.side === "blue" ? "ally" : "opponent") as Team,
    index: step.slot,
}));

/** An explicit, detached snapshot; never overwrites the user's main draft. */
export function captureStrategyGame(
    config: LiveDraftSeriesConfig,
    game: CompletedLiveDraftGame,
    history: readonly CompletedLiveDraftGame[],
): StrategyLiveSnapshot {
    const locks = buildChampionLockState(
        config,
        history.filter(
            (previous) =>
                previous.gameNumber < game.gameNumber &&
                previous.actions.length === STANDARD_DRAFT_SEQUENCE.length,
        ),
    );
    const teams: StrategyLiveSnapshot["teams"] = {
        ally: Array.from({ length: 5 }, () => ({})),
        opponent: Array.from({ length: 5 }, () => ({})),
    };
    for (const action of game.actions) {
        if (action.kind === "pick" && action.slot >= 0 && action.slot < 5)
            teams[action.side === "blue" ? "ally" : "opponent"][action.slot] = {
                championKey: action.championKey,
            };
    }
    const upcoming = STANDARD_DRAFT_SEQUENCE.find(
        (step) => step.kind === "pick" && !game.actions.some((action) =>
            action.kind === step.kind && action.side === step.side && action.slot === step.slot,
        ),
    );
    const name = (id: "team1" | "team2") =>
        id === "team1" ? config.team1Name : config.team2Name;
    const unavailable = (id: "team1" | "team2") => [
        ...new Set([...locks.disabled, ...locks.global, ...locks.byTeam[id]]),
    ];
    return {
        capturedAt: Date.now(),
        gameNumber: game.gameNumber,
        mode: config.mode,
        names: { ally: name(game.sides.blue), opponent: name(game.sides.red) },
        teams,
        bans: game.actions
            .filter((action) => action.kind === "ban")
            .map((action) => action.championKey),
        unavailable: {
            ally: unavailable(game.sides.blue),
            opponent: unavailable(game.sides.red),
        },
        next: upcoming
            ? {
                  team: upcoming.side === "blue" ? "ally" : "opponent",
                  index: upcoming.slot,
              }
            : undefined,
        pendingBans: nextDraftStep(game.actions)?.kind === "ban",
    };
}
