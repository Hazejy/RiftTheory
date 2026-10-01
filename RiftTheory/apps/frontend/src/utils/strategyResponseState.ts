import type { DraftPlayerPool } from "@rifttheory/core/src/draft/player-pool";
import { responseSequence, type DraftState } from "./draftResponseTree";
import type { StrategyLiveSnapshot } from "./strategyLiveDraft";
import type { StrategyPick } from "./strategyReview";

type Side = "blue" | "red";
type Team = "ally" | "opponent";

export function formatResponseChoice(picks: readonly Pick<StrategyPick, "name" | "role">[]): string {
    return picks.map((pick) => `${pick.name}${pick.role ? ` · ${pick.role}` : ""}`).join(" + ");
}

/** Convert the visible pick window into one chronological search state. */
export type ResponseStateInput = {
    selected: { team: Team; index: number };
    own: StrategyPick[];
    enemy: StrategyPick[];
    bans: string[];
    pool: readonly StrategyPick[];
    live?: Pick<StrategyLiveSnapshot, "pendingBans" | "unavailable"> &
        Partial<Pick<StrategyLiveSnapshot, "pendingAction">>;
    owned?: ReadonlySet<string>;
    playerPools?: Record<Side, readonly DraftPlayerPool[]>;
    patch: string;
    datasetId: string;
    rank: string;
    region: string;
};

function makeState(input: ResponseStateInput, cursor: number): DraftState {
    const side: Side = input.selected.team === "ally" ? "blue" : "red";
    return {
        patch: input.patch, context: "solo", rank: input.rank, region: input.region,
        datasetId: input.datasetId, firstPick: "blue", cursor,
        picks: side === "blue" ? { blue: input.own, red: input.enemy } :
            { blue: input.enemy, red: input.own },
        bans: [...input.bans], pool: input.pool,
        unavailable: {
            blue: input.live?.unavailable.ally ?? [],
            red: input.live?.unavailable.opponent ?? [],
        },
        owned: { blue: input.live || !input.owned?.size ? undefined : input.owned, red: undefined },
        playerPools: input.live ? undefined : input.playerPools,
    };
}

export function responseDraftState(input: ResponseStateInput): DraftState | undefined {
    // A live snapshot names the next pick even while the second bans are
    // unfinished. Starting at that pick would silently skip legal ban actions.
    if (input.live?.pendingBans) return undefined;
    const side: Side = input.selected.team === "ally" ? "blue" : "red";
    const sequence = responseSequence("blue");
    const cursor = sequence.findIndex((action) =>
        action.kind === "pick" && action.side === side && action.slot === input.selected.index);
    if (cursor < 0) return undefined;
    return makeState(input, cursor);
}

export function pendingBanDraftState(input: ResponseStateInput): DraftState | undefined {
    const action = input.live?.pendingAction;
    if (!input.live?.pendingBans || action?.kind !== "ban") return undefined;
    const sequence = responseSequence("blue");
    const cursor = sequence.findIndex((step) => step.kind === action.kind &&
        step.side === action.side && step.slot === action.slot);
    if (cursor < 0) return undefined;
    const nextPick = sequence.slice(cursor).find((step) => step.kind === "pick");
    if (!nextPick || nextPick.side !== (input.selected.team === "ally" ? "blue" : "red") ||
        nextPick.slot !== input.selected.index) return undefined;
    return makeState(input, cursor);
}
