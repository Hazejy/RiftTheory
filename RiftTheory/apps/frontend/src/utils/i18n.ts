import { ChampionData } from "@draftgap/core/src/models/dataset/ChampionData";
import { DraftGapConfig } from "@draftgap/core/src/models/user/Config";
import { useUser } from "../contexts/UserContext";
import { en, ko, zh, MessageKey } from "../locales/messages";
import { Role } from "@draftgap/core/src/models/Role";

export const SUPPORTED_LANGUAGES = ["en_US", "ko_KR", "zh_CN"] as const;

// Shared labels from inherited table/card definitions. Keep their column IDs
// unchanged; translate only their presentation, with an English fallback.
const UPSTREAM_LABELS: Record<string, MessageKey> = {
    Ally: "ally",
    Opponent: "opponent",
    Role: "role",
    Champion: "champion",
    Champions: "champions",
    Winrate: "winrate",
    Matchup: "matchups",
    Matchups: "matchups",
    Duo: "duos",
    Duos: "duos",
    Base: "base",
    Total: "total",
    Games: "games",
};

export function useI18n() {
    const { config } = useUser();
    const t = (key: MessageKey) =>
        (config.language === "ko_KR"
            ? ko
            : config.language === "zh_CN"
              ? zh
              : en)[key];
    const roleName = (role: Role) =>
        t((["top", "jungle", "mid", "bot", "support"] as const)[role]);
    const term = (value: string) =>
        value in en ? t(value as MessageKey) : value;
    const label = (value: string) =>
        UPSTREAM_LABELS[value] ? t(UPSTREAM_LABELS[value]) : value;
    return { t, roleName, term, label };
}

// Preserve Hangul and Han characters while ignoring spacing/punctuation.
export const normalizeChampionSearch = (value: string) =>
    value
        .normalize("NFKC")
        .replaceAll(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase();

export function championName(champion: ChampionData, config: DraftGapConfig) {
    if (config.language === "en_US") {
        return champion.name;
    }

    return champion.i18n?.[config.language]?.name ?? champion.name;
}
