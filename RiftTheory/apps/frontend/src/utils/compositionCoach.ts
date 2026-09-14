export type CapabilityRead = {
    capability: string;
    strength: number;
    champions: string[];
};

export type CompositionPlan = {
    key: string;
    title: string;
    score: number;
    target: string;
    stages: { label: string; detail: string }[];
    condition: string;
    failure: string;
    opponentResponse: string;
};

export type PlanReliability = {
    score: number;
    label: "Unconfirmed" | "Coherent" | "Conditional" | "Fragile";
    reasons: string[];
};

export type StrategicLean = {
    direction: "blue" | "red" | "even" | "withheld";
    strength: "none" | "slight" | "moderate" | "strong";
    scoreDifference: number;
    eligibleForCalibration: boolean;
    winrateAdjustmentApplied: false;
    explanation: string;
};

type CoachingRead = {
    damage_focus:
        | "physical"
        | "magic"
        | "mixed"
        | "utility"
        | "build_dependent";
    resource_demand: "low" | "medium" | "high";
    power_curve?:
        | "early"
        | "early_mid"
        | "mid"
        | "mid_late"
        | "late"
        | "timing_dependent";
    spike_notes?: string[];
};

type CoachedPick = {
    name: string;
    role?: string;
    coaching?: CoachingRead;
    capabilities?: { capability: string; strength: number }[];
};

export type DamageResourceRead = {
    coverage: number;
    damageLabel: string;
    damageDetail: string;
    resourceLabel: string;
    resourceDetail: string;
    highIncomeChampions: string[];
};

export type GameTimelineStep = {
    phase: string;
    objective: string;
    checkpoint: string;
};

export type ThemeCohesionRead = {
    label: "Cohesive" | "Partially connected" | "Fragmented" | "Unconfirmed";
    score: number | null;
    coverage: number;
    members: {
        champion: string;
        fit: "core" | "enabler" | "unclear" | "unknown";
        reason: string;
    }[];
    calibrationFeature: number | null;
};

export type StrategyCalibrationVector = {
    coverage: number;
    reliabilityEdge: number;
    themeEdge: number | null;
    resourceEfficiencyEdge: number;
    counterResilienceEdge: number;
    structuralCompletenessEdge: number;
    readyForOutcomeCalibration: boolean;
};

type CalibrationTeamRead = {
    reliability: PlanReliability;
    theme: ThemeCohesionRead;
    damageResources: DamageResourceRead;
    supportedRiskCount: number;
    structuralConditionCount: number;
};

type ReliabilityInput = {
    conditions: { kind: "structural" | "coverage" }[];
    execution: { label: string };
    capabilityAssessedPicks: number;
    totalPicks: number;
    themeCohesionScore?: number;
};

type Pick = { name: string; role?: string };

const providersFor = (tools: CapabilityRead[], keys: string[]) => [
    ...new Set(
        tools
            .filter((entry) => keys.includes(entry.capability))
            .flatMap((entry) => entry.champions),
    ),
];

const providerCount = (tools: CapabilityRead[], keys: string[]) =>
    providersFor(tools, keys).length;

const joinedProviders = (
    tools: CapabilityRead[],
    keys: string[],
    fallback: string,
) => providersFor(tools, keys).join(", ") || fallback;

const targetCandidates = (picks: Pick[]) => {
    const carries = picks
        .filter((pick) => pick.role === "bot" || pick.role === "mid")
        .map((pick) => pick.name);
    return carries.length ? carries.join(" or ") : "an exposed damage dealer";
};

