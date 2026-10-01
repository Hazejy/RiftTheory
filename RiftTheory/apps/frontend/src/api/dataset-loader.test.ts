import { afterEach, describe, expect, test } from "bun:test";
import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import { datasetUrl, loadDataset, parseDataset } from "./dataset-loader";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const sample = {
    version: "16.19.1", date: "2026-09-27", championData: {},
    itemData: {}, runeData: {}, runePathData: {}, statShardData: {}, summonerSpellData: {},
} as Dataset;

describe("ranked dataset loading", () => {
    test("rejects a transport payload missing required runtime fields", () => {
        expect(() => parseDataset({ version: "16.19.1", championData: {} })).toThrow();
    });
    test("uses the requested dataset when it succeeds", async () => {
        globalThis.fetch = (async () => Response.json(sample)) as unknown as typeof fetch;
        const result = await loadDataset("30-days", "diamond_plus", true);
        expect(result.actualRank).toBe("diamond_plus");
        expect(result.available).toBe(true);
    });

    test("uses the configured fallback after a failed rank request", async () => {
        const urls: string[] = [];
        globalThis.fetch = (async (input: RequestInfo | URL) => {
            urls.push(String(input));
            return urls.length === 1
                ? new Response("unavailable", { status: 503 })
                : Response.json(sample);
        }) as unknown as typeof fetch;
        const result = await loadDataset("30-days", "master_plus", true);
        expect(urls).toEqual([
            datasetUrl("30-days", "master_plus"),
            datasetUrl("30-days", "emerald_plus"),
        ]);
        expect(result.actualRank).toBe("emerald_plus");
        expect(result.available).toBe(false);
    });

    test("loads the last matching dataset while offline", async () => {
        globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as unknown as typeof fetch;
        const cache = {
            read: async (key: string) => key === datasetUrl("30-days", "diamond_plus") ? sample : undefined,
            write: async () => {},
        };
        const result = await loadDataset("30-days", "diamond_plus", true, undefined, cache);
        expect(result.data.version).toBe(sample.version);
        expect(result.actualRank).toBe("diamond_plus");
        expect(result.available).toBe(false);
    });

    test("retains previous data when both requests fail", async () => {
        globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as unknown as typeof fetch;
        const previous = {
            data: sample,
            requestedRank: "diamond_plus" as const,
            actualRank: "diamond_plus" as const,
            available: true,
        };
        expect(await loadDataset("30-days", "master_plus", true, previous)).toEqual({
            ...previous,
            requestedRank: "master_plus",
            available: false,
        });
    });

    test("reports failure when no dataset is available", async () => {
        globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as unknown as typeof fetch;
        expect(loadDataset("30-days", "emerald_plus", false)).rejects.toThrow();
    });
});
