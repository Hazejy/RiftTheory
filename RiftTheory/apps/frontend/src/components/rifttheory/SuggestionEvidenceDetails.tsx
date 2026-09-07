import type { InteractionFinding } from "@draftgap/core/src/interaction/interaction-engine";
import type { Role } from "@draftgap/core/src/models/Role";
import { For, Show } from "solid-js";
import type { RiftTheorySuggestionEvidence } from "../../contexts/DraftSuggestionsContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { championName, useI18n } from "../../utils/i18n";
import { DialogDescription, DialogHeader, DialogTitle } from "../common/Dialog";
import StrategicColorChips from "./StrategicColorChips";

const ROLE_TIER_LABELS = {
    primary: "flexPrimary",
    established: "flexEstablished",
    emerging: "flexEmerging",
} as const;

function InteractionList(props: {
    findings: readonly InteractionFinding[];
    emptyLabel: string;
}) {
    const { term } = useI18n();
    const { sourceForKey } = useRiftTheoryKnowledge();
    return (
        <Show
            when={props.findings.length}
            fallback={
                <p class="text-xs text-neutral-500">{props.emptyLabel}</p>
            }
        >
            <div class="grid gap-2">
                <For each={props.findings}>
                    {(finding) => {
                        const source = () =>
                            sourceForKey(finding.rule.sourceKey);
                        return (
                            <article class="rounded border border-neutral-800 bg-neutral-950/30 p-3">
                                <p class="text-sm text-neutral-200">
                                    {finding.subject.championName}{" "}
                                    <span class="text-accent">
                                        {term(finding.rule.relation)}
                                    </span>{" "}
                                    {finding.object.championName}
                                </p>
                                <p
                                    lang="en"
                                    class="mt-2 text-xs text-neutral-400"
                                >
                                    {finding.rule.condition}
                                </p>
                                <p
                                    lang="en"
                                    class="mt-1 text-xs text-neutral-300"
                                >
                                    {finding.rule.effect}
                                </p>
                                <Show when={source()}>
                                    {(ruleSource) => (
                                        <p class="mt-2 text-[11px] text-neutral-500">
                                            {ruleSource().label}
                                            <Show
                                                when={ruleSource().access_note}
                                            >
                                                {(note) => <> · {note()}</>}
                                            </Show>
                                        </p>
                                    )}
                                </Show>
                            </article>
                        );
                    }}
                </For>
            </div>
        </Show>
    );
}

