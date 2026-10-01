import { DATASET_VERSION, type Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import type { RankBracket } from "@rifttheory/core/src/models/user/Config";
import { fetchDatasetJson } from "./dataset-api";
import { readCachedDataset, writeCachedDataset } from "./dataset-cache";

export type DatasetName = "30-days" | "current-patch";
export type DatasetLoad = {
    data: Dataset;
    requestedRank: RankBracket;
    actualRank: RankBracket;
    available: boolean;
};
type DatasetCache = {
    read: (key: string) => Promise<unknown>;
    write: (key: string, value: unknown) => Promise<void>;
};
const defaultCache: DatasetCache = { read: readCachedDataset, write: writeCachedDataset };

export const datasetUrl = (name: DatasetName, rank: RankBracket) =>
    rank === "emerald_plus"
        ? `https://bucket.draftgap.com/datasets/v${DATASET_VERSION}/${name}.json`
        : `https://github.com/Hazejy/RiftTheory/releases/download/datasets-v${DATASET_VERSION}/${name}-${rank}.json`;

export function parseDataset(value: unknown): Dataset {
    if (!value || typeof value !== "object")
        throw new Error("Dataset has an unsupported format");
    const candidate = value as Partial<Dataset>;
    if (
        typeof candidate.version !== "string" ||
        typeof candidate.date !== "string" ||
        !candidate.championData ||
        typeof candidate.championData !== "object" ||
        !candidate.itemData ||
        !candidate.runeData ||
        !candidate.runePathData ||
        !candidate.statShardData ||
        !candidate.summonerSpellData ||
        !Object.values(candidate.championData).every((champion) =>
            champion && typeof champion.key === "string" &&
            typeof champion.name === "string" &&
            champion.statsByRole && typeof champion.statsByRole === "object",
        )
    ) throw new Error("Dataset has an unsupported format");
    return candidate as Dataset;
}

async function fetchRawDataset(name: DatasetName, rank: RankBracket, cache: DatasetCache) {
    try {
        const data = parseDataset(await fetchDatasetJson<unknown>(datasetUrl(name, rank)));
        void cache.write(datasetUrl(name, rank), data).catch(() => {});
        return data;
    } catch (error) {
        throw new Error(`${rank} dataset request failed`, { cause: error });
    }
}

async function cachedDataset(name: DatasetName, rank: RankBracket, cache: DatasetCache) {
    try {
        const cached = await cache.read(datasetUrl(name, rank));
        return cached === undefined ? undefined : parseDataset(cached);
    } catch {
        return undefined;
    }
}

async function localizeDataset(json: Dataset, name: DatasetName) {
    if (name !== "current-patch") return json;
    try {
        const localized = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(json.version)}/data/ko_KR/champion.json`,
            { signal: AbortSignal.timeout(6000) },
        );
        if (!localized.ok) throw new Error("Korean names unavailable");
        const names = (await localized.json()) as {
            data: Record<string, { key: string; name: string }>;
        };
        for (const entry of Object.values(names.data)) {
            const champion = json.championData[entry.key];
            if (champion && typeof entry.name === "string") {
                champion.i18n = {
                    ...champion.i18n,
                    ko_KR: { name: entry.name },
                };
            }
        }
    } catch {
        console.warn("Korean champion names unavailable; using English fallback.");
    }
    return json;
}

export async function loadDataset(
    name: DatasetName,
    requestedRank: RankBracket,
    allowRankFallback: boolean,
    previous?: DatasetLoad,
    cache: DatasetCache = defaultCache,
): Promise<DatasetLoad> {
    try {
        const data = await fetchRawDataset(name, requestedRank, cache);
        return {
            data: await localizeDataset(data, name),
            requestedRank,
            actualRank: requestedRank,
            available: true,
        };
    } catch (error) {
        console.warn(error);
        const cached = await cachedDataset(name, requestedRank, cache);
        if (cached) return {
            data: await localizeDataset(cached, name),
            requestedRank,
            actualRank: requestedRank,
            available: false,
        };
        if (allowRankFallback && requestedRank !== "emerald_plus") {
            try {
                const data = await fetchRawDataset(name, "emerald_plus", cache);
                return {
                    data: await localizeDataset(data, name),
                    requestedRank,
                    actualRank: "emerald_plus",
                    available: false,
                };
            } catch (fallbackError) {
                console.warn(fallbackError);
                const fallbackCached = await cachedDataset(name, "emerald_plus", cache);
                if (fallbackCached) return {
                    data: await localizeDataset(fallbackCached, name),
                    requestedRank,
                    actualRank: "emerald_plus",
                    available: false,
                };
            }
        }
        if (previous) return { ...previous, requestedRank, available: false };
        throw error;
    }
}
