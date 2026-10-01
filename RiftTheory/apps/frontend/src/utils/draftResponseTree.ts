import { STANDARD_DRAFT_SEQUENCE, type DraftSequenceStep } from "@rifttheory/core/src/live-draft/series";
import { canAssignPlayerPicks, type DraftPlayerPool } from "@rifttheory/core/src/draft/player-pool";
import { roleScenarios, reviewStrategy, strategyOptions, type StrategyOption, type StrategyPick } from "./strategyReview";
import { assessDamageResources } from "./compositionCoach";

export type DraftSide = "blue" | "red";
export type DraftAction = DraftSequenceStep & { championKey: string; role?: StrategyPick["role"] };
export type DraftState = {
    patch: string;
    context: "solo" | "pro";
    rank: string;
    region: string;
    datasetId: string;
    firstPick: DraftSide;
    cursor: number;
    picks: Record<DraftSide, StrategyPick[]>;
    bans: string[];
    pool: readonly StrategyPick[];
    unavailable: Record<DraftSide, readonly string[]>;
    owned?: Record<DraftSide, ReadonlySet<string> | undefined>;
    playerPools?: Record<DraftSide, readonly DraftPlayerPool[]>;
    sequence?: readonly DraftSequenceStep[];
};
export type SearchConfig = { pickBeam: number; banBeam: number; maxNodes: number };
export type EvaluationVector = {
    ownNeeds: string[]; ownPlans: string[]; enemyNeeds: string[]; enemyPlans: string[];
    ownCoverage: number; enemyCoverage: number; ownPicks: number; enemyPicks: number;
    roleScenarios: number; enemyRoleScenarios: number; ownDamage: string; enemyDamage: string;
    ownResources: string; enemyResources: string; uncertainty: string[];
};
export type SearchNode = { state: DraftState; action?: DraftAction; children: SearchNode[]; evaluation?: EvaluationVector };
export type PrincipalVariation = {
    actions: DraftAction[];
    evaluation: EvaluationVector;
    nodes: number;
    pruned: number;
    supportedActions: number;
    screenedActions: number;
    depth: number;
    fingerprint: string;
    status: "screened" | "unresolved";
    branchTradeoffs: string[];
    stopReason: "window_complete" | "draft_complete" | "node_cap" | "no_supported_action";
};

export function responseLineStatusText(line: PrincipalVariation): string {
    if (line.branchTradeoffs.length)
        return `Unresolved branch trade-offs: ${line.branchTradeoffs.join(", ")}`;
    if (line.status !== "screened")
        return `Unresolved: ${line.stopReason.replaceAll("_", " ")}`;
    return line.stopReason === "draft_complete" ? "Draft complete" : "Reached the next decision window";
}
export type PendingBanLine = {
    actions: DraftAction[];
    choices: StrategyOption[];
    supportedChoices: number;
    status: "screened" | "node_cap" | "no_supported_action";
};
export type PendingBanTree = {
    lines: PendingBanLine[];
    nextPick: { side: DraftSide; slot: number };
    nodes: number;
    supportedActions: number;
    screenedActions: number;
    pruned: number;
    truncated: boolean;
    fingerprint: string;
};
export type ComparisonReason = {
    code: "own_needs" | "own_plans" | "opponent_needs" | "opponent_plans" |
        "role_flex" | "kit_coverage" | "damage" | "resources" |
        "opponent_damage" | "opponent_resources" | "uncertainty" |
        "branch_tradeoffs" | "search_status";
    label: string;
    selected: string;
    alternative: string;
};