export function compositionPlans(
    tools: CapabilityRead[],
    enemyTools: CapabilityRead[],
    enemyPicks: Pick[],
) {
    const plans: CompositionPlan[] = [];
    const count = (...keys: string[]) => providerCount(tools, keys);
    const enemyCount = (...keys: string[]) => providerCount(enemyTools, keys);
    const targets = targetCandidates(enemyPicks);
    const divers = providersFor(tools, ["dive"]);
    const starters = providersFor(tools, ["engage", "pick"]);

    if (divers.length >= 2 || (divers.length >= 1 && starters.length >= 2)) {
        const followUp =
            providersFor(tools, ["poke", "zone_control"])
                .filter((champion) => !divers.includes(champion))
                .join(", ") || "the nearest damage dealer";
        const protection =
            providersFor(tools, ["peel", "disengage", "anti_dive"])
                .filter((champion) => !divers.includes(champion))
                .join(", ") || "the remaining backline";
        const access = providersFor(tools, ["global_pressure", "dive"]);
        plans.push({
            key: "coordinated_dive",
            title: "Coordinated backline dive",
            score:
                divers.length * 3 +
                starters.length +
                count("global_pressure") +
                count("pick") -
                enemyCount("frontline", "peel", "anti_dive"),
            target: `Primary target candidates: ${targets}.`,
            stages: [
                {
                    label: "Create access",
                    detail: `${access.join(", ") || divers[0]} ${access.length === 1 ? "removes" : "remove"} distance or creates the entry angle.`,
                },
                {
                    label: "Collapse together",
                    detail: `${divers.join(", ")} enter on the same target instead of splitting across the fight.`,
                },
                {
                    label: "Layer follow-up",
                    detail: `${followUp} controls the escape path and adds damage after the first commitment.`,
                },
                {
                    label: "Protect the trade",
                    detail: `${protection} prevents the opponent from winning the fight on the opposite side.`,
                },
            ],
            condition:
                "Establish flank or vision denial first and commit only when the chosen carry is separated from the full protection layer.",
            failure:
                enemyCount("frontline", "peel", "anti_dive") >= 2
                    ? "The dive fails if it enters through the enemy frontline or changes targets after the first defensive response."
                    : "The dive fails if access and follow-up happen on different timings.",
            opponentResponse: `${joinedProviders(enemyTools, ["frontline", "peel", "anti_dive"], "The opponent")} should deny flank vision, hold protection for the first committed diver and force the follow-up through the frontline.`,
        });
    }

    const frontliners = providersFor(tools, ["frontline"]);
    const protectors = providersFor(tools, ["peel", "disengage", "anti_dive"]);
    if (frontliners.length >= 2 && protectors.length >= 1) {
        plans.push({
            key: "front_to_back",
            title: "Protected front-to-back fight",
            score:
                frontliners.length * 2 +
                protectors.length * 2 +
                (frontliners.length >= 3 ? 6 : 2),
            target: "Primary target: the closest safe target; do not bypass the formation without a clear kill.",
            stages: [
                {
                    label: "Hold the line",
                    detail: `${frontliners.join(", ")} occupy the first contact and deny direct access.`,
                },
                {
                    label: "Answer commitment",
                    detail: `${protectors.join(", ")} preserve the damage dealers through the opponent's first rotation.`,
                },
                {
                    label: "Win the long fight",
                    detail: `${joinedProviders(tools, ["sustain", "zone_control", "poke"], "the backline")} keeps dealing damage while the formation holds.`,
                },
            ],
            condition:
                "Enter through one controlled angle and keep carries within protection range.",
            failure:
                "The formation fails when the frontline chases forward while the backline is reached from another angle.",
            opponentResponse: `${joinedProviders(enemyTools, ["poke", "siege", "dive", "pick"], "The opponent")} should avoid a clean front-door fight: erode the formation before contact or threaten a second access angle onto the backline.`,
        });
    }

    const pickers = providersFor(tools, ["pick"]);
    if (pickers.length >= 2)
        plans.push({
            key: "pick",
            title: "Vision pick into numbers advantage",
            score:
                pickers.length * 2 + count("global_pressure", "zone_control"),
            target: `Best targets: ${targets} while moving between a wave and an objective.`,
            stages: [
                {
                    label: "Remove information",
                    detail: "Push the nearby wave, sweep one entrance and leave the opponent with an unsafe route.",
                },
                {
                    label: "Layer control",
                    detail: `${pickers.join(", ")} use control in sequence rather than overlapping the first disable.`,
                },
                {
                    label: "Convert immediately",
                    detail: "Use the temporary numbers advantage for vision, a neutral objective or a structure.",
                },
            ],
            condition:
                "The opponent must be forced to move through limited information; grouped five-versus-five contact is not the same plan.",
            failure:
                "The plan stalls if waves are not prepared or the team waits too long after finding the pick.",
            opponentResponse: `${joinedProviders(enemyTools, ["wave_clear", "frontline", "global_pressure"], "The opponent")} should keep waves synchronized, move as a protected unit and refuse unsupported face-checks.`,
        });

    const poke = providersFor(tools, ["poke"]);
    const siege = providersFor(tools, ["siege"]);
    if (poke.length >= 2 && siege.length >= 1)
        plans.push({
            key: "poke_siege",
            title: "Poke and siege setup",
            score: poke.length * 2 + siege.length * 2 + count("wave_clear"),
            target: "Target health bars and access routes before targeting the structure or objective.",
            stages: [
                {
                    label: "Secure the wave",
                    detail: `${joinedProviders(tools, ["wave_clear"], poke[0])} creates time to take space.`,
                },
                {
                    label: "Chip before contact",
                    detail: `${poke.join(", ")} deal damage while preserving distance from engage.`,
                },
                {
                    label: "Take the concession",
                    detail: `${siege.join(", ")} converts low health or retreat into objective damage.`,
                },
            ],
            condition:
                "Arrive before the opponent and keep more than one safe exit from the setup.",
            failure:
                enemyCount("engage", "dive") >= 2
                    ? "The setup fails if the opponent reaches a clean engage before meaningful poke lands."
                    : "The setup fails if the team enters fog or gives up its spacing.",
            opponentResponse: `${joinedProviders(enemyTools, ["engage", "dive", "global_pressure"], "The opponent")} should contest the first move, approach through more than one angle and force commitment before repeated poke creates a health advantage.`,
        });

    const mapPressure = providersFor(tools, [
        "side_lane_pressure",
        "global_pressure",
    ]);
    if (mapPressure.length >= 2)
        plans.push({
            key: "map_pressure",
            title: "Side-lane pressure into a numbers play",
            score:
                mapPressure.length * 2 + count("wave_clear", "global_pressure"),
            target: "Target the defender or objective isolated when the opponent answers the side wave.",
            stages: [
                {
                    label: "Build two waves",
                    detail: `${mapPressure.join(", ")} create pressure away from the next objective.`,
                },
                {
                    label: "Force the answer",
                    detail: "Hold the four-player unit outside engage range until an opponent shows.",
                },
                {
                    label: "Move first",
                    detail: "Collapse, start the objective or take the structure before the defender rejoins.",
                },
            ],
            condition:
                "Side pressure and the grouped unit must act on the same wave timing.",
            failure:
                "The plan fails when the four-player unit fights early or the side-laner pushes without information.",
            opponentResponse: `${joinedProviders(enemyTools, ["engage", "pick", "global_pressure", "wave_clear"], "The opponent")} should either force on the four-player unit before the side wave connects or match the side threat without surrendering objective tempo.`,
        });

    return plans.sort(
        (left, right) =>
            right.score - left.score || left.key.localeCompare(right.key),
    );
}

