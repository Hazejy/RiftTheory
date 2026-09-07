import {
    buildChampionLockState,
    championLockReason,
    CompletedLiveDraftGame,
    FearlessScope,
    LIVE_DRAFT_MODES,
    LiveDraftAction,
    LiveDraftGameCount,
    LiveDraftMode,
    LiveDraftSeriesConfig,
    nextDraftStep,
    oppositeTeam,
    SeriesTeamId,
    sidesFromBlueTeam,
    STANDARD_DRAFT_SEQUENCE,
} from "@draftgap/core/src/live-draft/series";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import {
    championName,
    normalizeChampionSearch,
    useI18n,
} from "../../utils/i18n";
import { Button } from "../common/Button";
import { Icon, arrowLeft, broadcast, columns } from "../icons/RiftIcons";
import LiveDraftBroadcastStage from "./live-draft/LiveDraftBroadcastStage";
import LiveDraftChampionPool from "./live-draft/LiveDraftChampionPool";
import LiveDraftSetup, {
    liveDraftModeLabel,
} from "./live-draft/LiveDraftSetup";
import LiveDraftTeamPanel from "./live-draft/LiveDraftTeamPanel";

type StoredLiveDraft = {
    config: LiveDraftSeriesConfig;
    games: EditableLiveDraftGame[];
    activeGameNumber: number;
    layout?: LiveDraftLayout;
};

type EditableLiveDraftGame = {
    gameNumber: number;
    blueTeam: SeriesTeamId;
    actions: LiveDraftAction[];
};

type LiveDraftLayout = "classic" | "broadcast";

const STORAGE_KEY = "rifttheory.live-draft.local-series.v2";
const LEGACY_STORAGE_KEY = "rifttheory.live-draft.local-series.v1";
const GAME_COUNTS: readonly LiveDraftGameCount[] = [1, 2, 3, 4, 5];

function createGameDrafts(gameCount: LiveDraftGameCount) {
    return Array.from({ length: gameCount }, (_, index) => ({
        gameNumber: index + 1,
        blueTeam: (index % 2 === 0 ? "team1" : "team2") as SeriesTeamId,
        actions: [] as LiveDraftAction[],
    }));
}

function loadStoredDraft(): StoredLiveDraft | undefined {
    try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (
            current &&
            typeof current === "object" &&
            current.config &&
            LIVE_DRAFT_MODES.includes(current.config.mode) &&
            GAME_COUNTS.includes(current.config.gameCount) &&
            Array.isArray(current.games) &&
            Number.isInteger(current.activeGameNumber)
        ) {
            return current as StoredLiveDraft;
        }

        const value = JSON.parse(
            localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null",
        );
        if (
            !value ||
            typeof value !== "object" ||
            !value.config ||
            !LIVE_DRAFT_MODES.includes(value.config.mode) ||
            !GAME_COUNTS.includes(value.config.gameCount) ||
            !Array.isArray(value.completedGames) ||
            !Array.isArray(value.currentActions) ||
            !["team1", "team2"].includes(value.blueTeam)
        )
            return undefined;
        const legacyCompleted =
            value.completedGames as CompletedLiveDraftGame[];
        const games = createGameDrafts(value.config.gameCount).map((game) => {
            const complete = legacyCompleted.find(
                (candidate) => candidate.gameNumber === game.gameNumber,
            );
            if (complete) {
                const blueTeam = complete.sides.blue;
                return { ...game, blueTeam, actions: [...complete.actions] };
            }
            if (game.gameNumber === legacyCompleted.length + 1) {
                return {
                    ...game,
                    blueTeam: value.blueTeam as SeriesTeamId,
                    actions: [...(value.currentActions as LiveDraftAction[])],
                };
            }
            return game;
        });
        return {
            config: value.config,
            games,
            activeGameNumber: Math.min(
                legacyCompleted.length + 1,
                value.config.gameCount,
            ),
            layout: value.layout,
        };
    } catch {
        return undefined;
    }
}

