import { invoke } from "@tauri-apps/api/core";

export function parseGameflowPhase(value: unknown): string {
    if (value === null) throw new Error("League gameflow is unavailable");
    if (typeof value === "string" && value.length > 0) return value;
    throw new Error("Unsupported League gameflow response");
}

export async function getGameflowPhase(): Promise<string> {
    return parseGameflowPhase(await invoke("get_gameflow_phase"));
}
import {
    LolChampSelectChampSelectSession,
    LolChampSelectGridChampions,
    LolSummonerSummoner,
} from "../types/Lcu";

export function parseChampSelectSession(value: unknown): LolChampSelectChampSelectSession | null {
    if (value === null) return null;
    if (!value || typeof value !== "object")
        throw new Error("Unsupported champion-select response");
    const session = value as Partial<LolChampSelectChampSelectSession>;
    if (!Array.isArray(session.myTeam) || !Array.isArray(session.theirTeam) ||
        !Array.isArray(session.actions) || typeof session.gameId !== "number" ||
        typeof session.localPlayerCellId !== "number")
        throw new Error("Unsupported champion-select response");
    return session as LolChampSelectChampSelectSession;
}

export async function getChampSelectSession(): Promise<LolChampSelectChampSelectSession | null> {
    return parseChampSelectSession(await invoke("get_champ_select_session"));
}

export async function getCurrentSummoner(): Promise<LolSummonerSummoner | null> {
    return (await invoke("get_current_summoner")) as LolSummonerSummoner | null;
}

export async function getGridChampions(): Promise<LolChampSelectGridChampions | null> {
    const value: unknown = await invoke("get_grid_champions");
    if (value === null) return null;
    if (!Array.isArray(value) || !value.every((item) =>
        item && typeof item.id === "number" && Array.isArray(item.positionsFavorited)))
        throw new Error("Unsupported League champion grid response");
    return value as LolChampSelectGridChampions;
}

export async function getPickableChampionIds(): Promise<number[] | null> {
    const value: unknown = await invoke("get_pickable_champion_ids");
    if (value === null) return null;
    if (!Array.isArray(value) || !value.every((id) => Number.isInteger(id)))
        throw new Error("Unsupported pickable champion response");
    return value;
}
