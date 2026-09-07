import { Icon, magnifyingGlass, xMark } from "../icons/RiftIcons";
import { onCleanup, onMount, Show } from "solid-js";
import { useDraftFilters } from "../../contexts/DraftFiltersContext";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";

export function Search() {
    const { t } = useI18n();
    const { search, setSearch } = useDraftFilters();
    const { setConfig } = useUser();

    // eslint-disable-next-line prefer-const -- solid js ref
    let inputEl: HTMLInputElement | undefined = undefined;

    function onInput(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        setSearch(input.value);
        if (input.value === "DANGEROUSLY_ENABLE_BETA_FEATURES") {
            setConfig((config) => ({ ...config, enableBetaFeatures: true }));
            setSearch("");
        }
        if (input.value === "DANGEROUSLY_DISABLE_BETA_FEATURES") {
            setConfig((config) => ({ ...config, enableBetaFeatures: false }));
            setSearch("");
        }
    }

    onMount(() => {
        if (!inputEl) return;
        const el = inputEl as HTMLInputElement;

        const onEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.isComposing) {
                e.preventDefault();
                const firstTableRow = document.querySelector("table tbody tr");
                if (firstTableRow) {
                    (firstTableRow as HTMLElement).focus();
                }
            }
        };

        el.addEventListener("keydown", onEnter);
        onCleanup(() => {
            el.removeEventListener("keydown", onEnter);
        });
    });

    return (
        <div class="flex rounded-md flex-1">
            <div class="relative flex grow items-stretch">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Icon
                        path={magnifyingGlass}
                        class="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                    />
                </div>
                <input
                    ref={inputEl}
                    id="draftTableSearch"
                    data-champion-search
                    class="text-lg py-1 block w-full rounded-md rounded-l-md border-gray-301 pl-10 bg-neutral-800 placeholder:text-neutral-500 text-neutral-100"
                    placeholder={t("search")}
                    aria-label={t("search")}
                    value={search()}
                    onInput={onInput}
                />
                <Show when={search().length}>
                    <button
                        aria-label={t("clearSearch")}
                        class="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setSearch("")}
                    >
                        <Icon
                            path={xMark}
                            class="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </button>
                </Show>
            </div>
        </div>
    );
}
