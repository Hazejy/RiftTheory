import { describe, expect, test } from "bun:test";
import type {
    KnowledgeChampion,
    KnowledgeCoachingProfile,
} from "../types/RiftTheoryKnowledge";
import {
    compareStrategyOption,
    compareStrategyDraft,
    resolveStrategyPicks,
    reviewStrategy,
    roleScenarios,
    strategyOptions,
    strategyThemeFits,
    type StrategyPick,
    type StrategyRole,
} from "./strategyReview";
import { DRAFT_PICK_ORDER, draftResponseWindow, pickLabel } from "./draftOrder";
import shippedKnowledge from "../../public/data/rifttheory-knowledge.json";

function pick(
    name: string,
    role: StrategyRole,
    capabilities: string[],
    coaching?: Partial<KnowledgeCoachingProfile>,
): StrategyPick {
    return {
        key: name,
        name,
        role,
        possibleRoles: [role],
        knowledge: {
            riotKey: name,
            slug: name.toLowerCase(),
            name,
            active: true,
            firstSeenPatch: null,
            lastSeenPatch: null,
            localizations: {},
            capabilities: capabilities.map((capability) => ({
                role,
                capability,
                strength: 1,
                patch_version: "test",
                assessment_method: "manual",
                confidence: null,
                review_status: "reviewed",
                reasoning: "Test fixture",
                source_key: "test",
            })),
            strategicProfiles: [],
            colorBaseline: null,
            roleObservations: [],
            roleTraits: [],
            coachingProfiles: coaching
                ? [
                      {
                          role,
                          power_curve: "mid",
                          damage_focus: "physical",
                          resource_demand: "medium",
                          execution_demand: 2,
                          spike_notes: [],
                          reasoning: "Test fixture",
                          patch_version: "test",
                          assessment_method: "manual",
                          confidence: null,
                          review_status: "reviewed",
                          source_key: "test",
                          source_url: null,
                          ...coaching,
                      },
                  ]
                : [],
        },
    };
}

describe("strategy role resolution", () => {
    test("rejects duplicate champions, conflicting locks and more than five picks", () => {
        const a = pick("A", "top", ["dive"]);
        expect(roleScenarios([a, a])).toEqual([]);
        expect(roleScenarios([a, pick("B", "top", ["poke"])])).toEqual([]);
        expect(
            roleScenarios(
                Array.from({ length: 6 }, (_, i) => ({
                    ...a,
                    key: String(i),
                    role: undefined,
                    possibleRoles: [
                        "top",
                        "jungle",
                        "mid",
                        "bot",
                        "support",
                    ] as StrategyRole[],
                })),
            ),
        ).toEqual([]);
    });

    test("uses intersection of feasible role evidence, never a union of kits", () => {
        const flexible = pick("Flex", "top", ["poke", "wave_clear"]);
        flexible.role = undefined;
        flexible.possibleRoles = ["top", "mid"];
        flexible.knowledge!.capabilities.push({
            ...flexible.knowledge!.capabilities[0],
            role: "mid",
            capability: "wave_clear",
        });
        const unresolved = resolveStrategyPicks([flexible]).picks[0];
        expect(unresolved.roles).toEqual(["top", "mid"]);
        expect(unresolved.capabilities).toEqual(["wave_clear"]);
        const constrained = resolveStrategyPicks([
            flexible,
            pick("Mid", "mid", ["pick"]),
        ]).picks[0];
        expect(constrained.roles).toEqual(["top"]);
        expect(constrained.capabilities).toContain("poke");
    });

    test("rejects obsolete and invalid capability evidence", () => {
        const entry = pick("Unknown", "mid", [
            "poke",
            "dive",
            "engage",
            "wave_clear",
        ]);
        entry.knowledge!.capabilities[0].review_status = "outdated";
        entry.knowledge!.capabilities[1].strength = 0;
        entry.knowledge!.capabilities[2].strength = NaN;
        entry.knowledge!.capabilities[3].review_status = "rejected";
        expect(resolveStrategyPicks([entry]).picks[0].capabilities).toEqual([]);
        expect(reviewStrategy([entry], []).blue.unknowns.join(" ")).toContain(
            "unresolved",
        );
    });
});

