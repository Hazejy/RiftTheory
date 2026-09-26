import { STANDARD_DRAFT_SEQUENCE } from "@rifttheory/core/src/live-draft/series";
import type { Team } from "@rifttheory/core/src/models/Team";
import { DRAFT_PICK_ORDER, pickLabel } from "./draftOrder";
import {
    reviewStrategy,
    strategyOptions,
    type StrategyConstraints,
    type StrategyOption,
    type StrategyPick,
} from "./strategyReview";

type Slot = { team: Team; index: number };
type Filled = { championKey?: string };

const QUESTIONS: Record<string, string> = {
    B1: "What can Red answer, and which roles and plans remain open?",
    R1: "How does the first response challenge B1 while opening Red's own plan?",
    R2: "Does the second response work with R1 without exposing both roles too early?",
    B2: "Which part of R1 + R2 needs an answer, and what can B3 still preserve?",
    B3: "What does the Blue pair gain, and what can R3 punish before the next bans?",
    R3: "How does Red finish the first pick phase before the second bans?",
    R4: "What changed in the second bans, and what can Blue still take on B4 + B5?",
    B4: "Which remaining role or team function must Blue secure now?",
    B5: "What does Blue finish, and which weakness can Red attack with R5?",
    R5: "Does the final response complete Red's plan without opening a new weakness?",
};

const sameSlot = (left: Slot, right: Slot) =>
    left.team === right.team && left.index === right.index;
const actionLabel = (action: { kind: "pick" | "ban"; side: "blue" | "red"; slot: number }) =>
    action.kind === "pick"
        ? `${action.side === "blue" ? "B" : "R"}${action.slot + 1}`
        : `${action.side === "blue" ? "Blue" : "Red"} ban ${action.slot + 1}`;

/** Explain the actual next action window for any of the ten standard pick slots. */
export function draftCoachWindow(
    selected: Slot | undefined,
    window: readonly Slot[],
    teams: Record<Team, readonly Filled[]>,
) {
    if (!selected) return undefined;
    const start = DRAFT_PICK_ORDER.findIndex((slot) => sameSlot(slot, selected));
    if (start < 0) return undefined;
    const last = window.at(-1) ?? selected;
    const end = DRAFT_PICK_ORDER.findIndex((slot) => sameSlot(slot, last));
    const lastAction = STANDARD_DRAFT_SEQUENCE.findIndex(
        (action) => action.kind === "pick" &&
            action.side === (last.team === "ally" ? "blue" : "red") &&
            action.slot === last.index,
    );
    const following = STANDARD_DRAFT_SEQUENCE.slice(lastAction + 1);
    const nextOwn = following.findIndex(
        (action) => action.kind === "pick" &&
            action.side === (selected.team === "ally" ? "blue" : "red"),
    );
    const immediate = following.slice(0, nextOwn < 0 ? undefined : nextOwn + 1);
    const opponentSide = selected.team === "ally" ? "red" : "blue";
    const beforeOwn = following.slice(0, nextOwn < 0 ? undefined : nextOwn);
    const firstBan = beforeOwn.findIndex((action) => action.kind === "ban");
    const beforeBan = beforeOwn.slice(0, firstBan < 0 ? undefined : firstBan);
    const replyPicks = beforeBan.filter(
        (action) => action.kind === "pick" && action.side === opponentSide,
    );
    const nextOwnSequence = nextOwn < 0 || firstBan >= 0
        ? []
        : following.slice(nextOwn);
    const afterBansSequence = nextOwn < 0 || firstBan < 0
        ? []
        : following.slice(nextOwn);
    const nextOwnEnd = nextOwnSequence.findIndex(
        (action) => action.kind !== "pick" ||
            action.side !== (selected.team === "ally" ? "blue" : "red"),
    );
    const nextOwnPicks = nextOwnSequence.slice(
        0,
        nextOwnEnd < 0 ? undefined : nextOwnEnd,
    );
    const afterBansEnd = afterBansSequence.findIndex(
        (action) => action.kind !== "pick" ||
            action.side !== (selected.team === "ally" ? "blue" : "red"),
    );
    const nextOwnAfterBans = afterBansSequence.slice(
        0,
        afterBansEnd < 0 ? undefined : afterBansEnd,
    );
    const replyIndex = immediate.findIndex(
        (action) => action.kind === "pick" && action.side === opponentSide,
    );
    const reply = replyIndex < 0 ? undefined : immediate[replyIndex];
    const chronological = DRAFT_PICK_ORDER.every((slot, index) => {
        const filled = Boolean(teams[slot.team][slot.index]?.championKey);
        return index < start ? filled : !filled;
    });
    return {
        label: window.length > 1
            ? window.map((slot) => pickLabel(slot.team, slot.index)).join(" + ")
            : pickLabel(selected.team, selected.index),
        questions: (window.length ? window : [selected]).map(
            (slot) => QUESTIONS[pickLabel(slot.team, slot.index)],
        ),
        nextActions: immediate.map(actionLabel),
        nextOpponentPick: reply?.kind === "pick" ? actionLabel(reply) : undefined,
        replyPicks: replyPicks.map(actionLabel),
        nextOwnPicks: nextOwnPicks.map(actionLabel),
        nextOwnAfterBans: nextOwnAfterBans.map(actionLabel),
        opponentBansBeforeOwn: beforeOwn
            .filter((action) => action.kind === "ban" && action.side === opponentSide)
            .map(actionLabel),
        bansBeforeReply: immediate
            .slice(0, replyIndex < 0 ? undefined : replyIndex)
            .filter((action) => action.kind === "ban")
            .map(actionLabel),
        chronological,
        picksRemaining: DRAFT_PICK_ORDER.length - end - 1,
    };
}

