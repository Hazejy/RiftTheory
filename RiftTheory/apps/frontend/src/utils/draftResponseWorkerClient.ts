import type { PendingBanRequest, PendingBanResult, ResponseTreeRequest,
    ResponseTreeResult } from "./draftResponseWorker";

/** Terminate the previous computation when the draft changes. */
function createWorkerRunner<Request, Result>() {
    let active: Worker | undefined;
    let rejectPrevious: ((error: Error) => void) | undefined;
    return {
        search(request: Request): Promise<Result> {
            active?.terminate();
            rejectPrevious?.(new Error("Search superseded"));
            const worker = new Worker(new URL("../workers/draftResponseTree.worker.ts", import.meta.url), { type: "module" });
            active = worker;
            return new Promise((resolve, reject) => {
                rejectPrevious = reject;
                worker.onmessage = (event: MessageEvent<Result>) => {
                    if (active !== worker) return;
                    active = undefined;
                    rejectPrevious = undefined;
                    worker.terminate();
                    resolve(event.data);
                };
                worker.onerror = () => {
                    if (active !== worker) return;
                    active = undefined;
                    rejectPrevious = undefined;
                    worker.terminate();
                    reject(new Error("Response tree worker failed"));
                };
                worker.postMessage(request);
            });
        },
        dispose() {
            active?.terminate();
            active = undefined;
            rejectPrevious?.(new Error("Search disposed"));
            rejectPrevious = undefined;
        },
    };
}

export const createResponseTreeRunner = () =>
    createWorkerRunner<ResponseTreeRequest, ResponseTreeResult>();

export const createPendingBanRunner = () =>
    createWorkerRunner<PendingBanRequest, PendingBanResult>();
