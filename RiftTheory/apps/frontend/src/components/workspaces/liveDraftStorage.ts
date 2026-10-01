import { LIVE_DRAFT_MODES, STANDARD_DRAFT_SEQUENCE, type LiveDraftAction, type LiveDraftGameCount,
    type LiveDraftSeriesConfig,
    type SeriesTeamId } from "@rifttheory/core/src/live-draft/series";

export type EditableLiveDraftGame = {
    gameNumber: number;
    blueTeam: SeriesTeamId;
    actions: LiveDraftAction[];
};

export function isUsableLiveDraftConfig(value: unknown): value is LiveDraftSeriesConfig {
    if (!value || typeof value !== "object") return false;
    const config = value as Partial<LiveDraftSeriesConfig>;
    return typeof config.team1Name === "string" && typeof config.team2Name === "string" &&
        ([1, 2, 3, 4, 5] as unknown[]).includes(config.gameCount) &&
        LIVE_DRAFT_MODES.includes(config.mode as LiveDraftSeriesConfig["mode"]) &&
        (config.fearlessScope === "global" || config.fearlessScope === "team") &&
        typeof config.firstSelection === "boolean" &&
        Array.isArray(config.disabledChampionKeys) &&
        config.disabledChampionKeys.every((key) => typeof key === "string");
}

/** Saved data is untrusted: malformed entries must not reach the live view. */
export function isUsableLiveDraftGames(value: unknown, count: LiveDraftGameCount): value is EditableLiveDraftGame[] {
    if (!Array.isArray(value) || value.length !== count) return false;
    return value.every((game, index) => {
        if (!game || typeof game !== "object" || game.gameNumber !== index + 1 ||
            (game.blueTeam !== "team1" && game.blueTeam !== "team2") || !Array.isArray(game.actions) ||
            game.actions.length > STANDARD_DRAFT_SEQUENCE.length) return false;
        const seen = new Set<string>();
        return game.actions.every((action: unknown) => {
            if (!action || typeof action !== "object") return false;
            const candidate = action as Partial<LiveDraftAction>;
            if (typeof candidate.championKey !== "string" || !candidate.championKey ||
                (candidate.teamId !== "team1" && candidate.teamId !== "team2")) return false;
            const step = STANDARD_DRAFT_SEQUENCE.find((entry) =>
                entry.kind === candidate.kind && entry.side === candidate.side && entry.slot === candidate.slot);
            if (!step || candidate.teamId !== (candidate.side === "blue" ? game.blueTeam :
                game.blueTeam === "team1" ? "team2" : "team1")) return false;
            const key = `${step.kind}:${step.side}:${step.slot}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });
}
