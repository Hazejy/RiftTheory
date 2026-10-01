import { afterEach, expect, test } from "bun:test";
import { getLolalyticsChampion } from "./champion";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("a cancelled build-data request settles instead of staying pending", async () => {
    const controller = new AbortController();
    globalThis.fetch = ((_: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        })) as unknown as typeof fetch;

    const request = getLolalyticsChampion("16.19", "1", "top", undefined, undefined, controller.signal);
    controller.abort();
    await expect(request).rejects.toThrow();
});
