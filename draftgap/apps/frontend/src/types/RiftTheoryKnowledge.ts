import type {
    InteractionComparison,
    InteractionImpact,
    InteractionSeverity,
    InteractionTrait,
    TraitLevel,
} from "@draftgap/core/src/interaction/interaction-engine";

export const RIFT_THEORY_COLORS = [
    "white",
    "blue",
    "black",
    "red",
    "green",
    "colorless",
] as const;

export type RiftTheoryColor = (typeof RIFT_THEORY_COLORS)[number];
export type ColorAssignment = "main" | "off";

export type KnowledgeSource = {
    source_key: string;
    label: string;
    kind: "official" | "observed" | "manual" | "ai_assisted" | "historical";
    url: string | null;
    access_note: string | null;
};

export type KnowledgeCapability = {
    role: string;
    capability: string;
    strength: number;
    patch_version: string;
    assessment_method: "manual" | "ai_assisted" | "observed" | "hybrid";
    confidence: number | null;
    review_status: string;
    reasoning: string | null;
    source_key: string;
};

export type StrategicColor = {
    color: RiftTheoryColor;
    assignment: ColorAssignment;
    weight: number;
};

export type KnowledgeStrategicProfile = {
    role: string;
    patch_version: string;
    reasoning: string;
    review_status: string;
    confidence: number | null;
    source_key: string;
    source_url: string | null;
    colors: StrategicColor[];
};

export type KnowledgeRoleObservation = {
    role: string;
    patch_version: string;
    region: string;
    rank_bracket: string;
    queue: string;
    games: number;
    wins: number | null;
    pick_rate: number | null;
    observed_at: string;
    source_key: string;
    sample_total: number;
    role_share: number;
};

export type KnowledgeTraitDefinition = {
    trait_key: InteractionTrait;
    category:
        | "access"
        | "control"
        | "durability"
        | "pressure"
        | "tempo"
        | "utility";
    definition: string;
    contextual: boolean;
};

export type KnowledgeRoleTrait = {
    role: string;
    trait: InteractionTrait;
    level: TraitLevel;
    patch_version: string;
    assessment_method: "manual" | "ai_assisted" | "observed" | "hybrid";
    confidence: number | null;
    review_status: string;
    reasoning: string;
    conditions: string[];
    source_key: string;
};

export type KnowledgeInteractionRule = {
    rule_key: string;
    subject_trait_key: InteractionTrait;
    object_trait_key: InteractionTrait;
    comparison: InteractionComparison;
    subject_min_level: TraitLevel;
    object_min_level: TraitLevel;
    minimum_difference: number;
    relation: string;
    severity: InteractionSeverity;
    subject_impact: InteractionImpact;
    condition_text: string;
    effect_text: string;
    patch_version: string;
    confidence: number | null;
    review_status: string;
    source_key: string;
};

export type KnowledgeChampion = {
    riotKey: string | null;
    slug: string;
    name: string;
    active: boolean;
    firstSeenPatch: string | null;
    lastSeenPatch: string | null;
    localizations: Record<string, { name: string; patch: string }>;
    capabilities: KnowledgeCapability[];
    strategicProfiles: KnowledgeStrategicProfile[];
    roleObservations: KnowledgeRoleObservation[];
    roleTraits: KnowledgeRoleTrait[];
};

export type RiftTheoryKnowledge = {
    metadata: {
        schemaVersion: number;
        generatedAt: string;
        latestPatch: { version: string; discovered_at: string } | null;
        sourceCount: number;
    };
    sources: KnowledgeSource[];
    traitDefinitions: KnowledgeTraitDefinition[];
    interactionRules: KnowledgeInteractionRule[];
    champions: KnowledgeChampion[];
};

export function isRiftTheoryKnowledge(
    value: unknown,
): value is RiftTheoryKnowledge {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<RiftTheoryKnowledge>;
    return (
        typeof candidate.metadata?.schemaVersion === "number" &&
        Array.isArray(candidate.sources) &&
        Array.isArray(candidate.traitDefinitions) &&
        Array.isArray(candidate.interactionRules) &&
        Array.isArray(candidate.champions) &&
        candidate.champions.every(
            (champion) =>
                typeof champion?.name === "string" &&
                typeof champion?.slug === "string" &&
                Array.isArray(champion?.capabilities) &&
                Array.isArray(champion?.strategicProfiles) &&
                Array.isArray(champion?.roleTraits),
        )
    );
}
