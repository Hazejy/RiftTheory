/** User-entered pre-game availability. An omitted list means unknown, not empty. */
export type DraftPlayerPool = {
    id: string;
    name: string;
    roles: readonly string[];
    availableChampionKeys?: readonly string[];
    comfortableChampionKeys?: readonly string[];
    source: string;
    updatedAt: string;
    confidence: "self_reported" | "team_reported" | "observed";
};

export type PoolPick = { key: string; role?: string; possibleRoles: readonly string[] };

/** Preserve flex assignments and require distinct players for known roster slots. */
export function canAssignPlayerPicks(picks: readonly PoolPick[], players: readonly DraftPlayerPool[]) {
    if (!players.length) return true;
    const assign = (index: number, roles: Set<string>, used: Set<string>): boolean => {
        if (index === picks.length) return true;
        const pick = picks[index];
        for (const role of pick.role ? [pick.role] : pick.possibleRoles) {
            if (roles.has(role)) continue;
            const eligible = players.filter((player) => player.roles.includes(role));
            if (!eligible.length) {
                if (assign(index + 1, new Set([...roles, role]), used)) return true;
                continue;
            }
            for (const player of eligible) {
                if (used.has(player.id) || (player.availableChampionKeys &&
                    !player.availableChampionKeys.includes(pick.key))) continue;
                if (assign(index + 1, new Set([...roles, role]), new Set([...used, player.id])))
                    return true;
            }
        }
        return false;
    };
    return assign(0, new Set(), new Set());
}

export function playerComfort(pick: PoolPick, players: readonly DraftPlayerPool[]) {
    if (!pick.role) return "unknown" as const;
    const matching = players.filter((player) => player.roles.includes(pick.role!));
    if (!matching.length) return "unknown" as const;
    return matching.some((player) => player.comfortableChampionKeys?.includes(pick.key))
        ? "reported" as const : "unknown" as const;
}
