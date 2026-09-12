import {
    JSXElement,
    createContext,
    createEffect,
    createResource,
    useContext,
} from "solid-js";
import {
    DATASET_VERSION,
    Dataset,
} from "@draftgap/core/src/models/dataset/Dataset";
import { RankBracket } from "@draftgap/core/src/models/user/Config";
import { useUser } from "./UserContext";
import { fetchDatasetJson } from "../api/dataset-api";

type DatasetName = "30-days" | "current-patch";
type DatasetLoad = {
    data: Dataset;
    requestedRank: RankBracket;
    actualRank: RankBracket;
    available: boolean;
};

const datasetUrl = (name: DatasetName, rank: RankBracket) =>
    rank === "emerald_plus"
        ? `https://bucket.draftgap.com/datasets/v${DATASET_VERSION}/${name}.json`
        : `https://github.com/Hazejy/RiftTheory/releases/download/datasets-v${DATASET_VERSION}/${name}-${rank}.json`;

const fetchRawDataset = async (name: DatasetName, rank: RankBracket) => {
    try {
        return await fetchDatasetJson<Dataset>(datasetUrl(name, rank));
    } catch (error) {
        throw new Error(`${rank} dataset request failed`, { cause: error });
    }
};

const localizeDataset = async (json: Dataset, name: DatasetName) => {
    if (name !== "current-patch") return json;
    // Upstream includes Chinese names, but not Korean. Names only:
    // statistical data is unchanged and no user picks are transmitted.
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
        console.warn(
            "Korean champion names unavailable; using English fallback.",
        );
    }
    return json;
};

function createDatasetContext() {
    const { config } = useUser();
    const source = (name: DatasetName) =>
        `${name}:${config.rankBracket}:${config.allowRankFallback}` as const;
    const loadDataset = async (
        sourceValue: string,
        info: { value: DatasetLoad | undefined },
    ): Promise<DatasetLoad> => {
        const [name, requestedRank, fallback] = sourceValue.split(":") as [
            DatasetName,
            RankBracket,
            string,
        ];
        try {
            const data = await fetchRawDataset(name, requestedRank);
            return {
                data: await localizeDataset(data, name),
                requestedRank,
                actualRank: requestedRank,
                available: true,
            };
        } catch (error) {
            console.warn(error);
            if (fallback === "true" && requestedRank !== "emerald_plus") {
                const data = await fetchRawDataset(name, "emerald_plus");
                return {
                    data: await localizeDataset(data, name),
                    requestedRank,
                    actualRank: "emerald_plus",
                    available: false,
                };
            }
            if (info.value) {
                return {
                    ...info.value,
                    requestedRank,
                    available: false,
                };
            }
            throw error;
        }
    };

    const [currentPatchLoad] = createResource(
        () => source("current-patch"),
        loadDataset,
    );
    const [thirtyDaysLoad] = createResource(
        () => source("30-days"),
        loadDataset,
    );

    const dataset = () => currentPatchLoad()?.data;
    const dataset30Days = () => thirtyDaysLoad()?.data;

    const isLoaded = () =>
        dataset() !== undefined && dataset30Days() !== undefined;
    const rankStatus = () => {
        const current = currentPatchLoad();
        const thirty = thirtyDaysLoad();
        return {
            requested: config.rankBracket,
            active:
                current?.actualRank === thirty?.actualRank
                    ? current?.actualRank
                    : undefined,
            available: Boolean(current?.available && thirty?.available),
            loading: currentPatchLoad.loading || thirtyDaysLoad.loading,
        };
    };

    createEffect(() => {
        (window as any).DRAFTGAP_DEBUG = (window as any).DRAFTGAP_DEBUG || {};
        // eslint-disable-next-line solid/reactivity
        (window as any).DRAFTGAP_DEBUG.dataset = dataset;
        // eslint-disable-next-line solid/reactivity
        (window as any).DRAFTGAP_DEBUG.dataset30Days = dataset30Days;
    });

    return {
        dataset,
        dataset30Days,
        isLoaded,
        rankStatus,
    };
}

const DatasetContext = createContext<ReturnType<typeof createDatasetContext>>();

export function DatasetProvider(props: { children: JSXElement }) {
    return (
        <DatasetContext.Provider value={createDatasetContext()}>
            {props.children}
        </DatasetContext.Provider>
    );
}

export function useDataset() {
    const useCtx = useContext(DatasetContext);
    if (!useCtx) throw new Error("No DatasetContext found");

    return useCtx;
}
