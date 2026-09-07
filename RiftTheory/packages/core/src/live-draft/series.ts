export const LIVE_DRAFT_MODES = ["normal", "fearless", "ironman"] as const;
export type LiveDraftMode = (typeof LIVE_DRAFT_MODES)[number];

export type FearlessScope = "team" | "global";
export type SeriesTeamId = "team1" | "team2";
export type LiveDraftSide = "blue" | "red";
export type DraftActionKind = "ban" | "pick";
export type LiveDraftGameCount = 1 | 2 | 3 | 4 | 5;

export type DraftSequenceStep = {
    kind: DraftActionKind;
    side: LiveDraftSide;
    slot: number;
};

export const STANDARD_DRAFT_SEQUENCE: readonly DraftSequenceStep[] = [
    { kind: "ban", side: "blue", slot: 0 },
    { kind: "ban", side: "red", slot: 0 },
    { kind: "ban", side: "blue", slot: 1 },
    { kind: "ban", side: "red", slot: 1 },
    { kind: "ban", side: "blue", slot: 2 },
    { kind: "ban", side: "red", slot: 2 },
    { kind: "pick", side: "blue", slot: 0 },
    { kind: "pick", side: "red", slot: 0 },
    { kind: "pick", side: "red", slot: 1 },
    { kind: "pick", side: "blue", slot: 1 },
    { kind: "pick", side: "blue", slot: 2 },
    { kind: "ban", side: "red", slot: 3 },
    { kind: "ban", side: "blue", slot: 3 },
    { kind: "ban", side: "red", slot: 4 },
    { kind: "ban", side: "blue", slot: 4 },
    { kind: "pick", side: "red", slot: 2 },
    { kind: "pick", side: "blue", slot: 3 },
    { kind: "pick", side: "blue", slot: 4 },
    { kind: "pick", side: "red", slot: 3 },
    { kind: "pick", side: "red", slot: 4 },
];

export type LiveDraftSeriesConfig = {
    team1Name: string;
    team2Name: string;
    gameCount: LiveDraftGameCount;
    mode: LiveDraftMode;
    fearlessScope: FearlessScope;
    firstSelection: boolean;
    disabledChampionKeys: readonly string[];
};

export type LiveDraftAction = DraftSequenceStep & {
    championKey: string;
    teamId: SeriesTeamId;
};

export type CompletedLiveDraftGame = {
    gameNumber: number;
    sides: Record<LiveDraftSide, SeriesTeamId>;
    actions: readonly LiveDraftAction[];
};

export type ChampionLockState = {
    disabled: ReadonlySet<string>;
    global: ReadonlySet<string>;
    byTeam: Record<SeriesTeamId, ReadonlySet<string>>;
};

export type ChampionLockReason = "disabled" | "used_globally" | "used_by_team";

export function buildChampionLockState(
    config: LiveDraftSeriesConfig,
    completedGames: readonly CompletedLiveDraftGame[],
): ChampionLockState {
    const disabled = new Set(config.disabledChampionKeys);
    const global = new Set<string>();
    const byTeam: Record<SeriesTeamId, Set<string>> = {
        team1: new Set<string>(),
        team2: new Set<string>(),
    };

    for (const game of completedGames) {
        for (const action of game.actions) {
            if (config.mode === "normal") continue;
            if (config.mode === "ironman") {
                global.add(action.championKey);
                continue;
            }
            if (action.kind !== "pick") continue;
            if (config.fearlessScope === "global") {
                global.add(action.championKey);
            } else {
                byTeam[action.teamId].add(action.championKey);
            }
        }
    }

    return { disabled, global, byTeam };
}

export function championLockReason(
    lockState: ChampionLockState,
    championKey: string,
    teamId: SeriesTeamId,
): ChampionLockReason | undefined {
    if (lockState.disabled.has(championKey)) return "disabled";
    if (lockState.global.has(championKey)) return "used_globally";
    if (lockState.byTeam[teamId].has(championKey)) return "used_by_team";
    return undefined;
}

export function isChampionAvailable(
    lockState: ChampionLockState,
    championKey: string,
    teamId: SeriesTeamId,
) {
    return championLockReason(lockState, championKey, teamId) === undefined;
}

export function oppositeTeam(teamId: SeriesTeamId): SeriesTeamId {
    return teamId === "team1" ? "team2" : "team1";
}

export function sidesFromBlueTeam(
    blueTeam: SeriesTeamId,
): Record<LiveDraftSide, SeriesTeamId> {
    return { blue: blueTeam, red: oppositeTeam(blueTeam) };
}

export function nextDraftStep(actions: readonly LiveDraftAction[]) {
    return STANDARD_DRAFT_SEQUENCE[actions.length];
}
