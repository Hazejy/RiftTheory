import { describe, expect, test } from "bun:test";
import type { KnowledgeChampion } from "../types/RiftTheoryKnowledge";
import { compareStrategyOption, type StrategyPick, type StrategyRole } from "./strategyReview";
import { compareVariations, comparisonReasons, draftStateFingerprint, responseLineStatusText, responseSequence, searchDraftResponse, searchPendingBans, selectAdversarialBranch, summarizeResponseLine, transitionDraft, type DraftState } from "./draftResponseTree";
import shippedKnowledge from "../../public/data/rifttheory-knowledge.json";

const roles: StrategyRole[] = ["top", "jungle", "mid", "bot", "support"];
const source = shippedKnowledge.champions.find((champion) => champion.capabilities.length) as KnowledgeChampion;
const pool: StrategyPick[] = roles.flatMap((role) => Array.from({ length: 7 }, (_, index) => ({
    key: `${role}-${index}`, name: `${role}-${index}`, role, possibleRoles: [role],
    knowledge: { ...source, capabilities: [{ ...source.capabilities[0], role }] },
})));
const config = { pickBeam: 1, banBeam: 1, maxNodes: 24 };
function stateFor(side: "blue" | "red", slot: number, firstPick: "blue" | "red" = "blue"): DraftState {
    const sequence = responseSequence(firstPick);
    const cursor = sequence.findIndex((step) => step.kind === "pick" && step.side === side && step.slot === slot);
    const picks: DraftState["picks"] = { blue: [], red: [] };
    for (const step of sequence.slice(0, cursor)) if (step.kind === "pick")
        picks[step.side].push(pool.find((pick) => pick.key === `${roles[step.slot]}-${step.side === "blue" ? 0 : 1}`)!);
    return { patch: "test", context: "solo", rank: "test", region: "test", datasetId: "test",
        firstPick, cursor, picks, bans: [], pool, unavailable: { blue: [], red: [] } };
}

