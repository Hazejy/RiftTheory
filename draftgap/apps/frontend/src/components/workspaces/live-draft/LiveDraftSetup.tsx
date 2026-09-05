import {
    FearlessScope,
    LIVE_DRAFT_MODES,
    LiveDraftGameCount,
    LiveDraftMode,
} from "@draftgap/core/src/live-draft/series";
import { For, Show } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import { Button } from "../../common/Button";

const GAME_COUNTS: readonly LiveDraftGameCount[] = [1, 2, 3, 4, 5];

export type LiveDraftSetupProps = {
    team1Name: string;
    team2Name: string;
    mode: LiveDraftMode;
    fearlessScope: FearlessScope;
    gameCount: LiveDraftGameCount;
    onTeam1NameChange: (value: string) => void;
    onTeam2NameChange: (value: string) => void;
    onModeChange: (value: LiveDraftMode) => void;
    onFearlessScopeChange: (value: FearlessScope) => void;
    onGameCountChange: (value: LiveDraftGameCount) => void;
    onStart: () => void;
};

export function liveDraftModeLabel(
    mode: LiveDraftMode,
    t: ReturnType<typeof useI18n>["t"],
) {
    return t(
        mode === "normal"
            ? "normalMode"
            : mode === "fearless"
              ? "fearlessMode"
              : "ironmanMode",
    );
}

export default function LiveDraftSetup(props: LiveDraftSetupProps) {
    const { t } = useI18n();

    return (
        <section class="mx-auto max-w-4xl rounded-xl border border-neutral-700 bg-primary p-5 sm:p-7">
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm text-neutral-400">
                    {t("teamOneName")}
                    <input
                        class="rounded-lg border border-neutral-700 bg-canvas px-3 py-2.5 text-neutral-100 outline-none focus:border-accent"
                        value={props.team1Name}
                        onInput={(event) =>
                            props.onTeam1NameChange(event.currentTarget.value)
                        }
                    />
                </label>
                <label class="grid gap-2 text-sm text-neutral-400">
                    {t("teamTwoName")}
                    <input
                        class="rounded-lg border border-neutral-700 bg-canvas px-3 py-2.5 text-neutral-100 outline-none focus:border-accent"
                        value={props.team2Name}
                        onInput={(event) =>
                            props.onTeam2NameChange(event.currentTarget.value)
                        }
                    />
                </label>
            </div>

            <div class="mt-6">
                <p class="mb-2 text-sm text-neutral-400">{t("gameMode")}</p>
                <div class="grid gap-2 sm:grid-cols-3">
                    <For each={LIVE_DRAFT_MODES}>
                        {(value) => (
                            <button
                                type="button"
                                aria-pressed={props.mode === value}
                                class="rounded-lg border px-4 py-3 text-left transition-colors"
                                classList={{
                                    "border-accent bg-accent/10 text-accent":
                                        props.mode === value,
                                    "border-neutral-700 bg-canvas text-neutral-300 hover:border-neutral-500":
                                        props.mode !== value,
                                }}
                                onClick={() => props.onModeChange(value)}
                            >
                                <span class="font-semibold">
                                    {liveDraftModeLabel(value, t)}
                                </span>
                                <span class="mt-1 block text-xs text-neutral-500">
                                    {t(
                                        value === "normal"
                                            ? "normalModeHelp"
                                            : value === "fearless"
                                              ? "fearlessModeHelp"
                                              : "ironmanModeHelp",
                                    )}
                                </span>
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <Show when={props.mode === "fearless"}>
                <div class="mt-5 rounded-lg border border-neutral-800 bg-canvas/60 p-4">
                    <p class="text-sm text-neutral-300">{t("fearlessScope")}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <For each={["global", "team"] as const}>
                            {(scope) => (
                                <button
                                    type="button"
                                    aria-pressed={props.fearlessScope === scope}
                                    class="rounded border px-3 py-2 text-sm"
                                    classList={{
                                        "border-accent text-accent":
                                            props.fearlessScope === scope,
                                        "border-neutral-700 text-neutral-400":
                                            props.fearlessScope !== scope,
                                    }}
                                    onClick={() =>
                                        props.onFearlessScopeChange(scope)
                                    }
                                >
                                    {t(
                                        scope === "global"
                                            ? "globalFearless"
                                            : "teamFearless",
                                    )}
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </Show>

            <div class="mt-6">
                <p class="mb-2 text-sm text-neutral-400">
                    {t("numberOfGames")}
                </p>
                <div class="flex gap-2">
                    <For each={GAME_COUNTS}>
                        {(count) => (
                            <button
                                type="button"
                                aria-pressed={props.gameCount === count}
                                class="h-10 w-10 rounded-lg border text-sm"
                                classList={{
                                    "border-accent bg-accent/10 text-accent":
                                        props.gameCount === count,
                                    "border-neutral-700 text-neutral-400":
                                        props.gameCount !== count,
                                }}
                                onClick={() => props.onGameCountChange(count)}
                            >
                                {count}
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <Button
                class="mt-7 w-full justify-center px-5 py-3 text-base normal-case"
                onClick={props.onStart}
            >
                {t("startLocalSeries")}
            </Button>
            <p class="mt-3 text-center text-xs text-neutral-600">
                {t("realtimeBackendNotice")}
            </p>
        </section>
    );
}