describe("conditional strategy reasoning", () => {
    test("primary theme fit distinguishes direct actors, support and unproven fit", () => {
        const team = reviewStrategy([
            pick("Diver", "top", ["dive"]),
            pick("Starter", "jungle", ["engage"]),
            pick("Setup", "mid", ["zone_control"]),
            pick("Other", "bot", ["sustain"]),
        ], []).blue;
        expect(team.plans[0].key).toBe("dive");
        expect(strategyThemeFits(team).map((fit) => fit.label)).toEqual([
            "Core", "Core", "Supports", "Unclear",
        ]);
        expect(strategyThemeFits(reviewStrategy([pick("Solo", "top", ["dive"])], []).blue)[0].label)
            .toBe("Unconfirmed");
    });
    test("a catch route can address access without being relabeled hard engage", () => {
        const option = compareStrategyOption(
            [],
            [pick("Poke", "mid", ["poke"])],
            [pick("Catcher", "support", ["pick"])],
        );
        expect(option.answers).toContain("A route into the ranged setup");
        expect(
            reviewStrategy(option.picks, []).blue.plans.find(
                (p) => p.key === "pick",
            )?.requires,
        ).toContain("denied vision");
    });
    test("self-disengage does not masquerade as team protection", () => {
        const ezreal = pick("Ezreal", "bot", ["disengage", "poke"]);
        const vi = pick("Vi", "jungle", ["engage", "dive"]);
        const result = reviewStrategy([ezreal], [vi]);
        expect(result.blue.needs.some((n) => n.key === "protect")).toBe(true);
        expect(result.red.claims.some((c) => c.id === "entry-protection")).toBe(
            false,
        );
        expect(result.blue.plans.some((p) => p.key === "disengage")).toBe(
            false,
        );
    });

    test("one incidental poke provider is not a whole poke composition", () => {
        const jinx = pick("Jinx", "bot", ["poke", "siege", "wave_clear"]);
        expect(
            reviewStrategy([jinx], []).blue.plans.some((p) => p.key === "poke"),
        ).toBe(false);
        expect(
            reviewStrategy(
                [jinx, pick("Xerath", "mid", ["poke"])],
                [],
            ).blue.plans.some((p) => p.key === "poke"),
        ).toBe(true);
    });

    test("initiators can follow each other without requiring a non-engage label", () => {
        const vi = pick("Vi", "jungle", ["engage", "dive"]);
        expect(
            reviewStrategy([vi], []).blue.needs.some((n) => n.key === "follow"),
        ).toBe(true);
        expect(
            reviewStrategy(
                [vi, pick("Camille", "top", ["engage", "dive"])],
                [],
            ).blue.needs.some((n) => n.key === "follow"),
        ).toBe(false);
    });

    test("mixed or missing damage profiles prevent a single-resistance verdict", () => {
        const physical = ["top", "jungle", "bot"].map((role, i) =>
            pick(String(i), role as StrategyRole, ["dive"], {
                damage_focus: "physical",
            }),
        );
        expect(
            reviewStrategy(physical, []).blue.claims.some(
                (c) => c.id === "damage-physical",
            ),
        ).toBe(true);
        expect(
            reviewStrategy(
                [...physical, pick("Unknown", "mid", ["engage"])],
                [],
            ).blue.claims.some((c) => c.id === "damage-physical"),
        ).toBe(false);
        expect(
            reviewStrategy(
                [
                    ...physical,
                    pick("Mixed", "mid", ["engage"], { damage_focus: "mixed" }),
                ],
                [],
            ).blue.claims.some((c) => c.id === "damage-physical"),
        ).toBe(false);
    });
    test("one champion cannot both split-push and cover the remaining group", () => {
        const solo = pick("Side", "top", ["side_lane_pressure", "wave_clear"]);
        expect(
            reviewStrategy([solo], []).blue.plans.some(
                (p) => p.key === "split",
            ),
        ).toBe(false);
        const result = reviewStrategy(
            [solo, pick("Holder", "mid", ["wave_clear"])],
            [],
        ).blue;
        expect(result.plans.find((p) => p.key === "split")?.win).toContain(
            "Holder",
        );
        expect(result.needs.some((n) => n.key === "hold")).toBe(false);
    });
    test("entry versus protection names both sides without claiming an ultimate is cancelled", () => {
        const vi = pick("Vi", "jungle", ["engage", "dive"]);
        const janna = pick("Janna", "support", ["peel", "disengage"]);
        const result = reviewStrategy([vi], [janna]);
        const claim = result.blue.claims.find(
            (c) => c.id === "entry-protection",
        )!;
        expect(claim.detail).toContain("Vi");
        expect(claim.detail).toContain("Janna");
        expect(claim.requires).toContain(
            "does not prove it cancels every dash or ultimate",
        );
        expect(
            reviewStrategy([vi], []).blue.claims.some((c) => c.id === claim.id),
        ).toBe(false);
    });

    test("sustain is conditional on reaching the actual poke target", () => {
        const result = reviewStrategy(
            [pick("Xerath", "mid", ["poke", "wave_clear"])],
            [pick("Healer", "support", ["sustain"])],
        );
        expect(
            result.blue.claims.find((c) => c.id === "poke-sustain")?.requires,
        ).toContain("Self-healing is not team healing");
    });

    test("mixed power windows are a bridge, not an automatic risk penalty", () => {
        const own = [
            pick("Early", "jungle", ["engage"], { power_curve: "early" }),
        ];
        const addition = pick("Late", "bot", ["wave_clear"], {
            power_curve: "late",
        });
        expect(
            reviewStrategy([...own, addition], []).blue.claims.some(
                (c) => c.id === "mixed-timing",
            ),
        ).toBe(true);
        expect(
            compareStrategyOption(own, [], [addition]).newRisks.some(
                (c) => c.id === "mixed-timing",
            ),
        ).toBe(false);
    });

    test("missing data never becomes a proven late-game winner", () => {
        const late = pick("Late", "bot", [], { power_curve: "late" });
        const result = reviewStrategy([late], [pick("Unknown", "mid", [])]);
        expect(result.blue.covered).toBe(0);
        expect(result.blue.timeline[2].check).toContain(
            "Do not infer inevitability",
        );
        expect(result).not.toHaveProperty("winrate");
    });

    test("two divers form a readable plan without an empty initiator name", () => {
        const team = reviewStrategy(
            [
                pick("Diver1", "top", ["dive"]),
                pick("Diver2", "jungle", ["dive"]),
            ],
            [],
        ).blue;
        expect(team.plans[0].win).toContain("Diver1, Diver2 must coordinate");
        expect(team.plans[0].champions).toEqual(["Diver1", "Diver2"]);
    });

    test("a protection addition addresses a concrete need and reports new obligations", () => {
        const option = compareStrategyOption(
            [],
            [pick("Vi", "jungle", ["engage"])],
            [pick("Janna", "support", ["peel"])],
        );
        expect(option.answers).toContain("A way to survive the first entry");
        expect(option.newNeeds).toContain("A reliable way to prepare waves");
    });

    test("a candidate exposes the opponent's newly required protection", () => {
        const option = compareStrategyOption(
            [],
            [pick("Enemy", "mid", ["wave_clear"])],
            [pick("Entry", "jungle", ["engage"])],
        );
        expect(option.opponentNewNeeds).toContain(
            "A way to survive the first entry",
        );
        expect(option.opponentAnswers).toEqual([]);
    });

    test("committing a role explicitly explains the lost flex option", () => {
        const flex = pick("Flex", "top", ["dive"]);
        flex.role = undefined;
        flex.possibleRoles = ["top", "mid"];
        const option = compareStrategyOption(
            [flex],
            [],
            [pick("Mid", "mid", ["wave_clear"])],
        );
        expect(option.roleCommitments).toEqual(["Flex: top / mid → top"]);
    });
});

