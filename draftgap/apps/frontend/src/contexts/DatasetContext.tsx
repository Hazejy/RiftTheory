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

const fetchDataset = async (name: "30-days" | "current-patch") => {
    try {
        const response = await fetch(
            `https://bucket.draftgap.com/datasets/v${DATASET_VERSION}/${name}.json`,
        );
        if (!response.ok)
            throw new Error(`Dataset request failed: ${response.status}`);
        const json = (await response.json()) as Dataset;
        if (name === "current-patch") {
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
        }
        return json;
    } catch (err) {
        console.error(err);
        return undefined;
    }
};

function createDatasetContext() {
    const [dataset] = createResource("current-patch", fetchDataset);

    const [dataset30Days] = createResource("30-days", fetchDataset);

    const isLoaded = () =>
        dataset() !== undefined && dataset30Days() !== undefined;

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
