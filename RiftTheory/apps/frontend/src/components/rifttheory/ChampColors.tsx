import { createMemo, createSignal, For, Show } from "solid-js";
import { ChampionData } from "@draftgap/core/src/models/dataset/ChampionData";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import { useDraft } from "../../contexts/DraftContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { Icon, informationCircle } from "../icons/RiftIcons";
import { normalizeChampionSearch, useI18n } from "../../utils/i18n";
import { ChampionIcon } from "../icons/ChampionIcon";
import { COLOR_GUIDE } from "../../locales/colorGuide";
import {
    KnowledgeChampion,
    KnowledgeColorBaseline,
    KnowledgeStrategicProfile,
    RIFT_THEORY_COLORS,
    RiftTheoryColor,
} from "../../types/RiftTheoryKnowledge";
import { latestRoleEvidence } from "../../utils/flexEvidence";
import ObservedRoleBadges from "./ObservedRoleBadges";
import StrategicColorChips from "./StrategicColorChips";

type ColorRow = {
    champion: ChampionData;
    knowledge: KnowledgeChampion;
    profile?: KnowledgeStrategicProfile | KnowledgeColorBaseline;
    isBaseline?: boolean;
};

const COLORS = RIFT_THEORY_COLORS;
const ROLES = ["top", "jungle", "mid", "bot", "support"] as const;
const profileColors = (
    profile: KnowledgeStrategicProfile | KnowledgeColorBaseline,
    assignment: "main" | "off",
) =>
    profile.colors
        .filter((color) => color.assignment === assignment)
        .map((color) => color.color);
const safeHttpUrl = (value: string | null) =>
    value && /^https?:\/\//.test(value) ? value : undefined;

function ColorGuide() {
    const { t } = useI18n();
    const { config } = useUser();
    const [selected, setSelected] =
        createSignal<(typeof COLORS)[number]>("blue");
    const guide = () =>
        COLOR_GUIDE[config.language as keyof typeof COLOR_GUIDE] ??
        COLOR_GUIDE.en_US;
    const entry = () => guide().colors[selected()];
    return (
        <details class="rt-guide rounded-xl border border-neutral-700 p-4 sm:p-5">
            <summary class="cursor-pointer text-sm text-accent focus-visible:outline-2 focus-visible:outline-accent">
                <span class="inline-flex items-center gap-2 align-middle">
                    <Icon
                        path={informationCircle}
                        class="h-4 w-4"
                        aria-hidden="true"
                    />
                    {t("colorGuide")}
                </span>
            </summary>
            <div class="mt-5 space-y-5 text-sm text-neutral-300 leading-relaxed">
                <div>
                    <h3 class="text-xl font-semibold text-neutral-50">
                        {guide().title}
                    </h3>
                    <p class="mt-2 text-neutral-400">{guide().intro}</p>
                </div>
                <div
                    class="flex flex-wrap gap-2"
                    role="group"
                    aria-label={t("colorGuide")}
                >
                    <For each={COLORS}>
                        {(color) => (
                            <button
                                type="button"
                                aria-pressed={selected() === color}
                                class="rounded-md transition-opacity focus-visible:outline-2 focus-visible:outline-accent"
                                classList={{
                                    "ring-2 ring-accent ring-offset-2 ring-offset-primary":
                                        selected() === color,
                                    "opacity-65 hover:opacity-100":
                                        selected() !== color,
                                }}
                                onClick={() => setSelected(color)}
                            >
                                <StrategicColorChips colors={[color]} />
                            </button>
                        )}
                    </For>
                </div>
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    class="rounded-xl border border-neutral-700 bg-panel-inset p-4 sm:p-5 space-y-4"
                >
                    <div>
                        <p class="text-[11px] uppercase tracking-wider text-neutral-400">
                            {guide().definition}
                        </p>
                        <p class="mt-1 text-neutral-100">{entry().identity}</p>
                    </div>
                    <p class="text-[11px] uppercase tracking-wider text-accent border-t border-neutral-700 pt-4">
                        {guide().application}
                    </p>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p class="font-semibold text-neutral-100">
                                {guide().signalsTitle}
                            </p>
                            <ul class="mt-1 list-disc pl-5 text-neutral-400">
                                <For each={entry().signals}>
                                    {(signal) => <li>{signal}</li>}
                                </For>
                            </ul>
                        </div>
                        <div>
                            <p class="font-semibold text-neutral-100">
                                {guide().notEnoughTitle}
                            </p>
                            <p class="mt-1 text-neutral-400">
                                {entry().notEnough}
                            </p>
                        </div>
                    </div>
                    <dl class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt class="font-semibold text-neutral-100">
                                {guide().advantage}
                            </dt>
                            <dd class="mt-1">{entry().advantage}</dd>
                        </div>
                        <div>
                            <dt class="font-semibold text-neutral-100">
                                {guide().risk}
                            </dt>
                            <dd class="mt-1">{entry().risk}</dd>
                        </div>
                        <div class="sm:col-span-2 border-l-2 border-accent pl-3">
                            <dt class="font-semibold text-accent">
                                {guide().check}
                            </dt>
                            <dd class="mt-1">{entry().check}</dd>
                        </div>
                    </dl>
                </div>
                <p class="text-xs text-neutral-400">{guide().mainOff}</p>
                <details class="border-t border-neutral-700 pt-4">
                    <summary class="cursor-pointer font-medium text-neutral-100">
                        {guide().exampleTitle}
                    </summary>
                    <p class="mt-2">{guide().example}</p>
                </details>
                <div>
                    <h4 class="font-semibold text-neutral-100">
                        {guide().checklistTitle}
                    </h4>
                    <ol class="list-decimal pl-5 mt-2 space-y-1 text-neutral-400">
                        <For each={guide().checklist}>
                            {(item) => <li>{item}</li>}
                        </For>
                    </ol>
                </div>
            </div>
        </details>
    );
}