describe("candidate legality and response windows", () => {
    test("equal own coverage prefers a pick that creates an opponent problem", () => {
        const options = strategyOptions(
            [pick("Ally", "top", ["zone_control"])],
            [pick("Enemy", "mid", ["wave_clear"])],
            [
                pick("APlain", "jungle", ["wave_clear"]),
                pick("ZThreat", "jungle", ["wave_clear", "engage"]),
            ],
            { bans: [] },
            1,
        );
        expect(options.singles.map((option) => option.picks[0].name)).toEqual([
            "ZThreat",
            "APlain",
        ]);
    });

    test("reply stress test prioritizes pressure on the choosing team's plan", () => {
        const own = [pick("Own", "top", ["wave_clear"])];
        const enemy = [pick("Enemy", "mid", ["engage"])];
        const candidates = [
            pick("AProtect", "support", ["peel"]),
            pick("ZThreat", "support", ["engage"]),
        ];
        const defaultOrder = strategyOptions(own, enemy, candidates, { bans: [] }, 1);
        const pressureOrder = strategyOptions(own, enemy, candidates, { bans: [] }, 1, "", own, "pressure");
        expect(defaultOrder.singles[0].picks[0].name).toBe("AProtect");
        expect(pressureOrder.singles[0].picks[0].name).toBe("ZThreat");
        expect(pressureOrder.singles[0].opponentNewNeeds.length).toBeGreaterThan(0);
    });

    test("search keeps partners outside the query and includes anchors below the default shortlist", () => {
        const candidates = [
            ...Array.from({ length: 14 }, (_, i) =>
                pick(`Partner${String(i).padStart(2, "0")}`, "mid", [
                    "wave_clear",
                ]),
            ),
            pick("ZAnchor", "support", ["peel"]),
        ];
        const result = strategyOptions(
            [],
            [],
            candidates,
            { bans: [] },
            2,
            "  zANCHOR ",
        );
        expect(result.singles.map((o) => o.picks[0].name)).toEqual(["ZAnchor"]);
        expect(result.evaluated).toBe(1);
        expect(result.pairs).toHaveLength(3);
        for (const pair of result.pairs) {
            expect(pair.picks.some((p) => p.name === "ZAnchor")).toBe(true);
            expect(pair.picks.some((p) => p.name.startsWith("Partner"))).toBe(
                true,
            );
            expect(pair.scenarios).toBeGreaterThan(0);
        }
        expect(
            strategyOptions([], [], candidates, { bans: [] }, 1, "ZAnchor")
                .pairs,
        ).toEqual([]);
        expect(
            strategyOptions([], [], candidates, { bans: [] }, 2, "missing"),
        ).toEqual({ singles: [], pairs: [], unassessed: [], evaluated: 0 });
    });

    test("search anchors and partners still obey bans, ownership, history and role conflicts", () => {
        const candidates = [
            pick("Anchor", "support", ["peel"]),
            pick("Banned", "mid", ["wave_clear"]),
            pick("Locked", "jungle", ["dive"]),
            pick("Unowned", "top", ["dive"]),
            pick("Conflict", "support", ["pick"]),
            pick("Legal", "mid", ["wave_clear"]),
        ];
        const constraints = {
            bans: ["Banned"],
            unavailable: ["Locked"],
            owned: new Set(["Anchor", "Banned", "Locked", "Conflict", "Legal"]),
        };
        const result = strategyOptions(
            [],
            [],
            candidates,
            constraints,
            2,
            "Anchor",
        );
        expect(result.pairs).toHaveLength(1);
        expect(result.pairs[0].picks.map((p) => p.name).sort()).toEqual([
            "Anchor",
            "Legal",
        ]);
        expect(
            strategyOptions(
                [],
                [],
                candidates,
                { ...constraints, bans: ["Anchor"] },
                2,
                "Anchor",
            ).pairs,
        ).toEqual([]);
    });

    test("search retains a flex anchor's alternate role when a partner needs its first role", () => {
        const candidates = [
            pick("Anchor", "top", ["wave_clear"]),
            pick("Anchor", "mid", ["wave_clear"]),
            pick("Partner", "mid", ["wave_clear"]),
        ];
        const result = strategyOptions(
            [],
            [],
            candidates,
            { bans: [] },
            2,
            "Anchor",
        );
        expect(result.pairs).toHaveLength(1);
        expect(
            result.pairs[0].picks.find((p) => p.name === "Anchor")?.role,
        ).toBe("top");
    });

    test("resolving a teammate is not capability evidence for an unknown candidate", () => {
        const flex = pick("Flex", "top", ["dive"]);
        flex.role = undefined;
        flex.possibleRoles = ["top", "mid"];
        const options = strategyOptions(
            [flex],
            [],
            [pick("Unassessed", "mid", [])],
            { bans: [] },
            1,
        );
        expect(options.singles).toEqual([]);
    });
    test("explicit search keeps legal unknown picks separate from the ranked shortlist", () => {
        const unknown = pick("Yunara", "bot", []);
        const ranked = pick("Yone", "mid", ["dive"]);
        const result = strategyOptions(
            [], [], [unknown, ranked], { bans: [] }, 1, "y",
        );
        expect(result.singles.map((option) => option.picks[0].name)).toEqual(["Yone"]);
        expect(result.unassessed.map((option) => option.picks[0].name)).toEqual(["Yunara"]);
        expect(result.unassessed[0].unassessedPicks).toEqual(["Yunara"]);
        expect(strategyOptions([], [], [unknown], { bans: [] }, 1).unassessed).toEqual([]);
        expect(strategyOptions([], [], [unknown], { bans: ["Yunara"] }, 1, "Yunara").unassessed).toEqual([]);
        expect(strategyOptions([pick("Other", "bot", ["wave_clear"])], [], [unknown], { bans: [] }, 1, "Yunara").unassessed).toEqual([]);
    });
    test("banned, unavailable, enemy, owned and duplicate-role constraints are respected", () => {
        const pool = ["Banned", "Unavailable", "Enemy", "Unowned", "Valid"].map(
            (name) => pick(name, "support", ["peel"]),
        );
        pool.push(pick("RoleConflict", "top", ["peel"]));
        const options = strategyOptions(
            [pick("Own", "top", ["dive"])],
            [pool[2]],
            pool,
            {
                bans: ["Banned"],
                unavailable: ["Unavailable"],
                owned: new Set([
                    "Banned",
                    "Unavailable",
                    "Enemy",
                    "Valid",
                    "RoleConflict",
                ]),
            },
            2,
        );
        expect(options.singles.map((o) => o.picks[0].name)).toEqual(["Valid"]);
        expect(options.pairs).toEqual([]);
    });

    test("pairs have distinct champions and feasible simultaneous roles", () => {
        const candidates = [
            pick("A", "top", ["dive"]),
            pick("A", "mid", ["wave_clear"]),
            pick("B", "mid", ["poke"]),
            pick("B", "top", ["dive"]),
            pick("C", "support", ["peel"]),
        ];
        const result = strategyOptions([], [], candidates, { bans: [] }, 2);
        const keys = result.pairs.map((o) =>
            o.picks
                .map((p) => p.key)
                .sort()
                .join(":"),
        );
        expect(keys.length).toBeGreaterThan(0);
        expect(new Set(keys).size).toBe(keys.length);
        for (const pair of result.pairs) {
            expect(pair.picks[0].key).not.toBe(pair.picks[1].key);
            expect(pair.scenarios).toBeGreaterThan(0);
        }
        expect(
            strategyOptions([], [], candidates, { bans: [] }, 1).pairs,
        ).toEqual([]);
    });

    test("all ten main-draft slots have the correct response window", () => {
        const teams = {
            ally: Array.from({ length: 5 }, () => ({})),
            opponent: Array.from({ length: 5 }, () => ({})),
        };
        const labels = DRAFT_PICK_ORDER.map((step) =>
            draftResponseWindow(step, teams)
                .map((s) => pickLabel(s.team, s.index))
                .join("+"),
        );
        expect(labels).toEqual([
            "B1",
            "R1+R2",
            "R2",
            "B2+B3",
            "B3",
            "R3",
            "R4",
            "B4+B5",
            "B5",
            "R5",
        ]);
        expect(draftResponseWindow(undefined, teams)).toEqual([]);
    });

    test("occupied slots are replaced singly, and windows do not skip occupied picks", () => {
        const teams = {
            ally: [{}, {}, {}, {}, {}],
            opponent: [{ championKey: "A" }, { championKey: "B" }, {}, {}, {}],
        };
        expect(
            draftResponseWindow({ team: "opponent", index: 0 }, teams),
        ).toHaveLength(1);
        teams.opponent[0] = {};
        expect(
            draftResponseWindow({ team: "opponent", index: 0 }, teams),
        ).toHaveLength(1);
    });

    test("shipped knowledge supports a complete draft and bounded candidate search", () => {
        const champions = shippedKnowledge.champions as KnowledgeChampion[];
        const lookup = (name: string, role: StrategyRole): StrategyPick => {
            const knowledge = champions.find((c) => c.name === name)!;
            expect(knowledge).toBeDefined();
            return {
                key: knowledge.riotKey!,
                name,
                role,
                possibleRoles: [role],
                knowledge,
            };
        };
        const blue = [
            lookup("Camille", "top"),
            lookup("Vi", "jungle"),
            lookup("Orianna", "mid"),
            lookup("Jinx", "bot"),
            lookup("Nautilus", "support"),
        ];
        const red = [
            lookup("Ornn", "top"),
            lookup("Sejuani", "jungle"),
            lookup("Xerath", "mid"),
            lookup("Ezreal", "bot"),
            lookup("Janna", "support"),
        ];
        const result = reviewStrategy(blue, red);
        expect(result.complete).toBe(true);
        expect(result.blue.scenarios).toBe(1);
        expect(result.blue.plans.length).toBeGreaterThan(0);
        const candidates = champions.flatMap((knowledge) =>
            [...new Set(knowledge.capabilities.map((c) => c.role))]
                .filter((role) =>
                    ["top", "jungle", "mid", "bot", "support"].includes(role),
                )
                .map((role) => ({
                    key: knowledge.riotKey!,
                    name: knowledge.name,
                    role: role as StrategyRole,
                    possibleRoles: [role as StrategyRole],
                    knowledge,
                })),
        );
        const options = strategyOptions(
            blue.slice(0, 3),
            red,
            candidates,
            { bans: [] },
            2,
        );
        expect(options.singles.length).toBeGreaterThan(0);
        expect(options.pairs.length).toBeGreaterThan(0);
        for (const option of [...options.singles, ...options.pairs])
            expect(option.scenarios).toBeGreaterThan(0);
    });
});