describe("response tree state", () => {
    test("the final R5 continuation says the draft ended", () => {
        const initial = stateFor("red", 4);
        const chosen = pool.find((pick) => pick.key === "support-1")!;
        const choice = compareStrategyOption(initial.picks.red, initial.picks.blue, [chosen]);
        const line = searchDraftResponse(initial, choice, config)!;
        expect(line.stopReason).toBe("draft_complete");
        expect(responseLineStatusText(line)).toBe("Draft complete");
    });

    test("all ten slots replay as legal deterministic paths, including second bans", () => {
        for (const side of ["blue", "red"] as const) for (let slot = 0; slot < 5; slot++) {
            const initial = stateFor(side, slot);
            const chosen = pool.find((pick) => pick.key === `${roles[slot]}-${side === "blue" ? 0 : 1}`)!;
            const choice = compareStrategyOption(initial.picks[side], initial.picks[side === "blue" ? "red" : "blue"], [chosen]);
            const first = searchDraftResponse(initial, choice, config);
            const second = searchDraftResponse(initial, choice, config);
            expect(first).toBeDefined();
            expect(first).toEqual(second);
            let replay = initial;
            for (const action of first!.actions) {
                const next = transitionDraft(replay, action);
                expect(next).toBeDefined();
                replay = next!;
            }
            expect(new Set([...replay.picks.blue, ...replay.picks.red].map((pick) => pick.key)).size)
                .toBe(replay.picks.blue.length + replay.picks.red.length);
            expect(first!.status).toBe("screened");
            expect(first!.supportedActions).toBeGreaterThanOrEqual(first!.screenedActions);
            expect(first!.pruned).toBe(first!.supportedActions - first!.screenedActions);
            expect(first!.actions[0]).toMatchObject({ kind: "pick", side, slot });
            const summary = summarizeResponseLine(first!, 1);
            expect([...summary.opponent, ...summary.ownFollowup].map((action) => action.championKey).sort())
                .toEqual(first!.actions.slice(1).map((action) => action.championKey).sort());
            expect(summary.opponent.every((action) => action.side !== side)).toBe(true);
            expect(summary.ownFollowup.every((action) => action.side === side)).toBe(true);
            expect(summary.openNeeds).toEqual(first!.evaluation.ownNeeds);
            expect(first!.actions.filter((action) => action.kind === "pick" && action.side === side).length)
                .toBeGreaterThanOrEqual(1);
            if ((side === "blue" && slot === 2) || (side === "red" && slot === 2))
                expect(first!.actions.filter((action) => action.kind === "ban")).toHaveLength(4);
        }
    });

    test("side swap and legality preserve role uncertainty and locks", () => {
        const state = stateFor("red", 0, "red");
        const step = responseSequence("red")[state.cursor];
        expect(step.side).toBe("red");
        const flex = { ...pool[0], key: "flex", role: undefined, possibleRoles: ["top", "mid"] as StrategyRole[] };
        const withFlex = { ...state, pool: [...pool, flex] };
        const action = { ...step, championKey: "flex" };
        const next = transitionDraft(withFlex, action);
        expect(next?.picks.red[0].role).toBeUndefined();
        expect(transitionDraft({ ...withFlex, bans: ["flex"] }, action)).toBeUndefined();
        expect(transitionDraft({ ...withFlex, unavailable: { blue: [], red: ["flex"] } }, action)).toBeUndefined();
        expect(transitionDraft({ ...withFlex, owned: { blue: undefined, red: new Set(["other"]) } }, action)).toBeUndefined();
        expect(transitionDraft({ ...withFlex, owned: { blue: undefined, red: new Set() } }, action)).toBeUndefined();
        expect(transitionDraft(withFlex, { ...action, championKey: "missing" })).toBeUndefined();
        expect(transitionDraft(withFlex, { ...action, side: "blue" })).toBeUndefined();
        expect(transitionDraft(withFlex, { ...action, role: "jungle" })).toBeUndefined();
    });

    test("two screened alternatives share the same initial state and cross the ban phase", () => {
        const initial = stateFor("blue", 2);
        const choices = ["mid-0", "mid-2"].map((key) => compareStrategyOption(
            initial.picks.blue, initial.picks.red, [pool.find((pick) => pick.key === key)!],
        ));
        const lines = choices.map((choice) => searchDraftResponse(initial, choice, { pickBeam: 2, banBeam: 1, maxNodes: 96 }));
        for (const line of lines) {
            expect(line?.status).toBe("screened");
            expect(line?.actions.filter((action) => action.kind === "ban")).toHaveLength(4);
            expect(line?.actions.filter((action) => action.kind === "pick" && action.side === "blue").map((action) => action.slot))
                .toEqual([2, 3, 4]);
        }
        expect(lines[0]?.fingerprint).toBe(lines[1]?.fingerprint);
        const read = summarizeResponseLine(lines[0]!, 1);
        expect(read.opponent).toHaveLength(4);
        expect(read.opponent.filter((action) => action.kind === "ban")).toHaveLength(2);
        expect(read.ownFollowup.some((action) => action.kind === "pick")).toBe(true);
    });

    test("a double-pick choice is not repeated as its own fallback", () => {
        const initial = stateFor("blue", 1);
        const additions = ["jungle-0", "mid-0"].map((key) => pool.find((pick) => pick.key === key)!);
        const choice = compareStrategyOption(initial.picks.blue, initial.picks.red, additions);
        const line = searchDraftResponse(initial, choice, { ...config, maxNodes: 96 })!;
        expect(line.actions.slice(0, 2).map((action) => action.championKey)).toEqual(additions.map((pick) => pick.key));
        const summary = summarizeResponseLine(line, 2);
        expect(summary.ownFollowup.map((action) => action.championKey))
            .not.toContain(additions[1].key);
        expect([...summary.opponent, ...summary.ownFollowup]).toHaveLength(line.actions.length - 2);
    });

    test("two ban targets at each second-phase ban remain legal and reproducible", () => {
        const initial = stateFor("blue", 2);
        const choice = compareStrategyOption(initial.picks.blue, initial.picks.red,
            [pool.find((pick) => pick.key === "mid-0")!]);
        const wider = { pickBeam: 2, banBeam: 2, maxNodes: 256 };
        const first = searchDraftResponse(initial, choice, wider)!;
        const narrow = searchDraftResponse(initial, choice, { ...wider, banBeam: 1 })!;
        expect(first).toEqual(searchDraftResponse(initial, choice, wider)!);
        expect(first.nodes).toBeGreaterThan(narrow.nodes);
        expect(first.screenedActions).toBeGreaterThan(4);
        expect(first.supportedActions).toBeGreaterThanOrEqual(first.screenedActions);
        let replay = initial;
        for (const action of first.actions) replay = transitionDraft(replay, action)!;
        expect(replay).toBeDefined();
        if (first.status === "screened")
            expect(first.actions.filter((action) => action.kind === "ban")).toHaveLength(4);
        else
            expect(first.branchTradeoffs.length || first.stopReason === "node_cap").toBeTruthy();
    });

    test("wider opponent-ban search keeps every slot legal across first-pick sides", () => {
        const wider = { pickBeam: 2, banBeam: 2, maxNodes: 256 };
        for (const firstPick of ["blue", "red"] as const)
            for (const side of ["blue", "red"] as const)
                for (let slot = 0; slot < 5; slot++) {
                    const initial = stateFor(side, slot, firstPick);
                    const champion = pool.find((pick) => pick.key === `${roles[slot]}-${side === "blue" ? 0 : 1}`)!;
                    const choice = compareStrategyOption(initial.picks[side],
                        initial.picks[side === "blue" ? "red" : "blue"], [champion]);
                    const line = searchDraftResponse(initial, choice, wider)!;
                    expect(line.actions[0]).toMatchObject({ kind: "pick", side, slot });
                    let replay = initial;
                    for (const action of line.actions) {
                        const next = transitionDraft(replay, action);
                        expect(next).toBeDefined();
                        replay = next!;
                    }
                    expect(new Set([...replay.picks.blue, ...replay.picks.red].map((pick) => pick.key)).size)
                        .toBe(replay.picks.blue.length + replay.picks.red.length);
                }
    });

    test("pending second bans lead to legal conditional picks and expose truncation", () => {
        const afterBans = stateFor("red", 3);
        const cursor = responseSequence("blue").findIndex((step) =>
            step.kind === "ban" && step.side === "red" && step.slot === 3);
        const initial = { ...afterBans, cursor };
        const wide = { pickBeam: 2, banBeam: 2, maxNodes: 64 };
        const tree = searchPendingBans(initial, wide)!;
        expect(tree).toEqual(searchPendingBans(initial, wide)!);
        expect(tree.nextPick).toEqual({ side: "red", slot: 3 });
        expect(tree.lines.length).toBeGreaterThan(1);
        expect(tree.truncated).toBe(false);
        expect(tree.pruned).toBe(tree.supportedActions - tree.screenedActions);
        for (const line of tree.lines) {
            expect(line.actions).toHaveLength(4);
            let replay = initial;
            for (const action of line.actions) {
                expect(action.kind).toBe("ban");
                replay = transitionDraft(replay, action)!;
                expect(replay).toBeDefined();
            }
            expect(line.choices.length).toBeGreaterThan(0);
            for (const choice of line.choices) {
                const pick = choice.picks[0];
                expect(transitionDraft(replay, { kind: "pick", side: "red", slot: 3,
                    championKey: pick.key, role: pick.role })).toBeDefined();
            }
        }
        const capped = searchPendingBans(initial, { ...wide, maxNodes: 1 })!;
        expect(capped.truncated).toBe(true);
        expect(capped.lines.some((line) => line.status === "node_cap")).toBe(true);
        const locked = searchPendingBans({ ...initial,
            unavailable: { blue: [], red: ["bot-0"] } }, wide)!;
        expect(locked.lines.flatMap((line) => line.choices)
            .every((choice) => choice.picks[0].key !== "bot-0")).toBe(true);
    });

    test("fingerprint changes with patch, ban, pool, role and dataset", () => {
        const state = stateFor("blue", 0);
        const original = draftStateFingerprint(state, config);
        for (const changed of [
            { ...state, patch: "new" }, { ...state, datasetId: "new" },
            { ...state, bans: ["top-6"] }, { ...state, pool: pool.slice(1) },
            { ...state, pool: pool.map((pick, index) => index ? pick : { ...pick, name: "Renamed champion" }) },
            { ...state, owned: { blue: new Set(["top-0"]), red: undefined } },
            { ...state, owned: { blue: new Set<string>(), red: undefined } },
            { ...state, sequence: responseSequence("red") },
            { ...state, pool: pool.map((pick, index) => index ? pick : {
                ...pick, knowledge: { ...pick.knowledge!, capabilities: pick.knowledge!.capabilities.map((capability) => ({
                    ...capability, capability: "different",
                })) },
            }) },
        ]) expect(draftStateFingerprint(changed, config)).not.toBe(original);
        const withPicks = stateFor("blue", 1);
        const changedPick = { ...withPicks, picks: { ...withPicks.picks,
            blue: withPicks.picks.blue.map((pick, index) => index ? pick : { ...pick,
                knowledge: { ...pick.knowledge!, capabilities: pick.knowledge!.capabilities.map((capability) => ({
                    ...capability, capability: "changed picked evidence",
                })) },
            }),
        } };
        expect(draftStateFingerprint(changedPick, config))
            .not.toBe(draftStateFingerprint(withPicks, config));
        expect(compareVariations(undefined, undefined)).toBe("unresolved");
    });

    test("a player pool invalidates an unavailable recommendation", () => {
        const state = stateFor("blue", 0);
        const profile = { id: "blue-top", name: "Top player", roles: ["top"],
            availableChampionKeys: ["top-0"], source: "manual", updatedAt: "test",
            confidence: "self_reported" as const };
        const restricted = { ...state, playerPools: { blue: [profile], red: [] } };
        const unavailable = pool.find((pick) => pick.key === "top-2")!;
        const choice = compareStrategyOption([], [], [unavailable]);
        expect(searchDraftResponse(restricted, choice, config)).toBeUndefined();
        expect(draftStateFingerprint(restricted, config)).not.toBe(draftStateFingerprint(state, config));
    });

    test("an explicitly empty opponent ownership pool has no supported reply", () => {
        const state = stateFor("blue", 0);
        const restricted = { ...state, owned: { blue: undefined, red: new Set<string>() } };
        const choice = compareStrategyOption([], [], [pool.find((pick) => pick.key === "top-0")!]);
        const line = searchDraftResponse(restricted, choice, config);
        expect(line?.stopReason).toBe("no_supported_action");
        expect(line?.supportedActions).toBe(0);
        expect(line?.screenedActions).toBe(0);
        expect(line?.status).toBe("unresolved");
    });

    test("node cap and absent supported reply stay unresolved", () => {
        const state = stateFor("blue", 0);
        const chosen = pool.find((pick) => pick.key === "top-0")!;
        const choice = compareStrategyOption([], [], [chosen]);
        const capped = searchDraftResponse(state, choice, { ...config, maxNodes: 1 });
        expect(capped?.status).toBe("unresolved");
        expect(capped?.stopReason).toBe("node_cap");
        const noReply = searchDraftResponse({ ...state, pool: [chosen] }, choice, config);
        expect(noReply?.status).toBe("unresolved");
        expect(noReply?.stopReason).toBe("no_supported_action");
        expect(compareVariations(capped, noReply)).toBe("unresolved");
    });

    test("branch choice uses dominance and reports incomparable continuations", () => {
        const state = stateFor("blue", 0);
        const choice = compareStrategyOption([], [], [pool.find((pick) => pick.key === "top-0")!]);
        const base = searchDraftResponse(state, choice, config)!;
        const strong = { ...base, evaluation: { ...base.evaluation,
            ownNeeds: [], ownPlans: ["Entry"], enemyNeeds: ["Protection"], enemyPlans: [],
            uncertainty: [],
        } };
        const weak = { ...strong, actions: [...strong.actions, { ...strong.actions[0], championKey: "top-2" }],
            evaluation: { ...strong.evaluation, ownNeeds: ["Waveclear"] } };
        expect(selectAdversarialBranch([strong, weak], "own")?.branch).toBe(strong);
        expect(selectAdversarialBranch([strong, weak], "opponent")?.branch).toBe(weak);
        const trade = { ...weak, evaluation: { ...weak.evaluation, ownNeeds: [],
            ownPlans: ["Catch"], enemyNeeds: [] } };
        const selection = selectAdversarialBranch([strong, trade], "opponent");
        expect(selection?.tradeoffs).toContain("own plans");
        expect(selection?.tradeoffs).toContain("opponent needs");
        expect(compareVariations(strong, trade)).toBe("unresolved");
        const uncertain = { ...weak, evaluation: { ...weak.evaluation,
            uncertainty: ["Incomplete kit coverage"] } };
        expect(selectAdversarialBranch([strong, uncertain], "own")?.tradeoffs)
            .toContain("evidence uncertainty");
        expect(comparisonReasons(strong, weak)).toContainEqual({
            code: "own_needs", label: "Open own needs",
            selected: "None recorded", alternative: "Waveclear",
        });
        expect(comparisonReasons(strong, { ...strong, evaluation: {
            ...strong.evaluation, enemyDamage: "Different recorded damage",
        } }).map((reason) => reason.code)).toContain("opponent_damage");
        expect(comparisonReasons(strong, strong)).toEqual([]);
        expect(comparisonReasons(strong, undefined)).toContainEqual({
            code: "search_status", label: "Search status",
            selected: strong.status, alternative: "No supported line",
        });
    });
});
