import { createMemo, For, Show } from "solid-js";
import { evaluateDraftInteractions } from "@draftgap/core/src/interaction/interaction-engine";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useDraftAnalysis } from "../../contexts/DraftAnalysisContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { championName, useI18n } from "../../utils/i18n";
import {
    KnowledgeColorBaseline,
    KnowledgeCoachingProfile,
    KnowledgeStrategicProfile,
} from "../../types/RiftTheoryKnowledge";
import ObservedRoleBadges from "./ObservedRoleBadges";
import InteractionFindings from "./InteractionFindings";
import { toInteractionRule } from "../../utils/interactionEvidence";
import { effectiveColorEvidence } from "../../utils/colorEvidence";
import {
    assessDamageResources,
    assessPlanReliability,
    assessThemeCohesion,
    buildGameTimeline,
    buildStrategyCalibrationVector,
    CapabilityRead,
    CompositionPlan,
    compositionPlans as buildCompositionPlans,
    strategicLean,
} from "../../utils/compositionCoach";

const roleNames = ["top", "jungle", "mid", "bot", "support"];
const profileColors = (
    profile: KnowledgeStrategicProfile | KnowledgeColorBaseline,
    assignment: "main" | "off",
) =>
    profile.colors
        .filter((color) => color.assignment === assignment)
        .map((color) => color.color);
const profilePatch = (
    profile: KnowledgeStrategicProfile | KnowledgeColorBaseline,
) =>
    "patch_version" in profile ? profile.patch_version : profile.source_version;

const COLOR_PLAN: Record<string, { plan: string; risk: string }> = {
    red: {
        plan: "Accelerate the game, convert early resources and keep forcing before the draft runs out of fuel.",
        risk: "Becoming even or falling behind removes much of the plan's leverage.",
    },
    green: {
        plan: "Layer champion synergies and fight around connected item or level timings.",
        risk: "Isolated pieces are weaker when the team cannot combine its tools.",
    },
    blue: {
        plan: "Control information, space and resources until the opponent runs out of good options.",
        risk: "The draft needs enough time and safety to establish control.",
    },
    white: {
        plan: "Keep roles and responses versatile, then commit to the option the game state requires.",
        risk: "Versatility in draft can still become a binary choice in game.",
    },
    black: {
        plan: "Use a condition, sacrifice or trade-off to accelerate the rest of the composition.",
        risk: "The required condition must be met; the power is not unconditional.",
    },
    colorless: {
        plan: "Draft around the dedicated theme and make every surrounding slot support it.",
        risk: "The theme can warp the entire draft and leaves less room for generic answers.",
    },
};

const COLOR_STYLE: Record<string, string> = {
    red: "border-red-500/50 bg-red-500/10 text-red-200",
    green: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
    blue: "border-sky-500/50 bg-sky-500/10 text-sky-200",
    white: "border-stone-300/50 bg-stone-200/10 text-stone-100",
    black: "border-violet-500/50 bg-violet-500/10 text-violet-200",
    colorless: "border-amber-500/50 bg-amber-500/10 text-amber-200",
};

type UnresolvedCondition = {
    title: string;
    consequence: string;
    kind: "structural" | "coverage";
};

type PlanJob = {
    champion: string;
    role?: string;
    assignment: string;
    before: string;
    during: string;
    avoid: string;
};

const CAPABILITY_COACHING: Record<
    string,
    { winCondition: string; risk: string }
> = {
    engage: {
        winCondition: "Start decisive fights before the opponent can set up.",
        risk: "Engages become costly when follow-up is late or the first target is protected.",
    },
    disengage: {
        winCondition:
            "Absorb the first commitment, reset the fight and punish the second beat.",
        risk: "The draft can struggle when it must be the team that starts the action.",
    },
    pick: {
        winCondition:
            "Create numbers advantages through vision denial and isolated targets.",
        risk: "Grouped opponents and disciplined vision reduce pick access.",
    },
    poke: {
        winCondition:
            "Lower enemy health before objectives and force bad entries into controlled space.",
        risk: "Hard engage or sustain can erase the value of the setup phase.",
    },
    wave_clear: {
        winCondition:
            "Control wave states to buy setup time and deny clean sieges.",
        risk: "Wave control alone does not create a way to finish fights.",
    },
    frontline: {
        winCondition:
            "Hold contested space long enough for carries to deal damage safely.",
        risk: "A lone frontline can be bypassed or exhausted without supporting control.",
    },
    peel: {
        winCondition:
            "Protect the primary damage source and punish champions that overextend.",
        risk: "Defensive tools lose value when threats arrive from several angles.",
    },
    dive: {
        winCondition:
            "Reach and remove the enemy backline instead of fighting front to back.",
        risk: "Diving without synchronized access splits the composition in two.",
    },
    anti_dive: {
        winCondition:
            "Invite enemy commitment and turn it around near protected carries.",
        risk: "The composition may lack pressure against enemies that refuse to enter.",
    },
    zone_control: {
        winCondition:
            "Own entrances and objective space before the opponent arrives.",
        risk: "Late setup removes much of the terrain advantage.",
    },
    siege: {
        winCondition:
            "Convert range and wave pressure into structures without taking an even fight.",
        risk: "Flanks and reliable engage can collapse the siege formation.",
    },
    side_lane_pressure: {
        winCondition:
            "Stretch the map and force the opponent to answer more than one lane.",
        risk: "Poor timing can leave the four-player unit exposed.",
    },
    global_pressure: {
        winCondition: "Create temporary numbers advantages across the map.",
        risk: "Globals lose leverage when waves and vision are not prepared first.",
    },
    objective_control: {
        winCondition:
            "Turn setup and secure tools into reliable neutral objectives.",
        risk: "Objective strength matters less when the team concedes the approach.",
    },
    sustain: {
        winCondition:
            "Extend the setup or fight until the opponent's first rotation loses value.",
        risk: "Burst and clean target access can end the fight before sustain matters.",
    },
};

const capabilityStrength = (capabilities: CapabilityRead[], key: string) =>
    capabilities.find((entry) => entry.capability === key)?.strength ?? 0;

const strongestOf = (capabilities: CapabilityRead[], keys: string[]) =>
    Math.max(...keys.map((key) => capabilityStrength(capabilities, key)), 0);

const providerCount = (capabilities: CapabilityRead[], keys: string[]) =>
    new Set(
        capabilities
            .filter((entry) => keys.includes(entry.capability))
            .flatMap((entry) => entry.champions),
    ).size;

const curvePressure = (profiles: KnowledgeCoachingProfile[]) =>
    profiles.reduce((score, profile) => {
        if (profile.power_curve === "early") return score + 2;
        if (profile.power_curve === "early_mid") return score + 1;
        if (profile.power_curve === "mid_late") return score - 1;
        if (profile.power_curve === "late") return score - 2;
        return score;
    }, 0);

const decidingFactors = (
    blue: {
        name: string;
        coachingProfiles: KnowledgeCoachingProfile[];
        highResourceChampions: string[];
        execution: { label: string };
    },
    red: {
        name: string;
        coachingProfiles: KnowledgeCoachingProfile[];
        highResourceChampions: string[];
        execution: { label: string };
    },
    bluePlans: CompositionPlan[],
    redPlans: CompositionPlan[],
    blueRisks: string[],
    redRisks: string[],
) => {
    const factors: { title: string; detail: string }[] = [];
    const blueCurve = curvePressure(blue.coachingProfiles);
    const redCurve = curvePressure(red.coachingProfiles);
    if (Math.abs(blueCurve - redCurve) >= 3) {
        const earlier = blueCurve > redCurve ? blue : red;
        const later = earlier === blue ? red : blue;
        factors.push({
            title: `${earlier.name} owns the earlier conversion window`,
            detail: `${earlier.name} must turn early champion strength into durable objectives. ${later.name} benefits if the game stays controlled until later item breakpoints.`,
        });
    } else {
        factors.push({
            title: "The first synchronized item window matters more than raw scaling",
            detail:
                "Neither assessed curve dominates enough to decide the draft alone. Track completed items and ultimate availability before forcing the first major objective fight.",
        });
    }

    if (
        bluePlans[0]?.key === "coordinated_dive" &&
        redPlans[0]?.key === "front_to_back"
    )
        factors.push({
            title: "Blue target access versus Red formation",
            detail:
                "Blue must isolate a carry before entering the full protection layer. Red wins the structural exchange by keeping its carry behind frontline and saving control for the second diver.",
        });
    else if (
        redPlans[0]?.key === "coordinated_dive" &&
        bluePlans[0]?.key === "front_to_back"
    )
        factors.push({
            title: "Red target access versus Blue formation",
            detail:
                "Red must isolate a carry before entering the full protection layer. Blue wins the structural exchange by keeping its carry behind frontline and saving control for the second diver.",
        });
    else if (bluePlans[0] && redPlans[0])
        factors.push({
            title: `${bluePlans[0].title} versus ${redPlans[0].title}`,
            detail:
                "The side that establishes its required state first forces the opponent away from its preferred sequence. Vision and wave timing decide which plan begins on favorable terms.",
        });

    const blueResourceConflict = blue.highResourceChampions.length >= 3;
    const redResourceConflict = red.highResourceChampions.length >= 3;
    if (blueResourceConflict || redResourceConflict) {
        const affected = [
            ...(blueResourceConflict ? [blue.name] : []),
            ...(redResourceConflict ? [red.name] : []),
        ].join(" and ");
        factors.push({
            title: `${affected} must declare income priority`,
            detail:
                "Three or more assessed high-resource champions create competing item curves. Side waves and jungle camps should follow the chosen win condition rather than being divided evenly by default.",
        });
    }

    if (blue.execution.label !== red.execution.label) {
        const harder =
            executionPenalty(blue.execution.label) >
            executionPenalty(red.execution.label)
                ? blue
                : red;
        factors.push({
            title: `${harder.name} has less execution margin`,
            detail:
                "Its plan requires tighter sequencing or map synchronization. An even draft state does not imply an equally easy fight to execute.",
        });
    }

    if (blueRisks.length !== redRisks.length) {
        const exposed = blueRisks.length > redRisks.length ? blue : red;
        factors.push({
            title: `${exposed.name} has more confirmed disruption to solve`,
            detail:
                "The opponent owns more assessed answers into its primary tools. Those answers should be tracked as cooldowns or positioning requirements before commitment.",
        });
    }
    return factors.slice(0, 4);
};

