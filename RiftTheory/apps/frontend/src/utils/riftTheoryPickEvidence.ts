import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import type { Role } from "@rifttheory/core/src/models/Role";
import { STRATEGY_ROLES, type StrategyPick } from "./strategyReview";

export type RiftTheoryPickEvidence = {
    champion: string;
    role: string;
    roleGames: number;
    roleThin: boolean;
    roleRate?: number;
    duos: { label: string; games: number; rate: number; thin: boolean }[];
    matchups: { label: string; games: number; rate: number; thin: boolean }[];
};

const fixedRole = (pick: StrategyPick) =>
    pick.role === undefined ? undefined : STRATEGY_ROLES.indexOf(pick.role) as Role;

/** RiftTheory sample counts and rank-adjusted rates, not a pick's causal effect. */
export function riftTheoryPickEvidence(
    currentPatch: Dataset,
    thirtyDays: Dataset,
    additions: readonly StrategyPick[],
    own: readonly StrategyPick[],
    enemy: readonly StrategyPick[],
    minGames: number,
): RiftTheoryPickEvidence[] {
    const teammates = [...own, ...additions];
    const links = (
        candidate: StrategyPick,
        others: readonly StrategyPick[],
        kind: "synergy" | "matchup",
    ) => {
        const role = fixedRole(candidate);
        if (role === undefined) return [];
        const roleData = thirtyDays.championData[candidate.key]?.statsByRole[role];
        return others.flatMap((other) => {
            const otherRole = fixedRole(other);
            if (other.key === candidate.key || otherRole === undefined) return [];
            const sample = roleData?.[kind]?.[otherRole]?.[other.key];
            if (!sample || !Number.isFinite(sample.games) || sample.games <= 0 ||
                !Number.isFinite(sample.wins) || sample.wins < 0 ||
                sample.wins > sample.games) return [];
            return [{
                label: `${kind === "synergy" ? "with" : "vs"} ${other.name} · ${other.role}`,
                games: sample.games,
                rate: sample.wins / sample.games,
                thin: sample.games < minGames,
                directLane: kind === "matchup" && role === otherRole,
            }];
        }).sort((a, b) =>
            Number(b.directLane) - Number(a.directLane) || b.games - a.games,
        ).slice(0, 2).map(({ label, games, rate, thin }) => ({
            label, games, rate, thin,
        }));
    };
    return additions.flatMap((candidate) => {
        const role = fixedRole(candidate);
        if (role === undefined) return [];
        const sample = currentPatch.championData[candidate.key]?.statsByRole[role];
        const games = sample?.games ?? 0;
        return [{
            champion: candidate.name,
            role: candidate.role!,
            roleGames: games,
            roleThin: games > 0 && games < minGames,
            roleRate: games > 0 && Number.isFinite(sample?.wins) &&
                sample!.wins >= 0 && sample!.wins <= games
                ? sample!.wins / games
                : undefined,
            duos: links(candidate, teammates, "synergy"),
            matchups: links(candidate, enemy, "matchup"),
        }];
    });
}
