import { describe, expect, test } from "bun:test";
import { auditDraftRows, type Row } from "./audit-chaincc-drafts";
import { prepareGames } from "./backtest-pro-draft";

const roles = ["top", "jng", "mid", "bot", "sup"];
const picks = (prefix: string) => Object.fromEntries(roles.map((_, i) => [`pick${i + 1}`, `${prefix}${i}`]));
const teams = (id: string, date: string, blueWon: boolean): Row[] => [
    { game_id: id, date, patch: "16.01", league: "TEST", side: "Blue", team_id: "blue", team_name: "Blue", result: String(blueWon).toUpperCase(), ...picks("A") },
    { game_id: id, date, patch: "16.01", league: "TEST", side: "Red", team_id: "red", team_name: "Red", result: String(!blueWon).toUpperCase(), ...picks("B") },
];
const players = (id: string, blueWon: boolean): Row[] =>
    ["Blue", "Red"].flatMap((side) => roles.map((position, i) => ({
        game_id: id, side, position, playername: `${side}-${position}`, champion: `${side === "Blue" ? "A" : "B"}${i}`,
        result: String(side === "Blue" ? blueWon : !blueWon).toUpperCase(),
    })));

describe("public pro-draft data gate", () => {
    test("joins exactly two teams and five distinct roles per side", () => {
        const teamRows = teams("one", "2026-01-01", true);
        const playerRows = players("one", true);
        expect(auditDraftRows(teamRows, playerRows).validGames).toBe(1);
        expect(prepareGames(teamRows, playerRows)[0].blue.get("jng")).toBe("A1");
        playerRows[0].champion = "wrong";
        expect(auditDraftRows(teamRows, playerRows).rejectedGames).toEqual({
            "player roles, picks or result mismatch": 1,
        });
    });

    test("same-day games cannot use each other's outcome in team strength", () => {
        const games = prepareGames(
            [...teams("one", "2026-01-01", true), ...teams("two", "2026-01-01", true), ...teams("three", "2026-01-02", false)],
            [...players("one", true), ...players("two", true), ...players("three", false)],
        );
        expect(games[0].teamDifference).toBe(0);
        expect(games[1].teamDifference).toBe(0);
        expect(games[1].playerDifference).toBe(0);
        expect(games[2].teamDifference).toBeGreaterThan(0);
        expect(games[2].playerDifference).toBeGreaterThan(0);
        expect(games[2].familiarityDifference).toBe(0);
    });
});
