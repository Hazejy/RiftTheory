import { compareVariations, comparisonReasons, draftStateFingerprint, searchDraftResponse,
    type ComparisonReason, type DraftState, type PrincipalVariation, type SearchConfig } from "./draftResponseTree";
import type { StrategyOption } from "./strategyReview";
import { searchPendingBans, type PendingBanTree } from "./draftResponseTree";

export type ResponseTreeRequest = {
    id: string;
    state: DraftState;
    selected: StrategyOption;
    alternative?: StrategyOption;
    config: SearchConfig;
};
export type ResponseTreeResult = {
    id: string;
    first?: PrincipalVariation;
    second?: PrincipalVariation;
    verdict: "selected" | "alternative" | "unresolved";
    reasons: ComparisonReason[];
    config: SearchConfig;
};
export type PendingBanRequest = {
    kind: "pending_bans";
    id: string;
    state: DraftState;
    config: SearchConfig;
};
export type PendingBanResult = {
    kind: "pending_bans";
    id: string;
    tree?: PendingBanTree;
};

export const pendingBanRequestId = (state: DraftState, config: SearchConfig) =>
    `pending-bans:${draftStateFingerprint(state, config)}`;

export function evaluatePendingBanRequest(request: PendingBanRequest): PendingBanResult {
    return { kind: "pending_bans", id: request.id,
        tree: searchPendingBans(request.state, request.config) };
}

export const isCurrentPendingBan = (result: PendingBanResult | undefined,
    id: string | undefined) => Boolean(result && id && result.id === id);

const choiceId = (choice?: StrategyOption) => choice?.picks
    .map((pick) => `${pick.key}:${pick.role ?? "open"}`).join("|") ?? "none";

export function responseTreeRequestId(state: DraftState, selected: StrategyOption,
    alternative: StrategyOption | undefined, config: SearchConfig) {
    return `${draftStateFingerprint(state, config)}:${choiceId(selected)}:${choiceId(alternative)}`;
}

export function evaluateResponseTreeRequest(request: ResponseTreeRequest): ResponseTreeResult {
    const first = searchDraftResponse(request.state, request.selected, request.config);
    const second = request.alternative
        ? searchDraftResponse(request.state, request.alternative, request.config) : undefined;
    return { id: request.id, first, second, verdict: compareVariations(first, second),
        reasons: comparisonReasons(first, second), config: request.config };
}

export const isCurrentResponse = (result: ResponseTreeResult | undefined, id: string | undefined) =>
    Boolean(result && id && result.id === id);
