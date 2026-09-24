/** Retrospective evidence-coverage audit of observed professional drafts.
 * Usage: bun research/audit-coach-coverage.ts teams.csv.gz players.csv.gz [minimum-patch]
 * Final role assignments are used only to find missing role profiles. This is
 * not a historical pick recommendation or an outcome-model validation.
 */
import type { KnowledgeChampion } from "../RiftTheory/apps/frontend/src/types/RiftTheoryKnowledge";
import {
    reviewStrategy,
    strategyColorEvidence,
    strategyThemeFits,
    type StrategyPick,
    type StrategyRole,
} from "../RiftTheory/apps/frontend/src/utils/strategyReview";
import knowledge from "../RiftTheory/apps/frontend/public/data/rifttheory-knowledge.json";
import { readRows, type Row } from "./audit-chaincc-drafts";

const ROLES: Record<string, StrategyRole> = {
    top: "top", jng: "jungle", mid: "mid", bot: "bot", sup: "support",
};
const normalize = (name: string) => name.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
const patchNumber = (patch: string) => {
    const [major, minor] = patch.split(".").map(Number);
    return Number.isFinite(major) && Number.isFinite(minor)
        ? major * 1000 + minor : -1;
};

type Coverage = {
    games: number;
    picks: number;
    capability: number;
    reviewedCapability: number;
    matchingPatchReviewedCapability: number;
    color: number;
    roleColor: number;
    provisionalColor: number;
    historicalColor: number;
    coaching: number;
    primaryPlan: number;
    bothPrimaryPlans: number;
    issues: number;
    sameKnowledgePatchPicks: number;
    themeFit: Record<string, number>;
};
const emptyCoverage = (): Coverage => ({
    games: 0, picks: 0, capability: 0,
    reviewedCapability: 0, matchingPatchReviewedCapability: 0,
    color: 0,
    roleColor: 0, provisionalColor: 0, historicalColor: 0,
    coaching: 0,
    primaryPlan: 0, bothPrimaryPlans: 0, issues: 0,
    sameKnowledgePatchPicks: 0, themeFit: {},
});
const increment = (counts: Map<string, number>, key: string) =>
    counts.set(key, (counts.get(key) ?? 0) + 1);
const top = (counts: Map<string, number>) => [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20).map(([name, picks]) => ({ name, picks }));

