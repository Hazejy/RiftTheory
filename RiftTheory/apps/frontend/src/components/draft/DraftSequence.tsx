import { For, Show } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { DRAFT_PICK_ORDER, pickLabel } from "../../utils/draftOrder";
import { useI18n } from "../../utils/i18n";
import { Icon, resetDraft } from "../icons/RiftIcons";
import { Switch } from "../common/Switch";
import { useUser } from "../../contexts/UserContext";

export function DraftSequence() {
    const {
        allyTeam,
        opponentTeam,
        activeDraftPick,
        nextDraftPick,
        select,
        resetAll,
    } = useDraft();
    const { t } = useI18n();
    const { config, setConfig } = useUser();
    return (
        <section class="mb-4 font-body text-sm" aria-label={t("pickOrder")}>
            <div class="flex justify-between items-center gap-3 mb-2">
                <p role="status" aria-live="polite">
                    {activeDraftPick()
                        ? `${t("nextPick")}: ${pickLabel(activeDraftPick()!.team, activeDraftPick()!.index)}`
                        : t("draftComplete")}
                </p>
                <div class="flex items-center gap-3">
                    <label class="inline-flex items-center gap-2 text-xs text-neutral-400">
                        <span>{t("usePickOrder")}</span>
                        <Switch
                            class="h-5 w-9 [&_[data-kobalte-switch-thumb]]:h-4 [&_[data-kobalte-switch-thumb]]:w-4"
                            checked={config.usePickOrder}
                            onChange={(usePickOrder) => {
                                setConfig({ usePickOrder });
                                if (usePickOrder) {
                                    const next = nextDraftPick();
                                    select(
                                        next?.team ?? "ally",
                                        next?.index ?? 0,
                                        false,
                                        false,
                                    );
                                }
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-primary px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-red-400/50 hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:pointer-events-none"
                        disabled={
                            ![...allyTeam, ...opponentTeam].some(
                                (pick) => pick.championKey || pick.hoverKey,
                            )
                        }
                        onClick={resetAll}
                    >
                        <Icon path={resetDraft} class="h-4 w-4" />
                        {t("resetDraft")}
                    </button>
                </div>
            </div>
            <Show
                when={config.usePickOrder}
                fallback={
                    <p class="text-xs text-neutral-500">
                        {t("freeCompAnalysis")}
                    </p>
                }
            >
                <ol class="flex flex-wrap gap-1.5">
                <For each={DRAFT_PICK_ORDER}>
                    {(step) => {
                        const current = () =>
                            activeDraftPick()?.team === step.team &&
                            activeDraftPick()?.index === step.index;
                        const filled = () =>
                            (step.team === "ally" ? allyTeam : opponentTeam)[
                                step.index
                            ].championKey !== undefined;
                        return (
                            <li
                                aria-current={current() ? "step" : undefined}
                                class="border rounded text-xs"
                                classList={{
                                    "text-sky-300 border-sky-900":
                                        step.team === "ally",
                                    "text-red-300 border-red-900":
                                        step.team === "opponent",
                                    "ring-1 ring-white bg-neutral-700":
                                        current(),
                                    "opacity-40": filled(),
                                }}
                            >
                                <button
                                    type="button"
                                    class="px-2 py-1 focus-visible:outline-2 focus-visible:outline-accent"
                                    aria-pressed={current()}
                                    onClick={() =>
                                        select(step.team, step.index)
                                    }
                                >
                                    {pickLabel(step.team, step.index)}
                                </button>
                            </li>
                        );
                    }}
                </For>
                </ol>
            </Show>
        </section>
    );
}
