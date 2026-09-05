import type { InteractionRule } from "@draftgap/core/src/interaction/interaction-engine";
import type { InteractionTeam } from "@draftgap/core/src/interaction/interaction-engine";
import type { Role } from "@draftgap/core/src/models/Role";
import type { SuggestionEvidenceChampion } from "@draftgap/core/src/draft/suggestion-evidence";
import type {
    KnowledgeChampion,
    KnowledgeInteractionRule,
} from "../types/RiftTheoryKnowledge";

export const EVIDENCE_ROLE_NAMES = [
    "top",
    "jungle",
    "mid",
    "bot",
    "support",
] as const;

export function toInteractionRule(
    rule: KnowledgeInteractionRule,
): InteractionRule {
    return {
        ruleKey: rule.rule_key,
        subjectTrait: rule.subject_trait_key,
        objectTrait: rule.object_trait_key,
        comparison: rule.comparison,
        subjectMinimum: rule.subject_min_level,
        objectMinimum: rule.object_min_level,
        minimumDifference: rule.minimum_difference,
        relation: rule.relation,
        severity: rule.severity,
        subjectImpact: rule.subject_impact,
        condition: rule.condition_text,
        effect: rule.effect_text,
        patchVersion: rule.patch_version,
        confidence: rule.confidence,
        reviewStatus: rule.review_status,
        sourceKey: rule.source_key,
    };
}

export function toSuggestionEvidenceChampion(
    championKey: string,
    role: Role,
    team: InteractionTeam,
    champion?: KnowledgeChampion,
): SuggestionEvidenceChampion {
    const roleName = EVIDENCE_ROLE_NAMES[role];
    return {
        championKey,
        championName: champion?.name ?? championKey,
        role: roleName,
        team,
        capabilities: [
            ...new Set(
                (champion?.capabilities ?? [])
                    .filter((capability) => capability.role === roleName)
                    .map((capability) => capability.capability),
            ),
        ],
        traits: (champion?.roleTraits ?? [])
            .filter((trait) => trait.role === roleName)
            .map((trait) => ({ trait: trait.trait, level: trait.level })),
    };
}

export function suggestionEvidenceKey(championKey: string, role: Role) {
    return `${championKey}:${role}`;
}
