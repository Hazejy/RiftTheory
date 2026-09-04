import { createMemo, createSignal, For, Show } from "solid-js";
import { ChampionData } from "@draftgap/core/src/models/dataset/ChampionData";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import { useDraft } from "../../contexts/DraftContext";
import { Icon, informationCircle } from "../icons/RiftIcons";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../utils/i18n";
import { ChampionIcon } from "../icons/ChampionIcon";
import strategicProfiles from "../../../../../../data/strategic_profiles.json";
import { COLOR_GUIDE } from "../../locales/colorGuide";

type StrategicProfile = (typeof strategicProfiles)[number];
type ColorRow = { champion: ChampionData; profile?: StrategicProfile };

const COLORS = ["white", "blue", "black", "red", "green", "colorless"] as const;
const ROLES = ["top", "jungle", "mid", "bot", "support"] as const;
const COLOR_STYLES: Record<
    string,
    { background: string; color: string; "border-color": string }
> = {
    white: {
        background: "#eeeadd",
        color: "#333126",
        "border-color": "#d7d1bc",
    },
    blue: {
        background: "#132e52",
        color: "#a9d0ff",
        "border-color": "#355c85",
    },
    black: {
        background: "#26212d",
        color: "#d8c8e5",
        "border-color": "#665672",
    },
    red: { background: "#421d25", color: "#ffb9bb", "border-color": "#83424b" },
    green: {
        background: "#163a2a",
        color: "#a3e0ba",
        "border-color": "#3e7653",
    },
    colorless: {
        background: "#293036",
        color: "#dae0e5",
        "border-color": "#65717b",
    },
};

const profilesByChampion = new Map<string, StrategicProfile[]>();
for (const profile of strategicProfiles) {
    const profiles = profilesByChampion.get(profile.champion_name) ?? [];
    profiles.push(profile);
    profilesByChampion.set(profile.champion_name, profiles);
}

function ColorChips(props: { colors: readonly string[] }) {
    const { t, term } = useI18n();
    return (
        <div class="flex flex-wrap gap-1.5">
            <For
                each={props.colors}
                fallback={
                    <span class="text-neutral-500 text-xs">{t("none")}</span>
                }
            >
                {(color) => (
                    <span
                        class="inline-flex rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
                        style={COLOR_STYLES[color]}
                    >
                        {term(color)}
                    </span>
                )}
            </For>
        </div>
    );
}

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
                                <ColorChips colors={[color]} />
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
    const { config } = useUser();
    const { allyTeam, opponentTeam, bans, activeDraftPick, pickNextChampion } =
        useDraft();
    const { t, term } = useI18n();
    const [search, setSearch] = createSignal("");
    const [role, setRole] = createSignal("");
    const [color, setColor] = createSignal("");
    const [coverage, setCoverage] = createSignal("");
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

    const champions = createMemo(() =>
        Object.values(dataset()?.championData ?? {}).sort((a, b) =>
            championName(a, config).localeCompare(
                championName(b, config),
                config.language.replace("_", "-"),
            ),
        ),
    );
    const rows = createMemo(() =>
        champions().flatMap<ColorRow>((champion) => {
            const profiles = profilesByChampion.get(champion.name);
            return profiles?.length
                ? profiles.map((profile) => ({ champion, profile }))
                : [{ champion }];
        }),
    );
    const profiledCount = createMemo(
        () =>
            champions().filter((champion) =>
                profilesByChampion.has(champion.name),
            ).length,
    );
    const filtered = createMemo(() => {
        const query = normalizeChampionSearch(search());
        return rows().filter((row) => {
            if (
                query &&
                !normalizeChampionSearch(row.champion.name).includes(query) &&
                !normalizeChampionSearch(
                    championName(row.champion, config),
                ).includes(query)
            )
                return false;
            if (role() && row.profile?.role !== role()) return false;
            if (
                color() &&
                ![
                    ...(row.profile?.identity.main_colors ?? []),
                    ...(row.profile?.identity.off_colors ?? []),
                ].includes(color())
            )
                return false;
            if (coverage() === "profiled" && !row.profile) return false;
            if (coverage() === "missing" && row.profile) return false;
            return true;
        });
    });
    const clearFilters = () => {
        setSearch("");
        setRole("");
        setColor("");
        setCoverage("");
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
            <p class="text-xs text-neutral-400 leading-relaxed">
                {t("colorsPickHelp")}
            </p>

            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                <For
                    each={[
                        { label: t("champions"), count: champions().length },
                        { label: t("profiles"), count: profiledCount() },
                        {
                            label: t("noProfile"),
                            count: champions().length - profiledCount(),
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
                    aria-label={t("allColors")}
                    value={color()}
                    onChange={(event) => setColor(event.currentTarget.value)}
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
                    disabled={!search() && !role() && !color() && !coverage()}
                >
                    {t("clearFilters")}
                </button>
            </div>

            <div class="flex flex-wrap justify-between gap-2 text-xs text-neutral-400">
                <p role="status" aria-live="polite">
                    {t("shownRows")}: {filtered().length}
                </p>
                <p>
                    {t("cataloguePatch")}: {dataset()?.version} ·{" "}
                    {t("sourceLanguage")}
                </p>
            </div>
            <div class="rounded-xl border border-neutral-700 overflow-auto max-h-[65vh] bg-primary">
                <table class="w-full min-w-[680px] border-collapse text-sm">
                    <caption class="sr-only">{t("champColors")}</caption>
                    <thead class="sticky top-0 z-10 bg-panel-inset text-neutral-400 text-xs">
                        <tr>
                            <For
                                each={
                                    [
                                        "champion",
                                        "role",
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
                                        colSpan={6}
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
                                            aria-label={`${t("addToDraft")}: ${championName(row.champion, config)}`}
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
                                                {championName(
                                                    row.champion,
                                                    config,
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <td class="px-4 py-3 text-neutral-400">
                                        {row.profile ? (
                                            term(row.profile.role)
                                        ) : (
                                            <span title={t("roleNotAssessed")}>
                                                —
                                            </span>
                                        )}
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
                                                <ColorChips
                                                    colors={
                                                        profile().identity
                                                            .main_colors
                                                    }
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
                                                <ColorChips
                                                    colors={
                                                        profile().identity
                                                            .off_colors
                                                    }
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
                                                            {t(
                                                                "assessmentPatch",
                                                            )}
                                                            :{" "}
                                                            {profile().patch ??
                                                                t(
                                                                    "unknownPatch",
                                                                )}
                                                        </p>
                                                        <p lang="en">
                                                            {
                                                                profile()
                                                                    .identity
                                                                    .reasoning
                                                            }
                                                        </p>
                                                        <p
                                                            lang="en"
                                                            class="break-words"
                                                        >
                                                            {
                                                                profile()
                                                                    .identity
                                                                    .source_name
                                                            }
                                                        </p>
                                                        <Show
                                                            when={
                                                                profile()
                                                                    .source_url &&
                                                                /^https?:\/\//.test(
                                                                    profile()
                                                                        .source_url,
                                                                )
                                                            }
                                                        >
                                                            <a
                                                                href={
                                                                    profile()
                                                                        .source_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                class="text-accent underline"
                                                            >
                                                                {t("reference")}
                                                            </a>
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
