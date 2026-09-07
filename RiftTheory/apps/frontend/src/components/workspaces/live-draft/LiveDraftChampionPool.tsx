import { For } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";

export type LiveDraftChampionOption = {
    key: string;
    name: string;
};

export default function LiveDraftChampionPool(props: {
    champions: readonly LiveDraftChampionOption[];
    search: string;
    disabled: boolean;
    compact?: boolean;
    lockReason: (championKey: string) => string | undefined;
    onSearchChange: (value: string) => void;
    onSelect: (championKey: string) => void;
}) {
    const { t } = useI18n();

    return (
        <>
            <input
                class="mt-4 w-full rounded-lg border border-neutral-700 bg-canvas px-3 py-2.5 outline-none focus:border-accent"
                placeholder={t("search")}
                value={props.search}
                onInput={(event) =>
                    props.onSearchChange(event.currentTarget.value)
                }
            />
            <div
                class="mt-3 grid grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-9 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))]"
                style={{
                    "max-height": props.compact
                        ? "clamp(130px, 20vh, 190px)"
                        : "clamp(220px, calc(100vh - 450px), 380px)",
                }}
            >
                <For each={props.champions}>
                    {(champion) => {
                        const lockReason = () => props.lockReason(champion.key);
                        return (
                            <button
                                type="button"
                                disabled={
                                    props.disabled || lockReason() !== undefined
                                }
                                title={`${champion.name}${
                                    lockReason()
                                        ? ` · ${t("championLocked")}`
                                        : ""
                                }`}
                                class="group relative aspect-square overflow-hidden rounded-lg border border-neutral-700 bg-canvas disabled:opacity-25"
                                onClick={() => props.onSelect(champion.key)}
                            >
                                <ChampionIcon
                                    championKey={champion.key}
                                    size={58}
                                    cover
                                    class="h-full! w-full! transition-transform group-hover:scale-105"
                                />
                            </button>
                        );
                    }}
                </For>
            </div>
        </>
    );
}