export function auditCoachCoverage(
    teams: Row[],
    players: Row[],
    minimumPatch = "16.16",
    source = "ChainCC local pro export; final observed roles used only for retrospective coverage",
) {
    const champions = new Map<string, KnowledgeChampion>(
        (knowledge.champions as KnowledgeChampion[]).map((champion) => [
            normalize(champion.name), champion,
        ]),
    );
    const teamGroups = new Map<string, Row[]>();
    const playerGroups = new Map<string, Row[]>();
    for (const row of teams)
        teamGroups.set(row.game_id, [...(teamGroups.get(row.game_id) ?? []), row]);
    for (const row of players)
        playerGroups.set(row.game_id, [...(playerGroups.get(row.game_id) ?? []), row]);

    const byPatch = new Map<string, Coverage>();
    const missingCapabilities = new Map<string, number>();
    const missingColors = new Map<string, number>();
    const missingCoaching = new Map<string, number>();
    const unknownChampions = new Map<string, number>();
    let skipped = 0;
    const knowledgePatch = knowledge.metadata.latestPatch.version.split(".").slice(0, 2).join(".");
    for (const [gameId, pair] of teamGroups) {
        const blueRow = pair.find((row) => row.side === "Blue");
        const redRow = pair.find((row) => row.side === "Red");
        if (!blueRow || !redRow || pair.length !== 2 ||
            patchNumber(blueRow.patch) < patchNumber(minimumPatch)) continue;
        const members = playerGroups.get(gameId) ?? [];
        const picksFor = (side: "Blue" | "Red", row: Row): StrategyPick[] | undefined => {
            const assigned = new Map(members.filter((member) => member.side === side)
                .map((member) => [normalize(member.champion), ROLES[member.position]]));
            const picks = [1, 2, 3, 4, 5].map((index) => row[`pick${index}`]);
            if (assigned.size !== 5 || picks.some((name) => !name || !assigned.get(normalize(name))))
                return undefined;
            return picks.map((name) => {
                const role = assigned.get(normalize(name))!;
                const profile = champions.get(normalize(name));
                return {
                    key: profile?.riotKey ?? `unknown:${normalize(name)}`,
                    name,
                    role,
                    possibleRoles: [role],
                    knowledge: profile,
                };
            });
        };
        const blue = picksFor("Blue", blueRow);
        const red = picksFor("Red", redRow);
        if (!blue || !red) { skipped++; continue; }
        const review = reviewStrategy(blue, red);
        const coverage = byPatch.get(blueRow.patch) ?? emptyCoverage();
        byPatch.set(blueRow.patch, coverage);
        coverage.games++;
        coverage.issues += Number(review.issues.length > 0);
        coverage.primaryPlan += Number(!!review.blue.plans[0]) + Number(!!review.red.plans[0]);
        coverage.bothPrimaryPlans += Number(!!review.blue.plans[0] && !!review.red.plans[0]);
        for (const team of [review.blue, review.red]) {
            for (const fit of strategyThemeFits(team))
                coverage.themeFit[fit.label] = (coverage.themeFit[fit.label] ?? 0) + 1;
            for (const pick of team.picks) {
                const label = `${pick.name} / ${pick.role ?? "unresolved"}`;
                coverage.picks++;
                coverage.sameKnowledgePatchPicks += Number(blueRow.patch === knowledgePatch);
                if (pick.capabilities.length) coverage.capability++;
                else increment(missingCapabilities, label);
                const reviewed = pick.knowledge?.capabilities.some((entry) =>
                    entry.role === pick.role && entry.review_status === "reviewed" &&
                    pick.capabilities.includes(entry.capability),
                ) ?? false;
                coverage.reviewedCapability += Number(reviewed);
                coverage.matchingPatchReviewedCapability += Number(
                    reviewed && (pick.knowledge?.capabilities.some((entry) =>
                        entry.role === pick.role && entry.review_status === "reviewed" &&
                        entry.patch_version.startsWith(blueRow.patch) &&
                        pick.capabilities.includes(entry.capability),
                    ) ?? false),
                );
                const color = strategyColorEvidence(pick);
                if (color) {
                    coverage.color++;
                    if (color.tier === "role_profile") coverage.roleColor++;
                    else if (color.tier === "provisional_baseline") coverage.provisionalColor++;
                    else coverage.historicalColor++;
                } else increment(missingColors, label);
                if (pick.coaching) coverage.coaching++;
                else increment(missingCoaching, label);
                if (!pick.knowledge) increment(unknownChampions, pick.name);
            }
        }
    }
    const totals = emptyCoverage();
    for (const row of byPatch.values()) {
        for (const field of ["games", "picks", "capability", "reviewedCapability",
            "matchingPatchReviewedCapability", "color", "roleColor",
            "provisionalColor", "historicalColor", "coaching",
            "primaryPlan", "bothPrimaryPlans", "issues", "sameKnowledgePatchPicks"] as const)
            totals[field] += row[field];
        for (const [label, count] of Object.entries(row.themeFit))
            totals.themeFit[label] = (totals.themeFit[label] ?? 0) + count;
    }
    return {
        source,
        minimumPatch,
        knowledgePatch,
        skipped,
        totals,
        byPatch: Object.fromEntries([...byPatch].sort((a, b) => patchNumber(a[0]) - patchNumber(b[0]))),
        topMissingCapabilities: top(missingCapabilities),
        topMissingColors: top(missingColors),
        topMissingCoaching: top(missingCoaching),
        unknownChampions: top(unknownChampions),
    };
}

if (import.meta.main) {
    const [teamPath, playerPath, minimumPatch] = process.argv.slice(2);
    if (!teamPath || !playerPath)
        throw new Error("Provide team and player CSV(.gz) paths");
    console.log(JSON.stringify(auditCoachCoverage(
        readRows(teamPath), readRows(playerPath), minimumPatch,
    ), null, 2));
}
