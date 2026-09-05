import { For } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import {
    Icon,
    arrowLeft,
    cursorArrow,
    eye,
    eraser,
    mapPin,
    penTool,
    resetDraft,
    strategy,
    textTool,
} from "../../icons/RiftIcons";
import { PlannerTool } from "./model";

type ToolKind = Exclude<PlannerTool["kind"], "champion">;

type Props = {
    tool: PlannerTool;
    setTool: (kind: ToolKind) => void;
    canUndo: boolean;
    canClear: boolean;
    undo: () => void;
    clear: () => void;
};

export default function RiftPlannerToolbar(props: Props) {
    const { t } = useI18n();
    const tools = () => [
        {
            kind: "select" as const,
            label: t("selectMove"),
            key: "V",
            icon: cursorArrow,
        },
        {
            kind: "blue" as const,
            label: t("blueMarker"),
            key: "B",
            icon: mapPin,
        },
        { kind: "red" as const, label: t("redMarker"), key: "R", icon: mapPin },
        { kind: "draw" as const, label: t("draw"), key: "D", icon: penTool },
        {
            kind: "text" as const,
            label: t("addText"),
            key: "T",
            icon: textTool,
        },
        {
            kind: "vision" as const,
            label: t("visionMarker"),
            key: "W",
            icon: eye,
        },
        {
            kind: "objective" as const,
            label: t("objectiveMarker"),
            key: "O",
            icon: strategy,
        },
        { kind: "erase" as const, label: t("erase"), key: "E", icon: eraser },
    ];

    const buttonClass =
        "group relative flex h-11 w-11 items-center justify-center rounded-lg border transition-colors";

    return (
        <div class="flex shrink-0 flex-row gap-1 rounded-xl border border-neutral-700 bg-primary/95 p-1.5 shadow-xl xl:flex-col">
            <For each={tools()}>
                {(entry) => (
                    <button
                        type="button"
                        class={buttonClass}
                        classList={{
                            "border-accent bg-accent/15 text-accent":
                                props.tool.kind === entry.kind,
                            "border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-canvas hover:text-neutral-100":
                                props.tool.kind !== entry.kind,
                            "text-ally": entry.kind === "blue",
                            "text-opponent": entry.kind === "red",
                        }}
                        title={`${entry.label} (${entry.key})`}
                        aria-label={`${entry.label} (${entry.key})`}
                        aria-pressed={props.tool.kind === entry.kind}
                        onClick={() => props.setTool(entry.kind)}
                    >
                        <Icon path={entry.icon} class="h-5 w-5" />
                        <kbd class="absolute bottom-0.5 right-1 text-[8px] font-semibold text-neutral-500 group-hover:text-neutral-300">
                            {entry.key}
                        </kbd>
                    </button>
                )}
            </For>
            <span class="mx-1 h-8 w-px bg-neutral-700 xl:mx-0 xl:my-1 xl:h-px xl:w-8" />
            <button
                type="button"
                class={buttonClass}
                classList={{
                    "border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-canvas hover:text-neutral-100":
                        props.canUndo,
                    "cursor-not-allowed border-transparent text-neutral-700":
                        !props.canUndo,
                }}
                title={`${t("undo")} (Ctrl+Z)`}
                aria-label={`${t("undo")} (Ctrl+Z)`}
                disabled={!props.canUndo}
                onClick={() => props.undo()}
            >
                <Icon path={arrowLeft} class="h-5 w-5" />
            </button>
            <button
                type="button"
                class={buttonClass}
                classList={{
                    "border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-canvas hover:text-neutral-100":
                        props.canClear,
                    "cursor-not-allowed border-transparent text-neutral-700":
                        !props.canClear,
                }}
                title={t("clearMap")}
                aria-label={t("clearMap")}
                disabled={!props.canClear}
                onClick={() => props.clear()}
            >
                <Icon path={resetDraft} class="h-5 w-5" />
            </button>
        </div>
    );
}
