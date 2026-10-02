import {
    Icon,
    riftMark,
    draftBoard,
    strategy,
    colorLayers,
    itemCube,
    presentationChartLine,
    cog_6Tooth,
    prepBoard,
    riftPlanner,
    liveDraft,
    tierList,
} from "./components/icons/RiftIcons";
import {
    Component,
    createEffect,
    createSignal,
    For,
    Match,
    Show,
    Switch,
} from "solid-js";
import { RoleFilter } from "./components/draft/RoleFilter";
import { Search } from "./components/draft/Search";
import { TeamSelector } from "./components/draft/TeamSelector";
import { TeamSidebar } from "./components/draft/TeamSidebar";
import { useLolClient } from "./contexts/LolClientContext";
import { Badge } from "./components/common/Badge";
import { FilterMenu } from "./components/draft/FilterMenu";
import { formatDistance } from "date-fns";
import { ViewTabs } from "./components/common/ViewTabs";
import { useDraftView } from "./contexts/DraftViewContext";
import { useUser } from "./contexts/UserContext";
import { useDataset } from "./contexts/DatasetContext";
import { LoadingIcon } from "./components/icons/LoadingIcon";
import { DialogTrigger, Dialog } from "./components/common/Dialog";
import { DraftSequence } from "./components/draft/DraftSequence";
import { useI18n } from "./utils/i18n";
import { enUS, ko, zhCN } from "date-fns/locale";
import { LeagueOfItemsLink } from "./components/LeagueOfItemsLink";
import { useDraftAnalysis } from "./contexts/DraftAnalysisContext";
import { ChampionDraftAnalysisDialog } from "./components/dialogs/ChampionDraftAnalysisDialog";
import { AnalyzeHoverToggle } from "./components/draft/AnalyzeHoverToggle";
import { useMedia } from "./hooks/useMedia";
import { buttonVariants } from "./components/common/Button";
import { cn } from "./utils/style";
import { formatPatch } from "./utils/strings";
import { LanguageDropdownMenu } from "./components/LanguageMenu";
import { FONT_PRESETS, THEME_PRESETS } from "./utils/appearance";
import { customThemeVariables } from "./utils/customTheme";
import { DraftSnapshotButton } from "./components/rifttheory/DraftSnapshotButton";
import { LolClientStatusBadge } from "./components/draft/LolClientStatusBadge";
import { deferredView } from "./components/common/DeferredView";

const RiftTheoryStrategy = deferredView("Strategy", () => import("./components/rifttheory/StrategyWorkspace"));
const DraftSimulatorView = deferredView("Draft Simulator", () => import("./components/workspaces/DraftSimulatorView"));
const DraftTable = deferredView("Draft table", () => import("./components/draft/DraftTable"));
const SettingsDialog = deferredView("settings", () => import("./components/dialogs/SettingsDialog"));
const DraftPrepView = deferredView("Draft Prep", () => import("./components/workspaces/DraftPrepView"));
const RiftPlannerView = deferredView("Rift Planner", () => import("./components/workspaces/RiftPlannerView"));
const LiveDraftView = deferredView("Live Draft", () => import("./components/workspaces/LiveDraftView"));
const TierListView = deferredView("Tier List", () => import("./components/workspaces/TierListView"));
const ChampColors = deferredView("Champ Colors", () => import("./components/rifttheory/ChampColors"));
const AnalysisView = deferredView("analysis", () => import("./components/views/analysis/AnalysisView"));
const BuildsView = deferredView("builds", () => import("./components/views/builds/BuildsView").then((module) => ({ default: module.BuildsView })));