export const executionPenalty = (label: string) =>
    label === "High coordination"
        ? 2
        : label === "Moderate coordination"
          ? 1
          : 0;

export function assessPlanReliability(
    team: ReliabilityInput,
    plans: CompositionPlan[],
    supportedEdges: string[],
    supportedRisks: string[],
): PlanReliability {
    const structuralConditions = team.conditions.filter(
        (condition) => condition.kind === "structural",
    ).length;
    const coverageConditions = team.conditions.filter(
        (condition) => condition.kind === "coverage",
    ).length;
    const primaryScore = Math.min(plans[0]?.score ?? 0, 16);
    const score =
        primaryScore +
        (plans.length > 1 ? 1 : 0) +
        supportedEdges.length -
        supportedRisks.length * 2 -
        structuralConditions * 2 -
        coverageConditions * 3 -
        executionPenalty(team.execution.label) +
        (team.themeCohesionScore === undefined
            ? 0
            : team.themeCohesionScore >= 0.7
              ? 2
              : team.themeCohesionScore < 0.4
                ? -2
                : 0);
    const completeCoverage =
        team.totalPicks > 0 &&
        team.capabilityAssessedPicks >= team.totalPicks &&
        coverageConditions === 0;
    const label = !completeCoverage
        ? "Unconfirmed"
        : score >= 12
          ? "Coherent"
          : score >= 5
            ? "Conditional"
            : "Fragile";
    const reasons: string[] = [];
    if (plans[0]) reasons.push(`Primary plan: ${plans[0].title}.`);
    if (!completeCoverage)
        reasons.push(
            `Capability evidence covers ${team.capabilityAssessedPicks}/${team.totalPicks} picks; the verdict is withheld.`,
        );
    else if (plans.length > 1)
        reasons.push(`Playable fallback: ${plans[1].title}.`);
    if (supportedRisks.length)
        reasons.push(
            `${supportedRisks.length} supported opponent answer${supportedRisks.length === 1 ? "" : "s"} can disrupt the plan.`,
        );
    if (team.themeCohesionScore !== undefined) {
        if (team.themeCohesionScore >= 0.7)
            reasons.push("Most picks directly support the primary plan.");
        else if (team.themeCohesionScore < 0.4)
            reasons.push("Too few picks connect clearly to the primary plan.");
    }
    if (team.execution.label === "High coordination")
        reasons.push("High coordination demand reduces execution margin.");
    if (structuralConditions)
        reasons.push(
            `${structuralConditions} unresolved structural condition${structuralConditions === 1 ? "" : "s"}.`,
        );
    if (!supportedRisks.length && plans.length)
        reasons.push("No strong assessed opponent disruption was found.");
    return { score, label, reasons: reasons.slice(0, 3) };
}

