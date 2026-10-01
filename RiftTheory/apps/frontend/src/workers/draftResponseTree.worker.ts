/// <reference lib="webworker" />
import { evaluatePendingBanRequest, evaluateResponseTreeRequest,
    type PendingBanRequest, type ResponseTreeRequest } from "../utils/draftResponseWorker";

self.onmessage = (event: MessageEvent<ResponseTreeRequest | PendingBanRequest>) => {
    const request = event.data;
    self.postMessage("selected" in request
        ? evaluateResponseTreeRequest(request)
        : evaluatePendingBanRequest(request));
};
