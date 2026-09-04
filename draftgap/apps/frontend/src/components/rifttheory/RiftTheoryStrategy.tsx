import { createMemo, For, Show } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import { championName, useI18n } from "../../utils/i18n";
import strategicProfiles from "../../../../../../data/strategic_profiles.json";
import capabilityProfiles from "../../../../../../data/champion_profiles.json";

const roleNames = ["top", "jungle", "mid", "bot", "support"];

export default function RiftTheoryStrategy() {
    const { t, term } = useI18n();
    const { config } = useUser();
    const { allyTeam, opponentTeam } = useDraft();
    const { dataset } = useDataset();
    const teams = createMemo(() =>
        [
            { name: t("ally"), picks: allyTeam },
            { name: t("opponent"), picks: opponentTeam },
        ].map((team) => ({
            name: team.name,
            picks: team.picks
                .filter((pick) => pick.championKey !== undefined)
                .map((pick) => {
                    const champion = dataset()?.championData[pick.championKey!];
                    const name = champion?.name ?? "Unknown champion";
                    const role =
                        pick.role === undefined
                            ? undefined
                            : roleNames[pick.role];
                    return {
                        name: champion ? championName(champion, config) : name,
                        role,
                        strategy: strategicProfiles.find(
                            (profile) =>
                                profile.champion_name === name &&
                                profile.role === role,
                        ),
                        capabilities: capabilityProfiles.find(
                            (profile) =>
                                profile.name === name && profile.role === role,
                        ),
                    };
                }),
        })),
    );

    return (
        <section class="p-5 xl:p-8 overflow-y-auto font-body">
            <h2 class="text-2xl font-semibold mb-2">
                RiftTheory — {t("strategy")}
            </h2>
            <p class="text-sm text-neutral-400 mb-5">{t("strategyIntro")}</p>
            <div class="rounded border border-amber-800 bg-amber-950/20 p-3 text-sm text-amber-200 mb-6">
                {t("coverage")}
            </div>
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
                                            <p class="text-xs text-neutral-400 my-3">
                                                {t("capabilities")}:{" "}
                                                {pick.capabilities?.capabilities
                                                    .map(term)
                                                    .join(", ") ??
                                                    t("unassessed")}
                                            </p>
                                            <Show when={pick.capabilities}>
                                                <p class="text-xs text-neutral-500 mb-3">
                                                    {t("capabilitySource")}:{" "}
                                                    {pick.capabilities?.source}
                                                </p>
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
                                                                {strategy()
                                                                    .identity.main_colors.map(
                                                                        term,
                                                                    )
                                                                    .join(", ")}
                                                            </span>
                                                            <span class="border border-neutral-500 rounded px-2 py-1">
                                                                {t("offColors")}
                                                                :{" "}
                                                                {strategy()
                                                                    .identity.off_colors.map(
                                                                        term,
                                                                    )
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
                                                                    .identity
                                                                    .reasoning
                                                            }
                                                        </p>
                                                        <details class="mt-4 text-xs text-neutral-400">
                                                            <summary class="cursor-pointer text-sky-300">
                                                                {t("evidence")}
                                                            </summary>
                                                            <p class="mt-2 break-words">
                                                                {
                                                                    strategy()
                                                                        .identity
                                                                        .source_name
                                                                }
                                                            </p>
                                                            <p class="mt-2">
                                                                {t(
                                                                    "assessmentPatch",
                                                                )}
                                                                :{" "}
                                                                {strategy()
                                                                    .patch ??
                                                                    t(
                                                                        "unknownPatch",
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
            <p class="text-xs text-neutral-500 mt-5">{t("strategyCaveat")}</p>
        </section>
    );
}
