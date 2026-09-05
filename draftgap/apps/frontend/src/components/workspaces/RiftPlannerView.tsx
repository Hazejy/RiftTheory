import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { useI18n } from "../../utils/i18n";
import RiftPlannerCanvas from "./rift-planner/RiftPlannerCanvas";
import RiftPlannerRoster from "./rift-planner/RiftPlannerRoster";
import RiftPlannerToolbar from "./rift-planner/RiftPlannerToolbar";
import {
    copyBoard,
    EMPTY_BOARD,
    emptyPlannerDocument,
    PlannerBoard,
    PlannerDocument,
    PlannerTool,
} from "./rift-planner/model";
import WorkspaceLibrary from "./WorkspaceLibrary";

const INK_COLORS = ["#f8fafc", "#38bdf8", "#fb7185", "#facc15", "#4ade80"];
const INK_WIDTHS = [2, 4, 7, 12];

export default function RiftPlannerView() {
    const { t } = useI18n();
    const { allyTeam, opponentTeam } = useDraft();
    const initial = emptyPlannerDocument();
    const [board, setBoard] = createSignal<PlannerBoard>({
        markers: initial.markers,
        strokes: initial.strokes,
        labels: initial.labels,
    });
    const [notes, setNotes] = createSignal(initial.notes);
    const [customRoster, setCustomRoster] = createSignal(initial.customRoster);
    const [history, setHistory] = createSignal<PlannerBoard[]>([]);
    const [tool, setTool] = createSignal<PlannerTool>({ kind: "select" });
    const [inkColor, setInkColor] = createSignal(INK_COLORS[0]);
    const [inkWidth, setInkWidth] = createSignal(INK_WIDTHS[1]);
    const [textDraft, setTextDraft] = createSignal("");

    const workspaceSnapshot = (): PlannerDocument => ({
        ...copyBoard(board()),
        notes: notes(),
        customRoster: [...customRoster()],
    });

    const openWorkspace = (document: PlannerDocument) => {
        setBoard(copyBoard(document));
        setNotes(document.notes ?? "");
        setCustomRoster([...(document.customRoster ?? [])]);
        setHistory([]);
        setTool({ kind: "select" });
    };

    const commitBoard = (next: PlannerBoard) => {
        setHistory((current) => [...current.slice(-49), copyBoard(board())]);
        setBoard(next);
    };

    const recordHistory = (previous: PlannerBoard) => {
        setHistory((current) => [...current.slice(-49), previous]);
    };

    const undo = () => {
        const previous = history().at(-1);
        if (!previous) return;
        setBoard(previous);
        setHistory((current) => current.slice(0, -1));
    };

    const clearMap = () => commitBoard(copyBoard(EMPTY_BOARD));

    const isBoardEmpty = () =>
        !board().markers.length &&
        !board().strokes.length &&
        !board().labels.length;

    const currentRoster = () => [
        ...allyTeam
            .filter((pick) => pick.championKey)
            .map((pick) => ({
                championKey: pick.championKey!,
                team: "blue" as const,
            })),
        ...opponentTeam
            .filter((pick) => pick.championKey)
            .map((pick) => ({
                championKey: pick.championKey!,
                team: "red" as const,
            })),
    ];

    const setToolKind = (kind: Exclude<PlannerTool["kind"], "champion">) => {
        setTool({ kind });
    };

    const isSelectedChampion = (entry: {
        championKey: string;
        team: "blue" | "red";
    }) => {
        const selectedTool = tool();
        return (
            selectedTool.kind === "champion" &&
            selectedTool.championKey === entry.championKey &&
            selectedTool.team === entry.team
        );
    };

    onMount(() => {
        const shortcuts: Record<
            string,
            Exclude<PlannerTool["kind"], "champion">
        > = {
            v: "select",
            b: "blue",
            r: "red",
            d: "draw",
            t: "text",
            w: "vision",
            o: "objective",
            e: "erase",
        };
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (
                target?.isContentEditable ||
                target?.matches("input, textarea, select")
            ) {
                return;
            }
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "z"
            ) {
                event.preventDefault();
                undo();
                return;
            }
            if (event.key === "Escape") {
                setTool({ kind: "select" });
                return;
            }
            const shortcut = shortcuts[event.key.toLowerCase()];
            if (!shortcut || event.ctrlKey || event.metaKey || event.altKey)
                return;
            event.preventDefault();
            setTool({ kind: shortcut });
        };
        window.addEventListener("keydown", onKeyDown);
        onCleanup(() => window.removeEventListener("keydown", onKeyDown));
    });

    return (
        <div class="h-full overflow-y-auto px-4 py-5 xl:px-8">
            <div class="mx-auto max-w-[1500px]">
                <header class="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-accent">
                            {t("tacticalWorkspace")}
                        </p>
                        <h2 class="mt-1 text-3xl font-semibold">
                            {t("riftPlanner")}
                        </h2>
                        <p class="mt-2 max-w-3xl text-sm text-neutral-400">
                            {t("riftPlannerIntro")}
                        </p>
                    </div>
                    <WorkspaceLibrary
                        kind="rift-planner"
                        getSnapshot={workspaceSnapshot}
                        onOpen={openWorkspace}
                    />
                </header>

                <Show when={tool().kind === "draw"}>
                    <div class="mb-3 flex items-center gap-2 rounded-lg border border-neutral-800 bg-primary px-3 py-2 text-sm">
                        <span class="mr-1 text-neutral-400">
                            {t("inkColor")}
                        </span>
                        <For each={INK_COLORS}>
                            {(color) => (
                                <button
                                    type="button"
                                    class="h-6 w-6 rounded-full border-2"
                                    classList={{
                                        "border-white": inkColor() === color,
                                        "border-transparent":
                                            inkColor() !== color,
                                    }}
                                    style={{ background: color }}
                                    aria-label={`${t("inkColor")}: ${color}`}
                                    onClick={() => setInkColor(color)}
                                />
                            )}
                        </For>
                        <span class="mx-2 h-6 w-px bg-neutral-700" />
                        <span class="mr-1 text-neutral-400">
                            {t("penSize")}
                        </span>
                        <For each={INK_WIDTHS}>
                            {(width) => (
                                <button
                                    type="button"
                                    class="flex h-8 w-9 items-center justify-center rounded-md border transition-colors"
                                    classList={{
                                        "border-accent bg-accent/10":
                                            inkWidth() === width,
                                        "border-neutral-700 hover:border-neutral-500":
                                            inkWidth() !== width,
                                    }}
                                    aria-label={`${t("penSize")}: ${width}`}
                                    onClick={() => setInkWidth(width)}
                                >
                                    <span
                                        class="w-5 rounded-full bg-neutral-100"
                                        style={{
                                            height: `${Math.max(2, width / 2)}px`,
                                        }}
                                    />
                                </button>
                            )}
                        </For>
                    </div>
                </Show>
                <Show when={tool().kind === "text"}>
                    <label class="mb-3 flex max-w-xl items-center gap-3 rounded-lg border border-neutral-800 bg-primary px-3 py-2 text-sm">
                        <span class="shrink-0 text-neutral-400">
                            {t("labelText")}
                        </span>
                        <input
                            class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-600"
                            value={textDraft()}
                            placeholder={t("labelTextPlaceholder")}
                            onInput={(event) =>
                                setTextDraft(event.currentTarget.value)
                            }
                        />
                    </label>
                </Show>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div class="flex min-w-0 flex-col items-start justify-center gap-2 xl:flex-row">
                        <RiftPlannerToolbar
                            tool={tool()}
                            setTool={setToolKind}
                            canUndo={Boolean(history().length)}
                            canClear={!isBoardEmpty()}
                            undo={undo}
                            clear={clearMap}
                        />
                        <RiftPlannerCanvas
                            board={board()}
                            tool={tool()}
                            inkColor={inkColor()}
                            inkWidth={inkWidth()}
                            textDraft={textDraft()}
                            setBoard={setBoard}
                            commitBoard={commitBoard}
                            recordHistory={recordHistory}
                        />
                    </div>

                    <aside class="grid content-start gap-4">
                        <RiftPlannerRoster
                            currentEntries={currentRoster()}
                            customEntries={customRoster()}
                            setCustomEntries={setCustomRoster}
                            isSelected={isSelectedChampion}
                            onSelect={(entry) =>
                                setTool({ kind: "champion", ...entry })
                            }
                        />
                        <section class="rounded-xl border border-neutral-800 bg-primary p-4">
                            <h3 class="font-semibold">{t("gameNotes")}</h3>
                            <textarea
                                class="mt-3 min-h-44 w-full resize-y rounded-lg border border-neutral-700 bg-canvas p-3 text-sm outline-none focus:border-accent"
                                placeholder={t("gameNotesPlaceholder")}
                                value={notes()}
                                onInput={(event) =>
                                    setNotes(event.currentTarget.value)
                                }
                            />
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
