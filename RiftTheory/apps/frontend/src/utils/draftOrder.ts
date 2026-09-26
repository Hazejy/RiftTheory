import { Team } from "@rifttheory/core/src/models/Team";

// Pick slots are chronological, not lane assignments. B = ally, R = opponent.
export const DRAFT_PICK_ORDER: ReadonlyArray<{ team: Team; index: number }> = [
    { team: "ally", index: 0 },
    { team: "opponent", index: 0 },
    { team: "opponent", index: 1 },
    { team: "ally", index: 1 },
    { team: "ally", index: 2 },
    { team: "opponent", index: 2 },
    { team: "opponent", index: 3 },
    { team: "ally", index: 3 },
    { team: "ally", index: 4 },
    { team: "opponent", index: 4 },
];

export const pickLabel = (team: Team, index: number) =>
    `${team === "ally" ? "B" : "R"}${index + 1}`;

/** A replacement is one decision; an empty slot can include the next same-side pick. */
export function draftResponseWindow(
    step: { team: Team; index: number } | undefined,
    teams: Record<Team, readonly { championKey?: string }[]>,
    order = DRAFT_PICK_ORDER,
) {
    if (!step) return [];
    const start = order.findIndex(
        (p) => p.team === step.team && p.index === step.index,
    );
    if (start < 0) return [];
    if (teams[step.team][step.index]?.championKey) return [step];
    const result: { team: Team; index: number }[] = [];
    for (let i = start; i < order.length; i++) {
        const current = order[i];
        // R3 and R4 are separated by the second ban phase, even though they
        // appear adjacent in the pick-only order.
        if (i > start && current.team === "opponent" && current.index === 3 &&
            order[i - 1].team === "opponent" && order[i - 1].index === 2)
            break;
        if (
            current.team !== step.team ||
            teams[current.team][current.index]?.championKey
        )
            break;
        result.push(current);
    }
    return result;
}
