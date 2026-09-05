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

export default function LiveDraftBroadcastStage(props: {
    blueName: string;
    redName: string;
    currentStep?: DraftSequenceStep;
    actions: readonly LiveDraftAction[];
}) {
    const { t } = useI18n();
    const { dataset } = useDataset();
    const { config } = useUser();
    const actionFor = (
        side: LiveDraftSide,
        kind: "pick" | "ban",
        slot: number,
    ) =>
        props.actions.find(
            (action) =>
                action.side === side &&
                action.kind === kind &&
                action.slot === slot,
        );
    const isActive = (
        side: LiveDraftSide,
        kind: "pick" | "ban",
        slot: number,
    ) =>
        props.currentStep?.side === side &&
        props.currentStep.kind === kind &&
        props.currentStep.slot === slot;

    return (
        <section class="overflow-hidden rounded-xl border border-neutral-700 bg-[#090b0f] shadow-2xl">
            <div class="grid grid-cols-2 border-b border-neutral-700">
                <BroadcastTeamHeader
                    side="blue"
                    name={props.blueName}
                    currentStep={props.currentStep}
                />
                <BroadcastTeamHeader
                    side="red"
                    name={props.redName}
                    currentStep={props.currentStep}
                />
            </div>

            <div class="grid grid-cols-2 border-b-4 border-neutral-500/70">
                <For each={["blue", "red"] as const}>
                    {(side) => (
                        <div
                            class="flex gap-2 px-4 py-3"
                            classList={{
                                "justify-end border-r border-neutral-700":
                                    side === "blue",
                                "justify-start": side === "red",
                            }}
                        >
                            <For each={SLOTS}>
                                {(slot) => (
                                    <div
                                        class="h-11 w-11 overflow-hidden rounded border bg-neutral-900"
                                        classList={{
                                            "border-accent ring-1 ring-accent":
                                                isActive(side, "ban", slot),
                                            "border-neutral-700": !isActive(
                                                side,
                                                "ban",
                                                slot,
                                            ),
                                        }}
                                        title={`${t("ban")} ${slot + 1}`}
                                    >
                                        <Show
                                            when={actionFor(side, "ban", slot)}
                                        >
                                            {(action) => (
                                                <ChampionIcon
                                                    championKey={
                                                        action().championKey
                                                    }
                                                    size={44}
                                                    cover
                                                    class="h-full! w-full! grayscale"
                                                />
                                            )}
                                        </Show>
                                    </div>
                                )}
                            </For>
                        </div>
                    )}
                </For>
            </div>

            <div class="grid h-[clamp(160px,24vh,230px)] min-h-0 grid-cols-10">
                <For each={["blue", "red"] as const}>
                    {(side) => (
                        <For each={SLOTS}>
                            {(slot) => {
                                const action = () =>
                                    actionFor(side, "pick", slot);
                                return (
                                    <div
                                        class="relative min-h-0 overflow-hidden border-r border-neutral-700 bg-gradient-to-b from-neutral-800 to-black last:border-r-0"
                                        classList={{
                                            "ring-2 ring-inset ring-accent":
                                                isActive(side, "pick", slot),
                                        }}
                                    >
                                        <Show when={action()}>
                                            {(selected) => (
                                                <>
                                                    <ChampionIcon
                                                        championKey={
                                                            selected()
                                                                .championKey
                                                        }
                                                        size={220}
                                                        cover
                                                        class="absolute inset-0 h-full! w-full! rounded-none opacity-90"
                                                    />
                                                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-2 pb-3 pt-10 text-center">
                                                        <p class="truncate text-xs font-semibold">
                                                            {championName(
                                                                dataset()!
                                                                    .championData[
                                                                    selected()
                                                                        .championKey
                                                                ],
                                                                config,
                                                            )}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </Show>
                                        <span class="absolute left-2 top-2 text-[10px] font-semibold text-neutral-500">
                                            {side === "blue" ? "B" : "R"}
                                            {slot + 1}
                                        </span>
                                    </div>
                                );
                            }}
                        </For>
                    )}
                </For>
            </div>
        </section>
    );
}

function BroadcastTeamHeader(props: {
    side: LiveDraftSide;
    name: string;
    currentStep?: DraftSequenceStep;
}) {
    const { t } = useI18n();
    return (
        <div
            class="flex items-center justify-between gap-4 px-5 py-3"
            classList={{
                "border-r border-neutral-700 bg-gradient-to-r from-ally/10 to-transparent":
                    props.side === "blue",
                "flex-row-reverse bg-gradient-to-l from-opponent/10 to-transparent":
                    props.side === "red",
            }}
        >
            <div class={props.side === "red" ? "text-right" : ""}>
                <p
                    class="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    classList={{
                        "text-ally": props.side === "blue",
                        "text-opponent": props.side === "red",
                    }}
                >
                    {t(props.side === "blue" ? "blueSide" : "redSide")}
                </p>
                <h3 class="mt-0.5 text-lg font-semibold">{props.name}</h3>
            </div>
            <Show when={props.currentStep?.side === props.side}>
                <span class="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] text-accent">
                    {props.currentStep!.kind === "pick" ? t("pick") : t("ban")}{" "}
                    {props.currentStep!.slot + 1}
                </span>
            </Show>
        </div>
    );
}
