import { assessObservedRoles } from "@draftgap/core/src/role/flex-evidence";
import {
    KnowledgeChampion,
    KnowledgeRoleObservation,
} from "../types/RiftTheoryKnowledge";

function snapshotKey(observation: KnowledgeRoleObservation) {
    return [
        observation.patch_version,
        observation.region,
        observation.rank_bracket,
        observation.queue,
        observation.source_key,
    ].join("\u0000");
}

export function latestRoleEvidence(champion?: KnowledgeChampion) {
    const observations = champion?.roleObservations ?? [];
    if (!observations.length)
        return { ...assessObservedRoles([]), context: null };

    const latest = observations.reduce((current, observation) =>
        Date.parse(observation.observed_at) > Date.parse(current.observed_at)
            ? observation
            : current,
    );
    const key = snapshotKey(latest);
    return {
        ...assessObservedRoles(
            observations
                .filter((observation) => snapshotKey(observation) === key)
                .map((observation) => ({
                    role: observation.role,
                    games: observation.games,
                    sampleTotal: observation.sample_total,
                    roleShare: observation.role_share,
                })),
        ),
        context: {
            patch: latest.patch_version,
            region: latest.region,
            rankBracket: latest.rank_bracket,
            queue: latest.queue,
            observedAt: latest.observed_at,
            sourceKey: latest.source_key,
        },
    };
}
