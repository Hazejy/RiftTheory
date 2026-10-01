import { describe, expect, test } from "bun:test";
import { STANDARD_DRAFT_SEQUENCE } from "@rifttheory/core/src/live-draft/series";
import { chooseEngineMove, legalSimulatorActions, newSimulatorDraft } from "./draftSimulator";
import { transitionDraft } from "./draftResponseTree";
import { reviewStrategy, STRATEGY_ROLES, type StrategyPick } from "./strategyReview";

const pool: StrategyPick[] = STRATEGY_ROLES.flatMap((role) =>
    Array.from({ length: 15 }, (_, i) => ({ key: `${role}-${i}`, name: `${role}-${i}`, possibleRoles: [role] })));

describe("draft simulator", () => {
    test("offers an unresolved flex pick and preserves both observed roles", () => {
        const flex: StrategyPick = { key: "flex", name: "Flex", possibleRoles: ["top", "mid"] };
        const state = { ...newSimulatorDraft([flex, ...pool], "test", "test"), cursor: 6 };
        const actions = legalSimulatorActions(state).filter((action) => action.championKey === "flex");
        expect(actions.map((action) => action.role)).toEqual([undefined, "top", "mid"]);
        const next = transitionDraft(state, actions[0]);
        expect(next?.picks.blue[0].role).toBeUndefined();
        expect(next?.picks.blue[0].possibleRoles).toEqual(["top", "mid"]);
        expect(reviewStrategy(next!.picks.blue, next!.picks.red).blue.scenarios).toBe(2);
        const engine = chooseEngineMove(state, "flex");
        expect(engine?.action.championKey).toBe("flex");
        expect(engine?.action.role).toBeUndefined();
    });

    test("engine opens on Blue when the human chooses Red", () => {
        const state = newSimulatorDraft(pool, "test", "test");
        const move = chooseEngineMove(state);
        expect(move).toBeDefined();
        expect(move?.action).toMatchObject({ kind: "ban", side: "blue", slot: 0 });
        expect(move?.next.cursor).toBe(1);
        expect(move?.next.bans).toEqual([move!.action.championKey]);
    });

    test("plays a legal chronological game through the second bans and R5", () => {
        let state = newSimulatorDraft(pool, "test", "test");
        const actions = [];
        for (let i = 0; i < 20; i++) {
            const move = i % 2 ? chooseEngineMove(state) : undefined;
            const action = move?.action ?? legalSimulatorActions(state)[0];
            expect(action).toBeDefined();
            expect(action).toMatchObject(STANDARD_DRAFT_SEQUENCE[i]);
            const next = transitionDraft(state, action!);
            expect(next).toBeDefined();
            actions.push(action!);
            state = next!;
        }
        expect(state.cursor).toBe(20);
        expect(state.bans).toHaveLength(10);
        expect(state.picks.blue).toHaveLength(5);
        expect(state.picks.red).toHaveLength(5);
        expect(new Set(actions.map((action) => action.championKey)).size).toBe(20);
        expect(actions.slice(12, 16).every((action) => action.kind === "ban")).toBe(true);
        expect(actions.at(-1)).toMatchObject({ kind: "pick", side: "red", slot: 4 });
        expect(chooseEngineMove(state)).toBeUndefined();
    });

    test("never offers a duplicate or a role-illegal pick", () => {
        let state = newSimulatorDraft(pool, "test", "test");
        for (let i = 0; i < 7; i++) state = transitionDraft(state, legalSimulatorActions(state)[0])!;
        const actions = legalSimulatorActions(state);
        expect(actions.length).toBeGreaterThan(0);
        expect(actions.every((action) => !state.bans.includes(action.championKey))).toBe(true);
        expect(actions.every((action) => pool.find((pick) => pick.key === action.championKey)?.possibleRoles.includes(action.role!))).toBe(true);
    });
});
