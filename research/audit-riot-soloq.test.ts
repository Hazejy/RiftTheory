import { describe, expect, test } from "bun:test";
import { auditRankedRows, type RankedRow } from "./audit-riot-soloq";

const roles = ["top", "jungle", "mid", "bot", "support"];
const row = (id: string, day = "2026-09-20"): RankedRow => ({
    source: "riot-match-v5", matchId: id, platform: "euw1", queueId: 420,
    startTime: `${day}T12:00:00.000Z`, patch: "16.18",
    blue: { teamId: 100, won: true, bans: [], picks: roles.map((role, i) => ({ role, championId: i + 1, playerId: `b${i}` })) },
    red: { teamId: 200, won: false, bans: [], picks: roles.map((role, i) => ({ role, championId: i + 6, playerId: `r${i}` })) },
});

describe("stored Solo Queue cohort audit", () => {
    test("counts unique valid games without emitting identifiers", () => {
        const result = auditRankedRows([row("one"), row("one"), row("two", "2026-08-01")]);
        expect(result).toMatchObject({ rows: 3, uniqueMatches: 2, validMatches: 2, duplicates: 1, invalid: 0,
            distinctPlayers: 10, firstDate: "2026-08-01", lastDate: "2026-09-20", blueWins: 2,
            patches: { "16.18": 2 }, months: { "2026-08": 1, "2026-09": 1 } });
        expect(JSON.stringify(result)).not.toContain("one");
    });

    test("rejects missing roles, duplicate champions and contradictory results", () => {
        const missingRole = row("missing");
        missingRole.red.picks[4].role = "bot";
        const duplicatePick = row("duplicate");
        duplicatePick.red.picks[0].championId = 1;
        const sameWinner = row("winner");
        sameWinner.red.won = true;
        const result = auditRankedRows([missingRole, duplicatePick, sameWinner]);
        expect(result).toMatchObject({ rows: 3, validMatches: 0, invalid: 3, distinctPlayers: 0 });
    });
});