export function strategicLean(
    blue: PlanReliability,
    red: PlanReliability,
    evidenceCoverage: number,
): StrategicLean {
    const scoreDifference = blue.score - red.score;
    const completeEvidence =
        evidenceCoverage >= 1 &&
        blue.label !== "Unconfirmed" &&
        red.label !== "Unconfirmed";
    if (!completeEvidence)
        return {
            direction: "withheld",
            strength: "none",
            scoreDifference,
            eligibleForCalibration: false,
            winrateAdjustmentApplied: false,
            explanation:
                "Strategy lean withheld because role-specific capability evidence is incomplete.",
        };

    const magnitude = Math.abs(scoreDifference);
    const direction =
        magnitude < 4 ? "even" : scoreDifference > 0 ? "blue" : "red";
    const strength =
        magnitude < 4
            ? "none"
            : magnitude < 6
              ? "slight"
              : magnitude < 9
                ? "moderate"
                : "strong";
    return {
        direction,
        strength,
        scoreDifference,
        eligibleForCalibration: direction !== "even",
        winrateAdjustmentApplied: false,
        explanation:
            direction === "even"
                ? "Both execution plans grade similarly; strategy does not create a directional signal."
                : `${direction === "blue" ? "Blue" : "Red"} has the ${strength} strategic lean. Its winrate weight remains withheld until outcome calibration validates it.`,
    };
}

export function assessDamageResources(
    picks: CoachedPick[],
): DamageResourceRead {
    const assessed = picks.filter((pick) => pick.coaching);
    const damageSources = assessed.filter(
        (pick) => pick.coaching!.damage_focus !== "utility",
    );
    const count = (focus: CoachingRead["damage_focus"]) =>
        damageSources.filter((pick) => pick.coaching!.damage_focus === focus)
            .length;
    const physical = count("physical");
    const magic = count("magic");
    const mixed = count("mixed");
    const buildDependent = count("build_dependent");
    const damageTotal = damageSources.length;
    const physicalHeavy = damageTotal >= 3 && physical / damageTotal >= 0.75;
    const magicHeavy = damageTotal >= 3 && magic / damageTotal >= 0.75;
    const damageLabel = !damageTotal
        ? "Damage profile unconfirmed"
        : physicalHeavy
          ? "Physical-heavy damage"
          : magicHeavy
            ? "Magic-heavy damage"
            : physical > 0 && magic > 0
              ? "Split physical and magic damage"
              : mixed > 0
                ? "Mixed damage profile"
                : "Partially defined damage";
    const damageParts = [
        physical ? `${physical} physical` : "",
        magic ? `${magic} magic` : "",
        mixed ? `${mixed} mixed` : "",
        buildDependent ? `${buildDependent} build-dependent` : "",
    ].filter(Boolean);
    const damageDetail = !damageTotal
        ? "No covered pick is currently labeled as a damage source."
        : `${damageParts.join(" · ")}. ${physicalHeavy ? "Armor can reduce several income sources at once; preserve magic or true-damage access in builds." : magicHeavy ? "Magic resistance can reduce several income sources at once; preserve physical or true-damage access in builds." : "Opponents cannot optimize one basic resistance against every assessed damage source."}`;

    const highIncomeChampions = assessed
        .filter((pick) => pick.coaching!.resource_demand === "high")
        .map((pick) => pick.name);
    const lowIncomeChampions = assessed
        .filter((pick) => pick.coaching!.resource_demand === "low")
        .map((pick) => pick.name);
    const resourceConflict = highIncomeChampions.length >= 3;
    const resourceLabel = resourceConflict
        ? "Competing income curves"
        : highIncomeChampions.length
          ? "Sustainable carry allocation"
          : "Low assessed income demand";
    const resourceDetail = resourceConflict
        ? `${highIncomeChampions.join(", ")} all prefer high income. Assign side waves and post-lane camps by the next item breakpoint; do not split spare farm evenly.`
        : highIncomeChampions.length
          ? `${highIncomeChampions.join(" and ")} receive protected farm around their next item breakpoint.${lowIncomeChampions.length ? ` ${lowIncomeChampions.join(" and ")} can preserve tempo without claiming a primary income stream.` : ""}`
          : "No covered pick requires a protected high-income stream; prioritize map tempo and the nearest meaningful breakpoint.";

    return {
        coverage: picks.length ? assessed.length / picks.length : 0,
        damageLabel,
        damageDetail,
        resourceLabel,
        resourceDetail,
        highIncomeChampions,
    };
}

