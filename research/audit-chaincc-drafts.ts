/** Audit ChainCC's two-row team / ten-row player export before modeling.
 * Usage: bun research/audit-chaincc-drafts.ts teams.csv.gz players.csv.gz
 * Reads only local files and prints aggregate counts; no match data is committed.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

export type Row = Record<string, string>;

function parseCsv(input: string): Row[] {
    const records: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '"') {
            if (quoted && input[i + 1] === '"') {
                field += '"';
                i++;
            } else quoted = !quoted;
        } else if (char === "," && !quoted) {
            row.push(field);
            field = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && input[i + 1] === "\n") i++;
            row.push(field);
            if (row.some(Boolean)) records.push(row);
            row = [];
            field = "";
        } else field += char;
    }
    if (quoted) throw new Error("Unterminated CSV quote");
    if (field || row.length) records.push([...row, field]);
    const [header, ...data] = records;
    if (!header) throw new Error("Empty CSV");
    return data.map((values, index) => {
        if (values.length !== header.length)
            throw new Error(`CSV row ${index + 2}: expected ${header.length} fields, got ${values.length}`);
        return Object.fromEntries(header.map((key, i) => [key, values[i]]));
    });
}

export function readRows(path: string): Row[] {
    const bytes = readFileSync(path);
    const csv = path.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8");
    return parseCsv(csv.replace(/^\uFEFF/, ""));
}

function tally(rows: Row[], field: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row[field] || "(missing)"] = (counts[row[field] || "(missing)"] ?? 0) + 1;
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

export function auditDraftRows(teams: Row[], players: Row[]) {
    const byGame = new Map<string, Row[]>();
    const playersByGame = new Map<string, Row[]>();
    for (const row of teams) byGame.set(row.game_id, [...(byGame.get(row.game_id) ?? []), row]);
    for (const row of players) playersByGame.set(row.game_id, [...(playersByGame.get(row.game_id) ?? []), row]);
    const errors: Record<string, number> = {};
    const reject = (reason: string) => { errors[reason] = (errors[reason] ?? 0) + 1; };
    let validGames = 0;
    const validDates: string[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const requiredRoles = new Set(["top", "jng", "mid", "bot", "sup"]);
    for (const [id, sides] of byGame) {
        const members = playersByGame.get(id) ?? [];
        if (sides.length !== 2 || new Set(sides.map((row) => row.side)).size !== 2) { reject("team rows or sides"); continue; }
        if (sides.some((row) => !["TRUE", "FALSE"].includes(row.result)) || sides[0].result === sides[1].result) { reject("result"); continue; }
        if (sides.some((row) => [1, 2, 3, 4, 5].some((i) => !row[`pick${i}`]))) { reject("missing picks"); continue; }
        if (members.length !== 10) { reject("player row count"); continue; }
        if (sides.some((side) => {
            const own = members.filter((member) => member.side === side.side);
            if (own.length !== 5 || new Set(own.map((member) => member.position)).size !== 5 || own.some((member) => !requiredRoles.has(member.position))) return true;
            const drafted = [1, 2, 3, 4, 5].map((i) => side[`pick${i}`]).sort();
            return JSON.stringify(drafted) !== JSON.stringify(own.map((member) => member.champion).sort()) || own.some((member) => member.result !== side.result);
        })) { reject("player roles, picks or result mismatch"); continue; }
        const date = sides[0].date.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || sides[1].date.slice(0, 10) !== date) { reject("date"); continue; }
        validGames++;
        validDates.push(date);
    }
    validDates.sort();
    return {
        teamRows: teams.length,
        playerRows: players.length,
        distinctGames: byGame.size,
        validGames,
        rejectedGames: errors,
        firstDate: validDates[0] ?? null,
        lastDate: validDates.at(-1) ?? null,
        patches: tally(teams, "patch"),
        leagues: tally(teams, "league"),
        missingBans: teams.filter((row) => [1, 2, 3, 4, 5].some((i) => !row[`ban${i}`])).length,
    };
}

if (import.meta.main) {
    const [teamPath, playerPath] = process.argv.slice(2);
    if (!teamPath || !playerPath) throw new Error("Provide team and player CSV(.gz) paths");
    console.log(JSON.stringify(auditDraftRows(readRows(teamPath), readRows(playerPath)), null, 2));
}
