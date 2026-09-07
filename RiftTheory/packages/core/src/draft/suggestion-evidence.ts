import {
    evaluateDraftInteractions,
    InteractionChampion,
    InteractionFinding,
    InteractionImpact,
    InteractionRule,
} from "../interaction/interaction-engine";

export const FOUNDATION_CAPABILITIES = [
    "engage",
    "frontline",
    "wave_clear",
] as const;

export type SuggestionEvidenceChampion = InteractionChampion & {
    capabilities: readonly string[];
};

export type SuggestionEvidence = {
    missingCapabilities: string[];
    coveredCapabilities: string[];
    favorableInteractions: InteractionFinding[];
    unfavorableInteractions: InteractionFinding[];
    informationalInteractions: InteractionFinding[];
    assessed: boolean;
};

export type ObservedRoleTier = "primary" | "established" | "emerging";

export type ComparableSuggestionEvidence = SuggestionEvidence & {
    observedRole?: { tier: ObservedRoleTier };
    flexOptions: readonly unknown[];
};

export const SUGGESTION_EVIDENCE_ORDER = [
    "observed_role",
    "fewer_known_risks",
    "foundation_coverage",
    "known_edges",
    "flex_options",
    "assessment_coverage",
] as const;

const roleTierPriority: Record<ObservedRoleTier, number> = {
    primary: 3,
    established: 2,
    emerging: 1,
};

export function compareSuggestionEvidence(
    left?: ComparableSuggestionEvidence,
    right?: ComparableSuggestionEvidence,
) {
    const vector = (evidence?: ComparableSuggestionEvidence) => [
        evidence?.observedRole
            ? roleTierPriority[evidence.observedRole.tier]
            : 0,
        -(evidence?.unfavorableInteractions.length ?? 0),
        evidence?.coveredCapabilities.length ?? 0,
        evidence?.favorableInteractions.length ?? 0,
        evidence?.flexOptions.length ?? 0,
        evidence?.assessed ? 1 : 0,
    ];
    const leftVector = vector(left);
    const rightVector = vector(right);
    for (let index = 0; index < leftVector.length; index += 1) {
        const difference = leftVector[index]! - rightVector[index]!;
        if (difference !== 0) return difference;
    }
    return 0;
}

function impactForCandidate(
    finding: InteractionFinding,
    candidateKey: string,
): InteractionImpact {
    if (finding.subject.championKey === candidateKey)
        return finding.rule.subjectImpact;
    if (finding.rule.subjectImpact === "favorable") return "unfavorable";
    if (finding.rule.subjectImpact === "unfavorable") return "favorable";
    return "informational";
}

export function assessSuggestionEvidence(
    candidate: SuggestionEvidenceChampion,
    allies: readonly SuggestionEvidenceChampion[],
    enemies: readonly SuggestionEvidenceChampion[],
    rules: readonly InteractionRule[],
    foundationCapabilities: readonly string[] = FOUNDATION_CAPABILITIES,
) {
    const providedCapabilities = new Set(
        allies.flatMap((ally) => ally.capabilities),
    );
    const missingCapabilities = foundationCapabilities.filter(
        (capability) => !providedCapabilities.has(capability),
    );
    const candidateCapabilities = new Set(candidate.capabilities);
    const coveredCapabilities = missingCapabilities.filter((capability) =>
        candidateCapabilities.has(capability),
    );
    const interactions = evaluateDraftInteractions(
        [candidate, ...enemies],
        rules,
    ).filter(
        (finding) =>
            finding.subject.championKey === candidate.championKey ||
            finding.object.championKey === candidate.championKey,
    );
    const byImpact = (impact: InteractionImpact) =>
        interactions.filter(
            (finding) =>
                impactForCandidate(finding, candidate.championKey) === impact,
        );

    return {
        missingCapabilities,
        coveredCapabilities,
        favorableInteractions: byImpact("favorable"),
        unfavorableInteractions: byImpact("unfavorable"),
        informationalInteractions: byImpact("informational"),
        assessed:
            candidate.capabilities.length > 0 || candidate.traits.length > 0,
    } satisfies SuggestionEvidence;
}