export function buildGameTimeline(
    picks: CoachedPick[],
    plan?: CompositionPlan,
): GameTimelineStep[] {
    if (!plan) return [];
    const assessed = picks.filter((pick) => pick.coaching);
    const earlyChampions = assessed
        .filter((pick) =>
            ["early", "early_mid"].includes(pick.coaching!.power_curve ?? ""),
        )
        .map((pick) => pick.name);
    const lateChampions = assessed
        .filter((pick) =>
            ["mid_late", "late"].includes(pick.coaching!.power_curve ?? ""),
        )
        .map((pick) => pick.name);
    const spikes = [
        ...new Set(
            assessed.flatMap((pick) =>
                (pick.coaching!.spike_notes ?? []).map(
                    (spike) => `${pick.name}: ${spike}`,
                ),
            ),
        ),
    ].slice(0, 3);
    const setupByPlan: Record<string, string> = {
        coordinated_dive:
            "Track enemy protection cooldowns, control one flank route and keep the dive group on the same tempo.",
        front_to_back:
            "Protect carry income, stabilize waves and avoid spending frontline health before the objective setup.",
        pick: "Push the adjacent wave, deny vision on one route and force the opponent to face-check for access.",
        poke_siege:
            "Secure wave control and arrive first so range can create a health advantage before contact.",
        map_pressure:
            "Set side-lane assignments early and keep the grouped unit outside hard-engage range.",
    };
    const conversionByPlan: Record<string, string> = {
        coordinated_dive:
            "Convert the first clean backline isolation into an objective before defensive cooldowns reset.",
        front_to_back:
            "Take one controlled entrance, preserve formation and damage the closest safe target.",
        pick: "Turn the numbers advantage into vision, a neutral objective or a structure immediately.",
        poke_siege:
            "Take the objective or structure once enemy health or positioning forces a concession.",
        map_pressure:
            "Act the moment a defender answers the side wave: collapse, start the objective or take the structure.",
    };
    return [
        {
            phase: "Early setup",
            objective:
                setupByPlan[plan.key] ??
                "Stabilize lanes and prepare vision for the primary execution plan.",
            checkpoint: earlyChampions.length
                ? `${earlyChampions.join(" and ")} must convert early strength without forcing the full team off its income curve.`
                : "Do not force before the tools required by the primary plan are available.",
        },
        {
            phase: "Synchronized window",
            objective: spikes.length
                ? `Look for an overlap between ${spikes.join(" · ")}.`
                : "Fight only when the plan's key ultimates and completed items overlap.",
            checkpoint: plan.condition,
        },
        {
            phase: "Conversion & close",
            objective:
                conversionByPlan[plan.key] ??
                "Convert a won setup into durable map control instead of taking an immediate low-value reset.",
            checkpoint: `${lateChampions.length ? `${lateChampions.join(" and ")} gain more value if the game extends. ` : ""}Warning: ${plan.failure}`,
        },
    ];
}

