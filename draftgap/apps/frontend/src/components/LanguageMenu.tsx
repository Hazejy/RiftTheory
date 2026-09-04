import { For, Show } from "solid-js";
import { useUser } from "../contexts/UserContext";
import { useDataset } from "../contexts/DatasetContext";
import { useI18n } from "../utils/i18n";

export function LanguageDropdownMenu() {
    const { config, setConfig } = useUser();
    const { dataset } = useDataset();
    const { t } = useI18n();
    const languages = [
        { value: "en_US", label: "English" },
        { value: "ko_KR", label: "한국어" },
        { value: "zh_CN", label: "简体中文" },
    ];
    const koreanUnavailable = () =>
        config.language === "ko_KR" &&
        dataset() &&
        !Object.values(dataset()!.championData).some(
            (champion) => champion.i18n?.ko_KR,
        );
    return (
        <div class="flex items-center gap-2">
            <select
                aria-label={t("language")}
                title={t("localizationScope")}
                class="bg-neutral-800 text-neutral-100 border border-neutral-600 rounded px-2 py-1 text-sm font-body max-w-32"
                value={config.language}
                onChange={(event) =>
                    setConfig("language", event.currentTarget.value)
                }
            >
                <For each={languages}>
                    {(language) => (
                        <option value={language.value}>{language.label}</option>
                    )}
                </For>
            </select>
            <Show when={koreanUnavailable()}>
                <span
                    class="text-xs text-amber-300 max-w-40 font-body"
                    role="status"
                >
                    {t("koreanFallback")}
                </span>
            </Show>
        </div>
    );
}
