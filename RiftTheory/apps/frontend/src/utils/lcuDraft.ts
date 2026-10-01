import type { LolChampSelectChampSelectSession } from "../types/Lcu";

export function completedLcuBans(session: LolChampSelectChampSelectSession): string[] {
    return [
        ...new Set([
            ...((session.actions ?? [])
                .flat()
                .map((action) =>
                    action.completed && action.type === "ban" && action.championId > 0
                        ? String(action.championId)
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
}
