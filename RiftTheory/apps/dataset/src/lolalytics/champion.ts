import { retry } from "../utils";
import { type LolalyticsRole } from "./roles";
import type { LolalyticsChampionResponse } from "@rifttheory/core/src/models/build/LolalyticsChampionResponse";

export async function getLolalyticsChampion(
    patch: string,
    championKey: string,
    role: LolalyticsRole | "default" = "default",
    matchup?: string,
    matchupRole?: LolalyticsRole,
    signal?: AbortSignal,
) {
    // convert patch from ex. 12.21.1 to 12.21
    patch = patch.split(".").slice(0, 2).join(".");

    const queryParams = new URLSearchParams();
    queryParams.append("ep", "champion");
    queryParams.append("p", "d");
    queryParams.append("v", "1");
    queryParams.append("tier", "emerald_plus");
    queryParams.append("queue", "420");
    queryParams.append("region", "all");
    queryParams.append("patch", patch);
    queryParams.append("cid", championKey);
    queryParams.append("lane", role);
    if (matchup && matchupRole) {
        queryParams.append("vs", matchup);
        queryParams.append("vslane", matchupRole);
    }

    const url = `https://ax.lolalytics.com/mega/?${queryParams.toString()}`;
    const res = await retry(() => {
        signal?.throwIfAborted();
        return fetch(url, {
            signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
                : AbortSignal.timeout(15_000),
        });
    }, 5, signal);

    const text = await res.text();
    if (!text) {
        throw new Error("No text for lolalytics champion " + championKey);
    }

    try {
        const json = JSON.parse(text) as LolalyticsChampionResponse;

        return json;
    } catch (e) {
        throw new Error(
            "Error parsing JSON for lolalytics champion " +
                championKey +
                " url: " +
                url,
            {
                cause: e,
            },
        );
    }
}
