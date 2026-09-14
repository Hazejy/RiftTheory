import { describe, expect, test } from "bun:test";
import {
    assessDamageResources,
    assessThemeCohesion,
    assessPlanReliability,
    CapabilityRead,
    CompositionPlan,
    compositionPlans,
    buildGameTimeline,
    buildStrategyCalibrationVector,
    strategicLean,
} from "./compositionCoach";

const tools = (entries: Record<string, string[]>): CapabilityRead[] =>
    Object.entries(entries).map(([capability, champions]) => ({
        capability,
        champions,
        strength: 1,
    }));

const blue = tools({
    engage: ["Nocturne", "Camille", "Alistar"],
    pick: ["Nocturne", "Camille", "Jhin"],
    dive: ["Nocturne", "Camille"],
    global_pressure: ["Nocturne"],
    poke: ["Viktor", "Jhin"],
    zone_control: ["Viktor"],
    peel: ["Alistar"],
    disengage: ["Alistar", "Viktor"],
    side_lane_pressure: ["Camille"],
});

const red = tools({
    frontline: ["Trundle", "Renekton", "Nautilus"],
    peel: ["Nautilus"],
    disengage: ["Trundle", "Tristana"],
    engage: ["Renekton", "Nautilus"],
    pick: ["Renekton", "Nautilus", "Locke"],
    dive: ["Renekton", "Tristana", "Locke"],
    side_lane_pressure: ["Renekton", "Trundle", "Tristana"],
    sustain: ["Renekton", "Locke"],
});

describe("composition coach benchmark drafts", () => {
    test("Nocturne and Camille form a coordinated dive into protected carries", () => {
        const plans = compositionPlans(blue, red, [
            { name: "Tristana", role: "bot" },
            { name: "Locke", role: "mid" },
        ]);

        expect(plans[0].key).toBe("coordinated_dive");
        expect(plans[0].target).toContain("Tristana or Locke");
        expect(plans[0].stages[1].detail).toContain("Nocturne, Camille");
        expect(plans[0].stages[2].detail).not.toContain("Nocturne");
    });

    test("three anchors and multiple protection tools prioritize front-to-back", () => {
        const plans = compositionPlans(red, blue, [
            { name: "Viktor", role: "mid" },
            { name: "Jhin", role: "bot" },
        ]);

        expect(plans[0].key).toBe("front_to_back");
        expect(plans.some((plan) => plan.key === "coordinated_dive")).toBeTrue();
    });

    test("poke requires multiple poke providers and a siege conversion tool", () => {
        const plans = compositionPlans(
            tools({
                poke: ["Jayce", "Ziggs"],
                siege: ["Ziggs"],
                wave_clear: ["Ziggs"],
                disengage: ["Janna"],
            }),
            tools({ engage: ["Ornn"] }),
            [{ name: "Aphelios", role: "bot" }],
        );

        expect(plans[0].key).toBe("poke_siege");
        expect(plans[0].failure).toContain("spacing");
    });

    test("one poke champion alone does not create a poke-siege plan", () => {
        const plans = compositionPlans(
            tools({ poke: ["Jayce"], siege: ["Jayce"] }),
            [],
            [],
        );

        expect(plans.some((plan) => plan.key === "poke_siege")).toBeFalse();
    });

    test("multiple side-lane tools create a synchronized map-pressure plan", () => {
        const plans = compositionPlans(
            tools({
                side_lane_pressure: ["Camille", "LeBlanc"],
                global_pressure: ["Twisted Fate"],
                wave_clear: ["LeBlanc"],
            }),
            [],
            [],
        );

        expect(plans[0].key).toBe("map_pressure");
        expect(plans[0].condition).toContain("same wave timing");
    });
});

