import { Role, ROLES } from "@draftgap/core/src/models/Role";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useDataset } from "../../contexts/DatasetContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { latestRoleEvidence } from "../../utils/flexEvidence";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../utils/i18n";
import { EVIDENCE_ROLE_NAMES } from "../../utils/interactionEvidence";
import { downloadTierListSnapshot } from "../../utils/tierListSnapshot";
import { ChampionIcon } from "../icons/ChampionIcon";
import { RoleIcon } from "../icons/roles/RoleIcon";
import { Icon, trash } from "../icons/RiftIcons";

type TierListMode = "champions" | "players";
type TierDefinition = { id: string; label: string; color: string };
type Player = { id: string; name: string };
type PlayerPlacement = { playerId: string; role: Role; tierId: string };
type TierListDocument = {
    tiers: TierDefinition[];
    championPlacements: Record<string, string[]>;
    players: Player[];
    playerPlacements: PlayerPlacement[];
};

const STORAGE_KEY = "rifttheory.tier-list.v1";
const DEFAULT_TIERS: TierDefinition[] = [
    { id: "s", label: "S", color: "#ff454d" },
    { id: "a", label: "A", color: "#ff8a18" },
    { id: "b", label: "B", color: "#ffc21a" },
    { id: "c", label: "C", color: "#8bd000" },
    { id: "d", label: "D", color: "#4d86f7" },
    { id: "f", label: "F", color: "#7c3ff2" },
];

function emptyDocument(): TierListDocument {
    return {
        tiers: DEFAULT_TIERS.map((tier) => ({ ...tier })),
        championPlacements: {},
        players: [],
        playerPlacements: [],
    };
}

function loadDocument(): TierListDocument {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (
            !value ||
            typeof value !== "object" ||
            !Array.isArray(value.tiers) ||
            !value.championPlacements ||
            !Array.isArray(value.players) ||
            !Array.isArray(value.playerPlacements)
        ) {
            return emptyDocument();
        }
        return value as TierListDocument;
    } catch {
        return emptyDocument();
    }
}

