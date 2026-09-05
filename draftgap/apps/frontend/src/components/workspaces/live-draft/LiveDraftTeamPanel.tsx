import type {
    DraftSequenceStep,
    LiveDraftAction,
    LiveDraftSide,
} from "@draftgap/core/src/live-draft/series";
import { For, Show } from "solid-js";
import { useDataset } from "../../../contexts/DatasetContext";
import { useUser } from "../../../contexts/UserContext";
import { championName, useI18n } from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";

const SLOTS = [0, 1, 2, 3, 4] as const;

export default function LiveDraftTeamPanel(props: {
    side: LiveDraftSide;
    teamName: string;
    currentStep?: DraftSequenceStep;
    actions: readonly LiveDraftAction[];
}) {
    const { t } = useI18n();
    const { dataset } = useDataset();
    const { config } = useUser();
    const actionFor = (kind: "pick" | "ban", slot: number) =>
        props.actions.find(
            (action) =>
                action.side === props.side &&
                action.kind === kind &&
                action.slot === slot,
        );
    const isActive = (kind: "pick" | "ban", slot: number) =>
        props.currentStep?.side === props.side &&
        props.currentStep.kind === kind &&
        props.currentStep.slot === slot;
    const nameFor = (championKey: string) =>
        championName(dataset()!.championData[championKey], config);

    return (
        <section
            class="flex h-[clamp(470px,calc(100vh-300px),570px)] min-h-0 flex-col overflow-hidden rounded-xl border bg-primary"
            classList={{
                "border-ally/50": props.side === "blue",
                "border-opponent/50": props.side === "red",
            }}
        >
            <div
                class="border-b px-4 py-3"
                classList={{
                    "border-ally/30 bg-ally/[0.06]": props.side === "blue",
                    "border-opponent/30 bg-opponent/[0.06]":
                        props.side === "red",
                }}
            >
                <p
                    class="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    classList={{
                        "text-ally": props.side === "blue",
                        "text-opponent": props.side === "red",
                    }}
                >
                    {t(props.side === "blue" ? "blueSide" : "redSide")}
                </p>
                <h3 class="mt-0.5 truncate text-lg font-semibold">
                    {props.teamName}
                </h3>
            </div>

            <div class="border-b border-neutral-800 p-3">
                <div class="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    <span>{t("bans")}</span>
                    <Show
                        when={
                            props.currentStep?.side === props.side &&
                            props.currentStep.kind === "ban"
                        }
                    >
                        <span class="text-accent">
                            {t("ban")} {props.currentStep!.slot + 1}
                        </span>
                    </Show>
                </div>
                <div class="grid grid-cols-5 gap-1.5">
                    <For each={SLOTS}>
                        {(slot) => (
                            <div
                                class="aspect-square overflow-hidden rounded-md border bg-canvas/80"
                                classList={{
                                    "border-accent ring-1 ring-accent/30":
                                        isActive("ban", slot),
                                    "border-neutral-800": !isActive(
                                        "ban",
                                        slot,
                                    ),
                                }}
                            >
                                <Show when={actionFor("ban", slot)}>
                                    {(action) => (
                                        <ChampionIcon
                                            championKey={action().championKey}
                                            size={50}
                                            cover
                                            class="h-full! w-full! grayscale"
                                        />
                                    )}
                                </Show>
                            </div>
                        )}
                    </For>
                </div>
            </div>

            <div class="grid flex-1 grid-rows-5">
                <For each={SLOTS}>
                    {(slot) => {
                        const action = () => actionFor("pick", slot);
                        return (
                            <div
                                class="relative flex min-h-0 items-center gap-3 border-b border-neutral-800 px-3 last:border-b-0"
                                classList={{
                                    "flex-row-reverse text-right":
                                        props.side === "red",
                                    "bg-accent/[0.06] ring-1 ring-inset ring-accent/60":
                                        isActive("pick", slot),
                                }}
                            >
                                <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-canvas">
                                    <Show when={action()}>
                                        {(selected) => (
                                            <ChampionIcon
                                                championKey={
                                                    selected().championKey
                                                }
                                                size={56}
                                                cover
                                                class="h-full! w-full!"
                                            />
                                        )}
                                    </Show>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[10px] uppercase tracking-wider text-neutral-600">
                                        {t("pick")} {slot + 1}
                                    </p>
                                    <p class="mt-1 truncate font-semibold text-neutral-200">
                                        {action()
                                            ? nameFor(action()!.championKey)
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        );
                    }}
                </For>
            </div>
        </section>
    );
}
