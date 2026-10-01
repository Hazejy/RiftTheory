import {
    batch,
    createContext,
    createEffect,
    createSignal,
    JSXElement,
    useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { displayNameByRole, Role } from "@rifttheory/core/src/models/Role";
import { Team } from "@rifttheory/core/src/models/Team";
import { useDraftView } from "./DraftViewContext";
import { DRAFT_PICK_ORDER } from "../utils/draftOrder";
import { useDataset } from "./DatasetContext";
import { useDraftFilters } from "./DraftFiltersContext";
import { useUser } from "./UserContext";
import { MANUAL_DRAFT_BACKUP_KEY, MANUAL_DRAFT_KEY, ManualDraft, hasSavedPicks, nextManualDraftStep, parseManualDraft, serializeManualDraft } from "../utils/manualDraftStorage";
import { readStoredValue, writeStoredValue } from "../utils/safeStorage";

type TeamPick = {
    championKey: string | undefined;
    role: Role | undefined;
    hoverKey: string | undefined;
};

type TeamPicks = [TeamPick, TeamPick, TeamPick, TeamPick, TeamPick];

type Selection = {
    team: Team | undefined;
    index: number;
};

export function createDraftContext() {
    const { dataset } = useDataset();
    const { setCurrentDraftView, currentDraftView } = useDraftView();
    const { resetDraftFilters } = useDraftFilters();
    const { config } = useUser();

    const [allyTeam, setAllyTeam] = createStore<TeamPicks>([
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
    ]);
    const [opponentTeam, setOpponentTeam] = createStore<TeamPicks>([
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
        { championKey: undefined, role: undefined, hoverKey: undefined },
    ]);

    const [undoStack, setUndoStack] = createSignal<ManualDraft[]>([]);
    const [redoStack, setRedoStack] = createSignal<ManualDraft[]>([]);
    const [draftStorageError, setDraftStorageError] = createSignal(false);
    const [backupAvailable, setBackupAvailable] = createSignal(!!parseManualDraft(readStoredValue(MANUAL_DRAFT_BACKUP_KEY)));
    const [selection, setSelection] = createStore<Selection>({ team: "ally", index: 0 });
    let clientDraftActive = false;
    let restored = false;
    const setClientDraftActive = (active: boolean) => {
        clientDraftActive = active;
        if (active) restored = true;
    };
    const board = (): ManualDraft => ({
        ally: allyTeam.map(({ championKey, role }) => ({ championKey, role })),
        opponent: opponentTeam.map(({ championKey, role }) => ({ championKey, role })),
    });
    const applyBoard = (saved: ManualDraft) => batch(() => {
        saved.ally.forEach((pick, index) => setAllyTeam(index, { ...pick, hoverKey: undefined }));
        saved.opponent.forEach((pick, index) => setOpponentTeam(index, { ...pick, hoverKey: undefined }));
        const next = nextManualDraftStep(saved);
        setSelection("team", next?.team);
        setSelection("index", next?.index ?? 0);
    });
    const saveBoard = (backupSaved = true) => setDraftStorageError(!writeStoredValue(MANUAL_DRAFT_KEY, serializeManualDraft(board())) || !backupSaved);
    const saveBackup = (previous: ManualDraft) => {
        if (!hasSavedPicks(previous)) return true;
        const written = writeStoredValue(MANUAL_DRAFT_BACKUP_KEY, serializeManualDraft(previous));
        if (written) setBackupAvailable(true);
        return written;
    };
    const recordChange = (before: ManualDraft) => {
        if (serializeManualDraft(before) === serializeManualDraft(board())) return;
        const backupSaved = saveBackup(before);
        setUndoStack((stack) => [...stack.slice(-29), before]);
        setRedoStack([]);
        saveBoard(backupSaved);
    };
    const undoManualDraft = () => {
        const previous = undoStack().at(-1);
        if (!previous) return;
        const current = board();
        const backupSaved = saveBackup(current);
        setUndoStack((stack) => stack.slice(0, -1));
        setRedoStack((stack) => [...stack, current]);
        applyBoard(previous);
        saveBoard(backupSaved);
    };
    const redoManualDraft = () => {
        const next = redoStack().at(-1);
        if (!next) return;
        const current = board();
        const backupSaved = saveBackup(current);
        setRedoStack((stack) => stack.slice(0, -1));
        setUndoStack((stack) => [...stack, current]);
        applyBoard(next);
        saveBoard(backupSaved);
    };
    const discardManualHistory = () => {
        setUndoStack([]);
        setRedoStack([]);
    };
    const restorePreviousManualDraft = () => {
        const saved = parseManualDraft(readStoredValue(MANUAL_DRAFT_BACKUP_KEY));
        const current = dataset();
        if (!saved || !current || clientDraftActive || [...saved.ally, ...saved.opponent].some((pick) =>
            pick.championKey && !current.championData[pick.championKey])) return;
        const before = board();
        applyBoard(saved);
        recordChange(before);
    };
    createEffect(() => {
        const current = dataset();
        if (!current || restored) return;
        restored = true;
        const saved = parseManualDraft(readStoredValue(MANUAL_DRAFT_KEY));
        if (!saved) return;
        if ([...saved.ally, ...saved.opponent].some((pick) =>
            pick.championKey && !current.championData[pick.championKey])) return;
        applyBoard(saved);
    });

    const [bans, setBans] = createStore<string[]>([]);
    // If empty, assume all champions are owned
    const [ownedChampions, setOwnedChampions] = createSignal<Set<string>>(
        new Set(),
    );

    function getNextPick(team: Team) {
        const picks = team === "ally" ? allyTeam : opponentTeam;

        return picks.findIndex((pick) => pick.championKey === undefined);
    }

    const nextDraftPick = () =>
        DRAFT_PICK_ORDER.find(
            ({ team, index }) =>
                (team === "ally" ? allyTeam : opponentTeam)[index]
                    .championKey === undefined,
        );

    function pickNextChampion(
        championKey: string,
        role: Role | undefined,
        { updateView = true } = {},
    ) {
        const next = activeDraftPick();
        if (
            !next ||
            bans.includes(championKey) ||
            [...allyTeam, ...opponentTeam].some(
                (pick) => pick.championKey === championKey,
            )
        )
            return;
        pickChampion(next.team, next.index, championKey, role, { updateView });
    }

    function fixClashes(championKey: string, team: Team, index: number) {
        const allyClashingChampion = allyTeam.findIndex(
            (p) => p.championKey === championKey,
        );
        if (
            allyClashingChampion !== -1 &&
            (team !== "ally" || allyClashingChampion !== index)
        ) {
            resetChampion("ally", allyClashingChampion);
        }
        const opponentClashingChampion = opponentTeam.findIndex(
            (p) => p.championKey === championKey,
        );
        if (
            opponentClashingChampion !== -1 &&
            (team !== "opponent" || opponentClashingChampion !== index)
        ) {
            resetChampion("opponent", opponentClashingChampion);
        }
    }

    function fixRoleClashes(team: Team, role: Role, index: number) {
        const teamPicks = team === "ally" ? allyTeam : opponentTeam;
        const setTeam = team === "ally" ? setAllyTeam : setOpponentTeam;

        const clashingRole = teamPicks.findIndex((p) => p.role === role);
        if (clashingRole !== -1 && clashingRole !== index) {
            setTeam(clashingRole, "role", undefined);
        }
    }

    function pickChampion(
        team: "ally" | "opponent",
        index: number,
        championKey: string | undefined,
        role: Role | undefined,
        {
            updateSelection = true,
            resetFilters = true,
            reportEvent = true,
            updateView = true,
            trackHistory = true,
        } = {},
    ) {
        if (!Number.isInteger(index) || index < 0 || index >= 5) return;
        const before = trackHistory && !clientDraftActive ? board() : undefined;
        batch(() => {
            if (
                championKey &&
                dataset()?.championData[championKey] === undefined
            ) {
                return;
            }

            const setTeam = team === "ally" ? setAllyTeam : setOpponentTeam;

            if (championKey !== undefined) {
                fixClashes(championKey, team, index);
            }
            if (championKey !== undefined && role !== undefined) {
                fixRoleClashes(team, role, index);
            }

            setTeam(index, {
                championKey,
                role,
                hoverKey: undefined,
            });

            if (updateView && currentDraftView().type === "draft") {
                setCurrentDraftView({
                    type: "draft",
                    subType: team,
                });
            }

            if (updateSelection) {
                if (config.usePickOrder) {
                    const next = nextDraftPick();
                    select(next?.team, next?.index, false, updateView);
                } else {
                    const nextOnSameSide = getNextPick(team);
                    const otherTeam: Team =
                        team === "ally" ? "opponent" : "ally";
                    const nextOnOtherSide = getNextPick(otherTeam);
                    if (nextOnSameSide !== -1)
                        select(
                            team,
                            nextOnSameSide,
                            false,
                            updateView,
                        );
                    else if (nextOnOtherSide !== -1)
                        select(
                            otherTeam,
                            nextOnOtherSide,
                            false,
                            updateView,
                        );
                }
            }

            if (
                draftFinished() &&
                updateView &&
                currentDraftView().type === "draft"
            ) {
                setCurrentDraftView({
                    type: "analysis",
                });
            }

            if (resetFilters) {
                resetDraftFilters();
            }

            if (reportEvent && championKey !== undefined) {
                gtag("event", "pick_champion", {
                    event_category: "draft",
                    champion_key: championKey,
                    champion_name: dataset()!.championData[championKey].name,
                    role,
                    role_name: role ? displayNameByRole[role] : undefined,
                });
            }
        });
        if (before) recordChange(before);
    }

    function hoverChampion(
        team: "ally" | "opponent",
        index: number,
        championKey: string | undefined,
        role: Role | undefined,
    ) {
        batch(() => {
            if (
                championKey &&
                dataset()?.championData[championKey] === undefined
            ) {
                return;
            }

            const setTeam = team === "ally" ? setAllyTeam : setOpponentTeam;

            if (championKey !== undefined) {
                fixClashes(championKey, team, index);
            }

            if (championKey !== undefined && role !== undefined) {
                fixRoleClashes(team, role, index);
            }

            setTeam(index, {
                championKey: undefined,
                role,
                hoverKey: championKey,
            });
        });
    }

    const resetChampion = (team: "ally" | "opponent", index: number) => {
        pickChampion(team, index, undefined, undefined, {
            updateSelection: false,
            resetFilters: false,
            trackHistory: false,
        });
    };

    const resetTeam = (team: "ally" | "opponent", trackHistory = true) => {
        const before = trackHistory && !clientDraftActive ? board() : undefined;
        batch(() => {
            const setTeam = team === "ally" ? setAllyTeam : setOpponentTeam;
            for (let i = 0; i < 5; i++) {
                setTeam(i, {
                    championKey: undefined,
                    role: undefined,
                    hoverKey: undefined,
                });
            }

            const next = nextDraftPick();
            select(next?.team, next?.index, false, false);
            resetDraftFilters();
        });
        if (before) recordChange(before);
    };

    const resetAll = (trackHistory = true) => {
        const before = trackHistory && !clientDraftActive ? board() : undefined;
        batch(() => {
            resetTeam("ally", false);
            resetTeam("opponent", false);
        });
        if (before) recordChange(before);
    };

    // Selection is the next click target, whether automatic or explicitly chosen.
    const activeDraftPick = () =>
        selection.team === undefined
            ? undefined
            : { team: selection.team, index: selection.index };

    const select = (
        team: Team | undefined,
        index?: number,
        resetFilters = true,
        updateView = true,
    ) => {
        if (index === undefined && team !== undefined) {
            const emptyIndex = getNextPick(team);
            index = emptyIndex === -1 ? 0 : emptyIndex;
        }
        if (
            team !== undefined &&
            (index === undefined || index < 0 || index >= 5)
        )
            return;

        setSelection("team", team);
        setSelection("index", index ?? 0);
        if (resetFilters) {
            resetDraftFilters();
        }

        if (updateView) {
            setCurrentDraftView({
                type: "draft",
                subType: "draft",
            });
        }
    };

    const draftFinished = () =>
        [...allyTeam, ...opponentTeam].every(
            (s) => s.championKey !== undefined,
        );

    return {
        allyTeam,
        opponentTeam,
        bans,
        setBans,
        ownedChampions,
        setOwnedChampions,
        pickChampion,
        pickNextChampion,
        nextDraftPick,
        activeDraftPick,
        hoverChampion,
        resetChampion,
        resetTeam,
        resetAll,
        selection,
        select,
        draftFinished,
        canUndoManualDraft: () => undoStack().length > 0,
        canRedoManualDraft: () => redoStack().length > 0,
        undoManualDraft,
        redoManualDraft,
        discardManualHistory,
        draftStorageError,
        backupAvailable,
        restorePreviousManualDraft,
        setClientDraftActive,
    };
}

const DraftContext = createContext<ReturnType<typeof createDraftContext>>();

export function DraftProvider(props: { children: JSXElement }) {
    const ctx = createDraftContext();
    return (
        <DraftContext.Provider value={ctx}>
            {props.children}
        </DraftContext.Provider>
    );
}

export const useDraft = () => {
    const useCtx = useContext(DraftContext);
    if (!useCtx) throw new Error("No DraftContext found");

    return useCtx;
};