export function assessThemeCohesion(
    picks: CoachedPick[],
    plan?: CompositionPlan,
): ThemeCohesionRead {
    if (!plan)
        return {
            label: "Unconfirmed",
            score: null,
            coverage: 0,
            members: picks.map((pick) => ({
                champion: pick.name,
                fit: "unknown",
                reason: "No supported primary plan is available.",
            })),
            calibrationFeature: null,
        };
    const keysByPlan: Record<string, { core: string[]; enabler: string[] }> = {
        coordinated_dive: {
            core: ["dive", "engage", "global_pressure"],
            enabler: ["pick", "zone_control", "peel", "disengage"],
        },
        front_to_back: {
            core: ["frontline", "peel", "disengage", "anti_dive"],
            enabler: ["poke", "zone_control", "sustain", "wave_clear"],
        },
        pick: {
            core: ["pick", "global_pressure"],
            enabler: ["engage", "zone_control", "wave_clear"],
        },
        poke_siege: {
            core: ["poke", "siege"],
            enabler: ["wave_clear", "zone_control", "disengage", "peel"],
        },
        map_pressure: {
            core: ["side_lane_pressure", "global_pressure"],
            enabler: ["wave_clear", "disengage", "pick", "siege"],
        },
    };
    const keys = keysByPlan[plan.key] ?? { core: [], enabler: [] };
    const members = picks.map((pick) => {
        if (!pick.capabilities?.length)
            return {
                champion: pick.name,
                fit: "unknown" as const,
                reason: "Role-specific capability evidence is missing.",
            };
        const supported = pick.capabilities
            .filter((capability) => capability.strength >= 0.5)
            .map((capability) => capability.capability);
        const core = supported.filter((key) => keys.core.includes(key));
        if (core.length)
            return {
                champion: pick.name,
                fit: "core" as const,
                reason: `Directly supplies ${core.join(" and ")}.`,
            };
        const enablers = supported.filter((key) => keys.enabler.includes(key));
        if (enablers.length)
            return {
                champion: pick.name,
                fit: "enabler" as const,
                reason: `Enables the plan through ${enablers.join(" and ")}.`,
            };
        return {
            champion: pick.name,
            fit: "unclear" as const,
            reason: "No assessed capability directly connects this pick to the primary plan.",
        };
    });
    const known = members.filter((member) => member.fit !== "unknown");
    const points = known.reduce(
        (total, member) =>
            total +
            (member.fit === "core" ? 2 : member.fit === "enabler" ? 1 : 0),
        0,
    );
    const score = known.length ? points / (known.length * 2) : null;
    const coverage = picks.length ? known.length / picks.length : 0;
    const label =
        coverage < 1 || score === null
            ? "Unconfirmed"
            : score >= 0.7
              ? "Cohesive"
              : score >= 0.4
                ? "Partially connected"
                : "Fragmented";
    return {
        label,
        score,
        coverage,
        members,
        calibrationFeature: coverage === 1 ? score : null,
    };
}

const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));

export function buildStrategyCalibrationVector(
    blue: CalibrationTeamRead,
    red: CalibrationTeamRead,
): StrategyCalibrationVector {
    const coverage = Math.min(
        blue.theme.coverage,
        red.theme.coverage,
        blue.damageResources.coverage,
        red.damageResources.coverage,
    );
    const blueResourceConflict =
        blue.damageResources.highIncomeChampions.length >= 3 ? 1 : 0;
    const redResourceConflict =
        red.damageResources.highIncomeChampions.length >= 3 ? 1 : 0;
    const themeEdge =
        blue.theme.calibrationFeature === null ||
        red.theme.calibrationFeature === null
            ? null
            : clampUnit(
                  blue.theme.calibrationFeature - red.theme.calibrationFeature,
              );
    return {
        coverage,
        reliabilityEdge: clampUnit(
            (blue.reliability.score - red.reliability.score) / 16,
        ),
        themeEdge,
        resourceEfficiencyEdge: redResourceConflict - blueResourceConflict,
        counterResilienceEdge: clampUnit(
            (red.supportedRiskCount - blue.supportedRiskCount) / 3,
        ),
        structuralCompletenessEdge: clampUnit(
            (red.structuralConditionCount - blue.structuralConditionCount) / 3,
        ),
        readyForOutcomeCalibration:
            coverage >= 1 &&
            themeEdge !== null &&
            blue.reliability.label !== "Unconfirmed" &&
            red.reliability.label !== "Unconfirmed",
    };
}
