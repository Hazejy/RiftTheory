import { createMemo, createSignal, For, Setter, Show } from "solid-js";
import { useDataset } from "../../../contexts/DatasetContext";
import { useUser } from "../../../contexts/UserContext";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../../utils/i18n";
import { ChampionIcon } from "../../icons/ChampionIcon";
import { RoleIcon } from "../../icons/roles/RoleIcon";
import { Icon, trash } from "../../icons/RiftIcons";
import { PrepDocument } from "./model";

type Target = { playerId: string; categoryId: string };

export default function DraftPrepPools(props: {
    document: PrepDocument;
    setDocument: Setter<PrepDocument>;
}) {
    const { t, roleName } = useI18n();
    const { dataset } = useDataset();
    const { config } = useUser();
    const [target, setTarget] = createSignal<Target>();
    const [search, setSearch] = createSignal("");

    const champions = createMemo(() => {
        const data = dataset();
        if (!data) return [];
        const query = normalizeChampionSearch(search());
        return Object.entries(data.championData)
            .map(([key, champion]) => ({
                key,
                name: championName(champion, config),
            }))
            .filter((champion) =>
                normalizeChampionSearch(champion.name).includes(query),
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    const updateCategory = (categoryId: string, label: string) =>
        props.setDocument((current) => ({
            ...current,
            poolCategories: current.poolCategories.map((category) =>
                category.id === categoryId ? { ...category, label } : category,
            ),
        }));

    const addCategory = () => {
        const id = crypto.randomUUID();
        props.setDocument((current) => ({
            ...current,
            poolCategories: [
                ...current.poolCategories,
                { id, label: t("poolCategoryName") },
            ],
            players: current.players.map((player) => ({
                ...player,
                pools: { ...player.pools, [id]: [] },
            })),
        }));
    };

    const removeCategory = (categoryId: string) => {
        props.setDocument((current) => ({
            ...current,
            poolCategories: current.poolCategories.filter(
                (category) => category.id !== categoryId,
            ),
            players: current.players.map((player) => {
                const pools = { ...player.pools };
                delete pools[categoryId];
                return { ...player, pools };
            }),
        }));
        if (target()?.categoryId === categoryId) setTarget(undefined);
    };

    const toggleChampion = (championKey: string) => {
        const currentTarget = target();
        if (!currentTarget) return;
        props.setDocument((current) => ({
            ...current,
            players: current.players.map((player) => {
                if (player.id !== currentTarget.playerId) return player;
                const pool = player.pools[currentTarget.categoryId] ?? [];
                return {
                    ...player,
                    pools: {
                        ...player.pools,
                        [currentTarget.categoryId]: pool.includes(championKey)
                            ? pool.filter((key) => key !== championKey)
                            : [...pool, championKey],
                    },
                };
            }),
        }));
    };

    return (
        <div class="grid min-h-[620px] gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <main class="min-w-0">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-700 bg-primary/60 p-3">
                    <p class="text-sm text-neutral-500">{t("poolHint")}</p>
                    <button
                        type="button"
                        class="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent"
                        onClick={addCategory}
                    >
                        + {t("addPoolCategory")}
                    </button>
                </div>

                <div class="overflow-x-auto pb-2">
                    <div class="grid min-w-max auto-cols-[220px] grid-flow-col gap-3">
                        <For each={props.document.players}>
                            {(player) => (
                                <section class="overflow-hidden rounded-xl border border-neutral-700 bg-primary/60">
                                    <header class="flex items-center gap-2 border-b border-neutral-700 p-3">
                                        <RoleIcon
                                            role={player.role}
                                            class="h-5 w-5 fill-current text-accent"
                                        />
                                        <div class="min-w-0">
                                            <p class="truncate font-semibold">
                                                {player.name ||
                                                    roleName(player.role)}
                                            </p>
                                            <p class="text-[10px] uppercase tracking-wider text-neutral-600">
                                                {roleName(player.role)}
                                            </p>
                                        </div>
                                    </header>
                                    <For each={props.document.poolCategories}>
                                        {(category) => {
                                            const selected = () =>
                                                target()?.playerId ===
                                                    player.id &&
                                                target()?.categoryId ===
                                                    category.id;
                                            return (
                                                <button
                                                    type="button"
                                                    class="block w-full border-b border-neutral-800 p-3 text-left last:border-0"
                                                    classList={{
                                                        "bg-accent/10":
                                                            selected(),
                                                    }}
                                                    onClick={() =>
                                                        setTarget({
                                                            playerId: player.id,
                                                            categoryId:
                                                                category.id,
                                                        })
                                                    }
                                                >
                                                    <span class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                                        {category.label}
                                                    </span>
                                                    <span class="mt-2 grid min-h-12 grid-cols-4 gap-1">
                                                        <For
                                                            each={
                                                                player.pools[
                                                                    category.id
                                                                ] ?? []
                                                            }
                                                        >
                                                            {(key) => (
                                                                <span class="aspect-square overflow-hidden rounded border border-neutral-700">
                                                                    <ChampionIcon
                                                                        championKey={
                                                                            key
                                                                        }
                                                                        size={
                                                                            42
                                                                        }
                                                                        cover
                                                                        class="h-full! w-full!"
                                                                    />
                                                                </span>
                                                            )}
                                                        </For>
                                                    </span>
                                                </button>
                                            );
                                        }}
                                    </For>
                                </section>
                            )}
                        </For>
                    </div>
                </div>

                <section class="mt-3 rounded-xl border border-neutral-700 bg-primary/60 p-3">
                    <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        {t("poolCategoryName")}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <For each={props.document.poolCategories}>
                            {(category) => (
                                <label class="flex items-center rounded-lg border border-neutral-700 bg-canvas focus-within:border-accent">
                                    <input
                                        class="w-36 bg-transparent px-3 py-2 text-sm outline-none"
                                        // Keep the input uncontrolled while typing. Updating the
                                        // whole document on every key replaces the keyed category
                                        // node and drops focus after the first character.
                                        value={category.label}
                                        onBlur={(event) =>
                                            updateCategory(
                                                category.id,
                                                event.currentTarget.value,
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        aria-label={t("removePoolCategory")}
                                        class="border-l border-neutral-700 p-2 text-neutral-600 hover:text-rose-400"
                                        onClick={() =>
                                            removeCategory(category.id)
                                        }
                                    >
                                        <Icon
                                            path={trash}
                                            class="h-3.5 w-3.5"
                                        />
                                    </button>
                                </label>
                            )}
                        </For>
                    </div>
                </section>
            </main>

            <aside class="h-fit rounded-xl border border-neutral-700 bg-primary p-4 xl:sticky xl:top-16">
                <h3 class="font-semibold">{t("championPools")}</h3>
                <p class="mt-1 text-xs text-neutral-500">
                    {target()
                        ? props.document.poolCategories.find(
                              (category) =>
                                  category.id === target()!.categoryId,
                          )?.label
                        : t("selectPrepSlot")}
                </p>
                <input
                    class="mt-3 w-full rounded-lg border border-neutral-700 bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder={t("search")}
                    value={search()}
                    onInput={(event) => setSearch(event.currentTarget.value)}
                />
                <div class="mt-3 grid max-h-[500px] grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                    <For each={champions()}>
                        {(champion) => (
                            <button
                                type="button"
                                disabled={!target()}
                                title={champion.name}
                                class="aspect-square overflow-hidden rounded border border-neutral-700 disabled:opacity-30 hover:enabled:border-accent"
                                onClick={() => toggleChampion(champion.key)}
                            >
                                <ChampionIcon
                                    championKey={champion.key}
                                    size={56}
                                    cover
                                    class="h-full! w-full!"
                                />
                            </button>
                        )}
                    </For>
                </div>
                <Show when={!props.document.players.length}>
                    <p class="mt-3 text-xs text-neutral-600">
                        {t("addRosterMember")}
                    </p>
                </Show>
            </aside>
        </div>
    );
}