export function comparisonReasons(a: PrincipalVariation | undefined,
    b: PrincipalVariation | undefined): ComparisonReason[] {
    if (!a || !b) return [{ code: "search_status", label: "Search status",
        selected: a?.status ?? "No supported line", alternative: b?.status ?? "No supported line" }];
    const x = a.evaluation, y = b.evaluation;
    const list = (values: string[]) => [...values].sort().join("; ") || "None recorded";
    const reads: ComparisonReason[] = [
        { code: "own_needs", label: "Open own needs", selected: list(x.ownNeeds), alternative: list(y.ownNeeds) },
        { code: "own_plans", label: "Supported own plans", selected: list(x.ownPlans), alternative: list(y.ownPlans) },
        { code: "opponent_needs", label: "Opponent needs", selected: list(x.enemyNeeds), alternative: list(y.enemyNeeds) },
        { code: "opponent_plans", label: "Opponent plans", selected: list(x.enemyPlans), alternative: list(y.enemyPlans) },
        { code: "role_flex", label: "Feasible role assignments (own / opponent)",
            selected: `${x.roleScenarios} / ${x.enemyRoleScenarios}`,
            alternative: `${y.roleScenarios} / ${y.enemyRoleScenarios}` },
        { code: "kit_coverage", label: "Kit coverage (own / opponent)",
            selected: `${x.ownCoverage}/${x.ownPicks} / ${x.enemyCoverage}/${x.enemyPicks}`,
            alternative: `${y.ownCoverage}/${y.ownPicks} / ${y.enemyCoverage}/${y.enemyPicks}` },
        { code: "damage", label: "Recorded damage read", selected: x.ownDamage, alternative: y.ownDamage },
        { code: "resources", label: "Recorded resource read", selected: x.ownResources, alternative: y.ownResources },
        { code: "opponent_damage", label: "Opponent damage read", selected: x.enemyDamage, alternative: y.enemyDamage },
        { code: "opponent_resources", label: "Opponent resource read", selected: x.enemyResources, alternative: y.enemyResources },
        { code: "uncertainty", label: "Evidence uncertainty", selected: list(x.uncertainty), alternative: list(y.uncertainty) },
        { code: "branch_tradeoffs", label: "Unresolved branch trade-offs",
            selected: list(a.branchTradeoffs), alternative: list(b.branchTradeoffs) },
        { code: "search_status", label: "Search status", selected: a.status, alternative: b.status },
    ];
    return reads.filter((reason) => reason.selected !== reason.alternative);
}

export function summarizeResponseLine(line: PrincipalVariation, committedPicks: number) {
    const ownSide = line.actions[0]?.side;
    const future = line.actions.slice(committedPicks);
    return {
        opponent: future.filter((action) => action.side !== ownSide),
        ownFollowup: future.filter((action) => action.side === ownSide),
        openNeeds: line.evaluation.ownNeeds,
        branchTradeoffs: line.branchTradeoffs,
    };
}

export const responseSequence = (firstPick: DraftSide): readonly DraftSequenceStep[] =>
    firstPick === "blue" ? STANDARD_DRAFT_SEQUENCE : STANDARD_DRAFT_SEQUENCE.map((step) => ({
        ...step, side: step.side === "blue" ? "red" : "blue",
    }));

const pickFingerprint = (pick: StrategyPick) => [
    pick.key, pick.name, pick.role, pick.possibleRoles,
    pick.knowledge?.capabilities, pick.knowledge?.coachingProfiles,
    pick.knowledge?.strategicProfiles, pick.knowledge?.colorBaseline,
];

