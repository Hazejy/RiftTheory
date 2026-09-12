import { RiskLevel } from "../../risk/risk-level";

export type StatsSite = "op.gg" | "u.gg" | "lolalytics";
export const RankBrackets = [
    "emerald_plus",
    "diamond_plus",
    "master_plus",
] as const;
export type RankBracket = (typeof RankBrackets)[number];

export const DraftTablePlacement = {
    Bottom: "bottom",
    Hidden: "hidden",
    InPlace: "in-place",
} as const;
type DraftTablePlacement =
    (typeof DraftTablePlacement)[keyof typeof DraftTablePlacement];

export type DraftGapConfig = {
    // DRAFT ANALYSIS
    ignoreChampionWinrates: boolean;
    riskLevel: RiskLevel;
    minGames: number;
    rankBracket: RankBracket;
    allowRankFallback: boolean;

    // DRAFT SUGGESTIONS
    showFavouritesAtTop: boolean;
    banPlacement: DraftTablePlacement;
    unownedPlacement: DraftTablePlacement;
    showAdvancedWinrates: boolean;
    language: string;

    // MISC
    defaultStatsSite: StatsSite;
    enableBetaFeatures: boolean;

    // LOL CLIENT
    disableLeagueClientIntegration: boolean;
};
