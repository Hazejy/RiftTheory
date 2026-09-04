import {
    Icon,
    riftMark,
    draftBoard,
    strategy,
    colorLayers,
    itemCube,
    presentationChartLine,
    cog_6Tooth,
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
import DraftTable from "./components/draft/DraftTable";
import { RoleFilter } from "./components/draft/RoleFilter";
import { Search } from "./components/draft/Search";
import { TeamSelector } from "./components/draft/TeamSelector";
import { TeamSidebar } from "./components/draft/TeamSidebar";
import AnalysisView from "./components/views/analysis/AnalysisView";
import { useLolClient } from "./contexts/LolClientContext";
import { Badge } from "./components/common/Badge";
import { FilterMenu } from "./components/draft/FilterMenu";
import { formatDistance } from "date-fns";
import { ViewTabs } from "./components/common/ViewTabs";
import { BuildsView } from "./components/views/builds/BuildsView";
import { useDraftView } from "./contexts/DraftViewContext";
import { useUser } from "./contexts/UserContext";
import { useDataset } from "./contexts/DatasetContext";
import { LoadingIcon } from "./components/icons/LoadingIcon";
import { DialogTrigger, Dialog } from "./components/common/Dialog";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import RiftTheoryStrategy from "./components/rifttheory/RiftTheoryStrategy";
import ChampColors from "./components/rifttheory/ChampColors";
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
import { FONT_PRESETS } from "./utils/appearance";
import { WorkspaceShortcuts } from "./components/rifttheory/WorkspaceShortcuts";
import { customThemeVariables } from "./utils/customTheme";
import { DraftSnapshotButton } from "./components/rifttheory/DraftSnapshotButton";

const App: Component = () => {
    const { t } = useI18n();
    const { config } = useUser();
    const { currentDraftView, setCurrentDraftView } = useDraftView();
    const { dataset, dataset30Days, isLoaded } = useDataset();
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
    createEffect(() => {
        document.documentElement.lang = config.language.replace("_", "-");
        document.documentElement.dataset.font = config.fontPreset;
        document.documentElement.dataset.theme = config.theme;
        for (const [key, value] of Object.entries(
            customThemeVariables(config.customColors),
        )) {
            if (config.theme === "custom")
                document.documentElement.style.setProperty(key, value);
            else document.documentElement.style.removeProperty(key);
        }
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
                            (dataset.state === "ready" &&
                                dataset() === undefined) ||
                            (dataset30Days.state === "ready" &&
                                dataset30Days() === undefined)
                        }
                    >
                        <div class="flex justify-center items-center h-full text-2xl text-red-500">
                            {t("dataError")}
                        </div>
                    </Match>
                    <Match when={!isLoaded()}>
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
                                        },
                                        {
                                            label: t("champColors"),
                                            value: "colors",
                                            icon: colorLayers,
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
        const current = currentDraftView();
        if (current.type === "draft") {
            return current.subType;
        }
        return undefined;
    };

    return (
        <div
            class="h-screen flex flex-col"
            style={{
                height: "calc(var(--vh, 1vh) * 100)",
            }}
        >
            {/* Upstream update checks are disabled for this independent fork. */}
            <header class="rt-header bg-primary border-b border-neutral-700">
                <div class="rt-data-status text-xs text-neutral-400 flex flex-col">
                    <span>
                        {t("patch")} {formatPatch(dataset()?.version)}
                    </span>
                    <span>
                        {t("updated")} {timeAgo()}
                    </span>
                </div>
                <h1 class="rt-brand">
                    <Icon path={riftMark} class="rt-brand-mark" />
                    <span>
                        Rift<span class="text-accent">Theory</span>
                    </span>
                </h1>
                <div class="rt-header-actions flex gap-1">
                    <LanguageDropdownMenu />
                    <WorkspaceShortcuts />
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
                        <SettingsDialog />
                    </Dialog>
                    <LeagueOfItemsLink />
                </div>
            </header>
            {/* Desktop main */}
            <main
                class="rt-draft-layout min-h-0 flex-1 lg:grid overflow-hidden hidden"
                style={{
                    "grid-template-columns":
                        "minmax(170px, 1fr) minmax(0, 4fr) minmax(170px, 1fr)",
                    "grid-template-rows": "100%",
                }}
            >
                <TeamSidebar team="ally" />

                <MainView />

                <TeamSidebar team="opponent" />
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
