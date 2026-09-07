export const FLEX_EVIDENCE_POLICY = {
    confidenceZ: 1.96,
    minimumChampionGames: 1_000,
    established: {
        minimumRoleGames: 500,
        minimumShare: 0.10,
    },
    emerging: {
        minimumRoleGames: 100,
        minimumShare: 0.05,
    },
} as const;

export function flexStrengthForShare(share: number) {
    if (!Number.isFinite(share) || share < 0.05) return "none";
    if (share < 0.10) return "niche";
    if (share < 0.20) return "real";
    if (share < 0.35) return "strong";
    return "veryStrong";
}

export type FlexEvidenceTier =
    | "primary"
    | "established"
    | "emerging"
    | "insufficient";

export type ObservedRoleSample<RoleName extends string = string> = {
    role: RoleName;
    games: number;
    sampleTotal: number;
    roleShare: number;
};

export type AssessedRoleSample<RoleName extends string = string> =
    ObservedRoleSample<RoleName> & {
        lowerShare: number;
        tier: FlexEvidenceTier;
    };

export function wilsonLowerBound(successes: number, total: number, z = 1.96) {
    if (total <= 0 || successes < 0 || successes > total) return 0;
    const probability = successes / total;
    const squaredZ = z * z;
    const denominator = 1 + squaredZ / total;
    const center = probability + squaredZ / (2 * total);
    const margin =
        z *
        Math.sqrt(
            (probability * (1 - probability) + squaredZ / (4 * total)) / total,
        );
    return Math.max(0, (center - margin) / denominator);
}

export function assessObservedRoles<RoleName extends string>(
    samples: readonly ObservedRoleSample<RoleName>[],
) {
    if (!samples.length)
        return {
            roles: [] as AssessedRoleSample<RoleName>[],
            isFlexCandidate: false,
            sampleSufficient: false,
        };

    const sampleTotal = Math.max(
        ...samples.map((sample) => sample.sampleTotal),
    );
    const primaryRole = samples.reduce((current, sample) =>
        sample.games > current.games ? sample : current,
    ).role;
    const sampleSufficient =
        sampleTotal >= FLEX_EVIDENCE_POLICY.minimumChampionGames;
    const roles = samples
        .map<AssessedRoleSample<RoleName>>((sample) => {
            const lowerShare = wilsonLowerBound(
                sample.games,
                sample.sampleTotal,
                FLEX_EVIDENCE_POLICY.confidenceZ,
            );
            let tier: FlexEvidenceTier = "insufficient";
            if (sampleSufficient && sample.role === primaryRole) {
                tier = "primary";
            } else if (
                sampleSufficient &&
                sample.games >=
                    FLEX_EVIDENCE_POLICY.established.minimumRoleGames &&
                sample.roleShare >= FLEX_EVIDENCE_POLICY.established.minimumShare
            ) {
                tier = "established";
            } else if (
                sampleSufficient &&
                sample.games >=
                    FLEX_EVIDENCE_POLICY.emerging.minimumRoleGames &&
                sample.roleShare >= FLEX_EVIDENCE_POLICY.emerging.minimumShare &&
                sample.roleShare < FLEX_EVIDENCE_POLICY.established.minimumShare
            ) {
                tier = "emerging";
            }
            return { ...sample, lowerShare, tier };
        })
        .sort((left, right) => right.roleShare - left.roleShare);

    return {
        roles,
        isFlexCandidate: roles.some((role) => role.tier === "established"),
        sampleSufficient,
    };
}
