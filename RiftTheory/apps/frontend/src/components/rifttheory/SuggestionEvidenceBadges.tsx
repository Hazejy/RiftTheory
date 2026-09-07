import { For, Show } from "solid-js";
import type { RiftTheorySuggestionEvidence } from "../../contexts/DraftSuggestionsContext";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";
import type { Role } from "@draftgap/core/src/models/Role";
import { Dialog, DialogContent, DialogTrigger } from "../common/Dialog";
import { chevronRight, Icon } from "../icons/RiftIcons";
import SuggestionEvidenceDetails from "./SuggestionEvidenceDetails";
import StrategicColorChips from "./StrategicColorChips";
import { flexStrengthLabel } from "../../utils/flexEvidence";

const ROLE_TIER_CLASSES = {
    primary: "border-accent/60 bg-accent/10 text-accent",
    established: "border-emerald-700 bg-emerald-950/30 text-emerald-200",
    emerging: "border-neutral-700 bg-neutral-900 text-neutral-400",
} as const;

const ROLE_TIER_LABELS = {
    primary: "flexPrimary",
    established: "flexEstablished",
    emerging: "flexEmerging",
} as const;

export default function SuggestionEvidenceBadges(props: {
    championKey: string;
    role: Role;
    evidence?: RiftTheorySuggestionEvidence;
}) {
    const { config } = useUser();
    const { t, term, roleName } = useI18n();
    const percent = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"), {
            style: "percent",
            maximumFractionDigits: 1,
        });
    const integer = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"));

    return (
        <Show
            when={props.evidence}
            fallback={<span class="text-xs text-neutral-600">—</span>}
        >
            {(evidence) => (
                <Dialog>
                    <DialogTrigger
                        class="group grid w-full min-w-[28rem] min-w-0 grid-cols-[minmax(8rem,1.05fr)_minmax(10rem,1.4fr)_minmax(8rem,1.15fr)_auto] items-center gap-3 rounded text-left text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                        title={t("openDraftFitDetails")}
                        aria-label={t("openDraftFitDetails")}
                        onClick={(event: MouseEvent) => event.stopPropagation()}
                    >
                        <div class="min-w-0 flex min-h-8 flex-wrap items-center gap-1 border-r border-neutral-800 pr-3" title={t("colorPlan") }>
                            <span class="w-full text-[9px] uppercase tracking-wider text-neutral-500">
                                {t("colorPlan")}
                            </span>
                            <Show
                                when={evidence().strategicIdentity}
                                fallback={<span class="text-neutral-600">—</span>}
                            >
                                {(identity) => (
                                    <>
                                        <StrategicColorChips
                                            colors={identity().mainColors}
                                            prefix="X"
                                            compact
                                        />
                                        <Show when={identity().offColors.length}>
                                            <StrategicColorChips
                                                colors={identity().offColors}
                                                prefix="O"
                                                compact
                                            />
                                        </Show>
                                    </>
                                )}
                            </Show>
                        </div>
                        <div class="min-w-0 flex min-h-8 flex-wrap items-center border-r border-neutral-800 pr-3" title={t("roleEvidence") }>
                            <span class="w-full text-[9px] uppercase tracking-wider text-neutral-500">
                                {t("roleEvidence")}
                            </span>
                            <Show
                                when={evidence().observedRole}
                                fallback={<span class="text-neutral-600">—</span>}
                            >
                                {(role) => (
                                    <span
                                        class={`max-w-full truncate rounded border px-1.5 py-0.5 ${ROLE_TIER_CLASSES[role().tier]}`}
                                        title={`${t(ROLE_TIER_LABELS[role().tier])} · ${integer().format(role().games)} ${t("games")} · ${percent().format(role().roleShare)}`}
                                    >
                                        {t(ROLE_TIER_LABELS[role().tier])}
                                    </span>
                                )}
                            </Show>
                        </div>
                        <div class="min-w-0 flex min-h-8 flex-wrap items-center">
                            <span class="w-full text-[9px] uppercase tracking-wider text-neutral-500">
                                {t("flexRoles")}
                            </span>
                            <Show
                                when={evidence().flexOptions.length}
                                fallback={<span class="text-neutral-600">—</span>}
                            >
                                <div class="flex flex-wrap gap-1">
                                    <For each={evidence().flexOptions}>
                                        {(option) => (
                                            <span
                                                class="max-w-full whitespace-nowrap rounded border border-violet-800 bg-violet-950/30 px-1.5 py-0.5 text-violet-200"
                                                title={`${option.tier === "primary" ? t("flexPrimary") : t(flexStrengthLabel(option.roleShare))} · ${integer().format(option.games)} ${t("games")}`}
                                            >
                                                {roleName(option.role)}
                                                {" "}{percent().format(option.roleShare)}
                                            </span>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>
                        <div class="flex min-h-8 flex-wrap items-center justify-end gap-1">
                            <For each={evidence().coveredCapabilities}>
                                {(capability) => (
                                    <span
                                        class="rounded border border-emerald-800 bg-emerald-950/30 px-1.5 py-0.5 text-emerald-200"
                                        title={`${t("fillsFoundationGap")}: ${term(capability)}`}
                                    >
                                        + {term(capability)}
                                    </span>
                                )}
                            </For>
                            <Show
                                when={evidence().favorableInteractions.length}
                            >
                                <span
                                    class="rounded border border-sky-800 bg-sky-950/30 px-1.5 py-0.5 text-sky-200"
                                    title={evidence()
                                        .favorableInteractions.map(
                                            (finding) =>
                                                `${finding.subject.championName} ${term(finding.rule.relation)} ${finding.object.championName}: ${finding.rule.effect}`,
                                        )
                                        .join("\n")}
                                >
                                    {t("interactionEdge")}{" "}
                                    {evidence().favorableInteractions.length}
                                </span>
                            </Show>
                            <Show
                                when={evidence().unfavorableInteractions.length}
                            >
                                <span
                                    class="rounded border border-amber-800 bg-amber-950/30 px-1.5 py-0.5 text-amber-200"
                                    title={evidence()
                                        .unfavorableInteractions.map(
                                            (finding) =>
                                                `${finding.subject.championName} ${term(finding.rule.relation)} ${finding.object.championName}: ${finding.rule.effect}`,
                                        )
                                        .join("\n")}
                                >
                                    {t("interactionRisk")}{" "}
                                    {evidence().unfavorableInteractions.length}
                                </span>
                            </Show>
                            <Show
                                when={
                                    evidence().informationalInteractions.length
                                }
                            >
                                <span
                                    class="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-neutral-300"
                                    title={evidence()
                                        .informationalInteractions.map(
                                            (finding) =>
                                                `${finding.subject.championName} ${term(finding.rule.relation)} ${finding.object.championName}: ${finding.rule.effect}`,
                                        )
                                        .join("\n")}
                                >
                                    {t("interactionInfo")}{" "}
                                    {
                                        evidence().informationalInteractions
                                            .length
                                    }
                                </span>
                            </Show>
                            <Icon
                                path={chevronRight}
                                class="h-3.5 w-3.5 shrink-0 text-neutral-600 transition-colors group-hover:text-accent"
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent
                        class="max-w-2xl"
                        onClick={(event: MouseEvent) => event.stopPropagation()}
                    >
                        <SuggestionEvidenceDetails
                            championKey={props.championKey}
                            role={props.role}
                            evidence={evidence()}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Show>
    );
}
