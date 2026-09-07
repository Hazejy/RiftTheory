import { For } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { useI18n } from "../../utils/i18n";

const TEAMS = ["ally", "opponent"] as const;

export function TeamSelector() {
    const { selection, select } = useDraft();
    const { t } = useI18n();

    return (
        <span class="isolate inline-flex rounded-md shadow-xs">
            <For each={TEAMS}>
                {(team, i) => (
                    <button
                        type="button"
                        aria-pressed={selection.team === team}
                        onClick={() => select(team)}
                        class="text-lg relative inline-flex items-center border text-neutral-300 border-neutral-700 bg-primary px-3 py-1 font-medium hover:bg-neutral-800 uppercase disabled:pointer-events-none disabled:text-neutral-700"
                        classList={{
                            "rounded-r-md": i() === TEAMS.length - 1,
                            "rounded-l-md": i() === 0,
                            "-ml-px": i() !== 0,
                            "text-white bg-neutral-700!":
                                selection.team === team,
                        }}
                    >
                        {t(team)}
                    </button>
                )}
            </For>
        </span>
    );
}
