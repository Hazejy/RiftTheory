import { STANDARD_DRAFT_SEQUENCE } from "@rifttheory/core/src/live-draft/series";
import { transitionDraft, type DraftAction, type DraftSide, type DraftState } from "./draftResponseTree";
import { strategyOptions, type StrategyPick } from "./strategyReview";
import { strategyRoleCandidates } from "./strategyPool";

export type EngineMove = { action: DraftAction; next: DraftState; reason: string };
export type EngineStyle = "balanced" | "pressure" | "flex";

export function newSimulatorDraft(pool: readonly StrategyPick[], patch: string, datasetId: string): DraftState {
    return {
        patch, datasetId, context: "solo", rank: "active", region: "active",
        firstPick: "blue", cursor: 0, picks: { blue: [], red: [] }, bans: [],
        pool, unavailable: { blue: [], red: [] },
        sequence: STANDARD_DRAFT_SEQUENCE,
    };
}

export function legalSimulatorActions(state: DraftState): DraftAction[] {
    const step = (state.sequence ?? STANDARD_DRAFT_SEQUENCE)[state.cursor];
    if (!step) return [];
    const actions: DraftAction[] = [];
    for (const pick of state.pool) {
        const roles = step.kind === "ban" ? [undefined] :
            pick.possibleRoles.length > 1 ? [undefined, ...pick.possibleRoles] : pick.possibleRoles;
        for (const role of roles) {
            const action: DraftAction = { ...step, championKey: pick.key, ...(role ? { role } : {}) };
            if (transitionDraft(state, action)) actions.push(action);
        }
    }
    return actions;
}

export function chooseEngineMove(state: DraftState, style: EngineStyle = "balanced"): EngineMove | undefined {
    const step = (state.sequence ?? STANDARD_DRAFT_SEQUENCE)[state.cursor];
    if (!step) return undefined;
    const other: DraftSide = step.side === "blue" ? "red" : "blue";
    const own = step.kind === "pick" ? step.side : other;
    const candidates = [...state.pool, ...strategyRoleCandidates(state.pool)];
    const options = strategyOptions(state.picks[own], state.picks[own === "blue" ? "red" : "blue"],
        candidates, { bans: state.bans, unavailable: state.unavailable[own],
            owned: state.owned?.[own], playerPools: state.playerPools?.[own] }, 1, "", state.picks[own],
        style === "pressure" ? "pressure" : "default");
    const ranked = style === "flex" ? [...options.singles].sort((a, b) =>
        (state.pool.find((pick) => pick.key === b.picks[0].key)?.possibleRoles.length ?? 0) -
        (state.pool.find((pick) => pick.key === a.picks[0].key)?.possibleRoles.length ?? 0)) : options.singles;
    for (const option of ranked) {
        const pick = option.picks[0];
        const source = state.pool.find((entry) => entry.key === pick.key);
        const keepFlex = step.kind === "pick" && (source?.possibleRoles.length ?? 0) > 1;
        const assignedRole = keepFlex ? undefined : pick.role ?? source?.possibleRoles[0];
        const action: DraftAction = { ...step, championKey: pick.key,
            ...(step.kind === "pick" && assignedRole ? { role: assignedRole } : {}) };
        const next = transitionDraft(state, action);
        if (!next) continue;
        const reason = step.kind === "ban"
            ? "Ban targets a currently supported opponent option."
            : keepFlex ? `Preserves observed ${source!.possibleRoles.join(" / ")} flexibility; the plan remains conditional.`
            : option.answers.length ? `Addresses: ${option.answers.slice(0, 2).join(", ")}.`
            : option.plan ? `Supports ${option.plan}.` : "Supported by the current strategy review.";
        return { action, next, reason };
    }
    const legal = legalSimulatorActions(state);
    const action = style === "flex" && step.kind === "pick"
        ? legal.find((candidate) => !candidate.role &&
            (state.pool.find((pick) => pick.key === candidate.championKey)?.possibleRoles.length ?? 0) > 1) ?? legal[0]
        : legal[0];
    if (!action) return undefined;
    const next = transitionDraft(state, action)!;
    return { action, next, reason: "Legal fallback; no assessed strategy option available." };
}
