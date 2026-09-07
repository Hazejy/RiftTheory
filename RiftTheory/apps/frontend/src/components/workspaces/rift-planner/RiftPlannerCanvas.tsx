import { createSignal, For, Show } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";
import { Icon, eye, strategy } from "../../icons/RiftIcons";
import {
    copyBoard,
    MapPoint,
    PlannerBoard,
    PlannerLabel,
    PlannerMarker,
    PlannerStroke,
    PlannerTool,
    PLANNER_CHAMPION_DRAG_TYPE,
    PlannerChampionDrag,
} from "./model";

type Props = {
    board: PlannerBoard;
    tool: PlannerTool;
    inkColor: string;
    inkWidth: number;
    textDraft: string;
    setBoard: (board: PlannerBoard) => void;
    commitBoard: (board: PlannerBoard) => void;
    recordHistory: (board: PlannerBoard) => void;
    championSize: number;
};

type DragTarget = {
    kind: "marker" | "label";
    id: string;
    before: PlannerBoard;
};

function pathFor(points: MapPoint[]) {
    return points
        .map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`)
        .join(" ");
}

export default function RiftPlannerCanvas(props: Props) {
    const { t } = useI18n();
    const [draftStroke, setDraftStroke] = createSignal<MapPoint[] | null>(null);
    const [dragTarget, setDragTarget] = createSignal<DragTarget | null>(null);
    const [dragPoint, setDragPoint] = createSignal<MapPoint | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>();
    let mapElement!: HTMLDivElement;

    const pointFromEvent = (event: {
        clientX: number;
        clientY: number;
    }): MapPoint => {
        const bounds = mapElement.getBoundingClientRect();
        return {
            x: Math.max(
                0,
                Math.min(
                    100,
                    ((event.clientX - bounds.left) / bounds.width) * 100,
                ),
            ),
            y: Math.max(
                0,
                Math.min(
                    100,
                    ((event.clientY - bounds.top) / bounds.height) * 100,
                ),
            ),
        };
    };

    const addMarker = (point: MapPoint) => {
        const selectedTool = props.tool;
        if (
            selectedTool.kind === "select" ||
            selectedTool.kind === "draw" ||
            selectedTool.kind === "text" ||
            selectedTool.kind === "erase"
        ) {
            return;
        }
        const marker: PlannerMarker = {
            id: crypto.randomUUID(),
            kind: selectedTool.kind,
            ...point,
            ...(selectedTool.kind === "champion"
                ? {
                      championKey: selectedTool.championKey,
                      team: selectedTool.team,
                  }
                : {}),
        };
        props.commitBoard({
            ...props.board,
            markers: [...props.board.markers, marker],
        });
    };

    const dropChampion = (event: DragEvent) => {
        event.preventDefault();
        const raw =
            event.dataTransfer?.getData(PLANNER_CHAMPION_DRAG_TYPE) ||
            event.dataTransfer?.getData("text/plain");
        if (!raw) return;
        try {
            const entry = JSON.parse(raw) as PlannerChampionDrag;
            if (
                typeof entry.championKey !== "string" ||
                (entry.team !== "blue" && entry.team !== "red")
            ) {
                return;
            }
            props.commitBoard({
                ...props.board,
                markers: [
                    ...props.board.markers,
                    {
                        id: crypto.randomUUID(),
                        kind: "champion",
                        championKey: entry.championKey,
                        team: entry.team,
                        ...pointFromEvent(event),
                    },
                ],
            });
        } catch {
            return;
        }
    };

    const addLabel = (point: MapPoint) => {
        const text = props.textDraft.trim();
        if (!text) return;
        const label: PlannerLabel = { id: crypto.randomUUID(), text, ...point };
        props.commitBoard({
            ...props.board,
            labels: [...props.board.labels, label],
        });
    };

    const removeElement = (kind: DragTarget["kind"] | "stroke", id: string) => {
        if (kind === "marker") {
            props.commitBoard({
                ...props.board,
                markers: props.board.markers.filter(
                    (marker) => marker.id !== id,
                ),
            });
        } else if (kind === "label") {
            props.commitBoard({
                ...props.board,
                labels: props.board.labels.filter((label) => label.id !== id),
            });
        } else {
            props.commitBoard({
                ...props.board,
                strokes: props.board.strokes.filter(
                    (stroke) => stroke.id !== id,
                ),
            });
        }
        setSelectedId(undefined);
    };

    const onMapPointerDown = (
        event: PointerEvent & { currentTarget: HTMLDivElement },
    ) => {
        if (event.button !== 0) return;
        const point = pointFromEvent(event);
        if (props.tool.kind === "draw") {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDraftStroke([point]);
        } else if (props.tool.kind === "text") {
            addLabel(point);
        } else {
            addMarker(point);
        }
    };

    const onMapPointerMove = (event: PointerEvent) => {
        if (!draftStroke()) return;
        const point = pointFromEvent(event);
        setDraftStroke((current) => (current ? [...current, point] : null));
    };

    const finishStroke = () => {
        const points = draftStroke();
        setDraftStroke(null);
        if (!points || points.length < 2) return;
        const stroke: PlannerStroke = {
            id: crypto.randomUUID(),
            color: props.inkColor,
            width: props.inkWidth,
            points,
        };
        props.commitBoard({
            ...props.board,
            strokes: [...props.board.strokes, stroke],
        });
    };

    const startDrag = (
        event: PointerEvent & { currentTarget: HTMLButtonElement },
        kind: DragTarget["kind"],
        id: string,
    ) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        if (props.tool.kind === "erase") {
            removeElement(kind, id);
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        setSelectedId(id);
        setDragTarget({ kind, id, before: copyBoard(props.board) });
        setDragPoint(pointFromEvent(event));
    };

    const moveDragged = (event: PointerEvent) => {
        const target = dragTarget();
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        setDragPoint(pointFromEvent(event));
    };

    const finishDrag = (event: PointerEvent) => {
        const target = dragTarget();
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const point = dragPoint();
        if (point) {
            props.setBoard({
                ...props.board,
                markers:
                    target.kind === "marker"
                        ? props.board.markers.map((marker) =>
                              marker.id === target.id
                                  ? { ...marker, ...point }
                                  : marker,
                          )
                        : props.board.markers,
                labels:
                    target.kind === "label"
                        ? props.board.labels.map((label) =>
                              label.id === target.id
                                  ? { ...label, ...point }
                                  : label,
                          )
                        : props.board.labels,
            });
            props.recordHistory(target.before);
        }
        setDragTarget(null);
        setDragPoint(null);
    };

    const positionFor = (
        kind: DragTarget["kind"],
        id: string,
        point: MapPoint,
    ) =>
        dragTarget()?.kind === kind && dragTarget()?.id === id
            ? (dragPoint() ?? point)
            : point;

    const markerClass = (marker: PlannerMarker) => ({
        "h-8 w-8 border-2 border-white/80 bg-ally": marker.kind === "blue",
        "h-8 w-8 border-2 border-white/80 bg-opponent": marker.kind === "red",
        "flex h-9 w-9 items-center justify-center border border-sky-300 bg-sky-950 text-sky-100":
            marker.kind === "vision",
        "flex h-9 w-9 items-center justify-center border border-amber-300 bg-amber-950 text-amber-100":
            marker.kind === "objective",
        "border-2 bg-neutral-950": marker.kind === "champion",
        "border-ally": marker.kind === "champion" && marker.team === "blue",
        "border-opponent": marker.kind === "champion" && marker.team === "red",
        "ring-2 ring-white ring-offset-2 ring-offset-black":
            selectedId() === marker.id,
    });

    return (
        <div
            ref={mapElement}
            class="relative aspect-square min-w-0 shrink-0 touch-none overflow-hidden rounded-xl border border-neutral-700 bg-black shadow-2xl select-none"
            style={{
                width: "min(100%, 720px, calc(100vh - 260px))",
            }}
            classList={{
                "cursor-crosshair": props.tool.kind !== "select",
                "cursor-default": props.tool.kind === "select",
            }}
            aria-label={t("riftMap")}
            onPointerDown={onMapPointerDown}
            onPointerMove={onMapPointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onDragEnter={(event) => event.preventDefault()}
            onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={dropChampion}
        >
            <img
                src="/assets/maps/summoners-rift.jpg"
                alt={t("riftMap")}
                class="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                draggable={false}
            />
            <svg
                viewBox="0 0 100 100"
                class="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
            >
                <For each={props.board.strokes}>
                    {(stroke) => (
                        <>
                            <path
                                d={pathFor(stroke.points)}
                                fill="none"
                                stroke={stroke.color}
                                stroke-width={stroke.width}
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                vector-effect="non-scaling-stroke"
                            />
                            <Show when={props.tool.kind === "erase"}>
                                <path
                                    d={pathFor(stroke.points)}
                                    fill="none"
                                    stroke="transparent"
                                    stroke-width={Math.max(
                                        stroke.width + 12,
                                        18,
                                    )}
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    vector-effect="non-scaling-stroke"
                                    class="pointer-events-auto cursor-pointer"
                                    onPointerDown={(event) => {
                                        event.stopPropagation();
                                        removeElement("stroke", stroke.id);
                                    }}
                                />
                            </Show>
                        </>
                    )}
                </For>
                <Show when={draftStroke()}>
                    {(points) => (
                        <path
                            d={pathFor(points())}
                            fill="none"
                            stroke={props.inkColor}
                            stroke-width={props.inkWidth}
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            vector-effect="non-scaling-stroke"
                        />
                    )}
                </Show>
            </svg>
            <For each={props.board.labels}>
                {(label) => (
                    <button
                        type="button"
                        class="absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none select-none rounded-md border border-white/30 bg-black/75 px-2 py-1 text-sm font-semibold text-white shadow-lg active:cursor-grabbing"
                        classList={{
                            "ring-2 ring-white": selectedId() === label.id,
                        }}
                        style={{
                            left: `${positionFor("label", label.id, label).x}%`,
                            top: `${positionFor("label", label.id, label).y}%`,
                        }}
                        onPointerDown={(event) =>
                            startDrag(event, "label", label.id)
                        }
                        onPointerMove={moveDragged}
                        onPointerUp={finishDrag}
                        onPointerCancel={finishDrag}
                    >
                        {label.text}
                    </button>
                )}
            </For>
            <For each={props.board.markers}>
                {(marker) => (
                    <button
                        type="button"
                        aria-label={t("moveOrRemoveMarker")}
                        class="absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none select-none rounded-full shadow-lg transition-transform hover:scale-110 active:cursor-grabbing"
                        classList={markerClass(marker)}
                        style={{
                            left: `${positionFor("marker", marker.id, marker).x}%`,
                            top: `${positionFor("marker", marker.id, marker).y}%`,
                        }}
                        onPointerDown={(event) =>
                            startDrag(event, "marker", marker.id)
                        }
                        onPointerMove={moveDragged}
                        onPointerUp={finishDrag}
                        onPointerCancel={finishDrag}
                        onDragStart={(event) => event.preventDefault()}
                    >
                        <Show when={marker.kind === "vision"}>
                            <Icon path={eye} class="h-5 w-5" />
                        </Show>
                        <Show when={marker.kind === "objective"}>
                            <Icon path={strategy} class="h-5 w-5" />
                        </Show>
                        <Show
                            when={
                                marker.kind === "champion" && marker.championKey
                            }
                        >
                            <ChampionIcon
                                championKey={marker.championKey!}
                                size={props.championSize}
                                class="rounded-full"
                            />
                        </Show>
                    </button>
                )}
            </For>
            <div class="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-[11px] text-neutral-200 backdrop-blur-sm">
                {props.tool.kind === "select"
                    ? t("mapMoveHint")
                    : t("mapClickHint")}
            </div>
        </div>
    );
}
