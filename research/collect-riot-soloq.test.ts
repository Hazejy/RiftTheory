import { describe, expect, test } from "bun:test";
import { normalizeRankedMatch } from "./collect-riot-soloq";

const roles = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
const match = () => ({
    metadata: { matchId: "EUW1_123" },
    info: {
        queueId: 420,
        gameVersion: "16.18.123.456",
        gameStartTimestamp: Date.parse("2026-09-20T12:00:00Z"),
        gameDuration: 1800,
        participants: [100, 200].flatMap((teamId) => roles.map((teamPosition, i) => ({
            puuid: `${teamId}-${i}`, teamId, teamPosition,
            championId: (teamId === 100 ? 1 : 6) + i, win: teamId === 100,
        }))),
        teams: [
            { teamId: 100, win: true, bans: [{ championId: 42, pickTurn: 3 }, { championId: 12, pickTurn: 1 }] },
            { teamId: 200, win: false, bans: [] },
        ],
    },
});

describe("Riot Solo Queue match normalization", () => {
    test("keeps only pregame draft fields, result and pseudonymous player keys", () => {
        const result = normalizeRankedMatch(match(), "euw1", (puuid) => `hash:${puuid}`);
        expect(result?.patch).toBe("16.18");
        expect(result?.blue?.bans).toEqual([12, 42]);
        expect(result?.red?.picks[4]).toEqual({ role: "support", championId: 10, playerId: "hash:200-4" });
        expect(result).not.toHaveProperty("gameDuration");
    });

    test("rejects non-ranked games, remakes and invalid role assignments", () => {
        const draft = match();
        draft.info.queueId = 440;
        expect(normalizeRankedMatch(draft, "euw1", (value) => value)).toBeUndefined();
        draft.info.queueId = 420;
        draft.info.gameDuration = 200;
        expect(normalizeRankedMatch(draft, "euw1", (value) => value)).toBeUndefined();
        draft.info.gameDuration = 1800;
        draft.info.participants[0].teamPosition = "NONE";
        expect(normalizeRankedMatch(draft, "euw1", (value) => value)).toBeUndefined();
    });
});
