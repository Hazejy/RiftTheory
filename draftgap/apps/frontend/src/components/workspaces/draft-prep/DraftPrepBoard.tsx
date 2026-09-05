import { Setter, createMemo, createSignal, For, Show } from "solid-js";
import { useDataset } from "../../../contexts/DatasetContext";
import { useUser } from "../../../contexts/UserContext";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";
import { Icon, trash } from "../../icons/RiftIcons";
import {
    createPrepScenario,
    PrepDocument,
    PrepScenario,
    PrepSide,
    PrepSlot,
} from "./model";

type SelectedSlot = { scenarioId: string; slot: PrepSlot };
const SLOT_NUMBERS = [0, 1, 2, 3, 4] as const;

export default function DraftPrepBoard(props: {
    document: PrepDocument;
    setDocument: Setter<PrepDocument>;
}) {
    const { t } = useI18n();
    const { dataset } = useDataset();
    const { config } = useUser();
    const [selectedSlot, setSelectedSlot] = createSignal<SelectedSlot>();
    const [search, setSearch] = createSignal("");

    const gameNumbers = createMemo(() => {
        const highest = Math.max(
            1,
            ...props.document.scenarios.map((scenario) => scenario.gameNumber),
        );
        return Array.from({ length: highest }, (_, index) => index + 1);
    });
    const champions = createMemo(() => {
        const data = dataset();
        if (!data) return [];
        const query = normalizeChampionSearch(search());
        return Object.entries(data.championData)
            .map(([key, champion]) => ({
                key,
                name: championName(champion, config),
            }))
            .filter(({ name }) => normalizeChampionSearch(name).includes(query))
            .sort((left, right) => left.name.localeCompare(right.name));
    });

    const updateScenario = (
        scenarioId: string,
        update: (scenario: PrepScenario) => PrepScenario,
    ) =>
        props.setDocument((current) => ({
            ...current,
            scenarios: current.scenarios.map((scenario) =>
                scenario.id === scenarioId ? update(scenario) : scenario,
            ),
        }));

    const addScenario = (gameNumber: number) =>
        props.setDocument((current) => ({
            ...current,
            scenarios: [
                ...current.scenarios,
                createPrepScenario(
                    gameNumber,
                    current.scenarios.filter(
                        (scenario) => scenario.gameNumber === gameNumber,
                    ).length,
                ),
            ],
        }));

    const addGame = () => addScenario(gameNumbers().length + 1);

    const duplicateScenario = (scenario: PrepScenario) =>
        props.setDocument((current) => ({
            ...current,
            scenarios: [
                ...current.scenarios,
                {
                    ...scenario,
                    id: crypto.randomUUID(),
                    title: `${scenario.title} — ${t("copy")}`,
                    selections: { ...scenario.selections },
                },
            ],
        }));

    const removeScenario = (scenarioId: string) => {
        props.setDocument((current) => ({
            ...current,
            scenarios: current.scenarios.filter(
                (scenario) => scenario.id !== scenarioId,
            ),
        }));
        if (selectedSlot()?.scenarioId === scenarioId)
            setSelectedSlot(undefined);
    };

    const selectChampion = (championKey: string) => {
        const selected = selectedSlot();
        if (!selected) return;
        updateScenario(selected.scenarioId, (scenario) => ({
            ...scenario,
            selections: {
                ...scenario.selections,
                [selected.slot]: championKey,
            },
        }));
    };

    return (
        <div class="grid min-h-[650px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main class="min-w-0 space-y-4">
                <Show
                    when={props.document.scenarios.length}
                    fallback={
                        <button
                            type="button"
                            class="w-full rounded-xl border border-dashed border-neutral-700 bg-primary/50 p-16 text-center hover:border-accent"
                            onClick={() => addScenario(1)}
                        >
                            <span class="block text-lg font-semibold">
                                {t("startDraftPrep")}
                            </span>
                            <span class="mt-2 block text-sm text-neutral-500">
                                {t("visualPrepHint")}
                            </span>
                        </button>
                    }
                >
                    <For each={gameNumbers()}>
                        {(gameNumber) => {
                            const scenarios = () =>
                                props.document.scenarios.filter(
                                    (scenario) =>
                                        scenario.gameNumber === gameNumber,
                                );
                            return (
                                <section class="overflow-hidden rounded-xl border border-neutral-700 bg-primary/40">
                                    <header class="flex items-center justify-between border-b border-neutral-700 bg-accent/10 px-4 py-2.5">
                                        <h3 class="text-sm font-semibold text-accent">
                                            {t("game")} {gameNumber}
                                        </h3>
                                        <button
                                            type="button"
                                            class="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-accent hover:text-accent"
                                            onClick={() =>
                                                addScenario(gameNumber)
                                            }
                                        >
                                            + {t("newScenario")}
                                        </button>
                                    </header>
                                    <div class="grid gap-3 p-3 lg:grid-cols-2 2xl:grid-cols-3">
                                        <For each={scenarios()}>
                                            {(scenario) => (
                                                <ScenarioCard
                                                    scenario={scenario}
                                                    selectedSlot={selectedSlot()}
                                                    setSelectedSlot={
                                                        setSelectedSlot
                                                    }
                                                    updateScenario={
                                                        updateScenario
                                                    }
                                                    duplicate={() =>
                                                        duplicateScenario(
                                                            scenario,
                                                        )
                                                    }
                                                    remove={() =>
                                                        removeScenario(
                                                            scenario.id,
                                                        )
                                                    }
                                                />
                                            )}
                                        </For>
                                    </div>
                                </section>
                            );
                        }}
                    </For>
                    <button
                        type="button"
                        class="w-full rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-500 hover:border-accent hover:text-accent"
                        onClick={addGame}
                    >
                        + {t("addGame")}
                    </button>
                </Show>
            </main>

            <aside class="h-fit rounded-xl border border-neutral-700 bg-primary p-4 xl:sticky xl:top-16">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            {t("championPool")}
                        </p>
                        <h3 class="mt-1 font-semibold">
                            {selectedSlot()
                                ? t("chooseChampion")
                                : t("selectPrepSlot")}
                        </h3>
                    </div>
                    <Show when={selectedSlot()}>
                        <button
                            type="button"
                            class="text-xs text-neutral-500 hover:text-white"
                            onClick={() => setSelectedSlot(undefined)}
                        >
                            {t("close")}
                        </button>
                    </Show>
                </div>
                <input
                    class="mt-3 w-full rounded-lg border border-neutral-700 bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder={t("search")}
                    value={search()}
                    onInput={(event) => setSearch(event.currentTarget.value)}
                />
                <div class="mt-3 grid max-h-[560px] grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                    <For each={champions()}>
                        {(champion) => (
                            <button
                                type="button"
                                disabled={!selectedSlot()}
                                title={champion.name}
                                class="aspect-square overflow-hidden rounded-md border border-neutral-700 bg-canvas disabled:opacity-35 hover:enabled:border-accent"
                                onClick={() => selectChampion(champion.key)}
                            >
                                <ChampionIcon
                                    championKey={champion.key}
                                    size={58}
                                    cover
                                    class="h-full! w-full!"
                                />
                            </button>
                        )}
                    </For>
                </div>
            </aside>
        </div>
    );
}

