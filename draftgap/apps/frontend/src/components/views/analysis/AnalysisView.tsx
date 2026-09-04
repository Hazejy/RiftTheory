import { createSignal, Show } from "solid-js";
import { ButtonGroup } from "../../common/ButtonGroup";
import { DuoResultTable } from "./DuoResultTable";
import { IndividualChampionsResultTable } from "./IndividualChampionsResultTable";
import { MatchupResultTable } from "./MatchupResultTable";
import { DraftSummaryCards } from "./SummaryCards";
import { TotalChampionContributionTable } from "./TotalChampionContributionTable";
import { tooltip } from "../../../directives/tooltip";
import { Team } from "@draftgap/core/src/models/Team";
import { useUser } from "../../../contexts/UserContext";
import { useDraftAnalysis } from "../../../contexts/DraftAnalysisContext";
import { ScalingChart } from "./ScalingChart";
import { useI18n } from "../../../utils/i18n";
// eslint-disable-next-line
tooltip;

export default function AnalysisView() {
    const { t } = useI18n();
    const { config } = useUser();
    const { setAnalysisPick } = useDraftAnalysis();
    const [showAllMatchups, setShowAllMatchups] = createSignal(false);

    const openChampionDraftAnalysisModal = (
        team: Team,
        championKey: string,
    ) => {
        setAnalysisPick({ team, championKey });
    };

    return (
        <div>
            <p class="text-xs text-neutral-500 font-body mb-4">
                {t("modelCaveat")}
            </p>
            <DraftSummaryCards team="ally" />
            <DraftSummaryCards team="opponent" class="mb-12 mt-6" />

            <div
                class="flex-col md:flex-row flex gap-4 mb-8 overflow-hidden"
                id="total-result"
            >
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl mb-1 uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    How much does every champion contribute to
                                    the draft in which aspect?
                                    <br />
                                    <br />
                                    <strong>BASE</strong>: Champion base winrate
                                    <br />
                                    <strong>MATCHUP</strong>: Total winrate of
                                    all champion matchups
                                    <br />
                                    <strong>DUO</strong>: Total winrate of all
                                    champion duos
                                    <br />
                                    <strong>TOTAL</strong>: Total contribution
                                    of champion (BASE + MATCHUP + DUO)
                                </>
                            ),
                        }}
                    >
                        {t("allyOverview")}
                    </h3>
                    <TotalChampionContributionTable
                        team="ally"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("ally", key)
                        }
                    />
                </div>
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl mb-1 uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    How much does every champion contribute to
                                    the draft in which aspect?
                                    <br />
                                    <br />
                                    <strong>BASE</strong>: Champion base winrate
                                    <br />
                                    <strong>MATCHUP</strong>: Total winrate of
                                    all champion matchups
                                    <br />
                                    <strong>DUO</strong>: Total winrate of all
                                    champion duos
                                    <br />
                                    <strong>TOTAL</strong>: Total contribution
                                    of champion (BASE + MATCHUP + DUO)
                                </>
                            ),
                        }}
                    >
                        {t("opponentOverview")}
                    </h3>
                    <TotalChampionContributionTable
                        team="opponent"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("opponent", key)
                        }
                    />
                </div>
            </div>

            <Show when={!config.ignoreChampionWinrates}>
                <div
                    class="flex-col flex sm:flex-row gap-4 mb-8"
                    id="champions-result"
                >
                    <div class="sm:w-1/2">
                        <h3
                            class="text-3xl uppercase mb-1 ml-4"
                            // @ts-ignore
                            use:tooltip={{
                                content: (
                                    <>Base winrates of individual champions</>
                                ),
                            }}
                        >
                            {t("allyChampions")}
                        </h3>
                        <IndividualChampionsResultTable
                            team="ally"
                            onClickChampion={(championKey) =>
                                openChampionDraftAnalysisModal(
                                    "ally",
                                    championKey,
                                )
                            }
                        />
                    </div>
                    <div class="sm:w-1/2">
                        <h3
                            class="text-3xl uppercase mb-1 ml-4"
                            // @ts-ignore
                            use:tooltip={{
                                content: (
                                    <>Base winrates of individual champions</>
                                ),
                            }}
                        >
                            {t("opponentChampions")}
                        </h3>
                        <IndividualChampionsResultTable
                            team="opponent"
                            onClickChampion={(championKey) =>
                                openChampionDraftAnalysisModal(
                                    "opponent",
                                    championKey,
                                )
                            }
                        />
                    </div>
                </div>
            </Show>

            <div
                class="flex-col flex md:flex-row justify-between gap-2 md:items-end mb-2 items-end"
                id="matchup-result"
            >
                <div>
                    <h3
                        class="text-3xl uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    Winrates of all matchups between ally and
                                    opponent champions
                                </>
                            ),
                        }}
                    >
                        {t("matchups")}
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    matchup winrates to remove the current meta
                                    bias of the matchup.
                                </>
                            ),
                        }}
                    >
                        {t("normalized")}
                    </p>
                </div>
                <ButtonGroup
                    options={[
                        { label: t("headToHead"), value: false },
                        { label: t("all"), value: true },
                    ]}
                    size="sm"
                    selected={showAllMatchups()}
                    onChange={setShowAllMatchups}
                />
            </div>
            <MatchupResultTable
                class="w-full mb-8"
                showAll={showAllMatchups()}
                onClickChampion={(team, championKey) =>
                    openChampionDraftAnalysisModal(team, championKey)
                }
            />

            <div class="flex-col md:flex-row flex gap-4 mb-8" id="duo-result">
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>Winrates of all duos in the ally draft</>
                            ),
                        }}
                    >
                        {t("allyDuos")}
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4 mb-2"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    duo winrates.
                                </>
                            ),
                        }}
                    >
                        {t("normalized")}
                    </p>
                    <DuoResultTable
                        team="ally"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("ally", key)
                        }
                    />
                </div>
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl uppercase ml-4"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>Winrates of all duos in the opponent draft</>
                            ),
                        }}
                    >
                        {t("opponentDuos")}
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4 mb-2"
                        // @ts-ignore
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    duo winrates.
                                </>
                            ),
                        }}
                    >
                        {t("normalized")}
                    </p>
                    <DuoResultTable
                        team="opponent"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("opponent", key)
                        }
                    />
                </div>
            </div>

            {/* <div class="mb-2 mt-16 flex justify-center items-center gap-2">
                <div class="h-[3px] bg-neutral-700 w-24" />

                <h2 class="text-4xl uppercase text-neutral-500 text-center">
                    Misc
                </h2>

                <div class="h-[3px] bg-neutral-700 w-24" />
            </div> */}

            <div>
                <h3 class="text-3xl uppercase ml-4">{t("scaling")}</h3>
                <span
                    class="text-neutral-500 uppercase ml-4 mb-2"
                    // @ts-ignore
                    use:tooltip={{
                        content: (
                            <>
                                The overall team winrate has been normalized
                                (removed) before calculating the team winrate
                                over time.
                            </>
                        ),
                    }}
                >
                    {t("teamNormalized")}
                </span>
                <div class="p-4 rounded-md bg-primary w-1/2 max-w-2xl h-64">
                    <ScalingChart />
                </div>
            </div>
        </div>
    );
}