const App: Component = () => {
    const { t } = useI18n();
    const { config, storageError } = useUser();
    const { currentDraftView, setCurrentDraftView } = useDraftView();
    const { dataset, isLoaded, loadState, retryDatasets } = useDataset();
    const { analysisPick, setAnalysisPick, showAnalysisPick } =
        useDraftAnalysis();
    const { startLolClientIntegration, stopLolClientIntegration } =
        useLolClient();
    const { isDesktop } = useMedia();

    createEffect(() => {
        if (config.disableLeagueClientIntegration) {
            stopLolClientIntegration();
        } else {
            startLolClientIntegration();
        }
    });

    const [showSettings, setShowSettings] = createSignal(false);
    const [offlineView, setOfflineView] = createSignal<"draftPrep" | "riftPlanner" | "tierList">("draftPrep");
    createEffect(() => {
        document.documentElement.lang = config.language.replace("_", "-");
        document.documentElement.dataset.font = config.fontPreset;
        document.documentElement.dataset.theme = config.theme;
        document.documentElement.style.setProperty(
            "--surface-opacity",
            `${100 - config.transparency}%`,
        );
        const themeColors =
            config.theme === "custom"
                ? config.customColors
                : (THEME_PRESETS.find((preset) => preset.id === config.theme)
                      ?.colors ?? THEME_PRESETS[0].colors);
        for (const [key, value] of Object.entries(
            customThemeVariables(themeColors),
        ))
            document.documentElement.style.setProperty(key, value);
        const font =
            FONT_PRESETS.find((preset) => preset.id === config.fontPreset) ??
            FONT_PRESETS[0];
        document.documentElement.style.setProperty(
            "--font-header",
            font.family,
        );
        document.documentElement.style.setProperty("--font-body", font.family);
    });

    const timeAgo = () =>
        dataset()
            ? formatDistance(new Date(dataset()!.date), new Date(), {
                  addSuffix: true,
                  locale:
                      config.language === "ko_KR"
                          ? ko
                          : config.language === "zh_CN"
                            ? zhCN
                            : enUS,
              })
            : "";

    const MainView = () => {
        return (
            <div
                class="rt-workspace bg-canvas min-h-0 flex-1 overflow-auto overflow-x-hidden h-full flex flex-col"
                style={{
                    "scroll-behavior": "smooth",
                }}
            >
                <Switch>
                    <Match
                        when={
                            loadState() === "error"
                        }
                    >
                        <div class="flex h-full flex-col">
                            <p role="alert" class="px-4 py-4 text-center text-red-400">{t("dataError")}</p>
                            <button type="button" class="mx-auto mb-3 rounded border border-accent px-4 py-2 text-accent" onClick={retryDatasets}>Retry statistics</button>
                            <div class="flex flex-wrap justify-center gap-2 border-y border-neutral-700 px-4 py-3">
                                <button type="button" aria-pressed={offlineView() === "draftPrep"} class="rounded border border-neutral-600 px-3 py-2" onClick={() => setOfflineView("draftPrep")}>{t("draftPrep")}</button>
                                <button type="button" aria-pressed={offlineView() === "riftPlanner"} class="rounded border border-neutral-600 px-3 py-2" onClick={() => setOfflineView("riftPlanner")}>{t("riftPlanner")}</button>
                                <button type="button" aria-pressed={offlineView() === "tierList"} class="rounded border border-neutral-600 px-3 py-2" onClick={() => setOfflineView("tierList")}>{t("tierListMaker")}</button>
                            </div>
                            <Switch>
                                <Match when={offlineView() === "draftPrep"}><DraftPrepView /></Match>
                                <Match when={offlineView() === "riftPlanner"}><RiftPlannerView /></Match>
                                <Match when={offlineView() === "tierList"}><TierListView /></Match>
                            </Switch>
                        </div>
                    </Match>
                    <Match when={loadState() === "loading"}>
                        <div class="flex justify-center items-center h-full text-2xl">
                            <LoadingIcon class="animate-spin h-10 w-10" />
                        </div>
                    </Match>
                    <Match when={isLoaded()}>
                        <Dialog
                            open={showAnalysisPick()}
                            onOpenChange={(open) => {
                                if (!open) setAnalysisPick(undefined);
                            }}
                        >
                            <ChampionDraftAnalysisDialog
                                championKey={analysisPick()!.championKey}
                                team={analysisPick()!.team}
                                openChampionDraftAnalysisModal={(
                                    team,
                                    championKey,
                                ) => setAnalysisPick({ team, championKey })}
                            />
                        </Dialog>
                        <div class="flex flex-col min-h-full flex-1">
                            <ViewTabs
                                tabs={
                                    [
                                        {
                                            label: t("draft"),
                                            value: "draft",
                                            icon: draftBoard,
                                        },
                                        {
                                            label: t("analysis"),
                                            value: "analysis",
                                            icon: presentationChartLine,
                                        },
                                        {
                                            label: t("strategy"),
                                            value: "strategy",
                                            icon: strategy,
                                            disabled: true,
                                            disabledReason: "Not available yet",
                                        },
                                        {
                                            label: "Draft Simulator",
                                            value: "draftSimulator",
                                            icon: draftBoard,
                                            disabled: true,
                                            disabledReason: "Not available yet",
                                        },
                                        {
                                            label: t("champColors"),
                                            value: "colors",
                                            icon: colorLayers,
                                        },
                                        {
                                            label: t("draftPrep"),
                                            value: "draftPrep",
                                            icon: prepBoard,
                                        },
                                        {
                                            label: t("riftPlanner"),
                                            value: "riftPlanner",
                                            icon: riftPlanner,
                                        },
                                        {
                                            label: t("liveDraft"),
                                            value: "liveDraft",
                                            icon: liveDraft,
                                        },
                                        {
                                            label: t("tierListMaker"),
                                            value: "tierList",
                                            icon: tierList,
                                        },
                                        ...(config.enableBetaFeatures
                                            ? ([
                                                  {
                                                      label: t("builds"),
                                                      value: "builds",
                                                      icon: itemCube,
                                                  },
                                              ] as const)
                                            : []),
                                    ] as const
                                }
                                selected={currentDraftView().type}
                                onChange={(type) =>
                                    setCurrentDraftView({
                                        type,
                                        subType: "draft",
                                    })
                                }
                                class="xl:px-8"
                            />
                            <Switch>
                                <Match
                                    when={
                                        currentDraftView().type === "draftPrep"
                                    }
                                >
                                    <DraftPrepView />
                                </Match>
                                <Match
                                    when={
                                        currentDraftView().type ===
                                        "riftPlanner"
                                    }
                                >
                                    <RiftPlannerView />
                                </Match>
                                <Match
                                    when={
                                        currentDraftView().type === "liveDraft"
                                    }
                                >
                                    <LiveDraftView />
                                </Match>
                                <Match
                                    when={
                                        currentDraftView().type === "tierList"
                                    }
                                >
                                    <TierListView />
                                </Match>
                                <Match
                                    when={currentDraftView().type === "colors"}
                                >
                                    <ChampColors />
                                </Match>
                                <Match
                                    when={
                                        currentDraftView().type === "strategy"
                                    }
                                >
                                    <RiftTheoryStrategy />
                                </Match>
                                <Match when={currentDraftView().type === "draftSimulator"}>
                                    <DraftSimulatorView />
                                </Match>
                                <Match
                                    when={currentDraftView().type == "draft"}
                                >
                                    <div class="py-5 px-4 xl:px-8 h-full overflow-y-hidden flex flex-col">
                                        <DraftSequence />
                                        <div class="mb-4 flex gap-4">
                                            <Search />
                                            <TeamSelector />
                                            <RoleFilter class="hidden lg:inline-flex" />
                                            <div class="hidden lg:inline-flex gap-3">
                                                <FilterMenu />
                                                <Show when={isDesktop}>
                                                    <AnalyzeHoverToggle />
                                                </Show>
                                            </div>
                                        </div>
                                        <div class="flex justify-end mb-4 gap-4 lg:hidden">
                                            <RoleFilter class="w-full" />
                                            <FilterMenu />
                                            <AnalyzeHoverToggle />
                                        </div>
                                        <DraftTable />
                                    </div>
                                </Match>
                                <Match
                                    when={
                                        currentDraftView().type === "analysis"
                                    }
                                >
                                    <div class="py-5 px-4 xl:px-8 h-full overflow-y-auto">
                                        <AnalysisView />
                                    </div>
                                </Match>
                                <Match
                                    when={currentDraftView().type === "builds"}
                                >
                                    <BuildsView />
                                </Match>
                            </Switch>
                        </div>
                    </Match>
                </Switch>
            </div>
        );
    };

    const mobileTab = () => {
        if (loadState() === "error") return undefined;
        const current = currentDraftView();
        if (current.type === "draft") {
            return current.subType;
        }
        return undefined;
    };

    const isFullWidthWorkspace = () =>
        loadState() === "error" ||
        currentDraftView().type === "strategy" ||
        currentDraftView().type === "draftSimulator" ||
        currentDraftView().type === "colors" ||
        currentDraftView().type === "draftPrep" ||
        currentDraftView().type === "riftPlanner" ||
        currentDraftView().type === "liveDraft" ||
        currentDraftView().type === "tierList";

    return (
        <div
            class="rt-app-shell h-screen flex flex-col"
            style={{
                height: "calc(var(--vh, 1vh) * 100)",
            }}
        >
            <header class="rt-header bg-primary border-b border-neutral-700">
                <div class="rt-data-status text-xs text-neutral-400 flex flex-col">
                    <span>
                        {t("patch")} {formatPatch(dataset()?.version)}
                    </span>
                    <span>
                        {t("updated")} {timeAgo()}
                    </span>
                    <Show when={storageError()}>
                        <span role="alert" class="text-red-400">Local preferences cannot be saved.</span>
                    </Show>
                </div>
                <h1 class="rt-brand">
                    <Icon path={riftMark} class="rt-brand-mark" />
                    <span>
                        Rift<span class="text-accent">Theory</span>
                    </span>
                </h1>
                <div class="rt-header-actions flex gap-1">
                    <Show when={isDesktop}>
                        <LolClientStatusBadge
                            setShowDownloadModal={() => undefined}
                        />
                    </Show>
                    <LanguageDropdownMenu />
                    <DraftSnapshotButton />
                    <Dialog
                        open={showSettings()}
                        onOpenChange={setShowSettings}
                    >
                        <DialogTrigger
                            aria-label={t("settings")}
                            class={cn(
                                buttonVariants({
                                    variant: "transparent",
                                }),
                                "px-1 py-2",
                            )}
                        >
                            <Icon path={cog_6Tooth} class="w-7" />
                        </DialogTrigger>
                        <Show when={showSettings()}><SettingsDialog /></Show>
                    </Dialog>
                    <LeagueOfItemsLink />
                </div>
            </header>
            {/* Desktop main */}
            <main
                class="rt-draft-layout min-h-0 flex-1 lg:grid overflow-hidden hidden"
                style={{
                    "grid-template-columns": isFullWidthWorkspace()
                        ? "minmax(0, 1fr)"
                        : "clamp(220px, 14vw, 280px) minmax(0, 1fr) clamp(220px, 14vw, 280px)",
                    "grid-template-rows": "100%",
                }}
            >
                <Show when={!isFullWidthWorkspace()}>
                    <TeamSidebar team="ally" />
                </Show>

                <MainView />

                <Show when={!isFullWidthWorkspace()}>
                    <TeamSidebar team="opponent" />
                </Show>
            </main>

            {/* Mobile main */}
            <main class="min-h-0 flex-1 overflow-hidden lg:hidden">
                <Switch>
                    <Match when={mobileTab() === "ally"}>
                        <TeamSidebar team="ally" />
                    </Match>
                    <Match when={mobileTab() === "opponent"}>
                        <TeamSidebar team="opponent" />
                    </Match>
                    <Match when={true}>
                        <MainView />
                    </Match>
                </Switch>
            </main>

            {/* Mobile footers */}
            <Show when={mobileTab() !== undefined}>
                <footer class="bg-primary px-4 py-2 border-t-2 border-neutral-700 flex justify-evenly lg:hidden gap-4">
                    <For each={["ally", "draft", "opponent"] as const}>
                        {(view) => (
                            <Badge
                                as="button"
                                onClick={() =>
                                    setCurrentDraftView({
                                        type: "draft",
                                        subType: view,
                                    })
                                }
                                theme={
                                    mobileTab() === view
                                        ? "primary"
                                        : "secondary"
                                }
                                class="w-1/3"
                            >
                                {t(view)}
                            </Badge>
                        )}
                    </For>
                </footer>
            </Show>
        </div>
    );
};

export default App;
