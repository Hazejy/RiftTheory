import { STANDARD_DRAFT_SEQUENCE } from "@draftgap/core/src/live-draft/series";
import type { Team } from "@draftgap/core/src/models/Team";
import { DRAFT_PICK_ORDER, pickLabel } from "./draftOrder";

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
        bansBeforeReply: immediate
            .slice(0, replyIndex < 0 ? undefined : replyIndex)
            .filter((action) => action.kind === "ban")
            .map(actionLabel),
        chronological,
        picksRemaining: DRAFT_PICK_ORDER.length - end - 1,
    };
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
