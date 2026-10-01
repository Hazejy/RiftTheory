import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import type { Role } from "@rifttheory/core/src/models/Role";
import { assessObservedRoles } from "@rifttheory/core/src/role/flex-evidence";
import type { KnowledgeChampion } from "../types/RiftTheoryKnowledge";
import { STRATEGY_ROLES, type StrategyPick } from "./strategyReview";
import type { StrategySlot } from "./strategyLiveDraft";

export function buildStrategyPool(
    dataset: Dataset | undefined,
    championForKey: (key: string) => KnowledgeChampion | undefined,
): StrategyPick[] {
    // Flex eligibility comes from the active ranked dataset, not historical
    // role observations in the bundled knowledge export.
    return Object.values(dataset?.championData ?? {}).map((champion) => {
        const samples = STRATEGY_ROLES.map((role, index) => ({
            role,
            games: champion.statsByRole[index as Role]?.games ?? 0,
        }));
        const total = samples.reduce((sum, sample) => sum + sample.games, 0);
        const roles = assessObservedRoles(
            samples.map((sample) => ({
                ...sample,
                sampleTotal: total,
                roleShare: total ? sample.games / total : 0,
            })),
        ).roles;
        return {
            key: champion.key,
            name: champion.name,
            possibleRoles: roles
                .filter((role) => role.tier === "primary" || role.tier === "established")
                .map((role) => role.role),
            knowledge: championForKey(champion.key),
        };
    });
}

export function strategyRoleCandidates(pool: readonly StrategyPick[]) {
    return pool.flatMap((pick) =>
        pick.possibleRoles.map((role) => ({ ...pick, role })),
    );
}

export function toStrategyPicks(
    slots: readonly StrategySlot[],
    byKey: ReadonlyMap<string, StrategyPick>,
): StrategyPick[] {
    return slots.flatMap((slot) => {
        if (!slot.championKey) return [];
        const source = byKey.get(slot.championKey);
        return [{
            ...(source ?? {
                key: slot.championKey,
                name: slot.championKey,
                possibleRoles: [],
            }),
            role: slot.role === undefined ? undefined : STRATEGY_ROLES[slot.role],
        }];
    });
}
