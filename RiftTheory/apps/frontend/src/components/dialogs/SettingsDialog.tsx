import { Show } from "solid-js";
import { ButtonGroup, ButtonGroupOption } from "../common/ButtonGroup";
import { Switch } from "../common/Switch";
import { RiskLevel } from "@draftgap/core/src/risk/risk-level";
import { useUser } from "../../contexts/UserContext";
import { useMedia } from "../../hooks/useMedia";
import {
    DraftTablePlacement,
    StatsSite,
} from "@draftgap/core/src/models/user/Config";
import { DialogContent, DialogHeader, DialogTitle } from "../common/Dialog";
import { AppearanceSettings } from "../AppearanceSettings";
import { useI18n } from "../../utils/i18n";

export default function SettingsDialog() {
    const { t } = useI18n();
    const { isDesktop } = useMedia();
    const { config, setConfig } = useUser();

    const riskLevelOptions = (): ButtonGroupOption<RiskLevel>[] =>
        RiskLevel.map((level) => ({
            value: level,
            label: t(
                (
                    {
                        "very-low": "riskVeryLow",
                        low: "riskLow",
                        medium: "riskMedium",
                        high: "riskHigh",
                        "very-high": "riskVeryHigh",
                    } as const
                )[level],
            ),
        }));

    const draftTablePlacementOptions = [
        {
            value: DraftTablePlacement.Bottom,
            label: "Bottom",
        },
        {
            value: DraftTablePlacement.InPlace,
            label: "In Place",
        },
        {
            value: DraftTablePlacement.Hidden,
            label: "Hidden",
        },
    ];

    const statsSiteOptions = [
        {
            value: "lolalytics",
            label: "lolalytics",
        },
        {
            value: "u.gg",
            label: "u.gg",
        },
        {
            value: "op.gg",
            label: "op.gg",
        },
    ] as const;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t("settings")}</DialogTitle>
            </DialogHeader>
            <AppearanceSettings />
            <div>
                <h3 class="text-3xl uppercase">Draft</h3>
                <div class="flex space-x-16 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Ignore individual champion winrates
                    </span>
                    <Switch
                        checked={config.ignoreChampionWinrates}
                        onChange={() =>
                            setConfig({
                                ignoreChampionWinrates:
                                    !config.ignoreChampionWinrates,
                            })
                        }
                    />
                </div>
                <h4 class="text-lg uppercase mt-3 mb-1">{t("riskLevel")}</h4>
                <p
                    class="font-body text-xs leading-relaxed text-neutral-400 mb-3"
                    id="risk-level-help"
                >
                    {t("riskHelp")}
                </p>
                <ButtonGroup
                    aria-describedby="risk-level-help"
                    options={riskLevelOptions()}
                    selected={config.riskLevel}
                    size="sm"
                    onChange={(value: RiskLevel) =>
                        setConfig({
                            riskLevel: value,
                        })
                    }
                />
            </div>
            <div>
                <h3 class="text-3xl uppercase">UI</h3>
                <div class="flex space-x-8 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Place favourites at top of suggestions
                    </span>
                    <Switch
                        checked={config.showFavouritesAtTop}
                        onChange={() =>
                            setConfig({
                                showFavouritesAtTop:
                                    !config.showFavouritesAtTop,
                            })
                        }
                    />
                </div>

                <Show when={isDesktop}>
                    <div class="flex flex-col gap-1 mt-2">
                        <span class="text-lg uppercase">
                            Place banned champion suggestions at
                        </span>
                        <ButtonGroup
                            options={draftTablePlacementOptions}
                            selected={config.banPlacement}
                            size="sm"
                            onChange={(v) =>
                                setConfig({
                                    banPlacement: v,
                                })
                            }
                        />
                    </div>
                    <div class="flex flex-col gap-1 mt-2">
                        <span class="text-lg uppercase">
                            Place unowned champion suggestions at
                        </span>
                        <ButtonGroup
                            options={[
                                {
                                    value: DraftTablePlacement.Bottom,
                                    label: "Bottom",
                                },
                                {
                                    value: DraftTablePlacement.InPlace,
                                    label: "In Place",
                                },
                                {
                                    value: DraftTablePlacement.Hidden,
                                    label: "Hidden",
                                },
                            ]}
                            size="sm"
                            selected={config.unownedPlacement}
                            onChange={(v) =>
                                setConfig({
                                    unownedPlacement: v,
                                })
                            }
                        />
                    </div>
                </Show>

                <div class="flex space-x-8 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Show advanced winrates
                    </span>
                    <Switch
                        checked={config.showAdvancedWinrates}
                        onChange={() =>
                            setConfig({
                                showAdvancedWinrates:
                                    !config.showAdvancedWinrates,
                            })
                        }
                    />
                </div>
            </div>

            <Show when={isDesktop}>
                <div>
                    <h3 class="text-3xl uppercase">{t("leagueClient")}</h3>
                    <div class="flex space-x-16 items-center justify-between mt-2">
                        <div>
                            <p class="text-lg uppercase">{t("leagueSync")}</p>
                            <p class="mt-1 max-w-xl text-xs normal-case text-neutral-500">
                                {t("leagueSyncHelp")}
                            </p>
                        </div>
                        <Switch
                            checked={!config.disableLeagueClientIntegration}
                            onChange={() =>
                                setConfig({
                                    disableLeagueClientIntegration:
                                        !config.disableLeagueClientIntegration,
                                })
                            }
                        />
                    </div>
                </div>
            </Show>

            <div>
                <h3 class="text-3xl uppercase">Misc</h3>
                <div class="flex flex-col gap-1 mt-2">
                    <span class="text-lg uppercase">Favourite builds site</span>
                    <ButtonGroup
                        options={statsSiteOptions}
                        selected={config.defaultStatsSite}
                        size="sm"
                        onChange={(value: StatsSite) =>
                            setConfig({
                                defaultStatsSite: value,
                            })
                        }
                    />
                </div>
            </div>
        </DialogContent>
    );
}
