import { createMemo, For, Show } from "solid-js";
import { evaluateDraftInteractions } from "@draftgap/core/src/interaction/interaction-engine";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
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

type CapabilityRead = {
    capability: string;
    strength: number;
    champions: string[];
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

const draftQuestions = (tools: CapabilityRead[]) => {
    const questions: string[] = [];
    if (strongestOf(tools, ["engage", "pick"]) < 0.5)
        questions.push("How does this composition start a favorable fight?");
    if (strongestOf(tools, ["peel", "disengage", "anti_dive"]) < 0.5)
        questions.push(
            "Who protects the main damage source when the opponent commits?",
        );
    if (capabilityStrength(tools, "wave_clear") < 0.5)
        questions.push(
            "How does the team stabilize waves before an objective setup?",
        );
    if (capabilityStrength(tools, "frontline") < 0.5)
        questions.push(
            "Can the draft contest space without a conventional frontline?",
        );
    if (strongestOf(tools, ["zone_control", "objective_control"]) < 0.5)
        questions.push("What gives this team control of objective entrances?");
    return questions.slice(0, 3);
};

const coachingQuestions = (
    profiles: KnowledgeCoachingProfile[],
    highResourceChampions: string[],
) => {
    const questions: string[] = [];
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
        questions.push(
            "Can the opponent stack armor because the assessed damage is heavily physical?",
        );
    if (
        profiles.length >= 3 &&
        (damageCounts.get("magic") ?? 0) >= profiles.length - 1
    )
        questions.push(
            "Can the opponent stack magic resistance because the assessed damage is heavily magic?",
        );
    if (highResourceChampions.length >= 3)
        questions.push(
            `How is income allocated between ${highResourceChampions.join(", ")}?`,
        );
    return questions;
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
    const { dataset } = useDataset();
    const { knowledge, championForKey, championNameFor, sourceForKey } =
        useRiftTheoryKnowledge();
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
            const coachingProfiles = team.picks.flatMap((pick) =>
                pick.coaching ? [pick.coaching] : [],
            );
            const damageFocuses = [
                ...coachingProfiles.reduce((counts, profile) => {
                    counts.set(
                        profile.damage_focus,
                        (counts.get(profile.damage_focus) ?? 0) + 1,
                    );
                    return counts;
                }, new Map<string, number>()),
            ]
                .map(([focus, count]) => ({ focus, count }))
                .sort(
                    (left, right) =>
                        right.count - left.count ||
                        left.focus.localeCompare(right.focus),
                );
            const highResourceChampions = team.picks
                .filter((pick) => pick.coaching?.resource_demand === "high")
                .map((pick) => pick.name);

            return {
                ...team,
                assessedPicks,
                colors: colorRead,
                capabilities: capabilityRead,
                coachingProfiles,
                damageFocuses,
                highResourceChampions,
                powerCurve: assessedPowerCurveRead(coachingProfiles, colorRead),
                execution: assessedExecutionRead(
                    coachingProfiles,
                    colorRead,
                    capabilityRead,
                ),
                questions: [
                    ...draftQuestions(capabilityRead),
                    ...coachingQuestions(
                        coachingProfiles,
                        highResourceChampions,
                    ),
                ].slice(0, 4),
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
        const edgeDifference = blueEdges.length - redEdges.length;
        const coverage = Math.min(
            blue.assessedPicks / 5,
            red.assessedPicks / 5,
        );
        const verdict =
            coverage < 0.6
                ? "Too early to call"
                : edgeDifference >= 2
                  ? `${blue.name} has the clearer structural answers`
                  : edgeDifference <= -2
                    ? `${red.name} has the clearer structural answers`
                    : "No clear structural edge yet";
        return { blue, red, blueEdges, redEdges, coverage, verdict };
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

                        <div class="mt-5 grid gap-3 xl:grid-cols-2">
                            <For each={[read().blue, read().red]}>
                                {(team) => {
                                    const edges = () =>
                                        team.team === "blue"
                                            ? read().blueEdges
                                            : read().redEdges;
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
                                                            team.capabilities,
                                                        )}
                                                    </h4>
                                                </div>
                                                <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-400">
                                                    {team.picks.length}/5 picks
                                                </span>
                                            </div>

                                            <div class="mt-4 grid gap-4 md:grid-cols-2">
                                                <CoachList
                                                    title="How this draft wins"
                                                    tone="win"
                                                    tools={team.capabilities.slice(
                                                        0,
                                                        3,
                                                    )}
                                                    term={term}
                                                />
                                                <CoachList
                                                    title="What can punish it"
                                                    tone="risk"
                                                    tools={team.capabilities.slice(
                                                        0,
                                                        2,
                                                    )}
                                                    term={term}
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
                                                            team.damageFocuses
                                                                .length
                                                        }
                                                        fallback={
                                                            <p class="mt-1 text-xs text-neutral-500">
                                                                Not assessed yet
                                                            </p>
                                                        }
                                                    >
                                                        <p class="mt-1 text-sm font-semibold capitalize text-neutral-200">
                                                            {team.damageFocuses
                                                                .map(
                                                                    (entry) =>
                                                                        `${entry.focus.replaceAll("_", " ")} ${entry.count}`,
                                                                )
                                                                .join(" · ")}
                                                        </p>
                                                        <p class="mt-1 text-xs leading-relaxed text-neutral-500">
                                                            {team
                                                                .highResourceChampions
                                                                .length > 1
                                                                ? `Resource tension: ${team.highResourceChampions.join(", ")} all prefer high income.`
                                                                : team
                                                                        .highResourceChampions
                                                                        .length ===
                                                                    1
                                                                  ? `${team.highResourceChampions[0]} is the currently assessed high-income priority.`
                                                                  : "No assessed high-income conflict in the covered picks."}
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

                                            <Show when={team.questions.length}>
                                                <details class="mt-3 rounded-md border border-amber-900/50 bg-amber-950/10 p-3">
                                                    <summary class="cursor-pointer text-xs font-semibold text-amber-200">
                                                        Open draft questions (
                                                        {team.questions.length})
                                                    </summary>
                                                    <ul class="mt-2 space-y-1.5 text-xs text-neutral-400">
                                                        <For
                                                            each={
                                                                team.questions
                                                            }
                                                        >
                                                            {(question) => (
                                                                <li>
                                                                    • {question}
                                                                </li>
                                                            )}
                                                        </For>
                                                    </ul>
                                                    <p class="mt-2 text-[11px] text-neutral-600">
                                                        These are questions to
                                                        verify, not automatic
                                                        draft failures.
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
