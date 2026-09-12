import {
    Icon,
    ellipsisVertical,
    presentationChartLine,
    trash,
    user,
} from "../icons/RiftIcons";
import { useDraft } from "../../contexts/DraftContext";
import { Team } from "@draftgap/core/src/models/Team";
import { ROLES, Role } from "@draftgap/core/src/models/Role";
import {
    displayNameByStatsSite,
    linkByStatsSite,
    matchupLinkByStatsSite,
} from "../../utils/sites";
import { useUser } from "../../contexts/UserContext";
import { useDraftAnalysis } from "../../contexts/DraftAnalysisContext";
import { useDataset } from "../../contexts/DatasetContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuIcon,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../common/DropdownMenu";
import { cn } from "../../utils/style";
import { buttonVariants } from "../common/Button";
import { createMemo, For, Show } from "solid-js";
import { RoleIcon } from "../icons/roles/RoleIcon";
import { championName, useI18n } from "../../utils/i18n";
import { pickLabel } from "../../utils/draftOrder";

export function PickOptions(props: { team: Team; index: number }) {
    const { t, roleName } = useI18n();
    const { config } = useUser();
    const { dataset } = useDataset();
    const { pickChampion, allyTeam, opponentTeam } = useDraft();

    const { allyTeamComp, opponentTeamComp, setAnalysisPick, analyzeHovers } =
        useDraftAnalysis();

    const teamPicks = () => (props.team === "ally" ? allyTeam : opponentTeam);
    const teamComp = () =>
        props.team === "ally" ? allyTeamComp() : opponentTeamComp();
    const opposingComp = () =>
        props.team === "ally" ? opponentTeamComp() : allyTeamComp();

    const champion = () => {
        const pick = teamPicks()[props.index];

        if (pick.championKey) {
            return dataset()?.championData[pick.championKey!];
        }
        if (pick.hoverKey && analyzeHovers()) {
            return dataset()?.championData[pick.hoverKey!];
        }

        return undefined;
    };

    const matchup = createMemo(() => {
        const selected = champion();
        const selectedKey = teamPicks()[props.index].championKey;
        if (!selected || !selectedKey) return undefined;

        const role = [...teamComp().entries()].find(
            ([, championKey]) => championKey === selectedKey,
        )?.[0] as Role | undefined;
        if (role === undefined) return undefined;

        const opponentKey = opposingComp().get(role);
        if (!opponentKey) return undefined;
        const opponent = dataset()?.championData[opponentKey];
        if (!opponent) return undefined;

        return {
            role,
            opponent,
            url: matchupLinkByStatsSite(
                config.defaultStatsSite,
                selected.id,
                opponent.id,
                role,
                config.rankBracket,
            ),
        };
    });

    const selectedRole = () =>
        [...teamComp().entries()].find(
            ([, championKey]) =>
                championKey === teamPicks()[props.index].championKey,
        )?.[0] as Role | undefined;

    return (
        <div class="absolute right-10 top-1">
            <DropdownMenu>
                <DropdownMenuTrigger
                    aria-label={`${pickLabel(props.team, props.index)} ${t("options")}`}
                    class={cn(
                        buttonVariants({ variant: "transparent" }),
                        "p-2",
                    )}
                    onClick={(event) => event.stopPropagation()}
                >
                    <Icon path={ellipsisVertical} class="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>
                        {champion()
                            ? championName(champion()!, config)
                            : pickLabel(props.team, props.index)}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled={!champion()}
                            onSelect={() =>
                                pickChampion(
                                    props.team,
                                    props.index,
                                    undefined,
                                    undefined,
                                )
                            }
                        >
                            <DropdownMenuIcon path={trash} />
                            <span>{t("reset")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!champion()} asChild>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center w-full"
                                href={
                                    champion()
                                        ? linkByStatsSite(
                                              config.defaultStatsSite,
                                              champion()!.id,
                                              selectedRole() ??
                                                  teamPicks()[props.index]
                                                      .role ??
                                                  0,
                                              config.rankBracket,
                                          )
                                        : "#"
                                }
                            >
                                <DropdownMenuIcon path={user} />
                                <span>
                                    {displayNameByStatsSite(
                                        config.defaultStatsSite,
                                    )}{" "}
                                    build
                                </span>
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!matchup()} asChild>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center w-full"
                                href={matchup()?.url ?? "#"}
                            >
                                <DropdownMenuIcon
                                    path={presentationChartLine}
                                />
                                <span>
                                    {matchup()
                                        ? `${roleName(matchup()!.role)} matchup vs ${championName(matchup()!.opponent, config)}`
                                        : "Assign both champions to the same role"}
                                </span>
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!champion()}
                            onSelect={() =>
                                setAnalysisPick({
                                    team: props.team,
                                    championKey:
                                        teamPicks()[props.index].championKey!,
                                })
                            }
                        >
                            <DropdownMenuIcon path={presentationChartLine} />
                            <span>{t("analysis")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div class="flex px-1.5 justify-around">
                            <For each={ROLES}>
                                {(role) => (
                                    <button
                                        aria-label={roleName(role)}
                                        title={roleName(role)}
                                        class={cn(
                                            buttonVariants({
                                                variant: "transparent",
                                            }),
                                            "px-1.5 relative",
                                        )}
                                        onClick={() =>
                                            pickChampion(
                                                props.team,
                                                props.index,
                                                teamPicks()[props.index]
                                                    .championKey,
                                                role,
                                                {
                                                    updateSelection: false,
                                                    updateView: false,
                                                },
                                            )
                                        }
                                    >
                                        <RoleIcon
                                            role={role}
                                            class={cn(
                                                "h-6 w-6 text-neutral-500",
                                                {
                                                    "text-white":
                                                        teamPicks()[props.index]
                                                            .role === role,
                                                },
                                            )}
                                        />
                                        <Show
                                            when={
                                                teamPicks()[props.index]
                                                    .role === role
                                            }
                                        >
                                            <div class="h-[3px] w-full bg-neutral-50 -bottom-1.5 absolute left-0 rounded-t-full" />
                                        </Show>
                                    </button>
                                )}
                            </For>
                        </div>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
