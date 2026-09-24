/** Solo Queue knowledge-coverage audit for local normalized Riot Match-V5 rows.
 * Usage: bun research/audit-coach-soloq.ts path.jsonl [more.jsonl ...]
 * Match-V5 final roles are used for coverage only; pick order is unavailable.
 */
import { readFileSync } from "node:fs";
import knowledge from "../RiftTheory/apps/frontend/public/data/rifttheory-knowledge.json";
import { auditCoachCoverage } from "./audit-coach-coverage";
import { auditRankedRows, type RankedRow } from "./audit-riot-soloq";
import type { Row } from "./audit-chaincc-drafts";

const position = (role: string) =>
    role === "jungle" ? "jng" : role === "support" ? "sup" : role;

export function auditSoloQueueCoach(rows: RankedRow[], minimumPatch = "16.16") {
    const quality = auditRankedRows(rows);
    if (quality.invalid || quality.duplicates)
        throw new Error("Audit the normalized Solo Queue data before checking coach coverage");
    const names = new Map(knowledge.champions.map((champion) => [
        Number(champion.riotKey), champion.name,
    ]));
    const teams: Row[] = [];
    const players: Row[] = [];
    for (const row of rows) {
        for (const [side, team] of [["Blue", row.blue], ["Red", row.red]] as const) {
            const picks = team.picks.map((pick) =>
                names.get(pick.championId) ?? `Unknown ${pick.championId}`,
            );
            teams.push({
                game_id: row.matchId, side, patch: row.patch,
                pick1: picks[0], pick2: picks[1], pick3: picks[2],
                pick4: picks[3], pick5: picks[4],
            });
            for (const [index, pick] of team.picks.entries())
                players.push({
                    game_id: row.matchId, side,
                    champion: picks[index], position: position(pick.role),
                });
        }
    }
    return {
        quality: {
            validMatches: quality.validMatches,
            firstDate: quality.firstDate,
            lastDate: quality.lastDate,
            platforms: quality.platforms,
        },
        evidence: auditCoachCoverage(
            teams, players, minimumPatch,
            "Riot Match-V5 local Solo Queue pilot; final roles used only for retrospective coverage, not pick-order validation",
        ),
    };
}

if (import.meta.main) {
    const paths = process.argv.slice(2);
    if (!paths.length) throw new Error("Provide one or more normalized .jsonl paths");
    const rows = paths.flatMap((path) => readFileSync(path, "utf8")
        .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as RankedRow));
    console.log(JSON.stringify(auditSoloQueueCoach(rows), null, 2));
}
