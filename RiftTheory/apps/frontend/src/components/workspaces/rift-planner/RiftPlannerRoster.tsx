import { createMemo, createSignal, For, Setter, Show, untrack } from "solid-js";
import { useDataset } from "../../../contexts/DatasetContext";
import { useUser } from "../../../contexts/UserContext";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";
import { Icon, trash } from "../../icons/RiftIcons";
import { PLANNER_CHAMPION_DRAG_TYPE, PlannerChampionDrag } from "./model";

type RosterMode = "draft" | "custom";

export default function RiftPlannerRoster(props: {
    currentEntries: PlannerChampionDrag[];
    customEntries: PlannerChampionDrag[];
    setCustomEntries: Setter<PlannerChampionDrag[]>;
    isSelected: (entry: PlannerChampionDrag) => boolean;
    onSelect: (entry: PlannerChampionDrag) => void;
    championSize: number;
    setChampionSize: Setter<number>;
}) {
    const { t } = useI18n();
    const { dataset } = useDataset();
    const { config } = useUser();
    const [mode, setMode] = createSignal<RosterMode>(
        untrack(() => props.currentEntries.length) ? "draft" : "custom",
    );
    const [team, setTeam] = createSignal<"blue" | "red">("blue");
    const [search, setSearch] = createSignal("");

    const entries = () =>
        (mode() === "draft"
            ? props.currentEntries
            : props.customEntries
        ).filter((entry) => entry.team === team());
    const availableChampions = createMemo(() => {
        const data = dataset();
        if (!data || mode() !== "custom") return [];
        const query = normalizeChampionSearch(search());
        const used = new Set(
            props.customEntries
                .filter((entry) => entry.team === team())
                .map((entry) => entry.championKey),
        );
        return Object.entries(data.championData)
            .filter(
                ([key, champion]) =>
                    !used.has(key) &&
                    normalizeChampionSearch(
                        championName(champion, config),
                    ).includes(query),
            )
            .map(([key, champion]) => ({
                key,
                name: championName(champion, config),
            }))
            .sort((left, right) => left.name.localeCompare(right.name))
            .slice(0, 60);
    });

    const addChampion = (championKey: string) => {
        const selectedTeam = team();
        if (
            props.customEntries.filter((entry) => entry.team === selectedTeam)
                .length >= 5
        )
            return;
        props.setCustomEntries((current) => [
            ...current,
            { championKey, team: selectedTeam },
        ]);
        setSearch("");
    };

    const removeChampion = (entry: PlannerChampionDrag) =>
        props.setCustomEntries((current) =>
            current.filter(
                (candidate) =>
                    candidate.championKey !== entry.championKey ||
                    candidate.team !== entry.team,
            ),
        );

    return (
        <section class="rounded-xl border border-neutral-800 bg-primary p-4">
            <div class="flex items-center justify-between gap-3">
                <h3 class="font-semibold">{t("draftRoster")}</h3>
                <div class="flex rounded-lg border border-neutral-700 bg-canvas p-0.5">
                    <For each={["draft", "custom"] as const}>
                        {(value) => (
                            <button
                                type="button"
                                class="rounded-md px-2 py-1 text-[11px] font-semibold"
                                classList={{
                                    "bg-neutral-700 text-white":
                                        mode() === value,
                                    "text-neutral-500 hover:text-neutral-200":
                                        mode() !== value,
                                }}
                                onClick={() => setMode(value)}
                            >
                                {t(
                                    value === "draft"
                                        ? "currentDraft"
                                        : "customRoster",
                                )}
                            </button>
                        )}
                    </For>
                </div>
            </div>
            <p class="mt-1 text-xs text-neutral-500">{t("draftRosterHint")}</p>

            <label class="mt-3 block rounded-lg border border-neutral-800 bg-panel-inset px-3 py-2.5">
                <span class="flex items-center justify-between gap-3 text-xs">
                    <span class="font-medium text-neutral-300">
                        {t("championMarkerSize")}
                    </span>
                    <output class="tabular-nums text-accent">
                        {props.championSize}px
                    </output>
                </span>
                <input
                    type="range"
                    min="24"
                    max="64"
                    step="2"
                    value={props.championSize}
                    class="mt-2 w-full accent-accent"
                    aria-label={t("championMarkerSize")}
                    onInput={(event) =>
                        props.setChampionSize(Number(event.currentTarget.value))
                    }
                />
                <span class="mt-0.5 flex justify-between text-[10px] uppercase tracking-wider text-neutral-600">
                    <span>{t("smaller")}</span>
                    <span>{t("larger")}</span>
                </span>
            </label>

            <div class="mt-3 grid grid-cols-2 gap-2">
                <For each={["blue", "red"] as const}>
                    {(side) => (
                        <button
                            type="button"
                            class="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                            classList={{
                                "border-ally bg-ally/10 text-ally":
                                    side === "blue" && team() === side,
                                "border-opponent bg-opponent/10 text-opponent":
                                    side === "red" && team() === side,
                                "border-neutral-700 text-neutral-500":
                                    team() !== side,
                            }}
                            onClick={() => setTeam(side)}
                        >
                            {t(side === "blue" ? "blueSide" : "redSide")}
                        </button>
                    )}
                </For>
            </div>

            <Show
                when={entries().length}
                fallback={
                    <p class="mt-4 rounded-lg border border-dashed border-neutral-700 px-3 py-5 text-center text-sm text-neutral-500">
                        {mode() === "draft"
                            ? t("noDraftRoster")
                            : t("emptyRoster")}
                    </p>
                }
            >
                <div class="mt-3 grid grid-cols-5 gap-2">
                    <For each={entries()}>
                        {(entry) => {
                            const name = () =>
                                championName(
                                    dataset()!.championData[entry.championKey],
                                    config,
                                );
                            return (
                                <div class="group relative">
                                    <button
                                        type="button"
                                        draggable={true}
                                        title={`${name()} · ${t("dragToMap")}`}
                                        aria-label={`${t("placeChampion")}: ${name()}`}
                                        class="aspect-square w-full overflow-hidden rounded-lg border border-neutral-700 p-0.5"
                                        classList={{
                                            "border-ally":
                                                entry.team === "blue",
                                            "border-opponent":
                                                entry.team === "red",
                                            "ring-2 ring-accent":
                                                props.isSelected(entry),
                                        }}
                                        onClick={() => props.onSelect(entry)}
                                        onDragStart={(event) => {
                                            event.dataTransfer?.setData(
                                                "text/plain",
                                                JSON.stringify(entry),
                                            );
                                            event.dataTransfer?.setData(
                                                PLANNER_CHAMPION_DRAG_TYPE,
                                                JSON.stringify(entry),
                                            );
                                            if (event.dataTransfer)
                                                event.dataTransfer.effectAllowed =
                                                    "copy";
                                        }}
                                    >
                                        <ChampionIcon
                                            championKey={entry.championKey}
                                            size={42}
                                            cover
                                            class="h-full! w-full!"
                                        />
                                    </button>
                                    <Show when={mode() === "custom"}>
                                        <button
                                            type="button"
                                            aria-label={t("remove")}
                                            class="absolute -right-1 -top-1 hidden rounded-full border border-neutral-600 bg-canvas p-1 text-neutral-300 shadow group-hover:block"
                                            onClick={() =>
                                                removeChampion(entry)
                                            }
                                        >
                                            <Icon
                                                path={trash}
                                                class="h-3 w-3"
                                            />
                                        </button>
                                    </Show>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </Show>

            <Show when={mode() === "custom"}>
                <div class="mt-4 border-t border-neutral-800 pt-3">
                    <input
                        aria-label={t("addChampion")}
                        class="w-full rounded-lg border border-neutral-700 bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
                        placeholder={t("addChampion")}
                        value={search()}
                        onInput={(event) =>
                            setSearch(event.currentTarget.value)
                        }
                    />
                    <Show when={search().trim()}>
                        <div class="mt-2 grid max-h-44 grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                            <For each={availableChampions()}>
                                {(champion) => (
                                    <button
                                        type="button"
                                        title={champion.name}
                                        class="aspect-square overflow-hidden rounded-md border border-neutral-700 hover:border-accent"
                                        onClick={() =>
                                            addChampion(champion.key)
                                        }
                                    >
                                        <ChampionIcon
                                            championKey={champion.key}
                                            size={42}
                                            class="h-full! w-full!"
                                        />
                                    </button>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </Show>
        </section>
    );
}
