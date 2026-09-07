import { createMemo, createSignal, For, Show } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { COLOR_GUIDE } from "../../locales/colorGuide";
import type { MessageKey } from "../../locales/messages";
import type { RiftTheoryColor } from "../../types/RiftTheoryKnowledge";
import { DRAFT_PICK_ORDER, pickLabel } from "../../utils/draftOrder";
import { EVIDENCE_ROLE_NAMES } from "../../utils/interactionEvidence";
import { useI18n } from "../../utils/i18n";
import { effectiveColorEvidence } from "../../utils/colorEvidence";
import StrategicColorChips from "./StrategicColorChips";
import { chevronRight, Icon } from "../icons/RiftIcons";

const RESPONSE_PLANNER_OPEN_KEY = "rifttheory-response-planner-open";

const PRIORITY_RULES = [
    {
        signals: ["engage"],
        label: "responsePriorityEngage",
    },
    {
        signals: ["target_access"],
        label: "responsePriorityTargetAccess",
    },
    {
        signals: ["poke", "threat_range"],
        label: "responsePriorityRange",
    },
    {
        signals: ["terrain_control"],
        label: "responsePriorityZones",
    },
    {
        signals: ["wave_clear"],
        label: "responsePriorityWave",
    },
] as const;

export default function DraftResponsePlanner() {
    const { selection, activeDraftPick, allyTeam, opponentTeam } = useDraft();
    const { championForKey } = useRiftTheoryKnowledge();
    const { config } = useUser();
    const { t, term } = useI18n();
    const [isOpen, setIsOpen] = createSignal(
        typeof window === "undefined"
            ? true
            : window.localStorage.getItem(RESPONSE_PLANNER_OPEN_KEY) !==
                  "false",
    );

    const toggleOpen = () => {
        const next = !isOpen();
        setIsOpen(next);
        window.localStorage.setItem(RESPONSE_PLANNER_OPEN_KEY, String(next));
    };

    // Manual slot selection takes precedence so every B/R slot can be planned.
    const selectedStep = () =>
        selection.team !== undefined ? selection : activeDraftPick();
    const responseWindow = createMemo(() => {
        const step = selectedStep();
        if (!step?.team) return [];
        const start = DRAFT_PICK_ORDER.findIndex(
            (candidate) =>
                candidate.team === step.team && candidate.index === step.index,
        );
        if (start < 0) return [];
        const result = [];
        for (let index = start; index < DRAFT_PICK_ORDER.length; index += 1) {
            const candidate = DRAFT_PICK_ORDER[index]!;
            if (candidate.team !== step.team) break;
            const pick =
                candidate.team === "ally"
                    ? allyTeam[candidate.index]
                    : opponentTeam[candidate.index];
            if (!pick.championKey)
                result.push(pickLabel(candidate.team, candidate.index));
        }
        return result;
    });
    const enemyProfiles = createMemo(() => {
        const step = selectedStep();
        if (!step?.team) return [];
        const enemyPicks = step.team === "ally" ? opponentTeam : allyTeam;
        return enemyPicks.flatMap((pick) => {
            if (!pick.championKey) return [];
            const champion = championForKey(pick.championKey);
            const roleName =
                pick.role === undefined
                    ? undefined
                    : EVIDENCE_ROLE_NAMES[pick.role];
            const colorEvidence = effectiveColorEvidence(champion, roleName);
            const capabilities = (champion?.capabilities ?? [])
                .filter(
                    (capability) =>
                        roleName === undefined || capability.role === roleName,
                )
                .map((capability) => capability.capability);
            const traits = (champion?.roleTraits ?? [])
                .filter(
                    (trait) =>
                        roleName === undefined || trait.role === roleName,
                )
                .map((trait) => trait.trait);
            return [
                {
                    name: champion?.name ?? pick.championKey,
                    colors:
                        colorEvidence?.profile.colors
                            .filter((color) => color.assignment === "main")
                            .map((color) => color.color) ?? [],
                    signals: [...new Set([...capabilities, ...traits])],
                    evidenceTier: colorEvidence?.tier,
                },
            ];
        });
    });
    const enemyColors = createMemo(
        () =>
            [
                ...new Set(
                    enemyProfiles().flatMap((profile) => profile.colors),
                ),
            ] as RiftTheoryColor[],
    );
    const enemySignals = createMemo(() => [
        ...new Set(enemyProfiles().flatMap((profile) => profile.signals)),
    ]);
    const priorities = createMemo(() => {
        const signals = new Set(enemySignals());
        const matched = PRIORITY_RULES.filter((rule) =>
            rule.signals.some((signal) => signals.has(signal)),
        ).map((rule) => rule.label);
        return matched.length ? matched : ["responsePriorityGeneral"];
    });
    const guide = () =>
        COLOR_GUIDE[config.language as keyof typeof COLOR_GUIDE] ??
        COLOR_GUIDE.en_US;
    const leadingColor = () => enemyColors()[0];
    const PlannerCards = () => (
        <>
            <div class="rounded-lg border border-neutral-800 bg-panel-inset p-3">
                <p class="text-[10px] uppercase tracking-wider text-neutral-500">
                    {t("enemyPlanSignals")}
                </p>
                <Show
                    when={enemyProfiles().length}
                    fallback={
                        <p class="mt-2 text-xs text-neutral-500">
                            {t("noEnemyPicksYet")}
                        </p>
                    }
                >
                    <div class="mt-2 flex flex-wrap gap-2">
                        <For each={enemyProfiles()}>
                            {(profile) => (
                                <span class="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-2 py-1 text-xs">
                                    {profile.name}
                                    <Show when={profile.evidenceTier}>
                                        {(tier) => (
                                            <span class="text-[9px] uppercase tracking-wide text-neutral-500">
                                                {t(
                                                    tier() === "role_profile"
                                                        ? "roleColorProfile"
                                                        : tier() ===
                                                            "historical_reference"
                                                          ? "historical"
                                                          : "provisional",
                                                )}
                                            </span>
                                        )}
                                    </Show>
                                </span>
                            )}
                        </For>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                        <For each={enemySignals().slice(0, 6)}>
                            {(signal) => (
                                <span class="text-xs text-neutral-400">
                                    {term(signal)}
                                </span>
                            )}
                        </For>
                    </div>
                </Show>
            </div>

            <div class="rounded-lg border border-neutral-800 bg-panel-inset p-3">
                <p class="text-[10px] uppercase tracking-wider text-neutral-500">
                    {t("answerPriorities")}
                </p>
                <ul class="mt-2 space-y-1 text-xs text-neutral-300">
                    <For each={priorities()}>
                        {(priority) => <li>• {t(priority as MessageKey)}</li>}
                    </For>
                </ul>
            </div>

            <div class="rounded-lg border border-neutral-800 bg-panel-inset p-3">
                <p class="text-[10px] uppercase tracking-wider text-neutral-500">
                    {t("colorCounterLens")}
                </p>
                <Show
                    when={leadingColor()}
                    fallback={
                        <p class="mt-2 text-xs text-neutral-500">
                            {t("colorProfileMissing")}
                        </p>
                    }
                >
                    {(color) => (
                        <>
                            <div class="mt-2">
                                <StrategicColorChips
                                    colors={enemyColors()}
                                    prefix="X"
                                    compact
                                />
                            </div>
                            <p class="mt-2 text-xs leading-relaxed text-neutral-300">
                                {guide().colors[color()].risk}
                            </p>
                        </>
                    )}
                </Show>
            </div>
        </>
    );

    return (
        <section class="mb-2 shrink-0 rounded-xl border border-neutral-700 bg-primary">
            <div class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div class="min-w-0">
                    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                        {t("responsePlanner")}
                    </p>
                    <h3 class="mt-0.5 truncate text-sm font-semibold">
                        {t("responseWindow")}:{" "}
                        {responseWindow().join(" + ") || "—"}
                    </h3>
                </div>
                <div class="flex items-center gap-3">
                    <Show when={!isOpen() && enemyColors().length}>
                        <div class="hidden sm:block">
                            <StrategicColorChips
                                colors={enemyColors()}
                                prefix="X"
                                compact
                            />
                        </div>
                    </Show>
                    <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-panel-inset px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
                        aria-expanded={isOpen()}
                        onClick={toggleOpen}
                    >
                        {t(isOpen() ? "collapseResponsePlan" : "expandResponsePlan")}
                        <Icon
                            path={chevronRight}
                            class="h-3.5 w-3.5 transition-transform"
                            classList={{ "rotate-90": isOpen() }}
                        />
                    </button>
                </div>
            </div>

            <Show when={isOpen()}>
                <div class="border-t border-neutral-800 px-3 pb-3 pt-2.5">
                    <p class="mb-2 hidden text-xs leading-relaxed text-neutral-400 lg:block">
                        {t("responsePlannerHelp")}
                    </p>
                    <div class="grid gap-2 lg:grid-cols-3">
                        <PlannerCards />
                    </div>
                </div>
            </Show>
        </section>
    );
}
