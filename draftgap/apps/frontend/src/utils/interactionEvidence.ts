import type { InteractionRule } from "@draftgap/core/src/interaction/interaction-engine";
import type { KnowledgeInteractionRule } from "../types/RiftTheoryKnowledge";

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
        condition: rule.condition_text,
        effect: rule.effect_text,
        patchVersion: rule.patch_version,
        confidence: rule.confidence,
        reviewStatus: rule.review_status,
        sourceKey: rule.source_key,
    };
}
