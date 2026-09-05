import { For } from "solid-js";
import { useI18n } from "../../utils/i18n";

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
    red: {
        background: "#421d25",
        color: "#ffb9bb",
        "border-color": "#83424b",
    },
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

export default function StrategicColorChips(props: {
    colors: readonly string[];
    prefix?: string;
    compact?: boolean;
}) {
    const { t, term } = useI18n();
    return (
        <div class="flex flex-wrap gap-1.5">
            <For
                each={props.colors}
                fallback={
                    <span class="text-xs text-neutral-500">{t("none")}</span>
                }
            >
                {(color) => (
                    <span
                        class="inline-flex whitespace-nowrap rounded-md border font-medium"
                        classList={{
                            "px-1.5 py-0.5 text-[11px]": props.compact,
                            "px-2 py-1 text-xs": !props.compact,
                        }}
                        style={COLOR_STYLES[color]}
                    >
                        {props.prefix ? `${props.prefix} ` : ""}
                        {term(color)}
                    </span>
                )}
            </For>
        </div>
    );
}