describe("plan reliability evidence gates", () => {
    const coherentPlan: CompositionPlan = {
        key: "front_to_back",
        title: "Protected front-to-back fight",
        score: 16,
        target: "Closest safe target",
        stages: [],
        condition: "Keep formation",
        failure: "Formation splits",
    };

    test("withholds a verdict when one pick lacks capability evidence", () => {
        const result = assessPlanReliability(
            {
                conditions: [{ kind: "coverage" }],
                execution: { label: "Relatively direct" },
                capabilityAssessedPicks: 4,
                totalPicks: 5,
            },
            [coherentPlan],
            ["supported edge"],
            [],
        );

        expect(result.label).toBe("Unconfirmed");
        expect(result.reasons.join(" ")).toContain("4/5 picks");
    });

    test("allows complete, supported plans to be coherent", () => {
        const result = assessPlanReliability(
            {
                conditions: [],
                execution: { label: "Moderate coordination" },
                capabilityAssessedPicks: 5,
                totalPicks: 5,
            },
            [coherentPlan],
            ["supported edge"],
            [],
        );

        expect(result.label).toBe("Coherent");
    });

    test("supported counters reduce reliability instead of being hidden", () => {
        const result = assessPlanReliability(
            {
                conditions: [{ kind: "structural" }],
                execution: { label: "High coordination" },
                capabilityAssessedPicks: 5,
                totalPicks: 5,
            },
            [coherentPlan],
            [],
            ["counter one", "counter two", "counter three"],
        );

        expect(result.label).toBe("Conditional");
        expect(result.reasons.join(" ")).toContain(
            "3 supported opponent answers",
        );
    });

    test("theme cohesion changes strategic reliability only with complete evidence", () => {
        const cohesive = assessPlanReliability(
            {
                conditions: [],
                execution: { label: "Moderate coordination" },
                capabilityAssessedPicks: 5,
                totalPicks: 5,
                themeCohesionScore: 0.8,
            },
            [coherentPlan],
            [],
            [],
        );
        const fragmented = assessPlanReliability(
            {
                conditions: [],
                execution: { label: "Moderate coordination" },
                capabilityAssessedPicks: 5,
                totalPicks: 5,
                themeCohesionScore: 0.2,
            },
            [coherentPlan],
            [],
            [],
        );

        expect(cohesive.score - fragmented.score).toBe(4);
    });
});

describe("strategic winrate bridge", () => {
    const reliability = (score: number, label: "Coherent" | "Unconfirmed" = "Coherent") => ({
        score,
        label,
        reasons: [],
    });

    test("produces a directional signal without changing winrate", () => {
        const result = strategicLean(reliability(15), reliability(8), 1);

        expect(result.direction).toBe("blue");
        expect(result.strength).toBe("moderate");
        expect(result.eligibleForCalibration).toBeTrue();
        expect(result.winrateAdjustmentApplied).toBeFalse();
    });

    test("is symmetric between blue and red", () => {
        const blue = strategicLean(reliability(15), reliability(8), 1);
        const red = strategicLean(reliability(8), reliability(15), 1);

        expect(blue.scoreDifference).toBe(-red.scoreDifference);
        expect(red.direction).toBe("red");
        expect(red.strength).toBe(blue.strength);
    });

    test("withholds the signal when evidence is incomplete", () => {
        const result = strategicLean(
            reliability(15),
            reliability(4, "Unconfirmed"),
            0.8,
        );

        expect(result.direction).toBe("withheld");
        expect(result.eligibleForCalibration).toBeFalse();
    });
});

describe("damage and resource coaching", () => {
    const coached = (
        name: string,
        damage_focus: "physical" | "magic" | "mixed" | "utility",
        resource_demand: "low" | "medium" | "high",
    ) => ({ name, coaching: { damage_focus, resource_demand } });

    test("does not count utility champions as a damage type", () => {
        const result = assessDamageResources([
            coached("Jhin", "physical", "high"),
            coached("Camille", "physical", "high"),
            coached("Nocturne", "physical", "medium"),
            coached("Viktor", "magic", "high"),
            coached("Alistar", "utility", "low"),
        ]);

        expect(result.damageDetail).toContain("3 physical · 1 magic");
        expect(result.damageDetail).not.toContain("utility");
    });

    test("two carries are sustainable rather than an automatic conflict", () => {
        const result = assessDamageResources([
            coached("Top", "physical", "high"),
            coached("Bot", "magic", "high"),
            coached("Support", "utility", "low"),
        ]);

        expect(result.resourceLabel).toBe("Sustainable carry allocation");
    });

    test("three high-income curves require explicit farm priority", () => {
        const result = assessDamageResources([
            coached("Top", "physical", "high"),
            coached("Mid", "magic", "high"),
            coached("Bot", "physical", "high"),
        ]);

        expect(result.resourceLabel).toBe("Competing income curves");
        expect(result.resourceDetail).toContain("next item breakpoint");
        expect(result.highIncomeChampions).toHaveLength(3);
    });
});

