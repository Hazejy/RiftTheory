import { analyzeDraft, type AnalyzeDraftConfig } from "@rifttheory/core/src/draft/analysis";
import type { Dataset } from "@rifttheory/core/src/models/dataset/Dataset";
import type { Role } from "@rifttheory/core/src/models/Role";
import { reviewStrategy, STRATEGY_ROLES, type StrategyOption, type StrategyPick } from "./strategyReview";

export function rateStrategyOption(
    option: Pick<StrategyOption, "picks"> | undefined,
    own: StrategyPick[],
    enemy: StrategyPick[],
    dataset: Dataset | undefined,
    fullDataset: Dataset | undefined,
    config: AnalyzeDraftConfig,
) {
    if (!option || !dataset || !fullDataset) return undefined;
    const after = reviewStrategy([...own, ...option.picks], enemy);
    if (!after.complete || after.issues.length) return undefined;
    const roleMap = (picks: typeof after.blue.picks) => {
        if (picks.length !== 5 || picks.some((pick) => pick.roles.length !== 1))
            return undefined;
        return new Map(picks.map((pick) => [
            STRATEGY_ROLES.indexOf(pick.roles[0]) as Role,
            pick.key,
        ]));
    };
    const team = roleMap(after.blue.picks);
    const opponents = roleMap(after.red.picks);
    if (!team || !opponents || team.size !== 5 || opponents.size !== 5)
        return undefined;
    if ([...team, ...opponents].some(([role, key]) =>
        !dataset.championData[key]?.statsByRole[role])) return undefined;
    const rating = analyzeDraft(dataset, fullDataset, team, opponents, config);
    return Number.isFinite(rating.winrate) ? rating : undefined;
}
