import type { Role } from "@draftgap/core/src/models/Role";
import {
    roleScenarios,
    STRATEGY_ROLES,
    type StrategyConstraints,
    type StrategyPick,
} from "./strategyReview";

export type DraftGapReplacement = {
    pick: StrategyPick;
    modelIndex: number;
    roleGames: number;
};

/** Screen fixed-role, legal replacements; the caller supplies DraftGap's rating. */
export function screenDraftGapReplacements(
    own: readonly StrategyPick[],
    enemy: readonly StrategyPick[],
    candidates: readonly StrategyPick[],
    constraints: StrategyConstraints,
    rate: (
        ownRoles: Map<Role, string>,
        enemyRoles: Map<Role, string>,
        pick: StrategyPick,
    ) => { modelIndex: number; roleGames: number } | undefined,
    limit = 3,
) {
    const ownScenarios = roleScenarios([...own]);
    const enemyScenarios = roleScenarios([...enemy]);
    if (own.length !== 4 || enemy.length !== 5 ||
        ownScenarios.length !== 1 || enemyScenarios.length !== 1)
        return { evaluated: 0, role: undefined, top: [] as DraftGapReplacement[] };

    const missing = STRATEGY_ROLES.find((role) => !ownScenarios[0].includes(role));
    if (!missing) return { evaluated: 0, role: undefined, top: [] as DraftGapReplacement[] };
    const ownRoles = new Map(ownScenarios[0].map((role, index) => [
        STRATEGY_ROLES.indexOf(role) as Role, own[index].key,
    ]));
    const enemyRoles = new Map(enemyScenarios[0].map((role, index) => [
        STRATEGY_ROLES.indexOf(role) as Role, enemy[index].key,
    ]));
    const blocked = new Set([
        ...constraints.bans,
        ...(constraints.unavailable ?? []),
        ...own.map((pick) => pick.key),
        ...enemy.map((pick) => pick.key),
    ]);
    const scored: DraftGapReplacement[] = [];
    const seen = new Set<string>();
    for (const pick of candidates) {
        if (pick.role !== missing || blocked.has(pick.key) || seen.has(pick.key) ||
            (constraints.owned?.size && !constraints.owned.has(pick.key))) continue;
        seen.add(pick.key);
        const team = new Map(ownRoles);
        team.set(STRATEGY_ROLES.indexOf(missing) as Role, pick.key);
        const result = rate(team, enemyRoles, pick);
        if (!result || !Number.isFinite(result.modelIndex) ||
            result.modelIndex < 0 || result.modelIndex > 1 ||
            !Number.isFinite(result.roleGames) || result.roleGames < 0) continue;
        scored.push({ pick, ...result });
    }
    scored.sort((a, b) =>
        b.modelIndex - a.modelIndex ||
        b.roleGames - a.roleGames ||
        a.pick.name.localeCompare(b.pick.name),
    );
    return { evaluated: scored.length, role: missing, top: scored.slice(0, limit) };
}
