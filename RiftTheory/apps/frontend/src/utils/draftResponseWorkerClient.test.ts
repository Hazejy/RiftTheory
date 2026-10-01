import { expect, test } from "bun:test";
import { createPendingBanRunner, createResponseTreeRunner } from "./draftResponseWorkerClient";
import { isCurrentPendingBan, isCurrentResponse, pendingBanRequestId,
    responseTreeRequestId, type PendingBanRequest, type PendingBanResult,
    type ResponseTreeRequest, type ResponseTreeResult } from "./draftResponseWorker";
import type { DraftState } from "./draftResponseTree";
import type { StrategyOption } from "./strategyReview";

test("a changed draft cancels the old worker and only the latest result is current", async () => {
    const original = globalThis.Worker;
    const workers: FakeWorker[] = [];
    class FakeWorker {
        onmessage?: (event: MessageEvent<ResponseTreeResult>) => void;
        onerror?: () => void;
        terminated = false;
        constructor() { workers.push(this); }
        postMessage() { /* The test supplies the worker result explicitly. */ }
        terminate() { this.terminated = true; }
    }
    globalThis.Worker = FakeWorker as unknown as typeof Worker;
    try {
        const runner = createResponseTreeRunner();
        const first = runner.search({ id: "draft-a" } as ResponseTreeRequest);
        const cancelled = first.then(() => "unexpected success", (error: Error) => error.message);
        const second = runner.search({ id: "draft-b" } as ResponseTreeRequest);
        expect(await cancelled).toBe("Search superseded");
        expect(workers[0].terminated).toBe(true);
        workers[0].onmessage?.({ data: { id: "draft-a" } } as MessageEvent<ResponseTreeResult>);
        const result = { id: "draft-b" } as ResponseTreeResult;
        workers[1].onmessage?.({ data: result } as MessageEvent<ResponseTreeResult>);
        expect(await second).toBe(result);
        expect(isCurrentResponse(result, "draft-b")).toBe(true);
        expect(isCurrentResponse(result, "draft-a")).toBe(false);
        expect(workers[1].terminated).toBe(true);
        runner.dispose();
    } finally {
        globalThis.Worker = original;
    }
});

test("request identity includes both compared choices", () => {
    const state = { patch: "16.18", context: "solo", rank: "diamond", region: "unknown",
        datasetId: "date", firstPick: "blue", cursor: 6,
        picks: { blue: [], red: [] }, bans: [], pool: [],
        unavailable: { blue: [], red: [] } } as DraftState;
    const choice = (key: string) => ({ picks: [{ key, name: key, possibleRoles: ["top"] }] }) as StrategyOption;
    const config = { pickBeam: 2, banBeam: 1, maxNodes: 96 };
    expect(responseTreeRequestId(state, choice("A"), choice("B"), config))
        .not.toBe(responseTreeRequestId(state, choice("A"), choice("C"), config));
});

test("pending ban worker discards a stale scenario after the draft changes", async () => {
    const original = globalThis.Worker;
    const workers: FakeWorker[] = [];
    class FakeWorker {
        onmessage?: (event: MessageEvent<PendingBanResult>) => void;
        onerror?: () => void;
        terminated = false;
        constructor() { workers.push(this); }
        postMessage() { /* The test supplies the worker result explicitly. */ }
        terminate() { this.terminated = true; }
    }
    globalThis.Worker = FakeWorker as unknown as typeof Worker;
    try {
        const state = { patch: "16.19", context: "solo", rank: "emerald", region: "EUW",
            datasetId: "dataset-a", firstPick: "blue", cursor: 14,
            picks: { blue: [], red: [] }, bans: [], pool: [],
            unavailable: { blue: [], red: [] } } as DraftState;
        const config = { pickBeam: 2, banBeam: 2, maxNodes: 64 };
        const id = pendingBanRequestId(state, config);
        expect(pendingBanRequestId({ ...state, datasetId: "dataset-b" }, config)).not.toBe(id);
        const runner = createPendingBanRunner();
        const first = runner.search({ kind: "pending_bans", id, state, config });
        const cancelled = first.then(() => "unexpected success", (error: Error) => error.message);
        const secondId = pendingBanRequestId({ ...state, datasetId: "dataset-b" }, config);
        const second = runner.search({ kind: "pending_bans", id: secondId,
            state: { ...state, datasetId: "dataset-b" }, config } as PendingBanRequest);
        expect(await cancelled).toBe("Search superseded");
        expect(workers[0].terminated).toBe(true);
        const stale = { kind: "pending_bans", id } as PendingBanResult;
        workers[0].onmessage?.({ data: stale } as MessageEvent<PendingBanResult>);
        expect(isCurrentPendingBan(stale, secondId)).toBe(false);
        const current = { kind: "pending_bans", id: secondId } as PendingBanResult;
        workers[1].onmessage?.({ data: current } as MessageEvent<PendingBanResult>);
        expect(await second).toBe(current);
        expect(isCurrentPendingBan(current, secondId)).toBe(true);
        runner.dispose();
    } finally {
        globalThis.Worker = original;
    }
});
