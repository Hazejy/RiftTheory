import {
    batch,
    createContext,
    createSignal,
    JSX,
    onCleanup,
    useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
    getChampSelectSession,
    getGridChampions,
    getPickableChampionIds,
    getGameflowPhase,
} from "../api/lcu-api";
import { getRoleFromString, Role } from "@draftgap/core/src/models/Role";
import { Team } from "@draftgap/core/src/models/Team";
import {
    LolChampSelectChampSelectPlayerSelection,
    LolChampSelectChampSelectSession,
} from "../types/Lcu";
import {
    createImportFavouritePicksSuccessToast,
    createImportFavouritePicksToast,
} from "../utils/toast";
import { useDraft } from "./DraftContext";
import { useMedia } from "../hooks/useMedia";
import { useUser } from "./UserContext";
import { LolalyticsRole } from "../../../dataset/src/lolalytics/roles";

const createChampSelectSession = (): LolChampSelectChampSelectSession => ({
    actions: [],
    allowBattleBoost: false,
    allowDuplicatePicks: false,
    allowLockedEvents: false,
    allowSkinSelection: false,
    bans: {
        myTeamBans: [],
        numBans: 0,
        theirTeamBans: [],
    },
    benchChampionIds: [],
    benchEnabled: false,
    boostableSkinCount: 0,
    chatDetails: {
        chatRoomName: "",
        chatRoomPassword: "",
    },
    counter: 0,
    entitledFeatureState: {
        additionalRerolls: 0,
        unlockedSkinIds: [],
    },
    gameId: 0,
    hasSimultaneousBans: false,
    hasSimultaneousPicks: false,
    isCustomGame: false,
    isSpectating: false,
    localPlayerCellId: 0,
    lockedEventIndex: 0,
    myTeam: [],
    recoveryCounter: 0,
    rerollsRemaining: 0,
    skipChampionSelect: false,
    theirTeam: [],
    timer: {
        adjustedTimeLeftInPhase: 0,
        internalNowInEpochMs: 0,
        isInfinite: false,
        phase: "",
        totalTimeInPhase: 0,
    },
    trades: [],
});

export const ClientState = {
    NotFound: "NotFound",
    MainMenu: "MainMenu",
    InChampSelect: "InChampSelect",
    InGame: "InGame",
    Connecting: "Connecting",
    Disabled: "Disabled",
} as const;

export type ClientState = (typeof ClientState)[keyof typeof ClientState];

