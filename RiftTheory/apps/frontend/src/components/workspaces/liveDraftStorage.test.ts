import { expect, test } from "bun:test";
import { isUsableLiveDraftConfig, isUsableLiveDraftGames } from "./liveDraftStorage";

test("rejects corrupt saved games before the live draft reads their actions", () => {
    expect(isUsableLiveDraftGames([null, { gameNumber: 2, blueTeam: "team2", actions: [] }], 2)).toBe(false);
    expect(isUsableLiveDraftGames([{ gameNumber: 1, blueTeam: "team1", actions: [null] }], 1)).toBe(false);
    expect(isUsableLiveDraftGames([{ gameNumber: 1, blueTeam: "team1", actions: [
        { kind: "ban", side: "blue", slot: 0, championKey: "1", teamId: "team1" },
    ] }], 1)).toBe(true);
});

test("rejects a saved series with missing lock data", () => {
    expect(isUsableLiveDraftConfig({
        team1Name: "Blue", team2Name: "Red", gameCount: 1,
        mode: "fearless", fearlessScope: "global", firstSelection: false,
    })).toBe(false);
    expect(isUsableLiveDraftConfig({
        team1Name: "Blue", team2Name: "Red", gameCount: 1,
        mode: "fearless", fearlessScope: "global", firstSelection: false,
        disabledChampionKeys: [],
    })).toBe(true);
});