export default function TierListView() {
    const { t, roleName } = useI18n();
    const { dataset } = useDataset();
    const { championForKey } = useRiftTheoryKnowledge();
    const { config } = useUser();
    const [mode, setMode] = createSignal<TierListMode>("champions");
    const [document, setDocument] = createSignal(loadDocument());
    const [search, setSearch] = createSignal("");
    const [roleFilter, setRoleFilter] = createSignal<Role>();
    const [playerName, setPlayerName] = createSignal("");
    const [copied, setCopied] = createSignal(false);
    const [exporting, setExporting] = createSignal(false);
    const [exportError, setExportError] = createSignal(false);

    createEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(document()));
    });

    const placedChampionKeys = createMemo(
        () =>
            new Set(
                Object.values(document().championPlacements).flatMap(
                    (keys) => keys,
                ),
            ),
    );
    const availableChampions = createMemo(() => {
        const data = dataset();
        if (!data) return [];
        const query = normalizeChampionSearch(search());
        return Object.entries(data.championData)
            .filter(([key, champion]) => {
                if (placedChampionKeys().has(key)) return false;
                const role = roleFilter();
                if (role !== undefined) {
                    const evidenceChampion = championForKey(key);
                    if (evidenceChampion) {
                        const observedRole = latestRoleEvidence(
                            evidenceChampion,
                        ).roles.find(
                            (candidate) =>
                                candidate.role === EVIDENCE_ROLE_NAMES[role],
                        );
                        if (
                            !(
                                observedRole !== undefined &&
                                (observedRole.tier === "primary" ||
                                    observedRole.tier === "established")
                            )
                        )
                            return false;
                    } else {
                        const roleGames =
                            champion.statsByRole[role]?.games ?? 0;
                        const totalGames = ROLES.reduce<number>(
                            (total, candidateRole) =>
                                total +
                                (champion.statsByRole[candidateRole]?.games ??
                                    0),
                            0,
                        );
                        if (
                            roleGames < 500 ||
                            totalGames === 0 ||
                            roleGames / totalGames < 0.05
                        )
                            return false;
                    }
                }
                return normalizeChampionSearch(
                    championName(champion, config),
                ).includes(query);
            })
            .map(([key, champion]) => ({
                key,
                name: championName(champion, config),
            }))
            .sort((left, right) => left.name.localeCompare(right.name));
    });

    const moveChampion = (championKey: string, tierId?: string) => {
        setDocument((current) => {
            const placements = Object.fromEntries(
                current.tiers.map((tier) => [
                    tier.id,
                    (current.championPlacements[tier.id] ?? []).filter(
                        (key) => key !== championKey,
                    ),
                ]),
            );
            if (tierId)
                placements[tierId] = [...placements[tierId], championKey];
            return { ...current, championPlacements: placements };
        });
    };

    const setChampionDragData = (event: DragEvent, championKey: string) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData(
            "application/x-rifttheory-champion",
            championKey,
        );
        event.dataTransfer.setData("text/plain", championKey);
    };

    const readChampionDragData = (event: DragEvent) =>
        event.dataTransfer?.getData("application/x-rifttheory-champion") ||
        event.dataTransfer?.getData("text/plain");

    const updateTierLabel = (tierId: string, label: string) =>
        setDocument((current) => ({
            ...current,
            tiers: current.tiers.map((tier) =>
                tier.id === tierId ? { ...tier, label } : tier,
            ),
        }));

    const addPlayer = () => {
        const name = playerName().trim();
        if (!name) return;
        setDocument((current) => ({
            ...current,
            players: [...current.players, { id: crypto.randomUUID(), name }],
        }));
        setPlayerName("");
    };

    const removePlayer = (playerId: string) =>
        setDocument((current) => ({
            ...current,
            players: current.players.filter((player) => player.id !== playerId),
            playerPlacements: current.playerPlacements.filter(
                (placement) => placement.playerId !== playerId,
            ),
        }));

    const placePlayer = (
        playerId: string,
        role: Role,
        tierId: string,
        sourceRole?: Role,
    ) =>
        setDocument((current) => ({
            ...current,
            playerPlacements: [
                ...current.playerPlacements.filter(
                    (placement) =>
                        !(
                            placement.playerId === playerId &&
                            (placement.role === role ||
                                placement.role === sourceRole)
                        ),
                ),
                { playerId, role, tierId },
            ],
        }));

    const removePlayerPlacement = (playerId: string, role: Role) =>
        setDocument((current) => ({
            ...current,
            playerPlacements: current.playerPlacements.filter(
                (placement) =>
                    placement.playerId !== playerId || placement.role !== role,
            ),
        }));

    const playerById = (id: string) =>
        document().players.find((player) => player.id === id);

    const summary = () =>
        mode() === "champions"
            ? document()
                  .tiers.map((tier) => {
                      const names = (
                          document().championPlacements[tier.id] ?? []
                      ).map((key) => dataset()?.championData[key]?.name ?? key);
                      return `${tier.label}: ${names.join(", ") || "—"}`;
                  })
                  .join("\n")
            : document()
                  .tiers.map((tier) => {
                      const placements = document().playerPlacements.filter(
                          (entry) => entry.tierId === tier.id,
                      );
                      return `${tier.label}: ${
                          placements
                              .map(
                                  (entry) =>
                                      `${playerById(entry.playerId)?.name ?? "?"} (${roleName(entry.role)})`,
                              )
                              .join(", ") || "—"
                      }`;
                  })
                  .join("\n");

    const copySummary = async () => {
        await navigator.clipboard.writeText(summary());
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    const exportImage = async () => {
        const data = dataset();
        if (!data || exporting()) return;
        setExporting(true);
        setExportError(false);
        try {
            await downloadTierListSnapshot(
                mode() === "champions"
                    ? `${t("tierListMaker")} · ${t("champions")}`
                    : `${t("tierListMaker")} · ${t("players")}`,
                document().tiers.map((tier) => ({
                    label: tier.label,
                    color: tier.color,
                    items:
                        mode() === "champions"
                            ? (
                                  document().championPlacements[tier.id] ?? []
                              ).map((key) => ({
                                  label: championName(
                                      data.championData[key],
                                      config,
                                  ),
                                  imageUrl: `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/champion/${data.championData[key].id}.png`,
                              }))
                            : document()
                                  .playerPlacements.filter(
                                      (entry) => entry.tierId === tier.id,
                                  )
                                  .map((entry) => ({
                                      label:
                                          playerById(entry.playerId)?.name ??
                                          "?",
                                      detail: roleName(entry.role),
                                  })),
                })),
            );
        } catch {
            setExportError(true);
        } finally {
            setExporting(false);
        }
    };

    const resetTierList = () => setDocument(emptyDocument());

    return (
        <div class="h-full overflow-y-auto px-4 py-5 xl:px-8">
            <div class="mx-auto max-w-[1500px]">
                <header class="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-accent">
                            {t("rosterWorkspace")}
                        </p>
                        <h2 class="mt-1 text-3xl font-semibold">
                            {t("tierListMaker")}
                        </h2>
                        <p class="mt-2 max-w-3xl text-sm text-neutral-400">
                            {t("tierListIntro")}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button
                            type="button"
                            title={t("resetTierList")}
                            aria-label={t("resetTierList")}
                            class="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 hover:border-rose-500 hover:text-rose-400"
                            onClick={resetTierList}
                        >
                            <Icon path={trash} class="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            class="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:border-accent"
                            onClick={copySummary}
                        >
                            {copied() ? t("copied") : t("copy")}
                        </button>
                        <button
                            type="button"
                            disabled={exporting()}
                            class="rounded-lg border border-accent/60 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/20 disabled:opacity-50"
                            onClick={exportImage}
                        >
                            {exporting() ? t("creatingImage") : t("saveImage")}
                        </button>
                    </div>
                </header>
                <Show when={exportError()}>
                    <p class="mb-3 text-right text-xs text-rose-400">
                        {t("imageExportFailed")}
                    </p>
                </Show>

                <div class="mb-5 flex w-fit rounded-xl border border-neutral-700 bg-primary p-1">
                    <For each={["champions", "players"] as const}>
                        {(value) => (
                            <button
                                type="button"
                                class="rounded-lg px-5 py-2 text-sm font-semibold transition-colors"
                                classList={{
                                    "bg-accent text-neutral-950":
                                        mode() === value,
                                    "text-neutral-400 hover:text-white":
                                        mode() !== value,
                                }}
                                onClick={() => setMode(value)}
                            >
                                {t(value)}
                            </button>
                        )}
                    </For>
                </div>

                <Show
                    when={mode() === "champions"}
                    fallback={
                        <PlayerTierList
                            document={document()}
                            playerName={playerName()}
                            setPlayerName={setPlayerName}
                            addPlayer={addPlayer}
                            removePlayer={removePlayer}
                            placePlayer={placePlayer}
                            removePlacement={removePlayerPlacement}
                            updateTierLabel={updateTierLabel}
                        />
                    }
                >
                    <section class="overflow-hidden rounded-xl border border-neutral-700 bg-primary/60">
                        <For each={document().tiers}>
                            {(tier) => (
                                <div
                                    class="grid min-h-24 grid-cols-[72px_minmax(0,1fr)] border-b border-neutral-700 last:border-b-0"
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        if (event.dataTransfer)
                                            event.dataTransfer.dropEffect =
                                                "move";
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const key = readChampionDragData(event);
                                        if (key) moveChampion(key, tier.id);
                                    }}
                                >
                                    <input
                                        aria-label={t("tierName")}
                                        class="h-full w-full px-2 text-center text-xl font-bold text-neutral-950 outline-none"
                                        style={{ background: tier.color }}
                                        value={tier.label}
                                        onBlur={(event) =>
                                            updateTierLabel(
                                                tier.id,
                                                event.currentTarget.value,
                                            )
                                        }
                                    />
                                    <div
                                        class="flex min-w-0 flex-wrap content-start gap-2 p-3"
                                        style={{
                                            background: `color-mix(in srgb, ${tier.color} 8%, var(--color-canvas))`,
                                        }}
                                    >
                                        <For
                                            each={
                                                document().championPlacements[
                                                    tier.id
                                                ] ?? []
                                            }
                                        >
                                            {(key) => (
                                                <button
                                                    type="button"
                                                    draggable={true}
                                                    title={
                                                        dataset()?.championData[
                                                            key
                                                        ]?.name
                                                    }
                                                    class="group relative h-14 w-14 overflow-hidden rounded-lg border border-neutral-600 bg-canvas"
                                                    onDragStart={(event) =>
                                                        setChampionDragData(
                                                            event,
                                                            key,
                                                        )
                                                    }
                                                    onDblClick={() =>
                                                        moveChampion(key)
                                                    }
                                                >
                                                    <ChampionIcon
                                                        championKey={key}
                                                        size={56}
                                                        class="h-full! w-full!"
                                                    />
                                                    <span class="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 text-[9px] opacity-0 group-hover:opacity-100">
                                                        {t("remove")}
                                                    </span>
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            )}
                        </For>
                    </section>

                    <section class="mt-5 rounded-xl border border-neutral-700 bg-primary p-4">
                        <div class="flex flex-wrap items-center gap-2">
                            <input
                                class="min-w-56 flex-1 rounded-lg border border-neutral-700 bg-canvas px-3 py-2 outline-none focus:border-accent"
                                placeholder={t("search")}
                                value={search()}
                                onInput={(event) =>
                                    setSearch(event.currentTarget.value)
                                }
                            />
                            <button
                                type="button"
                                class="rounded-lg border px-3 py-2 text-sm"
                                classList={{
                                    "border-accent text-accent":
                                        roleFilter() === undefined,
                                    "border-neutral-700 text-neutral-400":
                                        roleFilter() !== undefined,
                                }}
                                onClick={() => setRoleFilter(undefined)}
                            >
                                {t("allRoles")}
                            </button>
                            <For each={ROLES}>
                                {(role) => (
                                    <button
                                        type="button"
                                        aria-label={roleName(role)}
                                        title={roleName(role)}
                                        class="rounded-lg border p-2"
                                        classList={{
                                            "border-accent text-accent":
                                                roleFilter() === role,
                                            "border-neutral-700 text-neutral-400":
                                                roleFilter() !== role,
                                        }}
                                        onClick={() =>
                                            setRoleFilter(
                                                roleFilter() === role
                                                    ? undefined
                                                    : role,
                                            )
                                        }
                                    >
                                        <RoleIcon role={role} class="h-5 w-5" />
                                    </button>
                                )}
                            </For>
                        </div>
                        <div class="mt-3 grid max-h-[380px] grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-2 overflow-y-auto pr-1">
                            <For each={availableChampions()}>
                                {(champion) => (
                                    <button
                                        type="button"
                                        draggable={true}
                                        title={champion.name}
                                        class="group relative aspect-square overflow-hidden rounded-lg border border-neutral-700 bg-canvas hover:border-accent"
                                        onDragStart={(event) =>
                                            setChampionDragData(
                                                event,
                                                champion.key,
                                            )
                                        }
                                        onClick={() =>
                                            moveChampion(
                                                champion.key,
                                                document().tiers[0].id,
                                            )
                                        }
                                    >
                                        <ChampionIcon
                                            championKey={champion.key}
                                            size={58}
                                            class="h-full! w-full! transition-transform group-hover:scale-105"
                                        />
                                    </button>
                                )}
                            </For>
                        </div>
                    </section>
                </Show>
            </div>
        </div>
    );
}

