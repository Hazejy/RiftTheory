import { type QueryClient } from "@tanstack/solid-query";
import { getLolalyticsChampion } from "../../../dataset/src/lolalytics/champion";
import { LOLALYTICS_ROLES, type LolalyticsRole } from "@rifttheory/core/src/models/LolalyticsRole";
import type { Role } from "@rifttheory/core/src/models/Role";
import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import { partialDatasetFromLolalyticsData, fullDatasetFromLolalyticsData } from "@rifttheory/core/src/builds/data";

function getLolalyticsChampionOptions(
    patch: string,
    championKey: string,
    role: LolalyticsRole | "default" = "default",
    matchup?: string,
    matchupRole?: LolalyticsRole,
    requestSignal?: AbortSignal,
) {
    return {
        queryKey: [
            "lolalytics",
            "champion",
            patch,
            championKey,
            role,
            matchup,
            matchupRole,
        ],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getLolalyticsChampion(
                patch,
                championKey,
                role,
                matchup,
                matchupRole,
                requestSignal
                    ? AbortSignal.any([requestSignal, signal])
                    : signal,
            ),
        staleTime: 1000 * 60 * 60, // 1 hour
    };
}

export async function fetchBuildData(
    queryClient: QueryClient,
    dataset: Dataset,
    championKey: string,
    role: Role,
    opponentTeamComp: Map<Role, string>,
    signal?: AbortSignal,
) {
    // convert patch from 13.7.1 to 13.7
    const patch = dataset.version.split(".").slice(0, 2).join(".");

    const championPatchDataPromises = queryClient.fetchQuery(
        getLolalyticsChampionOptions(
            patch,
            championKey,
            LOLALYTICS_ROLES[role],
            undefined,
            undefined,
            signal,
        ),
    );

    const champion30DaysDataPromises = queryClient.fetchQuery(
        getLolalyticsChampionOptions("30", championKey, LOLALYTICS_ROLES[role], undefined, undefined, signal),
    );

    const matchup30DaysDataPromises = [...opponentTeamComp.entries()].map(
        ([opponentRole, opponentChampionKey]) =>
            queryClient
                .fetchQuery(
                    getLolalyticsChampionOptions(
                        "30",
                        championKey,
                        LOLALYTICS_ROLES[role],
                        opponentChampionKey,
                        LOLALYTICS_ROLES[opponentRole],
                        signal,
                    ),
                )
                .then((championData) => ({
                    championKey: opponentChampionKey,
                    role: opponentRole,
                    championData,
                })),
    );

    const results = await Promise.all([
        championPatchDataPromises,
        champion30DaysDataPromises,
        ...matchup30DaysDataPromises,
    ]);
    const [championPatchData, champion30DaysData, ...matchup30DaysData] =
        results;

    const partialDataset = partialDatasetFromLolalyticsData(
        dataset,
        championKey,
        role,
        championPatchData,
    );

    const fullDataset = fullDatasetFromLolalyticsData(
        dataset,
        championKey,
        role,
        champion30DaysData,
        matchup30DaysData,
    );

    return [partialDataset, fullDataset] as const;
}
