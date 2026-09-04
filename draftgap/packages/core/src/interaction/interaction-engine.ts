export const INTERACTION_TRAITS = [
    "threat_range",
    "target_access",
    "wave_clear",
    "wave_access_safety",
    "engage",
    "disengage",
    "poke",
    "siege",
    "mobility",
    "frontline",
    "peel",
    "sustain",
    "side_lane_pressure",
    "terrain_control",
] as const;

export type InteractionTrait = (typeof INTERACTION_TRAITS)[number];
export type TraitLevel = 1 | 2 | 3 | 4 | 5;
export type InteractionTeam = "blue" | "red";
export type InteractionComparison = "subject_greater" | "both_at_least";
export type InteractionSeverity = "note" | "warning" | "strong";
export type InteractionImpact = "favorable" | "unfavorable" | "informational";

export type ChampionTrait = {
    trait: InteractionTrait;
    level: TraitLevel;
};

export type InteractionChampion = {
    championKey: string;
    championName: string;
    role: string;
    team: InteractionTeam;
    traits: readonly ChampionTrait[];
};

export type InteractionRule = {
    ruleKey: string;
    subjectTrait: InteractionTrait;
    objectTrait: InteractionTrait;
    comparison: InteractionComparison;
    subjectMinimum: TraitLevel;
    objectMinimum: TraitLevel;
    minimumDifference: number;
    relation: string;
    severity: InteractionSeverity;
    subjectImpact: InteractionImpact;
    condition: string;
    effect: string;
    patchVersion: string;
    confidence: number | null;
    reviewStatus: string;
    sourceKey: string;
};

export type InteractionFinding = {
    rule: InteractionRule;
    subject: InteractionChampion;
    object: InteractionChampion;
    subjectLevel: TraitLevel;
    objectLevel: TraitLevel;
};

function traitLevel(champion: InteractionChampion, trait: InteractionTrait) {
    return champion.traits.find((candidate) => candidate.trait === trait)
        ?.level;
}

function matchesRule(
    subject: InteractionChampion,
    object: InteractionChampion,
    rule: InteractionRule,
) {
    const subjectLevel = traitLevel(subject, rule.subjectTrait);
    const objectLevel = traitLevel(object, rule.objectTrait);
    if (subjectLevel === undefined || objectLevel === undefined) return null;
    if (subjectLevel < rule.subjectMinimum || objectLevel < rule.objectMinimum)
        return null;
    if (
        rule.comparison === "subject_greater" &&
        subjectLevel - objectLevel < rule.minimumDifference
    )
        return null;
    return { subjectLevel, objectLevel };
}

export function evaluateDraftInteractions(
    champions: readonly InteractionChampion[],
    rules: readonly InteractionRule[],
) {
    const findings: InteractionFinding[] = [];
    for (const subject of champions) {
        for (const object of champions) {
            if (subject.team === object.team) continue;
            for (const rule of rules) {
                const levels = matchesRule(subject, object, rule);
                if (levels) {
                    findings.push({ rule, subject, object, ...levels });
                }
            }
        }
    }
    const severityOrder: Record<InteractionSeverity, number> = {
        strong: 0,
        warning: 1,
        note: 2,
    };
    return findings.sort(
        (left, right) =>
            severityOrder[left.rule.severity] -
                severityOrder[right.rule.severity] ||
            (right.rule.confidence ?? 0) - (left.rule.confidence ?? 0) ||
            left.rule.ruleKey.localeCompare(right.rule.ruleKey),
    );
}
