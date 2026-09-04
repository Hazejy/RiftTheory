import { For } from "solid-js";
import { useUser } from "../contexts/UserContext";
import { useI18n } from "../utils/i18n";
import { FONT_PRESETS } from "../utils/appearance";
import { CustomThemeEditor } from "./CustomThemeEditor";

export function AppearanceSettings() {
    const { config, setConfig } = useUser();
    const { t } = useI18n();
    const choiceClass =
        "rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent";

    return (
        <section class="space-y-4 border-b border-neutral-700 pb-5 font-body">
            <div>
                <h3 class="text-xl font-semibold">{t("appearance")}</h3>
                <p class="text-xs text-neutral-400 mt-1">
                    {t("appearanceSaved")}
                </p>
            </div>
            <fieldset>
                <legend class="text-sm text-neutral-300 mb-2">
                    {t("font")}
                </legend>
                <div class="grid grid-cols-3 gap-2">
                    <For each={FONT_PRESETS}>
                        {(font) => (
                            <button
                                type="button"
                                class={choiceClass}
                                aria-label={font.name}
                                aria-pressed={config.fontPreset === font.id}
                                classList={{
                                    "border-accent bg-neutral-800":
                                        config.fontPreset === font.id,
                                    "border-neutral-700 hover:border-neutral-500":
                                        config.fontPreset !== font.id,
                                }}
                                onClick={() => setConfig("fontPreset", font.id)}
                            >
                                <span
                                    class="block text-3xl mb-2"
                                    style={{ "font-family": font.family }}
                                    aria-hidden="true"
                                >
                                    Aa
                                </span>
                                <span class="text-xs">{font.name}</span>
                            </button>
                        )}
                    </For>
                </div>
            </fieldset>
            <CustomThemeEditor />
        </section>
    );
}
