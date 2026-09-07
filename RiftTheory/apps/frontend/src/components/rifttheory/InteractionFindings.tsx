import type { InteractionFinding } from "@draftgap/core/src/interaction/interaction-engine";
import { For, Show } from "solid-js";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";

const SEVERITY_CLASSES = {
    note: "border-neutral-700 bg-neutral-900",
    warning: "border-amber-800 bg-amber-950/15",
    strong: "border-red-800 bg-red-950/15",
} as const;

export default function InteractionFindings(props: {
    findings: readonly InteractionFinding[];
    hasRolelessPicks: boolean;
}) {
    const { config } = useUser();
    const { t, term } = useI18n();
    const { sourceForKey } = useRiftTheoryKnowledge();
    const percent = () =>
        new Intl.NumberFormat(config.language.replace("_", "-"), {
            style: "percent",
            maximumFractionDigits: 0,
        });

    return (
        <section class="mt-7 border-t border-neutral-800 pt-6">
            <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
                <div>
                    <h3 class="text-xl font-semibold">
                        {t("interactionAnalysis")}
                    </h3>
                    <p class="mt-1 max-w-3xl text-sm text-neutral-400">
                        {t("interactionIntro")}
                    </p>
                </div>
                <span class="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                    {t("findings")}: {props.findings.length}
                </span>
            </div>
            <Show
                when={props.findings.length}
                fallback={
                    <div class="rounded-lg border border-dashed border-neutral-700 bg-neutral-900/40 p-5">
                        <p class="text-sm text-neutral-300">
                            {t("noInteractionEvidence")}
                        </p>
                        <Show when={props.hasRolelessPicks}>
                            <p class="mt-2 text-xs text-amber-300">
                                {t("interactionRequiresRoles")}
                            </p>
                        </Show>
                    </div>
                }
            >
                <div class="grid gap-3">
                    <For each={props.findings}>
                        {(finding) => {
                            const source = () =>
                                sourceForKey(finding.rule.sourceKey);
                            return (
                                <article
                                    class={`rounded-lg border p-4 ${SEVERITY_CLASSES[finding.rule.severity]}`}
                                >
                                    <div class="flex flex-wrap items-center gap-2">
                                        <strong>
                                            {finding.subject.championName}
                                        </strong>
                                        <span class="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                                            {term(finding.rule.relation)}
                                        </span>
                                        <strong>
                                            {finding.object.championName}
                                        </strong>
                                        <span class="ml-auto text-xs uppercase tracking-wider text-amber-300">
                                            {term(finding.rule.reviewStatus)}
                                        </span>
                                    </div>
                                    <div class="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span class="rounded border border-neutral-700 px-2 py-1">
                                            {term(finding.rule.subjectTrait)}{" "}
                                            {finding.subjectLevel}/5
                                        </span>
                                        <span class="rounded border border-neutral-700 px-2 py-1">
                                            {term(finding.rule.objectTrait)}{" "}
                                            {finding.objectLevel}/5
                                        </span>
                                    </div>
                                    <p
                                        lang="en"
                                        class="mt-3 text-sm text-neutral-300"
                                    >
                                        <span class="text-neutral-500">
                                            {t("condition")}:{" "}
                                        </span>
                                        {finding.rule.condition}
                                    </p>
                                    <p
                                        lang="en"
                                        class="mt-2 text-sm leading-relaxed text-neutral-200"
                                    >
                                        <span class="text-neutral-500">
                                            {t("effect")}:{" "}
                                        </span>
                                        {finding.rule.effect}
                                    </p>
                                    <details class="mt-3 text-xs text-neutral-500">
                                        <summary class="cursor-pointer text-neutral-400">
                                            {t("evidence")}
                                        </summary>
                                        <p class="mt-2">
                                            {source()?.label ??
                                                finding.rule.sourceKey}
                                        </p>
                                        <p class="mt-1">
                                            {t("confidence")}:{" "}
                                            {finding.rule.confidence === null
                                                ? t("unassessed")
                                                : percent().format(
                                                      finding.rule.confidence,
                                                  )}
                                        </p>
                                        <p class="mt-1">
                                            {t("assessmentPatch")}:{" "}
                                            {finding.rule.patchVersion ===
                                            "unknown"
                                                ? t("unknownPatch")
                                                : finding.rule.patchVersion}
                                        </p>
                                    </details>
                                </article>
                            );
                        }}
                    </For>
                </div>
            </Show>
            <p class="mt-4 text-xs text-neutral-500">
                {t("interactionCaveat")}
            </p>
        </section>
    );
}