describe("game plan timeline", () => {
    const plan: CompositionPlan = {
        key: "coordinated_dive",
        title: "Coordinated backline dive",
        score: 12,
        target: "Enemy carry",
        stages: [],
        condition: "Establish flank or vision denial first.",
        failure: "The dive fails when access and follow-up split.",
    };

    test("connects champion breakpoints to the primary plan", () => {
        const timeline = buildGameTimeline(
            [
                {
                    name: "Nocturne",
                    coaching: {
                        damage_focus: "physical",
                        resource_demand: "medium",
                        power_curve: "early_mid",
                        spike_notes: ["Level 6"],
                    },
                },
                {
                    name: "Camille",
                    coaching: {
                        damage_focus: "physical",
                        resource_demand: "high",
                        power_curve: "mid_late",
                        spike_notes: ["First item completion"],
                    },
                },
            ],
            plan,
        );

        expect(timeline).toHaveLength(3);
        expect(timeline[1].objective).toContain("Nocturne: Level 6");
        expect(timeline[1].checkpoint).toContain("vision denial");
        expect(timeline[2].checkpoint).toContain("Camille");
        expect(timeline[2].checkpoint).toContain("access and follow-up");
    });

    test("does not invent a timeline without a supported plan", () => {
        expect(buildGameTimeline([], undefined)).toEqual([]);
    });
});

describe("composition theme cohesion", () => {
    const divePlan: CompositionPlan = {
        key: "coordinated_dive",
        title: "Coordinated backline dive",
        score: 12,
        target: "Enemy carry",
        stages: [],
        condition: "Create access",
        failure: "Split timing",
    };
    const pick = (name: string, capabilities?: string[]) => ({
        name,
        capabilities: capabilities?.map((capability) => ({
            capability,
            strength: 1,
        })),
    });

    test("separates core divers, enablers and unclear fits", () => {
        const result = assessThemeCohesion(
            [
                pick("Nocturne", ["dive", "global_pressure"]),
                pick("Camille", ["dive"]),
                pick("Viktor", ["zone_control"]),
                pick("Alistar", ["peel"]),
                pick("Example", ["sustain"]),
            ],
            divePlan,
        );

        expect(result.members.map((member) => member.fit)).toEqual([
            "core",
            "core",
            "enabler",
            "enabler",
            "unclear",
        ]);
        expect(result.label).toBe("Partially connected");
        expect(result.calibrationFeature).not.toBeNull();
    });

    test("withholds calibration when a champion is unassessed", () => {
        const result = assessThemeCohesion(
            [pick("Nocturne", ["dive"]), pick("Unknown")],
            divePlan,
        );

        expect(result.label).toBe("Unconfirmed");
        expect(result.calibrationFeature).toBeNull();
    });
});

describe("strategy outcome calibration vector", () => {
    const team = (
        reliabilityScore: number,
        themeScore: number | null,
        highIncomeCount: number,
        supportedRiskCount: number,
        structuralConditionCount: number,
        coverage = 1,
    ) => ({
        reliability: {
            score: reliabilityScore,
            label: "Coherent" as const,
            reasons: [],
        },
        theme: {
            label: "Cohesive" as const,
            score: themeScore,
            coverage,
            members: [],
            calibrationFeature: themeScore,
        },
        damageResources: {
            coverage,
            damageLabel: "Split damage",
            damageDetail: "",
            resourceLabel: "",
            resourceDetail: "",
            highIncomeChampions: Array.from(
                { length: highIncomeCount },
                (_, index) => `Carry ${index}`,
            ),
        },
        supportedRiskCount,
        structuralConditionCount,
    });

    test("keeps every strategic driver separate and blue-positive", () => {
        const vector = buildStrategyCalibrationVector(
            team(16, 0.9, 2, 0, 0),
            team(8, 0.5, 3, 2, 2),
        );

        expect(vector.reliabilityEdge).toBeGreaterThan(0);
        expect(vector.themeEdge).toBeGreaterThan(0);
        expect(vector.resourceEfficiencyEdge).toBe(1);
        expect(vector.counterResilienceEdge).toBeGreaterThan(0);
        expect(vector.structuralCompletenessEdge).toBeGreaterThan(0);
        expect(vector.readyForOutcomeCalibration).toBeTrue();
    });

    test("cannot be calibrated with partial evidence", () => {
        const vector = buildStrategyCalibrationVector(
            team(16, null, 2, 0, 0, 0.8),
            team(8, 0.5, 2, 0, 0),
        );

        expect(vector.themeEdge).toBeNull();
        expect(vector.readyForOutcomeCalibration).toBeFalse();
    });
});
