import { expect, test } from "bun:test";
import { parseChampSelectSession, parseGameflowPhase } from "./lcu-api";

test("a missing gameflow endpoint cannot claim the League client is connected", () => {
    expect(() => parseGameflowPhase(null)).toThrow("League gameflow is unavailable");
    expect(parseGameflowPhase("None")).toBe("None");
    expect(parseGameflowPhase("InProgress")).toBe("InProgress");
});

test("LCU session boundary accepts absence and rejects malformed sessions", () => {
    expect(parseChampSelectSession(null)).toBeNull();
    expect(() => parseChampSelectSession({ myTeam: [] })).toThrow();
    expect(parseChampSelectSession({
        myTeam: [], theirTeam: [], actions: [], gameId: 1, localPlayerCellId: 0,
    })?.gameId).toBe(1);
});
