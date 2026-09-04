import { Team } from "@draftgap/core/src/models/Team";

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
