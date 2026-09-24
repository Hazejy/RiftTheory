/** Offline quality audit of normalized Riot Match-V5 Solo Queue rows.
 * Usage: bun research/audit-riot-soloq.ts data/runtime/soloq/*.jsonl
 * Prints aggregate counts only; match and pseudonymous player IDs stay local.
 */
import { readFileSync } from "node:fs";

const ROLES = ["top", "jungle", "mid", "bot", "support"];

type Pick = { role: string; championId: number; playerId: string };
type Side = { teamId: number; won: boolean; bans: number[]; picks: Pick[] };
export type RankedRow = {
    source: string;
    matchId: string;
    platform: string;
    queueId: number;
    startTime: string;
    patch: string;
    blue: Side;
    red: Side;
};

export function auditRankedRows(rows: RankedRow[]) {
    const seen = new Set<string>();
    const players = new Set<string>();
    const patches: Record<string, number> = {};
    const months: Record<string, number> = {};
    const platforms: Record<string, number> = {};
    let duplicates = 0, invalid = 0, blueWins = 0;
    let firstDate = "", lastDate = "";
    for (const row of rows) {
        if (seen.has(row.matchId)) { duplicates++; continue; }
        seen.add(row.matchId);
        const sides = [row.blue, row.red];
        const picks = sides.flatMap((side) => side?.picks ?? []);
        const validSide = (side: Side | undefined, teamId: number) =>
            side?.teamId === teamId && typeof side.won === "boolean" &&
            Array.isArray(side.bans) && Array.isArray(side.picks) &&
            side.picks.length === 5 &&
            ROLES.every((role) => side.picks.some((pick) => pick.role === role));
        const date = Date.parse(row.startTime);
        if (
            row.source !== "riot-match-v5" || row.queueId !== 420 ||
            !row.matchId || !row.platform || !/^\d+\.\d+$/.test(row.patch) ||
            !Number.isFinite(date) || new Date(date).toISOString() !== row.startTime ||
            !validSide(row.blue, 100) || !validSide(row.red, 200) ||
            row.blue.won === row.red.won ||
            new Set(picks.map((pick) => pick.championId)).size !== 10 ||
            new Set(picks.map((pick) => pick.playerId)).size !== 10 ||
            picks.some((pick) => !Number.isInteger(pick.championId) || pick.championId <= 0 || !pick.playerId)
        ) { invalid++; continue; }
        const day = row.startTime.slice(0, 10);
        firstDate = !firstDate || day < firstDate ? day : firstDate;
        lastDate = day > lastDate ? day : lastDate;
        patches[row.patch] = (patches[row.patch] ?? 0) + 1;
        months[day.slice(0, 7)] = (months[day.slice(0, 7)] ?? 0) + 1;
        platforms[row.platform] = (platforms[row.platform] ?? 0) + 1;
        blueWins += Number(row.blue.won);
        for (const pick of picks) players.add(pick.playerId);
    }
    return {
        rows: rows.length,
        uniqueMatches: seen.size,
        validMatches: seen.size - invalid,
        duplicates, invalid, distinctPlayers: players.size,
        firstDate, lastDate, blueWins,
        patches: Object.fromEntries(Object.entries(patches).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))),
        months: Object.fromEntries(Object.entries(months).sort()),
        platforms: Object.fromEntries(Object.entries(platforms).sort()),
    };
}

if (import.meta.main) {
    const paths = process.argv.slice(2);
    if (!paths.length) throw new Error("Pass one or more normalized .jsonl paths");
    const rows = paths.flatMap((path) => readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).map((line, i) => {
        try { return JSON.parse(line) as RankedRow; }
        catch { throw new Error(`Invalid JSON at ${path}:${i + 1}`); }
    }));
    console.log(JSON.stringify(auditRankedRows(rows), null, 2));
}