export default function SuggestionEvidenceDetails(props: {
    championKey: string;
    role: Role;
    evidence: RiftTheorySuggestionEvidence;
}) {
    const { dataset } = useDataset();
    const { config } = useUser();
    const { t, term, roleName } = useI18n();
    const integer = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"));
    const percent = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"), {
            style: "percent",
            maximumFractionDigits: 1,
        });
    const champion = () => dataset()?.championData[props.championKey];
    const displayName = () =>
        champion() ? championName(champion()!, config) : props.championKey;
    const remainingGaps = () =>
        props.evidence.missingCapabilities.filter(
            (capability) =>
                !props.evidence.coveredCapabilities.includes(capability),
        );

    return (
        <>
            <DialogHeader>
                <DialogTitle class="pr-8 text-2xl normal-case">
                    {displayName()} · {roleName(props.role)}
                </DialogTitle>
                <DialogDescription>
                    {t("draftFitDetailsIntro")}
                </DialogDescription>
            </DialogHeader>

            <section class="rounded border border-accent/30 bg-accent/5 p-3">
                <h4 class="text-sm font-semibold">{t("strategicIdentity")}</h4>
                <Show
                    when={props.evidence.strategicIdentity}
                    fallback={
                        <p class="mt-2 text-xs text-neutral-500">
                            {t("strategicIdentityMissing")}
                        </p>
                    }
                >
                    {(identity) => (
                        <div class="mt-3 space-y-3">
                            <div class="flex flex-wrap items-center gap-4">
                                <div>
                                    <p class="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
                                        {t("mainColors")}
                                    </p>
                                    <StrategicColorChips
                                        colors={identity().mainColors}
                                        prefix="X"
                                    />
                                </div>
                                <div>
                                    <p class="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
                                        {t("offColors")}
                                    </p>
                                    <StrategicColorChips
                                        colors={identity().offColors}
                                        prefix="O"
                                    />
                                </div>
                            </div>
                            <p class="text-[10px] uppercase tracking-wider text-neutral-500">
                                {identity().scope === "role"
                                    ? t("roleColorProfile")
                                    : identity().evidenceTier ===
                                        "historical_reference"
                                      ? t("historical")
                                      : t("provisional")}
                            </p>
                            <p class="text-xs leading-relaxed text-neutral-300">
                                {identity().reasoning}
                            </p>
                        </div>
                    )}
                </Show>
            </section>

            <section class="rounded border border-neutral-800 p-3">
                <h4 class="text-sm font-semibold">
                    {t("observedRoleEvidence")}
                </h4>
                <Show
                    when={props.evidence.observedRole}
                    fallback={
                        <p class="mt-2 text-xs text-neutral-500">{t("none")}</p>
                    }
                >
                    {(role) => (
                        <p class="mt-2 text-sm text-neutral-300">
                            {t(ROLE_TIER_LABELS[role().tier])} ·{" "}
                            {integer().format(role().games)} {t("games")} ·{" "}
                            {percent().format(role().roleShare)}
                        </p>
                    )}
                </Show>
                <Show when={props.evidence.flexOptions.length}>
                    <div class="mt-3">
                        <p class="text-xs uppercase tracking-wider text-neutral-500">
                            {t("availableFlexRoles")}
                        </p>
                        <div class="mt-2 flex flex-wrap gap-2">
                            <For each={props.evidence.flexOptions}>
                                {(option) => (
                                    <span class="rounded border border-emerald-800 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-200">
                                        {roleName(option.role)} ·{" "}
                                        {t(ROLE_TIER_LABELS[option.tier])} ·{" "}
                                        {integer().format(option.games)}{" "}
                                        {t("games")} ·{" "}
                                        {percent().format(option.roleShare)}
                                    </span>
                                )}
                            </For>
                        </div>
                    </div>
                </Show>
            </section>

            <section class="rounded border border-neutral-800 p-3">
                <h4 class="text-sm font-semibold">{t("foundationCoverage")}</h4>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                        <p class="text-xs uppercase tracking-wider text-emerald-300">
                            {t("fillsNow")}
                        </p>
                        <p class="mt-1 text-sm text-neutral-300">
                            {props.evidence.coveredCapabilities.length
                                ? props.evidence.coveredCapabilities
                                      .map(term)
                                      .join(", ")
                                : t("none")}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wider text-neutral-500">
                            {t("stillMissing")}
                        </p>
                        <p class="mt-1 text-sm text-neutral-400">
                            {remainingGaps().length
                                ? remainingGaps().map(term).join(", ")
                                : t("none")}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h4 class="mb-2 text-sm font-semibold text-sky-200">
                    {t("favorableInteractions")}
                </h4>
                <InteractionList
                    findings={props.evidence.favorableInteractions}
                    emptyLabel={t("noKnownInteractions")}
                />
            </section>
            <section>
                <h4 class="mb-2 text-sm font-semibold text-amber-200">
                    {t("unfavorableInteractions")}
                </h4>
                <InteractionList
                    findings={props.evidence.unfavorableInteractions}
                    emptyLabel={t("noKnownInteractions")}
                />
            </section>
            <Show when={props.evidence.informationalInteractions.length}>
                <section>
                    <h4 class="mb-2 text-sm font-semibold text-neutral-300">
                        {t("informationalInteractions")}
                    </h4>
                    <InteractionList
                        findings={props.evidence.informationalInteractions}
                        emptyLabel={t("noKnownInteractions")}
                    />
                </section>
            </Show>
            <p class="text-xs text-neutral-500">{t("draftFitCaveat")}</p>
        </>
    );
}