describe("comparison with the current draft", () => {
    test("replacement shortlist uses the actual draft for answers and role commitments", () => {
        const enemy = [pick("Entry", "jungle", ["engage"])];
        const old = pick("Old", "support", ["peel"]);
        const candidates = [
            pick("AProtection", "support", ["peel"]),
            pick("ZWave", "support", ["wave_clear"]),
        ];
        const result = strategyOptions(
            [],
            enemy,
            candidates,
            { bans: [] },
            1,
            "",
            [old],
        );
        expect(result.singles[0].picks[0].name).toBe("ZWave");
        expect(result.singles[0].answers).toEqual([
            "A reliable way to prepare waves",
        ]);
        expect(result.singles[0].newNeeds).toContain(
            "A way to survive the first entry",
        );
        expect(result.singles[1].answers).toEqual([]);
        for (const option of result.singles) {
            const comparison = compareStrategyDraft([old], enemy, option.picks);
            expect(option.answers).toEqual(
                comparison.own.answeredNeeds.map((n) => n.title),
            );
            expect(option.newNeeds).toEqual(
                comparison.own.newNeeds.map((n) => n.title),
            );
        }
    });

    test("replacement does not claim flex was lost when the old pick already fixed it", () => {
        const flex = pick("Flex", "top", ["dive"]);
        flex.role = undefined;
        flex.possibleRoles = ["top", "mid"];
        const current = [flex, pick("OldMid", "mid", ["wave_clear"])];
        const option = compareStrategyOption(
            [flex],
            [],
            [pick("NewMid", "mid", ["wave_clear"])],
            current,
        );
        expect(option.roleCommitments).toEqual([]);
    });

    test("a replacement reports protection lost from the actual current pick", () => {
        const current = [pick("Protector", "support", ["peel"])];
        const enemy = [pick("Entry", "jungle", ["engage", "dive"])];
        const proposed = [pick("Catcher", "support", ["pick"])];
        const original = JSON.stringify({ current, enemy, proposed });
        const comparison = compareStrategyDraft(current, enemy, proposed);
        expect(comparison.own.lostPlans.map((p) => p.key)).toContain(
            "disengage",
        );
        expect(comparison.own.gainedPlans.map((p) => p.key)).toContain("pick");
        expect(comparison.own.newNeeds.map((n) => n.key)).toContain("protect");
        expect(comparison.after.blue.picks.map((p) => p.name)).toEqual([
            "Catcher",
        ]);
        expect(
            comparison.before.red.claims.some(
                (c) => c.id === "entry-protection",
            ),
        ).toBe(true);
        expect(
            comparison.after.red.claims.some(
                (c) => c.id === "entry-protection",
            ),
        ).toBe(false);
        expect(JSON.stringify({ current, enemy, proposed })).toBe(original);
    });

    test("a proposed entry also reveals the opponent's new defensive route", () => {
        const current = [pick("Wave", "mid", ["wave_clear"])];
        const enemy = [pick("Protector", "support", ["peel"])];
        const proposed = [
            ...current,
            pick("Entry", "jungle", ["engage", "dive"]),
        ];
        const comparison = compareStrategyDraft(current, enemy, proposed);
        expect(comparison.opponent.gainedPlans.map((p) => p.key)).toContain(
            "disengage",
        );
        expect(
            comparison.after.red.plans.find((p) => p.key === "disengage")?.win,
        ).toContain("Entry");
        expect(comparison.after.blue.picks).toHaveLength(2);
        expect(comparison.after.red.picks).toHaveLength(1);
    });

    test("unchanged protection is not reported as a newly answered need during replacement", () => {
        const enemy = [pick("Entry", "jungle", ["engage"])];
        const comparison = compareStrategyDraft(
            [pick("Old", "support", ["peel"])],
            enemy,
            [pick("New", "support", ["peel", "wave_clear"])],
        );
        expect(comparison.own.answeredNeeds.map((n) => n.key)).toEqual([
            "wave",
        ]);
        expect(comparison.own.gainedPlans).toEqual([]);
        expect(comparison.own.lostPlans).toEqual([]);
        expect(comparison.after.blue.plans[0].win).toContain("New");
    });
});

