import { expect, test } from "bun:test";
import type { LolChampSelectChampSelectSession } from "../types/Lcu";
import { completedLcuBans } from "./lcuDraft";

test("LCU bans include completed actions and both teams once", () => {
    const session = {
        actions: [[
            { type: "ban", championId: 1, completed: true },
            { type: "ban", championId: 2, completed: false },
        ]],
        bans: { myTeamBans: [1, 3, 0], theirTeamBans: [3, 4] },
    } as unknown as LolChampSelectChampSelectSession;
    expect(completedLcuBans(session)).toEqual(["1", "3", "4"]);
});