export default function ChampColors() {
    const { dataset } = useDataset();
    const { knowledge, sourceForKey } = useRiftTheoryKnowledge();
    const { config } = useUser();
    const { allyTeam, opponentTeam, bans, activeDraftPick, pickNextChampion } =
        useDraft();
    const { t, term } = useI18n();
    const [search, setSearch] = createSignal("");
    const [role, setRole] = createSignal("");
    const [color, setColor] = createSignal<"" | RiftTheoryColor>("");
    const [coverage, setCoverage] = createSignal("");
    const [flexSignal, setFlexSignal] = createSignal("");
    const pickBlockReason = (key: string) => {
        if (
            [...allyTeam, ...opponentTeam].some(
                (pick) => pick.championKey === key,
            )
        )
            return t("alreadyPicked");
        if (bans.includes(key)) return t("unavailablePick");
        if (!activeDraftPick()) return t("chooseSlot");
        return undefined;
    };

    const localizedName = (champion: KnowledgeChampion) =>
        champion.localizations[config.language]?.name ?? champion.name;
    const champions = createMemo(() =>
        (knowledge()?.champions ?? [])
            .flatMap((knowledgeChampion) => {
                if (!knowledgeChampion.riotKey) return [];
                const champion =
                    dataset()?.championData[knowledgeChampion.riotKey];
                return champion
                    ? [{ champion, knowledge: knowledgeChampion }]
                    : [];
            })
            .sort((a, b) =>
                localizedName(a.knowledge).localeCompare(
                    localizedName(b.knowledge),
                    config.language.replace("_", "-"),
                ),
            ),
    );
    const rows = createMemo(() =>
        champions().flatMap<ColorRow>(({ champion, knowledge }) => {
            const profiles = knowledge.strategicProfiles;
            if (profiles?.length) {
                return profiles.map((profile) => ({
                    champion,
                    knowledge,
                    profile,
                }));
            }
            if (knowledge.colorBaseline) {
                return [
                    {
                        champion,
                        knowledge,
                        profile: knowledge.colorBaseline,
                        isBaseline: true,
                    },
                ];
            }
            return [{ champion, knowledge }];
        }),
    );
    const profiledCount = createMemo(
        () =>
            champions().filter(
                ({ knowledge }) =>
                    knowledge.strategicProfiles.length > 0 ||
                    !!knowledge.colorBaseline,
            ).length,
    );
    const flexCandidateCount = createMemo(
        () =>
            champions().filter(
                ({ knowledge }) =>
                    latestRoleEvidence(knowledge).isFlexCandidate,
            ).length,
    );
    const filtered = createMemo(() => {
        const query = normalizeChampionSearch(search());
        const selectedColor = color();
        return rows().filter((row) => {
            if (
                query &&
                !normalizeChampionSearch(row.knowledge.name).includes(query) &&
                !normalizeChampionSearch(localizedName(row.knowledge)).includes(
                    query,
                )
            )
                return false;
            if (
                role() &&
                (row.isBaseline
                    ? !latestRoleEvidence(row.knowledge).roles.some(
                          (entry) => entry.role === role(),
                      )
                    : (row.profile as KnowledgeStrategicProfile | undefined)
                          ?.role !== role())
            )
                return false;
            if (
                selectedColor &&
                ![
                    ...(row.profile ? profileColors(row.profile, "main") : []),
                    ...(row.profile ? profileColors(row.profile, "off") : []),
                ].includes(selectedColor)
            )
                return false;
            if (coverage() === "profiled" && !row.profile) return false;
            if (coverage() === "missing" && row.profile) return false;
            const flexEvidence = latestRoleEvidence(row.knowledge);
            if (flexSignal() === "established" && !flexEvidence.isFlexCandidate)
                return false;
            if (
                flexSignal() === "emerging" &&
                !flexEvidence.roles.some((entry) => entry.tier === "emerging")
            )
                return false;
            return true;
        });
    });
    const clearFilters = () => {
        setSearch("");
        setRole("");
        setColor("");
        setCoverage("");
        setFlexSignal("");
    };
    const filterClass =
        "rounded-lg border border-neutral-700 bg-primary px-3 py-2 text-sm text-neutral-200 focus:outline-2 focus:outline-accent";

    return (
        <section class="p-4 xl:p-8 font-body space-y-5">
            <header>
                <p class="text-xs uppercase tracking-widest text-accent mb-2">
                    RiftTheory / {t("catalogue")}
                </p>
                <h2 class="text-2xl font-semibold tracking-tight">
                    {t("champColors")}
                </h2>
                <p class="text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                    {t("colorsIntro")}
                </p>
            </header>

            <ColorGuide />
            <details class="rounded-xl border border-neutral-700 bg-primary p-4 text-sm">
                <summary class="cursor-pointer font-medium text-accent">
                    {t("flexEvidence")}
                </summary>
                <p class="mt-3 max-w-4xl text-neutral-400 leading-relaxed">
                    {t("flexEvidenceHelp")}
                </p>
            </details>
            <p class="text-xs text-neutral-400 leading-relaxed">
                {t("colorsPickHelp")}
            </p>

            <Show when={knowledge.loading}>
                <div
                    class="rounded-lg border border-neutral-700 bg-primary p-3 text-sm text-neutral-400"
                    role="status"
                >
                    {t("knowledgeLoading")}
                </div>
            </Show>
            <Show when={knowledge.error}>
                <div
                    class="rounded-lg border border-red-800 bg-red-950/20 p-3 text-sm text-red-200"
                    role="alert"
                >
                    {t("knowledgeError")}
                </div>
            </Show>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <For
                    each={[
                        { label: t("champions"), count: champions().length },
                        { label: t("profiles"), count: profiledCount() },
                        {
                            label: t("noProfile"),
                            count: champions().length - profiledCount(),
                        },
                        {
                            label: t("observedFlexCandidates"),
                            count: flexCandidateCount(),
                        },
                    ]}
                >
                    {(stat) => (
                        <div class="rounded-xl border border-neutral-700 bg-primary p-3 sm:p-4">
                            <p class="text-2xl font-semibold tabular-nums">
                                {stat.count}
                            </p>
                            <p class="text-xs text-neutral-400 mt-1">
                                {stat.label}
                            </p>
                        </div>
                    )}
                </For>
            </div>

            <div class="flex flex-wrap gap-2">
                <input
                    class={`${filterClass} flex-1 min-w-40`}
                    type="search"
                    data-champion-search
                    aria-label={t("search")}
                    placeholder={t("search")}
                    value={search()}
                    onInput={(event) => setSearch(event.currentTarget.value)}
                />
                <select
                    class={filterClass}
                    aria-label={t("role")}
                    value={role()}
                    onChange={(event) => setRole(event.currentTarget.value)}
                >
                    <option value="">{t("allRoles")}</option>
                    <For each={ROLES}>
                        {(value) => (
                            <option value={value}>{term(value)}</option>
                        )}
                    </For>
                </select>
                <select
                    class={filterClass}
                    aria-label={t("flexEvidence")}
                    value={flexSignal()}
                    onChange={(event) =>
                        setFlexSignal(event.currentTarget.value)
                    }
                >
                    <option value="">{t("allFlexSignals")}</option>
                    <option value="established">{t("establishedFlex")}</option>
                    <option value="emerging">{t("emergingFlex")}</option>
                </select>
                <select
                    class={filterClass}
                    aria-label={t("allColors")}
                    value={color()}
                    onChange={(event) =>
                        setColor(
                            event.currentTarget.value as "" | RiftTheoryColor,
                        )
                    }
                >
                    <option value="">{t("allColors")}</option>
                    <For each={COLORS}>
                        {(value) => (
                            <option value={value}>{term(value)}</option>
                        )}
                    </For>
                </select>
                <select
                    class={filterClass}
                    aria-label={t("review")}
                    value={coverage()}
                    onChange={(event) => setCoverage(event.currentTarget.value)}
                >
                    <option value="">{t("all")}</option>
                    <option value="profiled">{t("profiles")}</option>
                    <option value="missing">{t("noProfile")}</option>
                </select>
                <button
                    type="button"
                    class="text-xs text-accent px-2 underline disabled:opacity-40"
                    onClick={clearFilters}
                    disabled={
                        !search() &&
                        !role() &&
                        !color() &&
                        !coverage() &&
                        !flexSignal()
                    }
                >
                    {t("clearFilters")}
                </button>
            </div>

            <div class="flex flex-wrap justify-between gap-2 text-xs text-neutral-400">
                <p role="status" aria-live="polite">
                    {t("shownRows")}: {filtered().length}
                </p>
                <p>
                    {t("cataloguePatch")}:{" "}
                    {knowledge()?.metadata.latestPatch?.version ??
                        t("unknownPatch")}{" "}
                    · {t("sourceLanguage")}
                </p>
            </div>
            <div class="rounded-xl border border-neutral-700 overflow-auto max-h-[65vh] bg-primary">
                <table class="w-full min-w-[900px] border-collapse text-sm">
                    <caption class="sr-only">{t("champColors")}</caption>
                    <thead class="sticky top-0 z-10 bg-panel-inset text-neutral-400 text-xs">
                        <tr>
                            <For
                                each={
                                    [
                                        "champion",
                                        "role",
                                        "observedRoles",
                                        "mainColors",
                                        "offColors",
                                        "review",
                                        "evidence",
                                    ] as const
                                }
                            >
                                {(key) => (
                                    <th
                                        scope="col"
                                        class="text-left font-medium px-4 py-3 border-b border-neutral-700"
                                    >
                                        {t(key)}
                                    </th>
                                )}
                            </For>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-800">
                        <For
                            each={filtered()}
                            fallback={
                                <tr>
                                    <td
                                        colSpan={7}
                                        class="p-8 text-center text-neutral-400"
                                    >
                                        {t("noResults")}
                                    </td>
                                </tr>
                            }
                        >
                            {(row) => (
                                <tr class="hover:bg-neutral-800/50 transition-colors">
                                    <th
                                        scope="row"
                                        class="text-left font-medium px-4 py-3"
                                    >
                                        <button
                                            type="button"
                                            class="flex items-center gap-3 text-left rounded-md hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent"
                                            aria-label={`${t("addToDraft")}: ${localizedName(row.knowledge)}`}
                                            title={
                                                pickBlockReason(
                                                    row.champion.key,
                                                ) ?? t("addToDraft")
                                            }
                                            disabled={
                                                !!pickBlockReason(
                                                    row.champion.key,
                                                )
                                            }
                                            onClick={() =>
                                                pickNextChampion(
                                                    row.champion.key,
                                                    undefined,
                                                    { updateView: false },
                                                )
                                            }
                                        >
                                            <ChampionIcon
                                                championKey={row.champion.key}
                                                size={32}
                                                class="shrink-0 rounded-md"
                                            />
                                            <span>
                                                {localizedName(row.knowledge)}
                                            </span>
                                        </button>
                                    </th>
                                    <td class="px-4 py-3 text-neutral-400">
                                        {row.profile ? (
                                            row.isBaseline ? (
                                                t("championWide")
                                            ) : (
                                                term(
                                                    (
                                                        row.profile as KnowledgeStrategicProfile
                                                    ).role,
                                                )
                                            )
                                        ) : (
                                            <span title={t("roleNotAssessed")}>
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td class="px-4 py-3">
                                        <ObservedRoleBadges
                                            champion={row.knowledge}
                                            selectedRole={
                                                row.isBaseline
                                                    ? undefined
                                                    : (
                                                          row.profile as
                                                              | KnowledgeStrategicProfile
                                                              | undefined
                                                      )?.role
                                            }
                                        />
                                    </td>
                                    <td class="px-4 py-3">
                                        <Show
                                            when={row.profile}
                                            fallback={
                                                <span class="text-xs text-neutral-500">
                                                    {t("unassessed")}
                                                </span>
                                            }
                                        >
                                            {(profile) => (
                                                <StrategicColorChips
                                                    colors={profileColors(
                                                        profile(),
                                                        "main",
                                                    )}
                                                />
                                            )}
                                        </Show>
                                    </td>
                                    <td class="px-4 py-3">
                                        <Show
                                            when={row.profile}
                                            fallback={
                                                <span
                                                    class="text-neutral-500"
                                                    title={t("unassessed")}
                                                >
                                                    —
                                                </span>
                                            }
                                        >
                                            {(profile) => (
                                                <StrategicColorChips
                                                    colors={profileColors(
                                                        profile(),
                                                        "off",
                                                    )}
                                                />
                                            )}
                                        </Show>
                                    </td>
                                    <td class="px-4 py-3 text-xs text-neutral-400">
                                        <span
                                            classList={{
                                                "text-amber-300":
                                                    row.profile
                                                        ?.review_status ===
                                                    "provisional",
                                                "text-violet-300":
                                                    row.profile
                                                        ?.review_status ===
                                                    "historical",
                                            }}
                                        >
                                            {row.profile
                                                ? term(
                                                      row.profile.review_status,
                                                  )
                                                : t("unassessed")}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-xs">
                                        <Show
                                            when={row.profile}
                                            fallback={
                                                <span class="text-neutral-500">
                                                    —
                                                </span>
                                            }
                                        >
                                            {(profile) => (
                                                <details>
                                                    <summary class="text-accent cursor-pointer whitespace-nowrap">
                                                        {t("evidence")}
                                                    </summary>
                                                    <div class="min-w-56 max-w-xs py-3 text-neutral-400 leading-relaxed space-y-2">
                                                        <p>
                                                            {row.isBaseline
                                                                ? t(
                                                                      "referenceVersion",
                                                                  )
                                                                : t(
                                                                      "assessmentPatch",
                                                                  )}
                                                            :{" "}
                                                            {row.isBaseline
                                                                ? (
                                                                      profile() as KnowledgeColorBaseline
                                                                  )
                                                                      .source_version
                                                                : (
                                                                        profile() as KnowledgeStrategicProfile
                                                                    )
                                                                        .patch_version ===
                                                                    "unknown"
                                                                  ? t(
                                                                        "unknownPatch",
                                                                    )
                                                                  : (
                                                                        profile() as KnowledgeStrategicProfile
                                                                    )
                                                                        .patch_version}
                                                        </p>
                                                        <p lang="en">
                                                            {
                                                                profile()
                                                                    .reasoning
                                                            }
                                                        </p>
                                                        <p
                                                            lang="en"
                                                            class="break-words"
                                                        >
                                                            {sourceForKey(
                                                                profile()
                                                                    .source_key,
                                                            )?.label ??
                                                                profile()
                                                                    .source_key}
                                                        </p>
                                                        <Show
                                                            when={safeHttpUrl(
                                                                profile()
                                                                    .source_url,
                                                            )}
                                                        >
                                                            {(url) => (
                                                                <a
                                                                    href={url()}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="text-accent underline"
                                                                >
                                                                    {t(
                                                                        "reference",
                                                                    )}
                                                                </a>
                                                            )}
                                                        </Show>
                                                    </div>
                                                </details>
                                            )}
                                        </Show>
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
            <p class="text-xs text-neutral-500 leading-relaxed max-w-3xl">
                {t("colorsCoverage")}
            </p>
        </section>
    );
}
