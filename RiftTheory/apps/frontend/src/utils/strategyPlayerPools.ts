import type { DraftPlayerPool } from "@rifttheory/core/src/draft/player-pool";
import { readStoredValue, writeStoredValue } from "./safeStorage";

export type StrategyPlayerPools = { blue: DraftPlayerPool[]; red: DraftPlayerPool[] };
export const STRATEGY_PLAYER_POOLS_KEY = "rifttheory.strategy.playerPools.v1";
export const emptyStrategyPlayerPools = (): StrategyPlayerPools => ({ blue: [], red: [] });

export function readStrategyPlayerPools(): StrategyPlayerPools {
    const raw = readStoredValue(STRATEGY_PLAYER_POOLS_KEY);
    if (!raw) return emptyStrategyPlayerPools();
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return emptyStrategyPlayerPools();
        const record = parsed as Record<string, unknown>;
        const valid = (value: unknown): DraftPlayerPool[] => !Array.isArray(value) ? [] : value
            .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
            .filter((entry) => typeof entry.id === "string" && typeof entry.name === "string" &&
                Array.isArray(entry.roles) && entry.roles.every((role: unknown) =>
                    ["top", "jungle", "mid", "bot", "support"].includes(String(role))) &&
                (entry.availableChampionKeys === undefined || Array.isArray(entry.availableChampionKeys)) &&
                (entry.comfortableChampionKeys === undefined || Array.isArray(entry.comfortableChampionKeys)))
            .slice(0, 5)
            .map((entry) => ({
                id: entry.id as string, name: entry.name as string,
                roles: entry.roles as string[],
                availableChampionKeys: entry.availableChampionKeys as string[] | undefined,
                comfortableChampionKeys: entry.comfortableChampionKeys as string[] | undefined,
                source: typeof entry.source === "string" ? entry.source : "Manual entry",
                updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : "unknown",
                confidence: entry.confidence === "team_reported" || entry.confidence === "observed"
                    ? entry.confidence : "self_reported",
            }));
        return { blue: valid(record.blue), red: valid(record.red) };
    } catch { return emptyStrategyPlayerPools(); }
}

export function writeStrategyPlayerPools(pools: StrategyPlayerPools) {
    return writeStoredValue(STRATEGY_PLAYER_POOLS_KEY, JSON.stringify(pools));
}

export function resolveChampionNames(value: string, champions: readonly { key: string; name: string }[]) {
    const byName = new Map(champions.flatMap((champion) => [
        [champion.name.toLowerCase(), champion.key], [champion.key.toLowerCase(), champion.key],
    ] as const));
    const keys: string[] = [];
    const unknown: string[] = [];
    for (const term of value.split(",").map((part) => part.trim()).filter(Boolean)) {
        const key = byName.get(term.toLowerCase());
        if (key) keys.push(key);
        else unknown.push(term);
    }
    return { keys: [...new Set(keys)], unknown };
}