function PlayerTierList(props: {
    document: TierListDocument;
    playerName: string;
    setPlayerName: (value: string) => void;
    addPlayer: () => void;
    removePlayer: (id: string) => void;
    placePlayer: (
        playerId: string,
        role: Role,
        tierId: string,
        sourceRole?: Role,
    ) => void;
    removePlacement: (playerId: string, role: Role) => void;
    updateTierLabel: (tierId: string, label: string) => void;
}) {
    const { t, roleName } = useI18n();
    const playerName = (id: string) =>
        props.document.players.find((player) => player.id === id)?.name ?? "?";

    const setPlayerDragData = (
        event: DragEvent,
        value: { playerId: string; sourceRole?: Role },
    ) => {
        const payload = JSON.stringify(value);
        if (!event.dataTransfer) return;
        // Keep a plain-text fallback: some Chromium/Tauri versions omit custom
        // MIME types when the drag starts on a nested element.
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData("application/x-rifttheory-player", payload);
        event.dataTransfer.setData("text/plain", payload);
    };

    const readPlayerDragData = (event: DragEvent) => {
        const raw =
            event.dataTransfer?.getData("application/x-rifttheory-player") ||
            event.dataTransfer?.getData("text/plain");
        if (!raw) return undefined;
        try {
            return JSON.parse(raw) as { playerId: string; sourceRole?: Role };
        } catch {
            return undefined;
        }
    };

    return (
        <>
            <form
                class="mb-5 flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    props.addPlayer();
                }}
            >
                <input
                    class="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-primary px-3 py-2.5 outline-none focus:border-accent"
                    placeholder={t("enterPlayerName")}
                    value={props.playerName}
                    onInput={(event) =>
                        props.setPlayerName(event.currentTarget.value)
                    }
                />
                <button
                    type="submit"
                    class="rounded-lg border border-accent bg-accent/10 px-4 text-sm font-semibold text-accent disabled:opacity-40"
                    disabled={!props.playerName.trim()}
                >
                    {t("addPlayer")}
                </button>
            </form>

            <Show when={props.document.players.length}>
                <section class="mb-5 rounded-xl border border-neutral-700 bg-primary p-3">
                    <p class="mb-2 text-xs uppercase tracking-wider text-neutral-500">
                        {t("playerPool")}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <For each={props.document.players}>
                            {(player) => (
                                <div class="flex items-center gap-1 rounded-lg border border-neutral-700 bg-canvas p-1 text-sm">
                                    <button
                                        type="button"
                                        draggable={true}
                                        class="cursor-grab select-none px-2 py-1 active:cursor-grabbing"
                                        onDragStart={(event) => {
                                            event.stopPropagation();
                                            setPlayerDragData(event, {
                                                playerId: player.id,
                                            });
                                        }}
                                    >
                                        {player.name}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={t("removePlayer")}
                                        class="text-neutral-600 hover:text-opponent"
                                        onClick={() =>
                                            props.removePlayer(player.id)
                                        }
                                    >
                                        <Icon
                                            path={trash}
                                            class="h-3.5 w-3.5"
                                        />
                                    </button>
                                </div>
                            )}
                        </For>
                    </div>
                </section>
            </Show>

            <section class="overflow-x-auto rounded-xl border border-neutral-700 bg-primary/60">
                <div class="min-w-[850px]">
                    <div class="grid grid-cols-[82px_repeat(5,minmax(150px,1fr))] border-b border-neutral-700 bg-canvas text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        <div />
                        <For each={ROLES}>
                            {(role) => (
                                <div class="flex items-center justify-center gap-2 border-l border-neutral-700 px-3 py-2">
                                    <RoleIcon role={role} class="h-4 w-4" />
                                    {roleName(role)}
                                </div>
                            )}
                        </For>
                    </div>
                    <For each={props.document.tiers}>
                        {(tier) => (
                            <div class="grid min-h-24 grid-cols-[82px_repeat(5,minmax(150px,1fr))] border-b border-neutral-700 last:border-b-0">
                                <input
                                    aria-label={t("tierName")}
                                    class="h-full w-full px-2 text-center text-xl font-bold text-neutral-950 outline-none"
                                    style={{ background: tier.color }}
                                    value={tier.label}
                                    onBlur={(event) =>
                                        props.updateTierLabel(
                                            tier.id,
                                            event.currentTarget.value,
                                        )
                                    }
                                />
                                <For each={ROLES}>
                                    {(role) => (
                                        <div
                                            class="flex min-h-24 flex-wrap content-start gap-1.5 border-l border-neutral-700 p-2"
                                            style={{
                                                background: `color-mix(in srgb, ${tier.color} 7%, var(--color-canvas))`,
                                            }}
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                if (event.dataTransfer)
                                                    event.dataTransfer.dropEffect =
                                                        "copy";
                                            }}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                                const value =
                                                    readPlayerDragData(event);
                                                if (!value?.playerId) return;
                                                props.placePlayer(
                                                    value.playerId,
                                                    role,
                                                    tier.id,
                                                    value.sourceRole,
                                                );
                                            }}
                                        >
                                            <For
                                                each={props.document.playerPlacements.filter(
                                                    (placement) =>
                                                        placement.tierId ===
                                                            tier.id &&
                                                        placement.role === role,
                                                )}
                                            >
                                                {(placement) => (
                                                    <button
                                                        type="button"
                                                        draggable={true}
                                                        class="rounded-md border border-neutral-600 bg-primary px-2 py-1 text-xs hover:border-accent"
                                                        title={t(
                                                            "doubleClickRemove",
                                                        )}
                                                        onDragStart={(event) =>
                                                            setPlayerDragData(
                                                                event,
                                                                {
                                                                    playerId:
                                                                        placement.playerId,
                                                                    sourceRole:
                                                                        placement.role,
                                                                },
                                                            )
                                                        }
                                                        onDblClick={() =>
                                                            props.removePlacement(
                                                                placement.playerId,
                                                                placement.role,
                                                            )
                                                        }
                                                    >
                                                        {playerName(
                                                            placement.playerId,
                                                        )}
                                                    </button>
                                                )}
                                            </For>
                                        </div>
                                    )}
                                </For>
                            </div>
                        )}
                    </For>
                </div>
            </section>
        </>
    );
}
