import type {
    KnowledgeChampion,
    KnowledgeColorBaseline,
    KnowledgeStrategicProfile,
} from "../types/RiftTheoryKnowledge";

export type EffectiveColorEvidence = {
    profile: KnowledgeStrategicProfile | KnowledgeColorBaseline;
    scope: "role" | "champion";
    tier: "role_profile" | "provisional_baseline" | "historical_reference";
};

export function effectiveColorEvidence(
    champion: KnowledgeChampion | undefined,
    role: string | undefined,
): EffectiveColorEvidence | undefined {
    const roleProfile = champion?.strategicProfiles.find(
        (profile) => profile.role === role,
    );
    if (roleProfile) {
        return {
            profile: roleProfile,
            scope: "role",
            tier: "role_profile",
        };
    }

    if (!champion?.colorBaseline) return undefined;
    return {
        profile: champion.colorBaseline,
        scope: "champion",
        tier:
            champion.colorBaseline.review_status === "historical"
                ? "historical_reference"
                : "provisional_baseline",
    };
}