describe("strategy draft issues", () => {
    test("duplicate champions across teams withhold plans and options", () => {
        const same = pick("Same", "mid", ["pick", "wave_clear"]);
        const result = reviewStrategy([same], [same]);
        expect(result.issues.join(" ")).toContain(
            "Champions appear more than once: Same",
        );
        expect(result.blue.plans).toEqual([]);
        expect(result.red.plans).toEqual([]);
        expect(result.blue.needs).toEqual([]);
        expect(result.red.claims).toEqual([]);
        expect(result.complete).toBe(false);
        expect(
            strategyOptions(
                [same],
                [same],
                [pick("Support", "support", ["peel"])],
                { bans: [] },
                1,
            ).singles,
        ).toEqual([]);
    });

    test("conflicting enemy roles never become an apparent absence of threats", () => {
        const own = [pick("Catcher", "support", ["pick"])];
        const enemy = [
            pick("Entry1", "jungle", ["engage"]),
            pick("Entry2", "jungle", ["engage"]),
        ];
        const result = reviewStrategy(own, enemy);
        expect(result.issues.join(" ")).toContain(
            "Red: no supported role assignment",
        );
        expect(result.blue.plans).toEqual([]);
        expect(result.blue.timeline).toEqual([]);
        expect(
            strategyOptions(
                own,
                enemy,
                [pick("Wave", "mid", ["wave_clear"])],
                { bans: [] },
                1,
            ).evaluated,
        ).toBe(0);
    });

    test("a missing role sample requires assignment but empty slots are valid", () => {
        const unknown = {
            ...pick("Unknown", "top", ["dive"]),
            role: undefined,
            possibleRoles: [],
        };
        expect(reviewStrategy([unknown], []).issues).toHaveLength(1);
        expect(
            reviewStrategy([{ ...unknown, role: "top" }], []).issues,
        ).toEqual([]);
        expect(reviewStrategy([], []).issues).toEqual([]);
    });

    test("repairing an invalid draft is allowed without claiming new answers or lost plans", () => {
        const a = pick("A", "top", ["dive"]);
        const old = pick("Old", "top", ["engage"]);
        const enemy = [pick("Enemy", "mid", ["poke"])];
        const replacement = pick("New", "support", ["pick"]);
        const options = strategyOptions(
            [a],
            enemy,
            [replacement],
            { bans: [] },
            1,
            "",
            [a, old],
        );
        expect(options.singles).toHaveLength(1);
        expect(options.singles[0].answers).toEqual([]);
        const comparison = compareStrategyDraft([a, old], enemy, [
            a,
            replacement,
        ]);
        expect(comparison.comparable).toBe(false);
        expect(comparison.before.issues).toHaveLength(1);
        expect(comparison.after.issues).toEqual([]);
        expect(comparison.own.gainedPlans).toEqual([]);
        expect(comparison.opponent.answeredNeeds).toEqual([]);
        expect(comparison.after.blue.plans.length).toBeGreaterThan(0);
    });

    test("ten occupied slots are not a complete valid draft with conflicting roles", () => {
        const roles: StrategyRole[] = [
            "top",
            "jungle",
            "mid",
            "bot",
            "support",
        ];
        const blue = roles.map((role, i) => pick(`Blue${i}`, role, ["pick"]));
        const red = roles.map((role, i) => pick(`Red${i}`, role, ["pick"]));
        red[4].role = "top";
        const result = reviewStrategy(blue, red);
        expect(result.complete).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.title).toContain("Resolve draft issues");
    });
});
