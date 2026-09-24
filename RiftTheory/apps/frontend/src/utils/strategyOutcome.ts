import type { StrategyReview } from "./strategyReview";

export type StrategyOutcome = {
    heading: string;
    explanation: string;
    modelIndex?: number;
};

/** The draft rating is mapped through an Elo curve, not outcome-calibrated. */
export function assessStrategyOutcome(
    review: StrategyReview,
    ratingIndex: number | undefined,
    isLiveSnapshot: boolean,
): StrategyOutcome {
    if (review.issues.length)
        return {
            heading: "Winner unresolved",
            explanation: "Resolve duplicate picks and role assignments before comparing the drafts.",
        };
    if (!review.complete)
        return {
            heading: "Winner unresolved",
            explanation: "Both teams need five legal picks before a full-draft comparison is meaningful.",
        };
    if (isLiveSnapshot)
        return {
            heading: "Winner unresolved",
            explanation: "This Live Draft snapshot has conditional plans, but no statistical rating for these exact picks.",
        };
    if (
        ratingIndex === undefined ||
        !Number.isFinite(ratingIndex) ||
        ratingIndex < 0 ||
        ratingIndex > 1
    )
        return {
            heading: "Winner unresolved",
            explanation: "A usable draft rating for the requested dataset and rank is unavailable.",
        };
    const modelIndex = ratingIndex * 100;
    return {
        heading:
            ratingIndex === 0.5
                ? "Rating model: level"
                : `Rating model leans ${ratingIndex > 0.5 ? "Blue" : "Red"}`,
        explanation:
            "The number below is an Elo-style conversion of champion, duo and matchup ratings. It has no validated probability calibration or player-skill adjustment. Compare both plans and their counterplay before deciding which draft to play.",
        modelIndex,
    };
}
