import { expect, test } from "bun:test";
import { formatResponseChoice, pendingBanDraftState, responseDraftState } from "./strategyResponseState";
import { responseSequence } from "./draftResponseTree";
import type { StrategyPick } from "./strategyReview";

const blue: StrategyPick = { key: "blue", name: "Blue", role: "top", possibleRoles: ["top"] };
const red: StrategyPick = { key: "red", name: "Red", role: "top", possibleRoles: ["top"] };
const common = {
    bans: ["first-ban"], pool: [blue, red], patch: "16.19.1", datasetId: "dataset",
    rank: "emerald_plus", region: "all",
};

test("response comparison names each flex pick's actual role", () => {
    expect(formatResponseChoice([{ name: "Camille", role: "support" }]))
        .toBe("Camille · support");
    expect(formatResponseChoice([
        { name: "Olaf", role: "top" }, { name: "Galio", role: "mid" },
    ])).toBe("Olaf · top + Galio · mid");
});

test("a live pending-ban snapshot cannot silently start at the next pick", () => {
    const state = responseDraftState({ ...common,
        selected: { team: "opponent", index: 3 }, own: [red], enemy: [blue],
        live: { pendingBans: true, unavailable: { ally: ["blue-lock"], opponent: ["red-lock"] } },
    });
    expect(state).toBeUndefined();
    const pending = pendingBanDraftState({ ...common,
        selected: { team: "opponent", index: 3 }, own: [red], enemy: [blue],
        live: { pendingBans: true, pendingAction: { kind: "ban", side: "red", slot: 3 },
            unavailable: { ally: ["blue-lock"], opponent: ["red-lock"] } },
    });
    expect(responseSequence(pending!.firstPick)[pending!.cursor]).toMatchObject({
        kind: "ban", side: "red", slot: 3,
    });
    expect(pendingBanDraftState({ ...common,
        selected: { team: "ally", index: 3 }, own: [], enemy: [],
        live: { pendingBans: true, pendingAction: { kind: "ban", side: "red", slot: 3 },
            unavailable: { ally: [], opponent: [] } },
    })).toBeUndefined();
});

test("side-swapped team locks follow their current Blue and Red sides", () => {
    const state = responseDraftState({ ...common,
        selected: { team: "opponent", index: 3 }, own: [red], enemy: [blue],
        live: { pendingBans: false, unavailable: { ally: ["blue-lock"], opponent: ["red-lock"] } },
        owned: new Set(["red"]), playerPools: { blue: [], red: [] },
    })!;
    expect(state.picks).toEqual({ blue: [blue], red: [red] });
    expect(state.unavailable).toEqual({ blue: ["blue-lock"], red: ["red-lock"] });
    expect(state.owned?.blue).toBeUndefined();
    expect(state.playerPools).toBeUndefined();
    expect(responseSequence(state.firstPick)[state.cursor]).toMatchObject({
        kind: "pick", side: "red", slot: 3,
    });
});

test("main draft ownership and player pools stay with Blue", () => {
    const owned = new Set(["blue"]);
    const pools = { blue: [], red: [] };
    const state = responseDraftState({ ...common,
        selected: { team: "ally", index: 0 }, own: [], enemy: [], owned,
        playerPools: pools,
    })!;
    expect(state.owned?.blue).toBe(owned);
    expect(state.playerPools).toBe(pools);
    expect(state.unavailable).toEqual({ blue: [], red: [] });
    expect(responseDraftState({ ...common, selected: { team: "ally", index: 5 },
        own: [], enemy: [] })).toBeUndefined();
});