export const createLolClientContext = () => {
    const { isDesktop } = useMedia();
    const {
        pickChampion,
        hoverChampion,
        select,
        resetAll,
        allyTeam,
        opponentTeam,
        bans,
        setBans,
        setOwnedChampions,
    } = useDraft();
    const { isFavourite, setFavourite } = useUser();

    const [clientState, setClientState] = createSignal<ClientState>(
        ClientState.NotFound,
    );
    const [clientError, setClientError] = createSignal<string | undefined>();
    const [champSelectSession, setChampSelectSession] =
        createStore<LolChampSelectChampSelectSession>(
            createChampSelectSession(),
        );

    const updateChampSelectSession = (
        session: LolChampSelectChampSelectSession,
        firstTime = false,
    ) => {
        const nextPick = (session.actions ?? [])
            .flat()
            .find((a) => a.type === "pick" && !a.completed && a.isInProgress);

        const getRole = (role: string) => {
            return {
                top: Role.Top,
                jungle: Role.Jungle,
                bottom: Role.Bottom,
                middle: Role.Middle,
                utility: Role.Support,
            }[role];
        };

        const processSelection = (
            selection: LolChampSelectChampSelectPlayerSelection,
            team: Team,
            index: number,
        ) => {
            const teamPicks = team === "ally" ? allyTeam : opponentTeam;

            const role = selection.assignedPosition
                ? getRole(selection.assignedPosition)
                : undefined;

            if (selection.championId) {
                const championKey = selection.championId.toString();
                if (
                    teamPicks[index].championKey === championKey &&
                    teamPicks[index].role === role
                ) {
                    return false;
                }
                const resetFilters =
                    selection.cellId === session.localPlayerCellId;
                pickChampion(team, index, championKey, role, {
                    updateSelection: false,
                    resetFilters,
                    updateView: false,
                    reportEvent: false,
                });

                return true;
            } else {
                let championKey = undefined;
                if (
                    selection.championPickIntent &&
                    selection.cellId !== session.localPlayerCellId
                ) {
                    championKey = selection.championPickIntent.toString();
                }
                if (
                    teamPicks[index].hoverKey !== championKey ||
                    teamPicks[index].championKey !== undefined ||
                    teamPicks[index].role !== role
                ) {
                    hoverChampion(team, index, championKey, role);
                }
            }

            return false;
        };

        batch(() => {
            let draftChanged = firstTime;
            for (let i = 0; i < 5; i++) {
                const selection =
                    session.myTeam?.[i] ??
                    ({
                        championId: 0,
                        championPickIntent: 0,
                        assignedPosition: "",
                        cellId: -1,
                    } as LolChampSelectChampSelectPlayerSelection);
                draftChanged =
                    processSelection(selection, "ally", i) || draftChanged;
            }
            for (let i = 0; i < 5; i++) {
                const selection =
                    session.theirTeam?.[i] ??
                    ({
                        championId: 0,
                        championPickIntent: 0,
                        assignedPosition: "",
                        cellId: -1,
                    } as LolChampSelectChampSelectPlayerSelection);
                draftChanged =
                    processSelection(selection, "opponent", i) || draftChanged;
            }

            // Handle bans
            const bannedChampions = [
                ...new Set([
                    ...((session.actions ?? [])
                        .flat()
                        .map((a) =>
                            a.completed && a.type === "ban" && a.championId > 0
                                ? String(a.championId)
                                : null,
                        )
                        .filter(Boolean) as string[]),
                    ...(session.bans?.myTeamBans ?? [])
                        .filter((id) => id > 0)
                        .map(String),
                    ...(session.bans?.theirTeamBans ?? [])
                        .filter((id) => id > 0)
                        .map(String),
                ]),
            ];
            if (
                bannedChampions.length !== bans.length ||
                bannedChampions.some((b, i) => b !== bans[i])
            ) {
                setBans(bannedChampions);
            }

            // Set next pick if draft has changed
            if (nextPick && draftChanged) {
                const nextPickTeamSelection = nextPick.isAllyAction
                    ? session.myTeam
                    : session.theirTeam;
                const index = nextPickTeamSelection.findIndex(
                    (s) => s.cellId === nextPick.actorCellId,
                );

                // Only update next pick if ally
                // Irritating to have it update when opponent picks
                if (nextPick.isAllyAction && index >= 0 && index < 5) {
                    select(
                        nextPick.isAllyAction ? "ally" : "opponent",
                        index,
                        false,
                        false,
                    );
                }
            }

            setChampSelectSession(session);
        });
    };

    const checkImportFavourites = async () => {
        const DRAFTGAP_IMPORT_FAVOURITES_LAST_ASKED =
            "draftgap-import-favourites-last-asked";
        const lastAsked = localStorage.getItem(
            DRAFTGAP_IMPORT_FAVOURITES_LAST_ASKED,
        );
        if (lastAsked) {
            const lastAskedDate = new Date(lastAsked);
            const now = new Date();
            const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
            if (now.getTime() - lastAskedDate.getTime() < ONE_WEEK) {
                return;
            }
        }

        const gridChampions = await getGridChampions();
        if (!gridChampions) {
            console.error("Failed to get grid champions");
            return;
        }

        const lolFavourites = gridChampions?.flatMap((c) =>
            c.positionsFavorited.map((p) => ({
                championKey: c.id.toString(),
                role: getRoleFromString(p as LolalyticsRole),
            })),
        );

        const nonFavouritePicks = lolFavourites.filter(
            (f) => !isFavourite(f.championKey, f.role),
        );

        if (!nonFavouritePicks.length) {
            return;
        }

        createImportFavouritePicksToast(() => {
            for (const nonFavourite of nonFavouritePicks) {
                setFavourite(nonFavourite.championKey, nonFavourite.role, true);
            }

            createImportFavouritePicksSuccessToast(nonFavouritePicks.length);
        });

        localStorage.setItem(
            DRAFTGAP_IMPORT_FAVOURITES_LAST_ASKED,
            new Date().toISOString(),
        );
    };

    const updateUnownedChampions = async (active: () => boolean) => {
        const ownedChampions = await getPickableChampionIds();
        if (!active()) return;
        if (!ownedChampions) {
            console.error("Failed to get owned champions");
            return;
        }

        setOwnedChampions(new Set(ownedChampions.map((c) => String(c))));
    };

    let integrationTimeout: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    let running = false;

    const startLolClientIntegration = () => {
        if (!isDesktop || running) return;
        running = true;
        const run = ++generation;
        const active = () => running && generation === run;
        setClientState(ClientState.Connecting);

        const update = async () => {
            if (!active()) return;
            try {
                const session = await getChampSelectSession();
                if (!active()) return;
                if (session == null) {
                    const phase = await getGameflowPhase();
                    if (!active()) return;
                    if (clientState() !== ClientState.MainMenu) {
                        setBans([]);
                        setOwnedChampions(new Set<string>());
                    }

                    setClientState(
                        ["InProgress", "GameStart", "Reconnect"].includes(
                            phase ?? "",
                        )
                            ? ClientState.InGame
                            : ClientState.MainMenu,
                    );
                } else {
                    if (!Array.isArray(session.myTeam))
                        throw new Error("Unsupported champion-select response");
                    batch(() => {
                        if (clientState() !== ClientState.InChampSelect) {
                            void updateUnownedChampions(active).catch(() => {});
                            void checkImportFavourites().catch(() => {});
                            resetAll();
                            setBans([]);
                        }

                        updateChampSelectSession(
                            session,
                            clientState() !== ClientState.InChampSelect,
                        );
                        setClientState(ClientState.InChampSelect);
                    });
                }
                setClientError(undefined);
            } catch (e) {
                if (!active()) return;
                setClientState(ClientState.NotFound);
                setOwnedChampions(new Set<string>());
                setClientError(String(e));
            }

            if (!active()) return;
            const timeoutMs = {
                [ClientState.MainMenu]: 1000,
                [ClientState.InChampSelect]: 500,
                [ClientState.NotFound]: 2000,
                [ClientState.Disabled]: 2000,
                [ClientState.InGame]: 2000,
                [ClientState.Connecting]: 1000,
            }[clientState()];
            integrationTimeout = setTimeout(() => void update(), timeoutMs);
        };
        void update();
    };

    const stopLolClientIntegration = () => {
        running = false;
        generation++;
        clearTimeout(integrationTimeout);
        integrationTimeout = undefined;
        setOwnedChampions(new Set<string>());
        setClientState(ClientState.Disabled);
    };

    onCleanup(() => {
        stopLolClientIntegration();
        setClientState(ClientState.NotFound);
    });

    return {
        clientState,
        champSelectSession,
        startLolClientIntegration,
        stopLolClientIntegration,
        clientError,
        reconnect: () => {
            stopLolClientIntegration();
            startLolClientIntegration();
        },
    };
};

export const LolClientContext =
    createContext<ReturnType<typeof createLolClientContext>>();

export function LolClientProvider(props: { children: JSX.Element }) {
    const ctx = createLolClientContext();

    return (
        <LolClientContext.Provider value={ctx}>
            {props.children}
        </LolClientContext.Provider>
    );
}

export const useLolClient = () => {
    const useCtx = useContext(LolClientContext);
    if (!useCtx) throw new Error("No LolClientContext found");

    return useCtx;
};