/** A bounded target-ban scenario for the next own pick window, not a ban recommendation. */
export function draftBanStress(
    own: StrategyPick[],
    enemy: StrategyPick[],
    candidates: StrategyPick[],
    constraints: StrategyConstraints,
    windowSize: number,
    opponentBanCount: number,
) {
    if (!windowSize || !opponentBanCount) return undefined;
    const bans = [...constraints.bans];
    const screen = () => {
        const options = strategyOptions(
            own, enemy, candidates, { ...constraints, bans }, windowSize,
        );
        return windowSize > 1 ? options.pairs[0] : options.singles[0];
    };
    const initial = screen();
    if (!initial) return undefined;
    const targets: StrategyPick[] = [];
    let fallback: typeof initial | undefined = initial;
    for (let index = 0; index < opponentBanCount; index++) {
        const target = fallback?.picks[0];
        if (!target) break;
        targets.push(target);
        bans.push(target.key);
        fallback = screen();
    }
    return { initial, targets, fallback };
}

export type ScreenedDraftLine = {
    reply: StrategyOption;
    fallback?: StrategyOption;
    ownNeeds: string[];
    ownPlans: string[];
    enemyNeeds: string[];
    enemyPlans: string[];
    covered: boolean;
};

/** Screen a choice against a small set of legal replies and one own continuation. */
export function screenDraftChoice(
    own: StrategyPick[],
    enemy: StrategyPick[],
    choice: StrategyOption,
    candidates: StrategyPick[],
    ownConstraints: StrategyConstraints,
    enemyConstraints: StrategyConstraints,
    replySize: number,
    followSize: number,
) {
    if (!replySize) return {
        lines: [] as ScreenedDraftLine[],
        worst: undefined,
        supported: false,
    };
    const ownAfter = [...own, ...choice.picks];
    const responses = strategyOptions(
        enemy, ownAfter, candidates, enemyConstraints, replySize,
        "", enemy, "pressure",
    );
    const replies = replySize > 1 ? responses.pairs : responses.singles.slice(0, 3);
    const lines = replies.flatMap((reply): ScreenedDraftLine[] => {
        const enemyAfter = [...enemy, ...reply.picks];
        const options = followSize
            ? strategyOptions(ownAfter, enemyAfter, candidates, ownConstraints, followSize)
            : undefined;
        const fallback = followSize > 1 ? options?.pairs[0] : options?.singles[0];
        const ownFinal = [...ownAfter, ...(fallback?.picks ?? [])];
        const read = reviewStrategy(ownFinal, enemyAfter);
        if (read.issues.length) return [];
        return [{
            reply,
            fallback,
            ownNeeds: read.blue.needs.map((need) => need.title),
            ownPlans: read.blue.plans.map((plan) => plan.title),
            enemyNeeds: read.red.needs.map((need) => need.title),
            enemyPlans: read.red.plans.map((plan) => plan.title),
            covered: read.blue.covered === ownFinal.length &&
                read.red.covered === enemyAfter.length &&
                (!followSize || Boolean(fallback)),
        }];
    });
    // This ordering selects an adverse *screened* branch. It is structural,
    // not a win-probability utility or an exhaustive opponent policy.
    const worst = [...lines].sort((a, b) =>
        b.ownNeeds.length - a.ownNeeds.length ||
        a.ownPlans.length - b.ownPlans.length ||
        a.enemyNeeds.length - b.enemyNeeds.length ||
        b.enemyPlans.length - a.enemyPlans.length ||
        a.reply.picks.map((pick) => pick.name).join().localeCompare(
            b.reply.picks.map((pick) => pick.name).join(),
        ),
    )[0];
    return {
        lines,
        worst,
        supported: lines.length > 0 && lines.every((line) => line.covered),
    };
}

/** Report only Pareto dominance of the two screened adverse branches. */
export function compareScreenedDraftLines(
    selected: ScreenedDraftLine | undefined,
    alternative: ScreenedDraftLine | undefined,
): "selected" | "alternative" | "unresolved" {
    if (!selected?.covered || !alternative?.covered) return "unresolved";
    const dominates = (left: ScreenedDraftLine, right: ScreenedDraftLine) => {
        const included = (subset: string[], superset: string[]) =>
            subset.every((entry) => superset.includes(entry));
        const noWorse = [
            included(left.ownNeeds, right.ownNeeds),
            included(right.ownPlans, left.ownPlans),
            included(right.enemyNeeds, left.enemyNeeds),
            included(left.enemyPlans, right.enemyPlans),
        ];
        return noWorse.every(Boolean) && [
            left.ownNeeds.length < right.ownNeeds.length,
            left.ownPlans.length > right.ownPlans.length,
            left.enemyNeeds.length > right.enemyNeeds.length,
            left.enemyPlans.length < right.enemyPlans.length,
        ].some(Boolean);
    };
    if (dominates(selected, alternative)) return "selected";
    if (dominates(alternative, selected)) return "alternative";
    return "unresolved";
}

type PickChoice = { picks: readonly { key: string; role?: string }[] };

/** Keep a comparison inside the same selected pick window and role assignment. */
export function sameSlotAlternative<T extends PickChoice>(
    selected: T,
    ordered: readonly T[],
): T | undefined {
    const identity = (choice: T) => choice.picks
        .map((pick) => `${pick.key}:${pick.role ?? "?"}`)
        .sort()
        .join("|");
    const selectedIdentity = identity(selected);
    return ordered.find((choice) =>
        choice.picks.length === selected.picks.length &&
        identity(choice) !== selectedIdentity,
    );
}