function ScenarioCard(props: {
    scenario: PrepScenario;
    selectedSlot?: SelectedSlot;
    setSelectedSlot: (value?: SelectedSlot) => void;
    updateScenario: (
        id: string,
        update: (scenario: PrepScenario) => PrepScenario,
    ) => void;
    duplicate: () => void;
    remove: () => void;
}) {
    const { t } = useI18n();
    const update = <K extends keyof PrepScenario>(
        key: K,
        value: PrepScenario[K],
    ) =>
        props.updateScenario(props.scenario.id, (scenario) => ({
            ...scenario,
            [key]: value,
        }));

    return (
        <article class="overflow-hidden rounded-lg border border-neutral-700 bg-canvas/80 shadow-lg">
            <div class="flex items-center gap-2 border-b border-neutral-700 px-3 py-2">
                <input
                    aria-label={t("scenarioName")}
                    class="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none focus:text-accent"
                    value={props.scenario.title}
                    onInput={(event) =>
                        update("title", event.currentTarget.value)
                    }
                />
                <button
                    type="button"
                    class="text-[10px] text-neutral-500 hover:text-white"
                    onClick={() => props.duplicate()}
                >
                    {t("copy")}
                </button>
                <button
                    type="button"
                    aria-label={t("deleteScenario")}
                    class="text-neutral-600 hover:text-opponent"
                    onClick={() => props.remove()}
                >
                    <Icon path={trash} class="h-4 w-4" />
                </button>
            </div>

            <div class="grid grid-cols-2 border-b border-neutral-800">
                <input
                    class="min-w-0 border-r border-neutral-800 bg-transparent px-3 py-2 text-xs outline-none focus:bg-primary"
                    placeholder={t("matchupPlaceholder")}
                    value={props.scenario.matchup}
                    onInput={(event) =>
                        update("matchup", event.currentTarget.value)
                    }
                />
                <select
                    class="bg-transparent px-3 py-2 text-xs outline-none focus:bg-primary"
                    value={props.scenario.side}
                    onChange={(event) =>
                        update("side", event.currentTarget.value as PrepSide)
                    }
                >
                    <option value="either">{t("eitherSide")}</option>
                    <option value="blue">{t("blueSide")}</option>
                    <option value="red">{t("redSide")}</option>
                </select>
            </div>

            <DraftSlotSection
                scenario={props.scenario}
                kind="ban"
                selectedSlot={props.selectedSlot}
                setSelectedSlot={props.setSelectedSlot}
            />
            <DraftSlotSection
                scenario={props.scenario}
                kind="pick"
                selectedSlot={props.selectedSlot}
                setSelectedSlot={props.setSelectedSlot}
            />

            <textarea
                class="min-h-16 w-full resize-y border-t border-neutral-800 bg-transparent px-3 py-2 text-xs outline-none placeholder:text-neutral-700 focus:bg-primary"
                placeholder={t("scenarioNotesPlaceholder")}
                value={props.scenario.notes}
                onInput={(event) => update("notes", event.currentTarget.value)}
            />
        </article>
    );
}

