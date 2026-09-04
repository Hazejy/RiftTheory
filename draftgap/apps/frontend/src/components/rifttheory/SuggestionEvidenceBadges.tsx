import { For, Show } from "solid-js";
import type { RiftTheorySuggestionEvidence } from "../../contexts/DraftSuggestionsContext";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";

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
    evidence?: RiftTheorySuggestionEvidence;
}) {
    const { config } = useUser();
    const { t, term } = useI18n();
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
                <div class="flex max-w-72 flex-wrap gap-1 text-xs">
                    <Show when={evidence().observedRole}>
                        {(role) => (
                            <span
                                class={`rounded border px-1.5 py-0.5 ${ROLE_TIER_CLASSES[role().tier]}`}
                                title={`${t(ROLE_TIER_LABELS[role().tier])} · ${integer().format(role().games)} ${t("games")} · ${percent().format(role().roleShare)}`}
                            >
                                {t(ROLE_TIER_LABELS[role().tier])}
                            </span>
                        )}
                    </Show>
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
                    <Show when={evidence().favorableInteractions.length}>
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
                    <Show when={evidence().unfavorableInteractions.length}>
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
                    <Show when={evidence().informationalInteractions.length}>
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
                            {evidence().informationalInteractions.length}
                        </span>
                    </Show>
                </div>
            )}
        </Show>
    );
}