const planJobs = (
    picks: {
        name: string;
        role?: string;
        capabilities: { capability: string }[];
        coaching?: KnowledgeCoachingProfile;
    }[],
    plan?: CompositionPlan,
) => {
    const has = (
        pick: (typeof picks)[number],
        ...capabilities: string[]
    ) =>
        pick.capabilities.some((entry) =>
            capabilities.includes(entry.capability),
        );
    return picks.map((pick): PlanJob => {
        const highIncome = pick.coaching?.resource_demand === "high";
        if (plan?.key === "coordinated_dive") {
            if (has(pick, "dive"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Dive unit",
                    before: has(pick, "global_pressure")
                        ? "Track the isolated carry and hide the access angle."
                        : "Prepare a flank or stand within immediate follow-up range.",
                    during:
                        "Enter on the called target with the other diver and layer control or burst.",
                    avoid:
                        "Do not switch targets or cross the full frontline alone.",
                };
            if (has(pick, "peel", "disengage", "anti_dive"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Trade protector",
                    before:
                        "Stay connected to the allied damage source opposite the dive angle.",
                    during:
                        "Deny the enemy counter-dive while the dive unit finishes its target.",
                    avoid:
                        "Do not spend every defensive cooldown as extra engage.",
                };
            return {
                champion: pick.name,
                role: pick.role,
                assignment: "Ranged follow-up",
                before: has(pick, "wave_clear", "zone_control")
                    ? "Prepare the wave and control the target's escape route."
                    : "Hold a safe angle that can reach the called target.",
                during:
                    "Layer damage after access is secured; keep enough distance to survive the return engage.",
                avoid:
                    "Do not walk through enemy control to arrive one second earlier.",
            };
        }

        if (plan?.key === "front_to_back") {
            if (has(pick, "frontline"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Formation anchor",
                    before:
                        "Own the first contested space without leaving protection range.",
                    during:
                        "Control the closest threat and keep the fight in front of the carry.",
                    avoid:
                        "Do not chase past the damage line and open a flank behind you.",
                };
            if (has(pick, "peel", "disengage", "anti_dive"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Carry protection",
                    before:
                        "Identify the enemy access cooldown that must be answered.",
                    during:
                        "Hold control until the diver commits, then preserve the carry's firing space.",
                    avoid:
                        "Do not use the only peel tool on a low-value frontline target.",
                };
            return {
                champion: pick.name,
                role: pick.role,
                assignment: highIncome ? "Primary damage" : "Follow-up damage",
                before:
                    "Enter with the frontline between you and every known access angle.",
                during:
                    "Damage the closest safe target and move with the protection layer.",
                avoid:
                    "Do not bypass the formation for a carry unless the kill is secured.",
            };
        }

        if (plan?.key === "pick") {
            if (has(pick, "pick", "engage"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Pick creator",
                    before:
                        "Control fog around the next forced route and wait outside vision.",
                    during:
                        "Start on the first isolated high-value target and layer control in sequence.",
                    avoid:
                        "Do not reveal early or force into a fully grouped opponent.",
                };
            return {
                champion: pick.name,
                role: pick.role,
                assignment: "Pick conversion",
                before: "Push the adjacent wave and stay close enough to collapse.",
                during:
                    "Finish the controlled target, then move immediately to the objective.",
                avoid: "Do not split for farm after the pick window begins.",
            };
        }

        if (plan?.key === "poke_siege") {
            if (has(pick, "poke", "siege"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Range pressure",
                    before:
                        "Take position before contact and preserve a safe exit angle.",
                    during:
                        "Chip health or structures without crossing into engage range.",
                    avoid:
                        "Do not trade positioning for low-value damage before the objective.",
                };
            return {
                champion: pick.name,
                role: pick.role,
                assignment: has(pick, "peel", "disengage")
                    ? "Siege protection"
                    : "Flank control",
                before: "Secure the side entrance and track enemy engage angles.",
                during:
                    "Reject the first access attempt so ranged pressure can continue.",
                avoid: "Do not start an even fight before poke creates an advantage.",
            };
        }

        if (plan?.key === "map_pressure") {
            if (has(pick, "side_lane_pressure"))
                return {
                    champion: pick.name,
                    role: pick.role,
                    assignment: "Side-wave pressure",
                    before: "Build the side wave on the shared objective timer.",
                    during:
                        "Force a defender to show, then move first or threaten the structure.",
                    avoid:
                        "Do not push beyond available information while the grouped unit is exposed.",
                };
            return {
                champion: pick.name,
                role: pick.role,
                assignment: "Four-player restraint",
                before:
                    "Hold vision and remain outside hard-engage range while the side wave advances.",
                during:
                    "Act only after an opponent answers the side lane or loses objective position.",
                avoid: "Do not begin a four-versus-five fight before the map creates value.",
            };
        }

        return {
            champion: pick.name,
            role: pick.role,
            assignment: "Unresolved role",
            before: "Confirm the team's primary plan and required setup.",
            during: "Play around the strongest assessed team tool.",
            avoid: "Do not commit before responsibilities are clear.",
        };
    });
};

const PLAN_PRIORITY: Record<string, number> = {
    dive: 15,
    engage: 14,
    pick: 13,
    zone_control: 12,
    objective_control: 11,
    side_lane_pressure: 10,
    poke: 9,
    siege: 8,
    global_pressure: 8,
    frontline: 5,
    peel: 4,
    disengage: 4,
    anti_dive: 4,
    sustain: 3,
    wave_clear: 2,
};

const primaryPlanTools = (capabilities: CapabilityRead[]) =>
    [...capabilities]
        .sort(
            (left, right) =>
                right.champions.length - left.champions.length ||
                (PLAN_PRIORITY[right.capability] ?? 0) -
                    (PLAN_PRIORITY[left.capability] ?? 0) ||
                right.strength - left.strength ||
                left.capability.localeCompare(right.capability),
        )
        .slice(0, 3);

const describeIdentity = (
    colors: { color: string }[],
    tools: CapabilityRead[],
) => {
    const color = colors[0]?.color;
    const toolNames = tools.slice(0, 2).map((tool) => tool.capability);
    if (!color && !toolNames.length) return "Not enough assessed evidence yet";
    const colorPart = color
        ? `${color[0].toUpperCase()}${color.slice(1)}`
        : "Open";
    return toolNames.length
        ? `${colorPart} · ${toolNames.join(" + ")}`
        : colorPart;
};

const colorScore = (
    colors: { color: string; main: number; off: number }[],
    key: string,
) => {
    const color = colors.find((entry) => entry.color === key);
    return color ? color.main * 2 + color.off : 0;
};

const powerCurveRead = (
    colors: { color: string; main: number; off: number }[],
) => {
    if (!colors.length)
        return {
            label: "Unknown",
            detail: "Assign roles and add reviewed color profiles before reading the power curve.",
        };
    const early = colorScore(colors, "red");
    const late = colorScore(colors, "blue");
    const spikes = colorScore(colors, "green");
    if (early >= late + 3)
        return {
            label: "Early–mid pressure",
            detail: "The color profile rewards converting tempo before the opponent stabilizes. This is a strategic signal, not measured champion scaling.",
        };
    if (late >= early + 3)
        return {
            label: "Setup into later control",
            detail: "The color profile prefers time, information and controlled space. Exact breakpoints still need champion-specific scaling data.",
        };
    if (spikes >= Math.max(early, late))
        return {
            label: "Timing-window composition",
            detail: "Look for connected item or level spikes and fight while several champions are strong together.",
        };
    return {
        label: "Mixed curve",
        detail: "Color evidence shows no dominant timing; champion-specific breakpoints decide the windows.",
    };
};

const executionRead = (
    colors: { color: string; main: number; off: number }[],
    tools: CapabilityRead[],
) => {
    let demands = 0;
    if (
        capabilityStrength(tools, "dive") >= 0.6 &&
        capabilityStrength(tools, "engage") >= 0.6
    )
        demands += 2;
    if (strongestOf(tools, ["side_lane_pressure", "global_pressure"]) >= 0.6)
        demands += 1;
    if (colorScore(colors, "black") >= 3) demands += 1;
    if (colorScore(colors, "colorless") >= 3) demands += 1;
    if (
        providerCount(tools, ["frontline"]) >= 2 &&
        providerCount(tools, ["peel", "disengage"]) >= 2
    )
        demands -= 1;

    if (demands >= 3)
        return {
            label: "High coordination",
            detail: "The draft depends on synchronized access, timing or map states. A missed first action can split the composition.",
        };
    if (demands >= 1)
        return {
            label: "Moderate coordination",
            detail: "The plan is readable, but key tools still need a shared target and timing.",
        };
    return {
        label: "Relatively direct",
        detail: "The assessed tools support a simpler structure. This does not measure mechanical difficulty.",
    };
};

const assessedPowerCurveRead = (
    profiles: KnowledgeCoachingProfile[],
    fallbackColors: { color: string; main: number; off: number }[],
) => {
    if (!profiles.length) return powerCurveRead(fallbackColors);
    const curveOrder = [
        "early",
        "early_mid",
        "mid",
        "timing_dependent",
        "mid_late",
        "late",
    ];
    const counts = new Map<string, number>();
    for (const profile of profiles)
        counts.set(
            profile.power_curve,
            (counts.get(profile.power_curve) ?? 0) + 1,
        );
    const ordered = [...counts.entries()].sort(
        (left, right) =>
            right[1] - left[1] ||
            curveOrder.indexOf(left[0]) - curveOrder.indexOf(right[0]),
    );
    const readable = (value: string) => value.replaceAll("_", "–");
    return {
        label: ordered
            .slice(0, 2)
            .map(([curve]) => readable(curve))
            .join(" + "),
        detail: `Based on ${profiles.length} role-specific coaching profile${profiles.length === 1 ? "" : "s"}. Check the champion breakpoints below before choosing a fight window.`,
    };
};

const assessedExecutionRead = (
    profiles: KnowledgeCoachingProfile[],
    fallbackColors: { color: string; main: number; off: number }[],
    tools: CapabilityRead[],
) => {
    if (!profiles.length) return executionRead(fallbackColors, tools);
    const average =
        profiles.reduce(
            (total, profile) => total + profile.execution_demand,
            0,
        ) / profiles.length;
    return {
        label:
            average >= 4
                ? "High coordination"
                : average >= 2.75
                  ? "Moderate coordination"
                  : "Relatively direct",
        detail: `Average ${average.toFixed(1)}/5 across ${profiles.length} assessed role profile${profiles.length === 1 ? "" : "s"}; this measures draft execution demands, not player skill.`,
    };
};

const unresolvedConditions = (
    tools: CapabilityRead[],
    assessedPicks: number,
    totalPicks: number,
) => {
    const conditions: UnresolvedCondition[] = [];
    if (assessedPicks < totalPicks) {
        conditions.push({
            title: `${totalPicks - assessedPicks} pick${totalPicks - assessedPicks === 1 ? " is" : "s are"} missing role-specific capability evidence.`,
            consequence:
                "RiftTheory lowers confidence instead of treating unknown tools as confirmed draft weaknesses.",
            kind: "coverage",
        });
        return conditions;
    }
    if (strongestOf(tools, ["engage", "pick"]) < 0.5)
        conditions.push({
            title: "No reliable fight starter is confirmed.",
            consequence:
                "The opponent may choose when to disengage or enter unless terrain, flank timing or an unassessed tool creates access.",
            kind: "structural",
        });
    if (strongestOf(tools, ["peel", "disengage", "anti_dive"]) < 0.5)
        conditions.push({
            title: "Backline protection is not confirmed.",
            consequence:
                "A coordinated enemy engage can reach the primary damage source without passing through a second defensive layer.",
            kind: "structural",
        });
    if (capabilityStrength(tools, "wave_clear") < 0.5)
        conditions.push({
            title: "Wave stabilization is not confirmed.",
            consequence:
                "The team may arrive late to objectives or lose map access while answering stacked waves.",
            kind: "structural",
        });
    if (capabilityStrength(tools, "frontline") < 0.5)
        conditions.push({
            title: "No conventional frontline is confirmed.",
            consequence:
                "Contested space must be won through range, threat or tempo because the draft cannot safely absorb first contact.",
            kind: "structural",
        });
    if (strongestOf(tools, ["zone_control", "objective_control"]) < 0.5)
        conditions.push({
            title: "Objective-entry control is not confirmed.",
            consequence:
                "The team needs earlier arrival, superior vision or a pick before starting a neutral objective.",
            kind: "structural",
        });
    return conditions.slice(0, 3);
};

const coachingQuestions = (
    profiles: KnowledgeCoachingProfile[],
    highResourceChampions: string[],
) => {
    const conditions: UnresolvedCondition[] = [];
    const damageCounts = profiles.reduce((counts, profile) => {
        counts.set(
            profile.damage_focus,
            (counts.get(profile.damage_focus) ?? 0) + 1,
        );
        return counts;
    }, new Map<string, number>());
    if (
        profiles.length >= 3 &&
        (damageCounts.get("physical") ?? 0) >= profiles.length - 1
    )
        conditions.push({
            title: "The assessed damage profile is heavily physical.",
            consequence:
                "Efficient armor purchases may reduce several champions at once unless mixed or true damage is available in the actual builds.",
            kind: "structural",
        });
    if (
        profiles.length >= 3 &&
        (damageCounts.get("magic") ?? 0) >= profiles.length - 1
    )
        conditions.push({
            title: "The assessed damage profile is heavily magic.",
            consequence:
                "Efficient magic-resistance purchases may reduce several champions at once unless the actual builds diversify damage.",
            kind: "structural",
        });
    if (highResourceChampions.length >= 3)
        conditions.push({
            title: `Income priority is unresolved between ${highResourceChampions.join(", ")}.`,
            consequence:
                "The draft must assign waves and camps deliberately; simultaneous high-income curves cannot all be accelerated.",
            kind: "structural",
        });
    return conditions;
};

const matchupEdges = (
    teamName: string,
    tools: CapabilityRead[],
    enemyTools: CapabilityRead[],
) => {
    const edges: string[] = [];
    const enemyCommit = strongestOf(enemyTools, ["engage", "dive"]);
    const protection = strongestOf(tools, ["disengage", "peel", "anti_dive"]);
    if (enemyCommit >= 0.6 && protection >= 0.6)
        edges.push(
            `${teamName} has tools to answer the opponent's first engage or dive.`,
        );

    const enemyRange = strongestOf(enemyTools, ["poke", "siege"]);
    const rangeAnswer = strongestOf(tools, ["engage", "dive", "sustain"]);
    if (enemyRange >= 0.6 && rangeAnswer >= 0.6)
        edges.push(
            `${teamName} can challenge the opponent's poke or siege setup.`,
        );

    const ownPick = capabilityStrength(tools, "pick");
    const enemyProtection = strongestOf(enemyTools, ["frontline", "peel"]);
    if (ownPick >= 0.75 && enemyProtection < 0.5)
        edges.push(
            `${teamName} has pick access and the opponent lacks a strong assessed protection layer.`,
        );

    const ownZoneProviders = providerCount(tools, [
        "zone_control",
        "objective_control",
    ]);
    const enemyZoneProviders = providerCount(enemyTools, [
        "zone_control",
        "objective_control",
    ]);
    if (ownZoneProviders >= 2 && ownZoneProviders > enemyZoneProviders)
        edges.push(
            `${teamName} has the clearer assessed setup around neutral objectives.`,
        );

    return edges;
};

const planRequirements = (
    tools: CapabilityRead[],
    profiles: KnowledgeCoachingProfile[],
) => {
    const requirements: string[] = [];
    const engageProviders = providerCount(tools, ["engage"]);
    const diveProviders = providerCount(tools, ["dive"]);
    if (engageProviders >= 2 || diveProviders >= 2)
        requirements.push(
            diveProviders >= 2
                ? "Use one target call so the divers enter together and the backline can follow without splitting the fight."
                : "Call one target and synchronize engage, follow-up and damage before committing.",
        );
    const pokeProviders = providerCount(tools, ["poke"]);
    const siegeProviders = providerCount(tools, ["siege"]);
    if (pokeProviders >= 2 || siegeProviders >= 2)
        requirements.push(
            "Prepare waves and vision first; preserve spacing until the opponent is low enough to concede space.",
        );
    const setupProviders = providerCount(tools, [
        "zone_control",
        "objective_control",
    ]);
    if (setupProviders >= 2)
        requirements.push(
            "Arrive before the objective, clear entrances and make the opponent walk into controlled terrain.",
        );
    const mapPressureProviders = providerCount(tools, [
        "side_lane_pressure",
        "global_pressure",
    ]);
    if (mapPressureProviders >= 2)
        requirements.push(
            "Synchronize side waves with the four-player unit so map pressure does not become an outnumbered fight.",
        );
    if (
        profiles.some((profile) =>
            ["mid_late", "late"].includes(profile.power_curve),
        )
    )
        requirements.push(
            "Protect the later-scaling carries' income and avoid conceding the game before their listed breakpoints.",
        );
    if (profiles.filter((profile) => profile.resource_demand === "high").length >= 2)
        requirements.push(
            "Assign farm priority explicitly; the high-income champions cannot all receive the same waves and camps.",
        );
    return requirements.slice(0, 3);
};

const matchupRisks = (
    tools: CapabilityRead[],
    enemyTools: CapabilityRead[],
) => {
    const risks: string[] = [];
    const protection = strongestOf(tools, ["peel", "disengage", "anti_dive"]);
    if (strongestOf(enemyTools, ["engage", "dive"]) >= 0.6 && protection < 0.6)
        risks.push(
            "The opponent can reach the backline while this draft lacks a strong assessed protection layer.",
        );
    const rangeAnswer = strongestOf(tools, ["engage", "dive", "sustain"]);
    if (strongestOf(enemyTools, ["poke", "siege"]) >= 0.6 && rangeAnswer < 0.6)
        risks.push(
            "Enemy poke or siege can control the setup unless this team finds an unassessed flank or hard engage.",
        );
    if (
        capabilityStrength(tools, "poke") >= 0.6 &&
        capabilityStrength(enemyTools, "sustain") >= 0.6
    )
        risks.push(
            "Enemy sustain can erase poke between rotations and remove the health advantage before objectives.",
        );
    if (
        strongestOf(tools, ["pick", "dive"]) >= 0.6 &&
        strongestOf(enemyTools, ["frontline", "peel", "anti_dive"]) >= 0.6
    )
        risks.push(
            "The opponent has assessed protection that can deny the first pick or dive target.",
        );
    if (
        strongestOf(enemyTools, ["side_lane_pressure", "global_pressure"]) >= 0.6 &&
        strongestOf(tools, ["wave_clear", "global_pressure"]) < 0.6
    )
        risks.push(
            "The opponent can stretch the map faster than this draft can stabilize waves or match numbers.",
        );
    return risks.slice(0, 3);
};

function TextCoachList(props: {
    title: string;
    tone: "requirement" | "risk";
    items: string[];
}) {
    const isRisk = () => props.tone === "risk";
    return (
        <div>
            <p
                class="text-[10px] font-bold uppercase tracking-widest"
                classList={{
                    "text-sky-300": !isRisk(),
                    "text-amber-300": isRisk(),
                }}
            >
                {props.title}
            </p>
            <Show
                when={props.items.length}
                fallback={
                    <p class="mt-2 text-sm text-neutral-500">
                        No supported signal is strong enough to call yet.
                    </p>
                }
            >
                <ul class="mt-2 space-y-2 text-sm text-neutral-300">
                    <For each={props.items}>
                        {(item) => (
                            <li class="flex gap-2">
                                <span
                                    classList={{
                                        "text-sky-400": !isRisk(),
                                        "text-amber-400": isRisk(),
                                    }}
                                >
                                    {isRisk() ? "!" : "→"}
                                </span>
                                <span>{item}</span>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </div>
    );
}

function CoachList(props: {
    title: string;
    tone: "win" | "risk";
    tools: CapabilityRead[];
    term: (key: string) => string;
}) {
    const isWin = () => props.tone === "win";
    return (
        <div>
            <p
                class="text-[10px] font-bold uppercase tracking-widest"
                classList={{
                    "text-emerald-300": isWin(),
                    "text-amber-300": !isWin(),
                }}
            >
                {props.title}
            </p>
            <Show
                when={props.tools.length}
                fallback={
                    <p class="mt-2 text-sm text-neutral-500">
                        Not enough assessed tools yet.
                    </p>
                }
            >
                <ul class="mt-2 space-y-2 text-sm text-neutral-300">
                    <For each={props.tools}>
                        {(tool) => (
                            <li class="flex gap-2">
                                <span
                                    classList={{
                                        "text-emerald-400": isWin(),
                                        "text-amber-400": !isWin(),
                                    }}
                                >
                                    {isWin() ? "+" : "!"}
                                </span>
                                <span>
                                    {isWin()
                                        ? (CAPABILITY_COACHING[tool.capability]
                                              ?.winCondition ??
                                          `Use ${props.term(tool.capability)} as a primary team tool.`)
                                        : (CAPABILITY_COACHING[tool.capability]
                                              ?.risk ??
                                          `The ${props.term(tool.capability)} plan depends on coordinated execution.`)}
                                    <Show when={isWin()}>
                                        <small class="mt-0.5 block text-neutral-500">
                                            {props.term(tool.capability)} ·{" "}
                                            {tool.champions.join(", ")}
                                        </small>
                                    </Show>
                                </span>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </div>
    );
}

export default function RiftTheoryStrategy() {
    const { t, term } = useI18n();
    const { config } = useUser();
    const { allyTeam, opponentTeam } = useDraft();
    const { allyDraftAnalysis } = useDraftAnalysis();
    const { dataset } = useDataset();
    const { knowledge, championForKey, championNameFor, sourceForKey } =
        useRiftTheoryKnowledge();
    const percent = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"), {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
    const teams = createMemo(() =>
        [
            { name: t("ally"), team: "blue" as const, picks: allyTeam },
            { name: t("opponent"), team: "red" as const, picks: opponentTeam },
        ].map((team) => ({
            name: team.name,
            team: team.team,
            picks: team.picks
                .filter((pick) => pick.championKey !== undefined)
                .map((pick) => {
                    const championKey = pick.championKey!;
                    const champion = dataset()?.championData[championKey];
                    const knowledgeChampion = championForKey(championKey);
                    const name = champion?.name ?? "Unknown champion";
                    const role =
                        pick.role === undefined
                            ? undefined
                            : roleNames[pick.role];
                    const colorEvidence = effectiveColorEvidence(
                        knowledgeChampion,
                        role,
                    );
                    return {
                        championKey,
                        name:
                            championNameFor(championKey, config.language) ??
                            (champion ? championName(champion, config) : name),
                        role,
                        knowledgeChampion,
                        strategy: colorEvidence?.profile,
                        strategyScope: colorEvidence?.scope,
                        capabilities:
                            knowledgeChampion?.capabilities.filter(
                                (profile) => profile.role === role,
                            ) ?? [],
                        roleTraits:
                            knowledgeChampion?.roleTraits.filter(
                                (trait) => trait.role === role,
                            ) ?? [],
                        coaching: knowledgeChampion?.coachingProfiles?.find(
                            (profile) => profile.role === role,
                        ),
                    };
                }),
        })),
    );
    const interactionFindings = createMemo(() =>
        evaluateDraftInteractions(
            teams().flatMap((team) =>
                team.picks
                    .filter((pick) => pick.role !== undefined)
                    .map((pick) => ({
                        championKey: pick.championKey,
                        championName: pick.name,
                        role: pick.role!,
                        team: team.team,
                        traits: pick.roleTraits.map((trait) => ({
                            trait: trait.trait,
                            level: trait.level,
                        })),
                    })),
            ),
            (knowledge()?.interactionRules ?? []).map(toInteractionRule),
        ),
    );
    const hasRolelessPicks = createMemo(() =>
        teams().some((team) =>
            team.picks.some((pick) => pick.role === undefined),
        ),
    );
    const teamReads = createMemo(() =>
        teams().map((team) => {
            const colors = new Map<
                string,
                { main: number; off: number; champions: string[] }
            >();
            const capabilities = new Map<
                string,
                { total: number; count: number; champions: string[] }
            >();
            let assessedPicks = 0;
            let capabilityAssessedPicks = 0;

            for (const pick of team.picks) {
                if (pick.strategy) {
                    assessedPicks += 1;
                    for (const color of pick.strategy.colors) {
                        const current = colors.get(color.color) ?? {
                            main: 0,
                            off: 0,
                            champions: [],
                        };
                        current[color.assignment] += 1;
                        if (!current.champions.includes(pick.name))
                            current.champions.push(pick.name);
                        colors.set(color.color, current);
                    }
                }
                for (const capability of pick.capabilities) {
                    const current = capabilities.get(capability.capability) ?? {
                        total: 0,
                        count: 0,
                        champions: [],
                    };
                    current.total += capability.strength;
                    current.count += 1;
                    if (!current.champions.includes(pick.name))
                        current.champions.push(pick.name);
                    capabilities.set(capability.capability, current);
                }
                if (pick.capabilities.length) capabilityAssessedPicks += 1;
            }

            const colorRead = [...colors.entries()]
                .map(([color, value]) => ({ color, ...value }))
                .sort(
                    (left, right) =>
                        right.main - left.main ||
                        right.off - left.off ||
                        left.color.localeCompare(right.color),
                );
            const capabilityRead = [...capabilities.entries()]
                .map(([capability, value]) => ({
                    capability,
                    strength: value.total / value.count,
                    champions: value.champions,
                }))
                .sort((left, right) => right.strength - left.strength);
            const planTools = primaryPlanTools(capabilityRead);
            const coachingProfiles = team.picks.flatMap((pick) =>
                pick.coaching ? [pick.coaching] : [],
            );
            const highResourceChampions = team.picks
                .filter((pick) => pick.coaching?.resource_demand === "high")
                .map((pick) => pick.name);
            const damageResources = assessDamageResources(team.picks);

            return {
                ...team,
                assessedPicks,
                capabilityAssessedPicks,
                colors: colorRead,
                capabilities: capabilityRead,
                planTools,
                coachingProfiles,
                highResourceChampions,
                damageResources,
                powerCurve: assessedPowerCurveRead(coachingProfiles, colorRead),
                execution: assessedExecutionRead(
                    coachingProfiles,
                    colorRead,
                    capabilityRead,
                ),
                conditions: [
                    ...unresolvedConditions(
                        capabilityRead,
                        capabilityAssessedPicks,
                        team.picks.length,
                    ),
                    ...coachingQuestions(
                        coachingProfiles,
                        highResourceChampions,
                    ),
                ].slice(0, 4),
                requirements: planRequirements(
                    capabilityRead,
                    coachingProfiles,
                ),
            };
        }),
    );

    const coachRead = createMemo(() => {
        const [blue, red] = teamReads();
        if (!blue || !red) return undefined;
        const blueEdges = matchupEdges(
            blue.name,
            blue.capabilities,
            red.capabilities,
        );
        const redEdges = matchupEdges(
            red.name,
            red.capabilities,
            blue.capabilities,
        );
        const blueRisks = matchupRisks(blue.capabilities, red.capabilities);
        const redRisks = matchupRisks(red.capabilities, blue.capabilities);
        const bluePlans = buildCompositionPlans(
            blue.capabilities,
            red.capabilities,
            red.picks,
        );
        const redPlans = buildCompositionPlans(
            red.capabilities,
            blue.capabilities,
            blue.picks,
        );
        const blueThemeCohesion = assessThemeCohesion(
            blue.picks,
            bluePlans[0],
        );
        const redThemeCohesion = assessThemeCohesion(
            red.picks,
            redPlans[0],
        );
        const blueJobs = planJobs(blue.picks, bluePlans[0]);
        const redJobs = planJobs(red.picks, redPlans[0]);
        const coverage = Math.min(
            blue.capabilityAssessedPicks / 5,
            red.capabilityAssessedPicks / 5,
        );
        const blueReliability = assessPlanReliability(
            {
                ...blue,
                totalPicks: blue.picks.length,
                themeCohesionScore:
                    blueThemeCohesion.calibrationFeature ?? undefined,
            },
            bluePlans,
            blueEdges,
            blueRisks,
        );
        const redReliability = assessPlanReliability(
            {
                ...red,
                totalPicks: red.picks.length,
                themeCohesionScore:
                    redThemeCohesion.calibrationFeature ?? undefined,
            },
            redPlans,
            redEdges,
            redRisks,
        );
        const strategySignal = strategicLean(
            blueReliability,
            redReliability,
            blueThemeCohesion,
            redThemeCohesion,
            coverage,
        );
        const calibrationVector = buildStrategyCalibrationVector(
            {
                reliability: blueReliability,
                theme: blueThemeCohesion,
                damageResources: blue.damageResources,
                supportedRiskCount: blueRisks.length,
                structuralConditionCount: blue.conditions.filter(
                    (condition) => condition.kind === "structural",
                ).length,
            },
            {
                reliability: redReliability,
                theme: redThemeCohesion,
                damageResources: red.damageResources,
                supportedRiskCount: redRisks.length,
                structuralConditionCount: red.conditions.filter(
                    (condition) => condition.kind === "structural",
                ).length,
            },
        );
        const verdict =
            strategySignal.direction === "withheld"
                ? "Too early to call"
                : strategySignal.direction === "blue"
                  ? `${blue.name} has the more reliable execution plan`
                  : strategySignal.direction === "red"
                    ? `${red.name} has the more reliable execution plan`
                    : "Both plans remain similarly conditional";
        const factors = decidingFactors(
            blue,
            red,
            bluePlans,
            redPlans,
            blueJobs,
            redJobs,
            blueRisks,
            redRisks,
        );
        const statisticalWinrate = allyDraftAnalysis()?.winrate;
        const statisticalLean =
            statisticalWinrate === undefined
                ? "unknown"
                : statisticalWinrate >= 0.505
                  ? "blue"
                  : statisticalWinrate <= 0.495
                    ? "red"
                    : "even";
        const strategicDirection = strategySignal.direction;
        const modelRelationship =
            strategicDirection === "withheld"
                ? "Strategic comparison is withheld until every selected role has capability evidence."
                : statisticalLean === "unknown"
                ? "Statistical comparison is not available for this draft."
                : statisticalLean === "even" && strategicDirection === "even"
                  ? "Both models see a close draft, but for different reasons."
                  : statisticalLean === strategicDirection
                    ? "The statistical estimate and strategic read lean in the same direction."
                    : statisticalLean === "even"
                      ? "Statistics are close, while plan reliability creates a strategic lean."
                      : strategicDirection === "even"
                        ? "Statistics lean to one side, while the strategic plans remain similarly conditional."
                        : "The statistical estimate and strategic read disagree; treat this as a review flag, not a result to average blindly.";
        return {
            blue,
            red,
            blueEdges,
            redEdges,
            blueRisks,
            redRisks,
            bluePlans,
            redPlans,
            blueReliability,
            redReliability,
            coverage,
            verdict,
            factors,
            statisticalWinrate,
            modelRelationship,
            strategySignal,
            calibrationVector,
        };
    });

    return (
        <section class="p-5 xl:p-8 overflow-y-auto font-body">
            <h2 class="text-2xl font-semibold mb-2">
                RiftTheory — {t("strategy")}
            </h2>
            <p class="text-sm text-neutral-400 mb-5">{t("strategyIntro")}</p>
            <Show when={knowledge.loading}>
                <div
                    class="rounded border border-neutral-700 bg-primary p-3 text-sm text-neutral-400 mb-4"
                    role="status"
                >
                    {t("knowledgeLoading")}
                </div>
            </Show>
            <Show when={knowledge.error}>
                <div
                    class="rounded border border-red-800 bg-red-950/20 p-3 text-sm text-red-200 mb-4"
                    role="alert"
                >
                    {t("knowledgeError")}
                </div>
            </Show>
            <Show when={coachRead()}>
                {(read) => (
                    <section class="mb-7 rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 via-primary to-primary p-4 xl:p-5">
                        <div class="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                                    Coach read · experimental
                                </p>
                                <h3 class="mt-1 text-xl font-semibold">
                                    {read().verdict}
                                </h3>
                                <p class="mt-1 max-w-3xl text-sm text-neutral-400">
                                    An explainable composition read, not a win
                                    probability. It uses only the role, color
                                    and capability evidence currently available.
                                </p>
                            </div>
                            <div class="min-w-44 rounded-lg border border-neutral-700 bg-canvas/70 px-3 py-2">
                                <div class="flex justify-between text-xs text-neutral-400">
                                    <span>Evidence coverage</span>
                                    <strong class="text-neutral-200">
                                        {Math.round(read().coverage * 100)}%
                                    </strong>
                                </div>
                                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                                    <div
                                        class="h-full rounded-full bg-accent"
                                        style={{
                                            width: `${read().coverage * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <Show
                            when={
                                read().statisticalWinrate !== undefined &&
                                read().blue.picks.length === 5 &&
                                read().red.picks.length === 5
                            }
                        >
                            <div class="mt-4 rounded-lg border border-neutral-700 bg-canvas/50 p-3">
                                <div class="grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
                                    <div class="flex gap-2 text-xs">
                                        <span class="rounded border border-ally/40 bg-ally/10 px-2 py-1 text-ally">
                                            Statistical Blue {" "}
                                            {percent().format(
                                                read().statisticalWinrate!,
                                            )}
                                        </span>
                                        <span class="rounded border border-opponent/40 bg-opponent/10 px-2 py-1 text-opponent">
                                            Statistical Red {" "}
                                            {percent().format(
                                                1 - read().statisticalWinrate!,
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-xs font-semibold text-neutral-300">
                                            Statistical model × strategic model
                                        </p>
                                        <p class="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                                            {read().modelRelationship}
                                        </p>
                                        <p class="mt-1 text-[11px] leading-relaxed text-neutral-400">
                                            Strategy signal: {read().strategySignal.direction}
                                            {read().strategySignal.strength !== "none"
                                                ? ` · ${read().strategySignal.strength}`
                                                : ""}
                                            {" · "}Winrate adjustment: not applied
                                        </p>
                                        <p class="mt-1 text-[10px] leading-relaxed text-neutral-600">
                                            Calibration vector: {read().calibrationVector.readyForOutcomeCalibration
                                                ? "complete"
                                                : `${Math.round(read().calibrationVector.coverage * 100)}% evidence coverage`}
                                            . Awaiting validated 5v5 outcome weights.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Show>

                        <div class="mt-4 grid gap-2 sm:grid-cols-2">
                            <For
                                each={[
                                    {
                                        team: read().blue,
                                        reliability: read().blueReliability,
                                    },
                                    {
                                        team: read().red,
                                        reliability: read().redReliability,
                                    },
                                ]}
                            >
                                {(entry) => (
                                    <div class="rounded-lg border border-neutral-700 bg-canvas/50 px-3 py-2.5">
                                        <div class="flex items-center justify-between gap-2">
                                            <span
                                                class="text-xs font-semibold"
                                                classList={{
                                                    "text-ally":
                                                        entry.team.team ===
                                                        "blue",
                                                    "text-opponent":
                                                        entry.team.team ===
                                                        "red",
                                                }}
                                            >
                                                {entry.team.name} plan
                                                reliability
                                            </span>
                                            <strong
                                                class="rounded px-2 py-0.5 text-xs"
                                                classList={{
                                                    "bg-emerald-950 text-emerald-300":
                                                        entry.reliability
                                                            .label ===
                                                        "Coherent",
                                                    "bg-amber-950 text-amber-300":
                                                        entry.reliability
                                                            .label ===
                                                        "Conditional",
                                                    "bg-red-950 text-red-300":
                                                        entry.reliability
                                                            .label ===
                                                        "Fragile",
                                                    "bg-sky-950 text-sky-300":
                                                        entry.reliability
                                                            .label ===
                                                        "Unconfirmed",
                                                }}
                                            >
                                                {entry.reliability.label}
                                            </strong>
                                        </div>
                                        <ul class="mt-2 space-y-1 text-[11px] text-neutral-500">
                                            <For
                                                each={
                                                    entry.reliability.reasons
                                                }
                                            >
                                                {(reason) => (
                                                    <li>• {reason}</li>
                                                )}
                                            </For>
                                        </ul>
                                    </div>
                                )}
                            </For>
                        </div>

                        <Show when={read().factors.length}>
                            <div class="mt-4 rounded-lg border border-neutral-700 bg-primary/50 p-3">
                                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                                    What decides this draft
                                </p>
                                <div class="mt-2 grid gap-2 lg:grid-cols-2">
                                    <For each={read().factors}>
                                        {(factor, index) => (
                                            <div class="flex gap-2 rounded-md bg-canvas/50 p-2.5">
                                                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/40 text-[10px] font-bold text-accent">
                                                    {index() + 1}
                                                </span>
                                                <span>
                                                    <strong class="block text-xs text-neutral-200">
                                                        {factor.title}
                                                    </strong>
                                                    <span class="mt-1 block text-[11px] leading-relaxed text-neutral-500">
                                                        {factor.detail}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>

                        <div class="mt-5 grid gap-3 xl:grid-cols-2">
                            <For each={[read().blue, read().red]}>
                                {(team) => {
                                    const edges = () =>
                                        team.team === "blue"
                                            ? read().blueEdges
                                            : read().redEdges;
                                    const risks = () =>
                                        team.team === "blue"
                                            ? read().blueRisks
                                            : read().redRisks;
                                    const plans = () =>
                                        team.team === "blue"
                                            ? read().bluePlans
                                            : read().redPlans;
                                    const primaryPlan = () => plans()[0];
                                    const jobs = () =>
                                        team.team === "blue"
                                            ? read().blueJobs
                                            : read().redJobs;
                                    const timeline = () =>
                                        buildGameTimeline(
                                            team.picks,
                                            primaryPlan(),
                                        );
                                    const themeCohesion = () =>
                                        team.team === "blue"
                                            ? read().blueThemeCohesion
                                            : read().redThemeCohesion;
                                    return (
                                        <article class="rounded-lg border border-neutral-700 bg-canvas/60 p-4">
                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p
                                                        class="text-xs font-semibold uppercase tracking-wider"
                                                        classList={{
                                                            "text-ally":
                                                                team.team ===
                                                                "blue",
                                                            "text-opponent":
                                                                team.team ===
                                                                "red",
                                                        }}
                                                    >
                                                        {team.name}
                                                    </p>
                                                    <h4 class="mt-1 text-lg font-semibold capitalize">
                                                        {describeIdentity(
                                                            team.colors,
                                                            team.planTools,
                                                        )}
                                                    </h4>
                                                </div>
                                                <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-400">
                                                    {team.picks.length}/5 picks
                                                </span>
                                            </div>

                                            <Show when={primaryPlan()}>
                                                {(plan) => (
                                                    <div class="mt-4 rounded-lg border border-sky-900/60 bg-sky-950/10 p-4">
                                                        <div class="flex flex-wrap items-start justify-between gap-2">
                                                            <div>
                                                                <p class="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                                                                    Primary execution plan
                                                                </p>
                                                                <h5 class="mt-1 text-base font-semibold text-neutral-100">
                                                                    {plan().title}
                                                                </h5>
                                                            </div>
                                                            <Show
                                                                when={
                                                                    plans()[1]
                                                                }
                                                            >
                                                                <span class="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-400">
                                                                    Alternative: {plans()[1].title}
                                                                </span>
                                                            </Show>
                                                        </div>
                                                        <p class="mt-2 text-xs text-neutral-400">
                                                            {plan().target}
                                                        </p>
                                                        <ol class="mt-3 grid gap-2 md:grid-cols-2">
                                                            <For
                                                                each={
                                                                    plan()
                                                                        .stages
                                                                }
                                                            >
                                                                {(stage, index) => (
                                                                    <li class="flex gap-2 rounded-md border border-neutral-800 bg-canvas/60 p-2.5">
                                                                        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-950 text-[10px] font-bold text-sky-300">
                                                                            {index() + 1}
                                                                        </span>
                                                                        <span>
                                                                            <strong class="block text-xs text-neutral-200">
                                                                                {stage.label}
                                                                            </strong>
                                                                            <span class="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">
                                                                                {stage.detail}
                                                                            </span>
                                                                        </span>
                                                                    </li>
                                                                )}
                                                            </For>
                                                        </ol>
                                                        <div class="mt-3 grid gap-2 md:grid-cols-2">
                                                            <p class="rounded-md bg-emerald-950/15 p-2.5 text-xs leading-relaxed text-neutral-400">
                                                                <strong class="text-emerald-300">
                                                                    Required state: {" "}
                                                                </strong>
                                                                {plan().condition}
                                                            </p>
                                                            <p class="rounded-md bg-amber-950/15 p-2.5 text-xs leading-relaxed text-neutral-400">
                                                                <strong class="text-amber-300">
                                                                    Failure state: {" "}
                                                                </strong>
                                                                {plan().failure}
                                                            </p>
                                                        </div>
                                                        <div class="mt-3 grid gap-2 lg:grid-cols-3">
                                                            <For each={timeline()}>
                                                                {(step, index) => (
                                                                    <div class="rounded-md border border-neutral-800 bg-primary/50 p-3">
                                                                        <p class="text-[10px] font-bold uppercase tracking-widest text-accent">
                                                                            {index() + 1}. {step.phase}
                                                                        </p>
                                                                        <p class="mt-1.5 text-xs leading-relaxed text-neutral-300">
                                                                            {step.objective}
                                                                        </p>
                                                                        <p class="mt-1 text-[11px] leading-relaxed text-neutral-500">
                                                                            {step.checkpoint}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </For>
                                                        </div>
                                                        <div class="mt-3 rounded-md border border-neutral-800 bg-primary/50 p-3">
                                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                                    Theme cohesion
                                                                </p>
                                                                <strong class="text-xs text-neutral-200">
                                                                    {themeCohesion().label}
                                                                    {themeCohesion().score !== null
                                                                        ? ` · ${Math.round(themeCohesion().score! * 100)}%`
                                                                        : ""}
                                                                </strong>
                                                            </div>
                                                            <div class="mt-2 flex flex-wrap gap-1.5">
                                                                <For each={themeCohesion().members}>
                                                                    {(member) => (
                                                                        <span
                                                                            class="rounded border px-2 py-1 text-[10px]"
                                                                            classList={{
                                                                                "border-emerald-800 bg-emerald-950/20 text-emerald-300": member.fit === "core",
                                                                                "border-sky-800 bg-sky-950/20 text-sky-300": member.fit === "enabler",
                                                                                "border-amber-800 bg-amber-950/20 text-amber-300": member.fit === "unclear",
                                                                                "border-neutral-700 text-neutral-500": member.fit === "unknown",
                                                                            }}
                                                                            title={member.reason}
                                                                        >
                                                                            {member.champion} · {member.fit}
                                                                        </span>
                                                                    )}
                                                                </For>
                                                            </div>
                                                            <p class="mt-2 text-[11px] leading-relaxed text-neutral-500">
                                                                Core picks execute the primary plan; enablers create access, control or protection. Unclear fit is a review flag, not an automatic champion penalty. Winrate weight remains uncalibrated.
                                                            </p>
                                                        </div>
                                                        <details class="mt-3 border-t border-sky-900/40 pt-3">
                                                            <summary class="cursor-pointer text-xs font-semibold text-sky-200">
                                                                Player responsibilities ({jobs().length})
                                                            </summary>
                                                            <div class="mt-3 grid gap-2 lg:grid-cols-2">
                                                                <For each={jobs()}>
                                                                    {(job) => (
                                                                        <div class="rounded-md border border-neutral-800 bg-canvas/60 p-3">
                                                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                                                <strong class="text-xs text-neutral-200">
                                                                                    {job.champion}{" "}
                                                                                    <span class="font-normal uppercase text-neutral-500">
                                                                                        {job.role
                                                                                            ? term(job.role)
                                                                                            : "?"}
                                                                                    </span>
                                                                                </strong>
                                                                                <span class="rounded bg-sky-950 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                                                                                    {job.assignment}
                                                                                </span>
                                                                            </div>
                                                                            <dl class="mt-2 grid gap-1 text-[11px] leading-relaxed">
                                                                                <div>
                                                                                    <dt class="inline font-semibold text-neutral-400">
                                                                                        Before: {" "}
                                                                                    </dt>
                                                                                    <dd class="inline text-neutral-500">
                                                                                        {job.before}
                                                                                    </dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt class="inline font-semibold text-neutral-400">
                                                                                        During: {" "}
                                                                                    </dt>
                                                                                    <dd class="inline text-neutral-500">
                                                                                        {job.during}
                                                                                    </dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt class="inline font-semibold text-amber-400">
                                                                                        Avoid: {" "}
                                                                                    </dt>
                                                                                    <dd class="inline text-neutral-500">
                                                                                        {job.avoid}
                                                                                    </dd>
                                                                                </div>
                                                                            </dl>
                                                                        </div>
                                                                    )}
                                                                </For>
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}
                                            </Show>

                                            <div class="mt-4 grid gap-4 lg:grid-cols-3">
                                                <CoachList
                                                    title="How this draft wins"
                                                    tone="win"
                                                    tools={team.planTools}
                                                    term={term}
                                                />
                                                <TextCoachList
                                                    title="Must achieve"
                                                    tone="requirement"
                                                    items={team.requirements}
                                                />
                                                <TextCoachList
                                                    title="How the opponent breaks it"
                                                    tone="risk"
                                                    items={risks()}
                                                />
                                            </div>

                                            <div class="mt-4 grid gap-2 border-t border-neutral-800 pt-3 sm:grid-cols-2 xl:grid-cols-3">
                                                <div class="rounded-md bg-primary/70 p-3">
                                                    <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                        Power curve signal
                                                    </p>
                                                    <p class="mt-1 text-sm font-semibold text-neutral-200">
                                                        {team.powerCurve.label}
                                                    </p>
                                                    <p class="mt-1 text-xs leading-relaxed text-neutral-500">
                                                        {team.powerCurve.detail}
                                                    </p>
                                                </div>
                                                <div class="rounded-md bg-primary/70 p-3">
                                                    <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                        Execution demand
                                                    </p>
                                                    <p class="mt-1 text-sm font-semibold text-neutral-200">
                                                        {team.execution.label}
                                                    </p>
                                                    <p class="mt-1 text-xs leading-relaxed text-neutral-500">
                                                        {team.execution.detail}
                                                    </p>
                                                </div>
                                                <div class="rounded-md bg-primary/70 p-3 sm:col-span-2 xl:col-span-1">
                                                    <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                        Damage & resources
                                                    </p>
                                                    <Show
                                                        when={
                                                            team.damageResources
                                                                .coverage > 0
                                                        }
                                                        fallback={
                                                            <p class="mt-1 text-xs text-neutral-500">
                                                                Not assessed yet
                                                            </p>
                                                        }
                                                    >
                                                        <p class="mt-1 text-sm font-semibold text-neutral-200">
                                                            {team.damageResources.damageLabel}
                                                        </p>
                                                        <p class="mt-1 text-xs leading-relaxed text-neutral-500">
                                                            {team.damageResources.damageDetail}
                                                        </p>
                                                        <p class="mt-2 text-xs font-semibold text-neutral-300">
                                                            {team.damageResources.resourceLabel}
                                                        </p>
                                                        <p class="mt-1 text-xs leading-relaxed text-neutral-500">
                                                            {team.damageResources.resourceDetail}
                                                        </p>
                                                    </Show>
                                                </div>
                                            </div>

                                            <Show
                                                when={
                                                    team.coachingProfiles.length
                                                }
                                            >
                                                <details class="mt-3 rounded-md border border-neutral-800 bg-primary/40 p-3">
                                                    <summary class="cursor-pointer text-xs font-semibold text-sky-200">
                                                        Champion breakpoints and
                                                        role demands (
                                                        {
                                                            team
                                                                .coachingProfiles
                                                                .length
                                                        }
                                                        /{team.picks.length})
                                                    </summary>
                                                    <div class="mt-3 grid gap-2">
                                                        <For
                                                            each={team.picks.filter(
                                                                (pick) =>
                                                                    pick.coaching,
                                                            )}
                                                        >
                                                            {(pick) => (
                                                                <div class="rounded border border-neutral-800 bg-canvas/50 p-3">
                                                                    <div class="flex flex-wrap items-center gap-2 text-xs">
                                                                        <strong class="text-neutral-200">
                                                                            {
                                                                                pick.name
                                                                            }{" "}
                                                                            ·{" "}
                                                                            {pick.role
                                                                                ? term(
                                                                                      pick.role,
                                                                                  )
                                                                                : "?"}
                                                                        </strong>
                                                                        <span class="rounded bg-neutral-800 px-1.5 py-0.5 capitalize text-neutral-400">
                                                                            {pick.coaching!.damage_focus.replaceAll(
                                                                                "_",
                                                                                " ",
                                                                            )}
                                                                        </span>
                                                                        <span class="rounded bg-neutral-800 px-1.5 py-0.5 capitalize text-neutral-400">
                                                                            {pick.coaching!.power_curve.replaceAll(
                                                                                "_",
                                                                                "–",
                                                                            )}
                                                                        </span>
                                                                        <span class="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-400">
                                                                            execution{" "}
                                                                            {
                                                                                pick
                                                                                    .coaching!
                                                                                    .execution_demand
                                                                            }
                                                                            /5
                                                                        </span>
                                                                    </div>
                                                                    <p class="mt-2 text-xs text-neutral-400">
                                                                        {pick.coaching!.spike_notes.join(
                                                                            " · ",
                                                                        )}
                                                                    </p>
                                                                    <p class="mt-1 text-[11px] leading-relaxed text-neutral-600">
                                                                        {
                                                                            pick
                                                                                .coaching!
                                                                                .reasoning
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </For>
                                                    </div>
                                                </details>
                                            </Show>

                                            <Show when={team.conditions.length}>
                                                <details class="mt-3 rounded-md border border-amber-900/50 bg-amber-950/10 p-3">
                                                    <summary class="cursor-pointer text-xs font-semibold text-amber-200">
                                                        Unresolved conditions (
                                                        {team.conditions.length})
                                                    </summary>
                                                    <ul class="mt-2 space-y-1.5 text-xs text-neutral-400">
                                                        <For
                                                            each={
                                                                team.conditions
                                                            }
                                                        >
                                                            {(condition) => (
                                                                <li class="rounded border border-neutral-800 bg-canvas/40 p-2.5">
                                                                    <div class="flex items-start gap-2">
                                                                        <span
                                                                            class="mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                                                            classList={{
                                                                                "bg-amber-950 text-amber-300":
                                                                                    condition.kind ===
                                                                                    "structural",
                                                                                "bg-sky-950 text-sky-300":
                                                                                    condition.kind ===
                                                                                    "coverage",
                                                                            }}
                                                                        >
                                                                            {condition.kind}
                                                                        </span>
                                                                        <span>
                                                                            <strong class="block text-neutral-300">
                                                                                {condition.title}
                                                                            </strong>
                                                                            <span class="mt-1 block leading-relaxed text-neutral-500">
                                                                                {condition.consequence}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </li>
                                                            )}
                                                        </For>
                                                    </ul>
                                                    <p class="mt-2 text-[11px] text-neutral-600">
                                                        Structural conditions
                                                        reduce plan reliability;
                                                        coverage conditions only
                                                        reduce confidence.
                                                    </p>
                                                </details>
                                            </Show>

                                            <Show
                                                when={edges().length}
                                                fallback={
                                                    <p class="mt-4 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
                                                        No supported matchup
                                                        edge is strong enough to
                                                        call yet.
                                                    </p>
                                                }
                                            >
                                                <div class="mt-4 border-t border-neutral-800 pt-3">
                                                    <p class="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                                                        Answers into this
                                                        opponent
                                                    </p>
                                                    <For each={edges()}>
                                                        {(edge) => (
                                                            <p class="mt-2 text-sm text-neutral-300">
                                                                → {edge}
                                                            </p>
                                                        )}
                                                    </For>
                                                </div>
                                            </Show>
                                        </article>
                                    );
                                }}
                            </For>
                        </div>
                    </section>
                )}
            </Show>
            <section class="mb-7">
                <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                            Live draft read
                        </p>
                        <h3 class="mt-1 text-xl font-semibold">
                            What each composition is trying to do
                        </h3>
                    </div>
                    <p class="max-w-xl text-xs text-neutral-500">
                        Signals come only from assigned roles and labeled color
                        evidence. Role profiles override champion baselines;
                        missing coverage stays unknown.
                    </p>
                </div>
                <div class="grid gap-4 xl:grid-cols-2">
                    <For each={teamReads()}>
                        {(team) => (
                            <article
                                class="rounded-xl border border-neutral-700 bg-primary/70 p-4"
                                classList={{
                                    "border-l-4 border-l-ally":
                                        team.team === "blue",
                                    "border-l-4 border-l-opponent":
                                        team.team === "red",
                                }}
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <h4 class="text-lg font-semibold">
                                        {team.name}
                                    </h4>
                                    <span class="text-xs text-neutral-500">
                                        {team.assessedPicks}/{team.picks.length}{" "}
                                        color profiles
                                    </span>
                                </div>
                                <Show
                                    when={team.colors.length}
                                    fallback={
                                        <p class="mt-4 rounded-lg border border-dashed border-neutral-700 p-4 text-sm text-neutral-500">
                                            Add picks and assign roles to reveal
                                            a supported game plan.
                                        </p>
                                    }
                                >
                                    <div class="mt-4 grid gap-3">
                                        <For each={team.colors.slice(0, 3)}>
                                            {(color, index) => (
                                                <div
                                                    class={`rounded-lg border p-3 ${
                                                        COLOR_STYLE[
                                                            color.color
                                                        ] ??
                                                        "border-neutral-700 bg-canvas"
                                                    }`}
                                                >
                                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                                                {index() === 0
                                                                    ? "Primary signal"
                                                                    : "Supporting signal"}
                                                            </span>
                                                            <strong class="capitalize">
                                                                {term(
                                                                    color.color,
                                                                )}
                                                            </strong>
                                                        </div>
                                                        <span class="text-[11px] opacity-75">
                                                            {color.main} main
                                                            {color.off
                                                                ? ` · ${color.off} off`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                    <p class="mt-2 text-sm leading-relaxed text-neutral-200">
                                                        {
                                                            COLOR_PLAN[
                                                                color.color
                                                            ]?.plan
                                                        }
                                                    </p>
                                                    <p class="mt-1 text-xs leading-relaxed text-neutral-400">
                                                        Watch-out:{" "}
                                                        {
                                                            COLOR_PLAN[
                                                                color.color
                                                            ]?.risk
                                                        }
                                                    </p>
                                                    <p class="mt-2 text-[11px] text-neutral-500">
                                                        From:{" "}
                                                        {color.champions.join(
                                                            ", ",
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                                <Show when={team.capabilities.length}>
                                    <div class="mt-4 border-t border-neutral-800 pt-3">
                                        <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                                            Strongest assessed tools
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <For
                                                each={team.capabilities.slice(
                                                    0,
                                                    6,
                                                )}
                                            >
                                                {(capability) => (
                                                    <span
                                                        class="rounded-md border border-neutral-700 bg-canvas px-2 py-1 text-xs text-neutral-300"
                                                        title={`Supported by ${capability.champions.join(", ")}`}
                                                    >
                                                        {term(
                                                            capability.capability,
                                                        )}{" "}
                                                        · supported by{" "}
                                                        {
                                                            capability.champions
                                                                .length
                                                        }{" "}
                                                        {capability.champions
                                                            .length === 1
                                                            ? "champion"
                                                            : "champions"}
                                                    </span>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </article>
                        )}
                    </For>
                </div>
            </section>
            <div class="grid xl:grid-cols-2 gap-5">
                <For each={teams()}>
                    {(team) => (
                        <section>
                            <h3 class="text-lg font-semibold mb-3">
                                {team.name}
                            </h3>
                            <Show
                                when={team.picks.length}
                                fallback={
                                    <p class="text-sm text-neutral-500 border border-neutral-700 rounded p-4">
                                        {t("noPicks")}
                                    </p>
                                }
                            >
                                <For each={team.picks}>
                                    {(pick) => (
                                        <article class="rounded border border-neutral-700 bg-neutral-900 p-4 mb-4">
                                            <h4 class="text-lg font-semibold">
                                                {pick.name}{" "}
                                                <span class="text-xs font-normal text-neutral-400 uppercase">
                                                    {pick.role
                                                        ? term(pick.role)
                                                        : t("unresolved")}
                                                </span>
                                            </h4>
                                            <div class="my-3 space-y-2">
                                                <p class="text-[11px] uppercase tracking-wider text-neutral-500">
                                                    {t("observedRoles")}
                                                </p>
                                                <ObservedRoleBadges
                                                    champion={
                                                        pick.knowledgeChampion
                                                    }
                                                    selectedRole={pick.role}
                                                />
                                            </div>
                                            <p class="text-xs text-neutral-400 my-3">
                                                {t("capabilities")}:{" "}
                                                {pick.capabilities.length
                                                    ? pick.capabilities
                                                          .map((capability) =>
                                                              term(
                                                                  capability.capability,
                                                              ),
                                                          )
                                                          .join(", ")
                                                    : t("unassessed")}
                                            </p>
                                            <Show
                                                when={
                                                    pick.capabilities.length > 0
                                                }
                                            >
                                                <p class="text-xs text-neutral-500 mb-3">
                                                    {t("capabilitySource")}:{" "}
                                                    {[
                                                        ...new Set(
                                                            pick.capabilities.map(
                                                                (capability) =>
                                                                    sourceForKey(
                                                                        capability.source_key,
                                                                    )?.label ??
                                                                    capability.source_key,
                                                            ),
                                                        ),
                                                    ].join(", ")}
                                                </p>
                                            </Show>
                                            <Show when={pick.roleTraits.length}>
                                                <details class="mb-4 rounded border border-neutral-800 bg-neutral-950/30 p-3 text-xs">
                                                    <summary class="cursor-pointer text-neutral-300">
                                                        {t("interactionTraits")}
                                                    </summary>
                                                    <p class="mt-2 text-neutral-500">
                                                        {t("traitScale")}
                                                    </p>
                                                    <div class="mt-3 grid gap-3">
                                                        <For
                                                            each={
                                                                pick.roleTraits
                                                            }
                                                        >
                                                            {(trait) => {
                                                                const source =
                                                                    () =>
                                                                        sourceForKey(
                                                                            trait.source_key,
                                                                        );
                                                                return (
                                                                    <div class="border-l-2 border-neutral-700 pl-3">
                                                                        <p class="text-neutral-200">
                                                                            {term(
                                                                                trait.trait,
                                                                            )}{" "}
                                                                            <span class="text-accent">
                                                                                {
                                                                                    trait.level
                                                                                }
                                                                                /5
                                                                            </span>
                                                                        </p>
                                                                        <p
                                                                            lang="en"
                                                                            class="mt-1 leading-relaxed text-neutral-400"
                                                                        >
                                                                            {
                                                                                trait.reasoning
                                                                            }
                                                                        </p>
                                                                        <For
                                                                            each={
                                                                                trait.conditions
                                                                            }
                                                                        >
                                                                            {(
                                                                                condition,
                                                                            ) => (
                                                                                <p
                                                                                    lang="en"
                                                                                    class="mt-1 text-neutral-500"
                                                                                >
                                                                                    {
                                                                                        condition
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </For>
                                                                        <Show
                                                                            when={
                                                                                source()
                                                                                    ?.url
                                                                            }
                                                                        >
                                                                            {(
                                                                                url,
                                                                            ) => (
                                                                                <a
                                                                                    class="mt-1 inline-block text-neutral-500 underline hover:text-neutral-300"
                                                                                    href={url()}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                >
                                                                                    {source()
                                                                                        ?.label ??
                                                                                        trait.source_key}
                                                                                </a>
                                                                            )}
                                                                        </Show>
                                                                    </div>
                                                                );
                                                            }}
                                                        </For>
                                                    </div>
                                                </details>
                                            </Show>
                                            <Show
                                                when={pick.strategy}
                                                fallback={
                                                    <p class="text-sm text-neutral-400">
                                                        {t("noIdentity")}
                                                    </p>
                                                }
                                            >
                                                {(strategy) => (
                                                    <>
                                                        <div class="flex flex-wrap gap-3 text-sm mb-3">
                                                            <span class="border border-sky-700 bg-sky-950 rounded px-2 py-1">
                                                                {t(
                                                                    "mainColors",
                                                                )}
                                                                :{" "}
                                                                {profileColors(
                                                                    strategy(),
                                                                    "main",
                                                                )
                                                                    .map(term)
                                                                    .join(", ")}
                                                            </span>
                                                            <span class="border border-neutral-500 rounded px-2 py-1">
                                                                {t("offColors")}
                                                                :{" "}
                                                                {profileColors(
                                                                    strategy(),
                                                                    "off",
                                                                )
                                                                    .map(term)
                                                                    .join(
                                                                        ", ",
                                                                    ) ||
                                                                    t("none")}
                                                            </span>
                                                            <span class="text-amber-300 py-1">
                                                                {term(
                                                                    strategy()
                                                                        .review_status,
                                                                )}
                                                            </span>
                                                            <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-400">
                                                                {pick.strategyScope ===
                                                                "role"
                                                                    ? "Role profile"
                                                                    : "Champion baseline"}
                                                            </span>
                                                        </div>
                                                        <p class="text-xs text-neutral-500 mb-2">
                                                            {t(
                                                                "sourceLanguage",
                                                            )}
                                                        </p>
                                                        <p
                                                            lang="en"
                                                            class="text-sm text-neutral-300 leading-relaxed"
                                                        >
                                                            {
                                                                strategy()
                                                                    .reasoning
                                                            }
                                                        </p>
                                                        <details class="mt-4 text-xs text-neutral-400">
                                                            <summary class="cursor-pointer text-sky-300">
                                                                {t("evidence")}
                                                            </summary>
                                                            <p class="mt-2 break-words">
                                                                {sourceForKey(
                                                                    strategy()
                                                                        .source_key,
                                                                )?.label ??
                                                                    strategy()
                                                                        .source_key}
                                                            </p>
                                                            <p class="mt-2">
                                                                {t(
                                                                    "assessmentPatch",
                                                                )}
                                                                :{" "}
                                                                {profilePatch(
                                                                    strategy(),
                                                                ) === "unknown"
                                                                    ? t(
                                                                          "unknownPatch",
                                                                      )
                                                                    : profilePatch(
                                                                          strategy(),
                                                                      )}
                                                            </p>
                                                            <Show
                                                                when={
                                                                    strategy()
                                                                        .source_url
                                                                }
                                                            >
                                                                {(url) => (
                                                                    <a
                                                                        class="inline-block underline mt-2"
                                                                        href={url()}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        {t(
                                                                            "reference",
                                                                        )}
                                                                    </a>
                                                                )}
                                                            </Show>
                                                            <p class="mt-2">
                                                                {t(
                                                                    "accessCaveat",
                                                                )}
                                                            </p>
                                                        </details>
                                                    </>
                                                )}
                                            </Show>
                                        </article>
                                    )}
                                </For>
                            </Show>
                        </section>
                    )}
                </For>
            </div>
            <InteractionFindings
                findings={interactionFindings()}
                hasRolelessPicks={hasRolelessPicks()}
            />
            <p class="text-xs text-neutral-500 mt-5">{t("strategyCaveat")}</p>
        </section>
    );
}