export function draftStateFingerprint(state: DraftState, config: SearchConfig) {
    const serialized = JSON.stringify({
        patch: state.patch, context: state.context, rank: state.rank, region: state.region,
        datasetId: state.datasetId, firstPick: state.firstPick, cursor: state.cursor,
        picks: { blue: state.picks.blue.map(pickFingerprint), red: state.picks.red.map(pickFingerprint) },
        bans: state.bans, unavailable: state.unavailable,
        owned: {
            blue: state.owned?.blue === undefined ? null : [...state.owned.blue].sort(),
            red: state.owned?.red === undefined ? null : [...state.owned.red].sort(),
        },
        playerPools: state.playerPools,
        sequence: state.sequence,
        pool: state.pool.map(pickFingerprint).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
        config,
    });
    let hash = 2166136261;
    for (let index = 0; index < serialized.length; index++)
        hash = Math.imul(hash ^ serialized.charCodeAt(index), 16777619);
    return `rt-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function transitionDraft(state: DraftState, action: DraftAction): DraftState | undefined {
    const sequence = state.sequence ?? responseSequence(state.firstPick);
    const expected = sequence[state.cursor];
    if (!expected || expected.kind !== action.kind || expected.side !== action.side || expected.slot !== action.slot)
        return undefined;
    const key = action.championKey;
    if (!key || state.bans.includes(key) || state.picks.blue.some((p) => p.key === key) || state.picks.red.some((p) => p.key === key)) return undefined;
    if (!state.pool.some((candidate) => candidate.key === key)) return undefined;
    if (action.kind === "ban") return { ...state, cursor: state.cursor + 1, bans: [...state.bans, key] };
    if (state.unavailable[action.side].includes(key)) return undefined;
    if (state.owned?.[action.side] && !state.owned[action.side]!.has(key)) return undefined;
    const pick = state.pool.find((candidate) => candidate.key === key && (!action.role || candidate.role === action.role || candidate.possibleRoles.includes(action.role)));
    if (!pick || (action.role && !pick.possibleRoles.includes(action.role) && pick.role !== action.role)) return undefined;
    const assigned = { ...pick, role: action.role ?? pick.role };
    const picks = [...state.picks[action.side], assigned];
    if (picks.length !== action.slot + 1 || !roleScenarios(picks).length ||
        !canAssignPlayerPicks(picks, state.playerPools?.[action.side] ?? [])) return undefined;
    return { ...state, cursor: state.cursor + 1, picks: { ...state.picks, [action.side]: picks } };
}

const other = (side: DraftSide): DraftSide => side === "blue" ? "red" : "blue";
function candidates(state: DraftState, side: DraftSide) {
    if (state.owned?.[side]?.size === 0)
        return { singles: [], pairs: [], unassessed: [], evaluated: 0, supported: 0 };
    return strategyOptions(state.picks[side], state.picks[other(side)], [...state.pool], {
        bans: state.bans, unavailable: state.unavailable[side], owned: state.owned?.[side],
        playerPools: state.playerPools?.[side],
    }, 1);
}

/** Screen pending live bans before the next pick, retaining each conditional pool. */
export function searchPendingBans(initial: DraftState, config: SearchConfig): PendingBanTree | undefined {
    const sequence = initial.sequence ?? responseSequence(initial.firstPick);
    if (sequence[initial.cursor]?.kind !== "ban") return undefined;
    const nextPick = sequence.slice(initial.cursor).find((step) => step.kind === "pick");
    if (!nextPick || nextPick.kind !== "pick") return undefined;
    const ownSide = nextPick.side;
    const lines: PendingBanLine[] = [];
    const limit = Math.max(1, config.maxNodes);
    let nodes = 0, supportedActions = 0, screenedActions = 0, pruned = 0;
    let truncated = false;
    const visit = (state: DraftState, actions: DraftAction[]) => {
        const step = sequence[state.cursor];
        if (step?.kind === "pick") {
            const options = candidates(state, step.side);
            lines.push({ actions, choices: options.singles.slice(0, 2),
                supportedChoices: options.supported,
                status: options.singles.length ? "screened" : "no_supported_action" });
            return;
        }
        if (!step || step.kind !== "ban") {
            lines.push({ actions, choices: [], supportedChoices: 0, status: "no_supported_action" });
            return;
        }
        if (nodes >= limit) {
            truncated = true;
            lines.push({ actions, choices: [], supportedChoices: 0, status: "node_cap" });
            return;
        }
        const targets = candidates(state, other(step.side));
        supportedActions += targets.supported;
        const width = step.side === ownSide ? 1 : config.banBeam;
        let expanded = 0;
        for (const option of targets.singles.slice(0, Math.max(1, width))) {
            if (nodes >= limit) { truncated = true; break; }
            const action = { ...step, championKey: option.picks[0].key };
            const next = transitionDraft(state, action);
            if (!next) continue;
            nodes++;
            screenedActions++;
            expanded++;
            visit(next, [...actions, action]);
        }
        pruned += Math.max(0, targets.supported - expanded);
        if (!expanded)
            lines.push({ actions, choices: [], supportedChoices: 0,
                status: truncated ? "node_cap" : "no_supported_action" });
    };
    visit(initial, []);
    lines.sort((a, b) => JSON.stringify(a.actions).localeCompare(JSON.stringify(b.actions)));
    return { lines, nextPick: { side: nextPick.side, slot: nextPick.slot }, nodes,
        supportedActions, screenedActions, pruned, truncated,
        fingerprint: draftStateFingerprint(initial, config) };
}
function evaluate(state: DraftState, side: DraftSide): EvaluationVector {
    const read = reviewStrategy(state.picks[side], state.picks[other(side)]);
    const resourceInputs = (picks: typeof read.blue.picks) => picks.map(({ name, role, coaching }) => ({ name, role, coaching }));
    const ownResources = assessDamageResources(resourceInputs(read.blue.picks));
    const enemyResources = assessDamageResources(resourceInputs(read.red.picks));
    return {
        ownNeeds: read.blue.needs.map((n) => n.title), ownPlans: read.blue.plans.map((p) => p.title),
        enemyNeeds: read.red.needs.map((n) => n.title), enemyPlans: read.red.plans.map((p) => p.title),
        ownCoverage: read.blue.covered, enemyCoverage: read.red.covered,
        ownPicks: state.picks[side].length, enemyPicks: state.picks[other(side)].length,
        roleScenarios: read.blue.scenarios,
        enemyRoleScenarios: read.red.scenarios,
        ownDamage: ownResources.damageLabel, enemyDamage: enemyResources.damageLabel,
        ownResources: ownResources.resourceLabel, enemyResources: enemyResources.resourceLabel,
        uncertainty: [...(read.issues.length ? ["Invalid or incomplete role evidence"] : []),
            ...(read.blue.covered < state.picks[side].length || read.red.covered < state.picks[other(side)].length ? ["Incomplete kit coverage"] : [])],
    };
}
const subset = (x: string[], y: string[]) => x.every((value) => y.includes(value));
function dominatesEvaluation(x: EvaluationVector, y: EvaluationVector) {
    if (x.uncertainty.length || y.uncertainty.length) return false;
    const noWorse = x.ownCoverage >= y.ownCoverage && x.enemyCoverage <= y.enemyCoverage &&
        x.roleScenarios >= y.roleScenarios && x.enemyRoleScenarios <= y.enemyRoleScenarios &&
        x.ownDamage === y.ownDamage && x.enemyDamage === y.enemyDamage &&
        x.ownResources === y.ownResources && x.enemyResources === y.enemyResources &&
        subset(x.ownNeeds, y.ownNeeds) && subset(y.ownPlans, x.ownPlans) &&
        subset(y.enemyNeeds, x.enemyNeeds) && subset(x.enemyPlans, y.enemyPlans);
    const better = x.ownCoverage > y.ownCoverage || x.enemyCoverage < y.enemyCoverage ||
        x.roleScenarios > y.roleScenarios || x.enemyRoleScenarios < y.enemyRoleScenarios ||
        x.ownNeeds.length < y.ownNeeds.length || x.ownPlans.length > y.ownPlans.length ||
        x.enemyNeeds.length > y.enemyNeeds.length || x.enemyPlans.length < y.enemyPlans.length;
    return noWorse && better;
}

function branchDifferences(branches: PrincipalVariation[]) {
    const values = branches.map((branch) => branch.evaluation);
    const differs = (read: (value: EvaluationVector) => unknown) =>
        new Set(values.map((value) => JSON.stringify(read(value)))).size > 1;
    return [
        differs((value) => value.ownNeeds) && "own needs",
        differs((value) => value.ownPlans) && "own plans",
        differs((value) => value.enemyNeeds) && "opponent needs",
        differs((value) => value.enemyPlans) && "opponent plans",
        differs((value) => [value.roleScenarios, value.enemyRoleScenarios]) && "role flexibility",
        differs((value) => [value.ownCoverage, value.enemyCoverage]) && "kit coverage",
        differs((value) => [value.ownDamage, value.enemyDamage]) && "damage profile",
        differs((value) => [value.ownResources, value.enemyResources]) && "resource demand",
        differs((value) => value.uncertainty) && "evidence uncertainty",
    ].filter((label): label is string => Boolean(label));
}

export function selectAdversarialBranch(branches: PrincipalVariation[], side: "own" | "opponent") {
    if (!branches.length) return undefined;
    const contenders = branches.filter((branch) => !branches.some((otherBranch) =>
        otherBranch !== branch && (side === "own"
            ? dominatesEvaluation(otherBranch.evaluation, branch.evaluation)
            : dominatesEvaluation(branch.evaluation, otherBranch.evaluation))));
    contenders.sort((a, b) => JSON.stringify(a.actions).localeCompare(JSON.stringify(b.actions)));
    const tradeoffs = contenders.length > 1 ? branchDifferences(contenders) : [];
    return { branch: contenders[0], tradeoffs };
}

/** A bounded action tree: screened picks and target bans, through the next own window. */
export function searchDraftResponse(initial: DraftState, choice: StrategyOption, config: SearchConfig): PrincipalVariation | undefined {
    const sequence = initial.sequence ?? responseSequence(initial.firstPick);
    const ownSide = sequence[initial.cursor]?.side;
    if (!ownSide || sequence[initial.cursor]?.kind !== "pick") return undefined;
    const fingerprint = draftStateFingerprint(initial, config);
    let nodes = 0;
    let pruned = 0;
    let supportedActions = 0;
    let screenedActions = 0;
    let capped = false;
    const rootActions: DraftAction[] = [];
    let state = initial;
    for (const pick of choice.picks) {
        const step = sequence[state.cursor];
        if (!step || step.kind !== "pick" || step.side !== ownSide) return undefined;
        const action = { ...step, championKey: pick.key, role: pick.role };
        const next = transitionDraft(state, action);
        if (!next) return undefined;
        rootActions.push(action);
        state = next;
        nodes++;
    }
    const limit = Math.max(1, config.maxNodes);
    const leaf = (current: DraftState, path: DraftAction[],
        stopReason: PrincipalVariation["stopReason"]): PrincipalVariation => ({
        actions: path, evaluation: evaluate(current, ownSide), nodes: 0, pruned: 0,
        supportedActions: 0, screenedActions: 0, depth: path.length, fingerprint,
        status: stopReason === "window_complete" || stopReason === "draft_complete" ? "screened" : "unresolved",
        branchTradeoffs: [],
        stopReason,
    });
    function visit(current: DraftState, path: DraftAction[], reachedOwnAgain: boolean): PrincipalVariation[] {
        const step = sequence[current.cursor];
        if (!step) return [leaf(current, path, "draft_complete")];
        if (reachedOwnAgain && (step.kind !== "pick" || step.side !== ownSide))
            return [leaf(current, path, "window_complete")];
        if (nodes >= limit) {
            capped = true;
            return [leaf(current, path, "node_cap")];
        }
        const nextReachedOwn = reachedOwnAgain || (step.kind === "pick" && step.side === ownSide);
        const candidateSet = candidates(current, step.kind === "ban" ? other(step.side) : step.side);
        // Widen adversarial bans first. Own ban choices stay a single
        // supported target until the wider response beam fits the node budget.
        const width = step.kind === "ban"
            ? step.side === ownSide ? 1 : config.banBeam
            : config.pickBeam;
        const selected = candidateSet.singles.slice(0, Math.max(1, width));
        supportedActions += candidateSet.supported;
        const branches: PrincipalVariation[] = [];
        for (const option of selected) {
            if (nodes >= limit) { capped = true; break; }
            const action = { ...step, championKey: option.picks[0].key, role: step.kind === "pick" ? option.picks[0].role : undefined };
            const next = transitionDraft(current, action);
            if (!next) continue;
            nodes++;
            screenedActions++;
            branches.push(...visit(next, [...path, action], nextReachedOwn));
        }
        pruned += Math.max(0, candidateSet.supported - branches.length);
        if (!branches.length) return [leaf(current, path, capped ? "node_cap" : "no_supported_action")];
        const selection = selectAdversarialBranch(branches, step.side === ownSide ? "own" : "opponent")!;
        return [{ ...selection.branch, branchTradeoffs: [...new Set([
            ...selection.branch.branchTradeoffs, ...selection.tradeoffs,
        ])] }];
    }
    const found = visit(state, rootActions, false)[0];
    return { ...found, nodes, pruned, supportedActions, screenedActions,
        depth: found.actions.length, status: capped || found.branchTradeoffs.length ? "unresolved" : found.status,
        stopReason: capped ? "node_cap" : found.stopReason };
}

export function compareVariations(a: PrincipalVariation | undefined, b: PrincipalVariation | undefined): "selected" | "alternative" | "unresolved" {
    if (!a || !b || a.status !== "screened" || b.status !== "screened" || a.evaluation.uncertainty.length || b.evaluation.uncertainty.length) return "unresolved";
    if (dominatesEvaluation(a.evaluation, b.evaluation)) return "selected";
    if (dominatesEvaluation(b.evaluation, a.evaluation)) return "alternative";
    return "unresolved";
}