function DraftSlotSection(props: {
    scenario: PrepScenario;
    kind: "pick" | "ban";
    selectedSlot?: SelectedSlot;
    setSelectedSlot: (value?: SelectedSlot) => void;
}) {
    const { t } = useI18n();
    return (
        <section
            class="grid grid-cols-2 gap-2 p-2"
            classList={{
                "border-b border-neutral-800 bg-opponent/[0.06]":
                    props.kind === "ban",
                "bg-emerald-500/[0.05]": props.kind === "pick",
            }}
        >
            <For each={["blue", "red"] as const}>
                {(side) => (
                    <div>
                        <p
                            class="mb-1 text-[9px] font-semibold uppercase tracking-wider"
                            classList={{
                                "text-ally": side === "blue",
                                "text-opponent": side === "red",
                            }}
                        >
                            {side === "blue" ? "Blue" : "Red"} ·{" "}
                            {t(props.kind === "pick" ? "picks" : "bans")}
                        </p>
                        <div class="grid grid-cols-5 gap-1">
                            <For each={SLOT_NUMBERS}>
                                {(slotIndex) => {
                                    const slot =
                                        `${side}-${props.kind}-${slotIndex}` as PrepSlot;
                                    const championKey = () =>
                                        props.scenario.selections[slot];
                                    const selected = () =>
                                        props.selectedSlot?.scenarioId ===
                                            props.scenario.id &&
                                        props.selectedSlot.slot === slot;
                                    return (
                                        <button
                                            type="button"
                                            title={`${side === "blue" ? "B" : "R"}${props.kind === "ban" ? "B" : ""}${slotIndex + 1}`}
                                            class="relative aspect-square overflow-hidden rounded border bg-primary text-[9px] text-neutral-600"
                                            classList={{
                                                "border-accent ring-1 ring-accent":
                                                    selected(),
                                                "border-neutral-700":
                                                    !selected(),
                                                grayscale:
                                                    props.kind === "ban" &&
                                                    Boolean(championKey()),
                                            }}
                                            onClick={() =>
                                                props.setSelectedSlot({
                                                    scenarioId:
                                                        props.scenario.id,
                                                    slot,
                                                })
                                            }
                                        >
                                            <Show
                                                when={championKey()}
                                                fallback={
                                                    <span>
                                                        {side === "blue"
                                                            ? "B"
                                                            : "R"}
                                                        {slotIndex + 1}
                                                    </span>
                                                }
                                            >
                                                {(key) => (
                                                    <ChampionIcon
                                                        championKey={key()}
                                                        size={44}
                                                        cover
                                                        class="h-full! w-full!"
                                                    />
                                                )}
                                            </Show>
                                        </button>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                )}
            </For>
        </section>
    );
}