export default function LiveDraftView() {
    const { t } = useI18n();
    const { dataset } = useDataset();
    const { config: userConfig } = useUser();
    const stored = loadStoredDraft();
    const [team1Name, setTeam1Name] = createSignal("Blue Team");
    const [team2Name, setTeam2Name] = createSignal("Red Team");
    const [mode, setMode] = createSignal<LiveDraftMode>("normal");
    const [fearlessScope, setFearlessScope] =
        createSignal<FearlessScope>("global");
    const [gameCount, setGameCount] = createSignal<LiveDraftGameCount>(3);
    const [seriesConfig, setSeriesConfig] = createSignal<
        LiveDraftSeriesConfig | undefined
    >(stored?.config);
    const [games, setGames] = createSignal<EditableLiveDraftGame[]>(
        stored?.games ?? [],
    );
    const [activeGameNumber, setActiveGameNumber] = createSignal(
        stored?.activeGameNumber ?? 1,
    );
    const [search, setSearch] = createSignal("");
    const [layout, setLayout] = createSignal<LiveDraftLayout>(
        stored?.layout === "broadcast" ? "broadcast" : "classic",
    );

    createEffect(() => {
        const activeConfig = seriesConfig();
        if (!activeConfig) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                config: activeConfig,
                games: games(),
                activeGameNumber: activeGameNumber(),
                layout: layout(),
            } satisfies StoredLiveDraft),
        );
    });

    const activeGame = () =>
        games().find((game) => game.gameNumber === activeGameNumber());
    const currentActions = () => activeGame()?.actions ?? [];
    const setCurrentActions = (
        update:
            | LiveDraftAction[]
            | ((actions: LiveDraftAction[]) => LiveDraftAction[]),
    ) =>
        setGames((current) =>
            current.map((game) =>
                game.gameNumber === activeGameNumber()
                    ? {
                          ...game,
                          actions:
                              typeof update === "function"
                                  ? update(game.actions)
                                  : update,
                      }
                    : game,
            ),
        );
    const blueTeam = () => activeGame()?.blueTeam ?? "team1";
    const setBlueTeam = (
        update: SeriesTeamId | ((team: SeriesTeamId) => SeriesTeamId),
    ) =>
        setGames((current) =>
            current.map((game) =>
                game.gameNumber === activeGameNumber()
                    ? {
                          ...game,
                          blueTeam:
                              typeof update === "function"
                                  ? update(game.blueTeam)
                                  : update,
                      }
                    : game,
            ),
        );
    const currentGameNumber = () => activeGameNumber();
    const sides = () => sidesFromBlueTeam(blueTeam());
    const step = () => nextDraftStep(currentActions());
    const activeTeam = () => (step() ? sides()[step()!.side] : undefined);
    const lockState = createMemo(() => {
        const activeConfig = seriesConfig();
        return activeConfig
            ? buildChampionLockState(
                  activeConfig,
                  games()
                      .filter(
                          (game) =>
                              game.gameNumber < activeGameNumber() &&
                              game.actions.length ===
                                  STANDARD_DRAFT_SEQUENCE.length,
                      )
                      .map((game) => ({
                          gameNumber: game.gameNumber,
                          sides: sidesFromBlueTeam(game.blueTeam),
                          actions: game.actions,
                      })),
              )
            : undefined;
    });
    const currentChampionKeys = createMemo(
        () => new Set(currentActions().map((action) => action.championKey)),
    );
    const champions = createMemo(() => {
        const data = dataset();
        if (!data) return [];
        const query = normalizeChampionSearch(search());
        return Object.entries(data.championData)
            .map(([key, champion]) => ({
                key,
                name: championName(champion, userConfig),
            }))
            .filter(({ name }) => normalizeChampionSearch(name).includes(query))
            .sort((left, right) => left.name.localeCompare(right.name));
    });
    const completedGames = createMemo(() =>
        games()
            .filter(
                (game) =>
                    game.actions.length === STANDARD_DRAFT_SEQUENCE.length,
            )
            .map(
                (game): CompletedLiveDraftGame => ({
                    gameNumber: game.gameNumber,
                    sides: sidesFromBlueTeam(game.blueTeam),
                    actions: game.actions,
                }),
            ),
    );
    const isSeriesComplete = () =>
        Boolean(seriesConfig()) && completedGames().length === games().length;

    const teamName = (teamId: SeriesTeamId) => {
        const activeConfig = seriesConfig();
        if (!activeConfig) return "";
        return teamId === "team1"
            ? activeConfig.team1Name
            : activeConfig.team2Name;
    };

    const startSeries = () => {
        const nextConfig: LiveDraftSeriesConfig = {
            team1Name: team1Name().trim() || t("teamOne"),
            team2Name: team2Name().trim() || t("teamTwo"),
            gameCount: gameCount(),
            mode: mode(),
            fearlessScope: fearlessScope(),
            firstSelection: false,
            disabledChampionKeys: [],
        };
        setSeriesConfig(nextConfig);
        setGames(createGameDrafts(nextConfig.gameCount));
        setActiveGameNumber(1);
    };

    const lockReason = (championKey: string) => {
        if (currentChampionKeys().has(championKey)) return "current_game";
        const locks = lockState();
        const teamId = activeTeam();
        return locks && teamId
            ? championLockReason(locks, championKey, teamId)
            : undefined;
    };

    const selectChampion = (championKey: string) => {
        const currentStep = step();
        const teamId = activeTeam();
        if (!currentStep || !teamId || lockReason(championKey)) return;
        setCurrentActions((actions) => [
            ...actions,
            { ...currentStep, championKey, teamId },
        ]);
    };

    const finishGame = () => {
        if (currentActions().length !== STANDARD_DRAFT_SEQUENCE.length) return;
        const nextGame =
            games().find(
                (game) =>
                    game.gameNumber > activeGameNumber() &&
                    game.actions.length < STANDARD_DRAFT_SEQUENCE.length,
            ) ??
            games().find(
                (game) => game.actions.length < STANDARD_DRAFT_SEQUENCE.length,
            );
        if (nextGame) setActiveGameNumber(nextGame.gameNumber);
        setSearch("");
    };

    const leaveSeries = () => {
        setSeriesConfig(undefined);
        setGames([]);
        setActiveGameNumber(1);
        setSearch("");
    };

    const DraftPool = (props: { compact?: boolean }) => (
        <section class="min-w-0 rounded-xl border border-neutral-800 bg-primary p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="font-semibold">
                        <Show when={step()} fallback={t("draftComplete")}>
                            {(currentStep) => (
                                <>
                                    {teamName(sides()[currentStep().side])} ·{" "}
                                    {currentStep().kind === "pick"
                                        ? t("pick")
                                        : t("ban")}{" "}
                                    {currentStep().slot + 1}
                                </>
                            )}
                        </Show>
                    </h3>
                    <p class="mt-1 text-xs text-neutral-500">
                        {currentActions().length} /{" "}
                        {STANDARD_DRAFT_SEQUENCE.length} {t("draftActions")}
                    </p>
                </div>
                <Show when={!step()}>
                    <Button
                        class="px-4 py-2 text-sm normal-case"
                        onClick={finishGame}
                    >
                        {t("finishGame")}
                    </Button>
                </Show>
            </div>
            <LiveDraftChampionPool
                champions={champions()}
                search={search()}
                disabled={!step()}
                compact={props.compact}
                lockReason={lockReason}
                onSearchChange={setSearch}
                onSelect={selectChampion}
            />
        </section>
    );

    return (
        <div class="h-full overflow-y-auto px-4 py-3 xl:px-8">
            <div class="mx-auto max-w-[1500px]">
                <header
                    class="flex flex-wrap items-end justify-between gap-4"
                    classList={{
                        "mb-5": !seriesConfig(),
                        "mb-3": Boolean(seriesConfig()),
                    }}
                >
                    <div>
                        <Show when={!seriesConfig()}>
                            <p class="text-xs uppercase tracking-[0.2em] text-accent">
                                {t("sharedDraftRoom")}
                            </p>
                        </Show>
                        <h2
                            class="font-semibold"
                            classList={{
                                "mt-1 text-3xl": !seriesConfig(),
                                "text-xl": Boolean(seriesConfig()),
                            }}
                        >
                            {t("liveDraft")}
                        </h2>
                        <Show when={!seriesConfig()}>
                            <p class="mt-2 max-w-3xl text-sm text-neutral-400">
                                {t("liveDraftIntro")}
                            </p>
                        </Show>
                    </div>
                    <Show when={seriesConfig()}>
                        <button
                            type="button"
                            class="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-opponent/70 hover:text-neutral-100"
                            onClick={leaveSeries}
                        >
                            {t("newSeries")}
                        </button>
                    </Show>
                </header>

                <Show
                    when={seriesConfig()}
                    fallback={
                        <LiveDraftSetup
                            team1Name={team1Name()}
                            team2Name={team2Name()}
                            mode={mode()}
                            fearlessScope={fearlessScope()}
                            gameCount={gameCount()}
                            onTeam1NameChange={setTeam1Name}
                            onTeam2NameChange={setTeam2Name}
                            onModeChange={setMode}
                            onFearlessScopeChange={setFearlessScope}
                            onGameCountChange={setGameCount}
                            onStart={startSeries}
                        />
                    }
                >
                    {(activeConfig) => (
                        <>
                            <nav
                                aria-label={t("seriesGames")}
                                class="mb-2 flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-800 bg-primary p-1"
                            >
                                <span class="shrink-0 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                    {t("series")}
                                </span>
                                <For each={games()}>
                                    {(game) => {
                                        const complete = () =>
                                            game.actions.length ===
                                            STANDARD_DRAFT_SEQUENCE.length;
                                        return (
                                            <button
                                                type="button"
                                                aria-label={`${t("game")} ${game.gameNumber}`}
                                                aria-pressed={
                                                    activeGameNumber() ===
                                                    game.gameNumber
                                                }
                                                class="relative flex h-9 min-w-12 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors"
                                                classList={{
                                                    "border-accent bg-accent/10 text-accent":
                                                        activeGameNumber() ===
                                                        game.gameNumber,
                                                    "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white":
                                                        activeGameNumber() !==
                                                        game.gameNumber,
                                                }}
                                                onClick={() => {
                                                    setActiveGameNumber(
                                                        game.gameNumber,
                                                    );
                                                    setSearch("");
                                                }}
                                            >
                                                G{game.gameNumber}
                                                <span
                                                    class="absolute bottom-1 h-1 w-1 rounded-full"
                                                    classList={{
                                                        "bg-emerald-400":
                                                            complete(),
                                                        "bg-neutral-600":
                                                            !complete() &&
                                                            Boolean(
                                                                game.actions
                                                                    .length,
                                                            ),
                                                        hidden:
                                                            !complete() &&
                                                            !game.actions
                                                                .length,
                                                    }}
                                                />
                                            </button>
                                        );
                                    }}
                                </For>
                            </nav>
                            <section class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-primary px-3 py-2">
                                <div>
                                    <span class="text-sm font-semibold">
                                        {t("game")} {currentGameNumber()} /{" "}
                                        {activeConfig().gameCount}
                                    </span>
                                    <span class="ml-3 text-xs text-neutral-500">
                                        {liveDraftModeLabel(
                                            activeConfig().mode,
                                            t,
                                        )}
                                        <Show
                                            when={
                                                activeConfig().mode ===
                                                "fearless"
                                            }
                                        >
                                            {" "}
                                            ·{" "}
                                            {t(
                                                activeConfig().fearlessScope ===
                                                    "global"
                                                    ? "globalFearless"
                                                    : "teamFearless",
                                            )}
                                        </Show>
                                    </span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex rounded-lg border border-neutral-700 bg-canvas p-0.5">
                                        <For
                                            each={
                                                [
                                                    {
                                                        value: "classic",
                                                        label: t(
                                                            "classicLayout",
                                                        ),
                                                        icon: columns,
                                                    },
                                                    {
                                                        value: "broadcast",
                                                        label: t(
                                                            "broadcastLayout",
                                                        ),
                                                        icon: broadcast,
                                                    },
                                                ] as const
                                            }
                                        >
                                            {(option) => (
                                                <button
                                                    type="button"
                                                    title={option.label}
                                                    aria-label={option.label}
                                                    aria-pressed={
                                                        layout() ===
                                                        option.value
                                                    }
                                                    class="rounded-md p-1.5"
                                                    classList={{
                                                        "bg-neutral-700 text-white":
                                                            layout() ===
                                                            option.value,
                                                        "text-neutral-500 hover:text-white":
                                                            layout() !==
                                                            option.value,
                                                    }}
                                                    onClick={() =>
                                                        setLayout(option.value)
                                                    }
                                                >
                                                    <Icon
                                                        path={option.icon}
                                                        class="h-4 w-4"
                                                    />
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={currentActions().length > 0}
                                        class="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 disabled:opacity-30"
                                        onClick={() =>
                                            setBlueTeam((team) =>
                                                oppositeTeam(team),
                                            )
                                        }
                                    >
                                        {t("swapSides")}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!currentActions().length}
                                        class="flex items-center gap-1 rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 disabled:opacity-30"
                                        onClick={() =>
                                            setCurrentActions((actions) =>
                                                actions.slice(0, -1),
                                            )
                                        }
                                    >
                                        <Icon
                                            path={arrowLeft}
                                            class="h-3.5 w-3.5"
                                        />
                                        {t("undo")}
                                    </button>
                                </div>
                            </section>

                            <Show
                                when={layout() === "classic"}
                                fallback={
                                    <div class="grid gap-4">
                                        <DraftPool compact />
                                        <LiveDraftBroadcastStage
                                            blueName={teamName(sides().blue)}
                                            redName={teamName(sides().red)}
                                            currentStep={step()}
                                            actions={currentActions()}
                                        />
                                    </div>
                                }
                            >
                                <div class="grid items-stretch gap-3 xl:grid-cols-[240px_minmax(0,1fr)_240px]">
                                    <LiveDraftTeamPanel
                                        side="blue"
                                        teamName={teamName(sides().blue)}
                                        currentStep={step()}
                                        actions={currentActions()}
                                    />
                                    <DraftPool />
                                    <LiveDraftTeamPanel
                                        side="red"
                                        teamName={teamName(sides().red)}
                                        currentStep={step()}
                                        actions={currentActions()}
                                    />
                                </div>
                            </Show>

                            <Show when={completedGames().length}>
                                <section class="mt-4 rounded-xl border border-neutral-800 bg-primary p-4">
                                    <h3 class="font-semibold">
                                        {t("seriesHistory")}
                                    </h3>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        <For each={completedGames()}>
                                            {(game) => (
                                                <span class="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
                                                    {t("game")}{" "}
                                                    {game.gameNumber} ·{" "}
                                                    {
                                                        game.actions.filter(
                                                            (action) =>
                                                                action.kind ===
                                                                "pick",
                                                        ).length
                                                    }{" "}
                                                    {t("picks")}
                                                </span>
                                            )}
                                        </For>
                                    </div>
                                </section>
                            </Show>
                            <Show when={isSeriesComplete()}>
                                <SeriesComplete
                                    config={activeConfig()}
                                    completedGames={completedGames().length}
                                    onNewSeries={leaveSeries}
                                />
                            </Show>
                        </>
                    )}
                </Show>
            </div>
        </div>
    );
}

function SeriesComplete(props: {
    config: LiveDraftSeriesConfig;
    completedGames: number;
    onNewSeries: () => void;
}) {
    const { t } = useI18n();
    return (
        <section class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-800 bg-emerald-950/20 p-4">
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-emerald-300">
                    {t("seriesComplete")}
                </p>
                <h3 class="mt-1 text-lg font-semibold">
                    {props.config.team1Name} vs. {props.config.team2Name}
                </h3>
                <p class="mt-1 text-sm text-neutral-400">
                    {props.completedGames} {t("gamesCompleted")}
                </p>
            </div>
            <Button
                variant="secondary"
                class="px-4 py-2 text-sm normal-case"
                onClick={props.onNewSeries}
            >
                {t("newSeries")}
            </Button>
        </section>
    );
}
