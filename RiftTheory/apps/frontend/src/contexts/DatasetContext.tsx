import {
    JSXElement,
    createContext,
    createResource,
    useContext,
} from "solid-js";
import { useUser } from "./UserContext";
import { loadDataset as loadRankedDataset, type DatasetLoad, type DatasetName } from "../api/dataset-loader";

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
            DatasetLoad["requestedRank"],
            string,
        ];
        return loadRankedDataset(name, requestedRank, fallback === "true", info.value);
    };

    const [currentPatchLoad, { refetch: refetchCurrentPatch }] = createResource(
        () => source("current-patch"),
        loadDataset,
    );
    const [thirtyDaysLoad, { refetch: refetchThirtyDays }] = createResource(
        () => source("30-days"),
        loadDataset,
    );

    // A Solid resource accessor throws in its errored state. Read its state first
    // so a failed first download can reach the visible offline workspace.
    const dataset = () => currentPatchLoad.state === "errored" ? undefined : currentPatchLoad()?.data;
    const dataset30Days = () => thirtyDaysLoad.state === "errored" ? undefined : thirtyDaysLoad()?.data;

    const isLoaded = () =>
        dataset() !== undefined && dataset30Days() !== undefined;
    const rankStatus = () => {
        const current = currentPatchLoad.state === "errored" ? undefined : currentPatchLoad();
        const thirty = thirtyDaysLoad.state === "errored" ? undefined : thirtyDaysLoad();
        return {
            requested: config.rankBracket,
            active:
                current?.actualRank === thirty?.actualRank
                    ? current?.actualRank
                    : undefined,
            available: Boolean(current?.available && thirty?.available),
            loading: currentPatchLoad.loading || thirtyDaysLoad.loading,
            error: currentPatchLoad.error ?? thirtyDaysLoad.error,
        };
    };
    const loadState = (): "loading" | "ready" | "degraded" | "error" => {
        if (isLoaded()) return rankStatus().available ? "ready" : "degraded";
        return rankStatus().loading ? "loading" : "error";
    };
    const retryDatasets = () => {
        void refetchCurrentPatch();
        void refetchThirtyDays();
    };

    return {
        dataset,
        dataset30Days,
        isLoaded,
        rankStatus,
        loadState,
        retryDatasets,
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
