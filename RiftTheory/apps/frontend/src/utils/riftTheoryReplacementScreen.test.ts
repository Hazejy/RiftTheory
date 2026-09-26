import { expect, test } from "bun:test";
import type { StrategyPick, StrategyRole } from "./strategyReview";
import { screenRiftTheoryReplacements } from "./riftTheoryReplacementScreen";

const pick = (key: string, role: StrategyRole): StrategyPick => ({
    key, name: key, role, possibleRoles: [role],
});

test("screens only legal same-role replacements against fixed nine picks", () => {
    const own = [
        pick("OwnTop", "top"), pick("OwnJungle", "jungle"),
        pick("OwnMid", "mid"), pick("OwnBot", "bot"),
    ];
    const enemy = [
        pick("EnemyTop", "top"), pick("EnemyJungle", "jungle"),
        pick("EnemyMid", "mid"), pick("EnemyBot", "bot"),
        pick("EnemySupport", "support"),
    ];
    const seen: string[] = [];
    const result = screenRiftTheoryReplacements(
        own, enemy,
        [
            pick("Low", "support"), pick("High", "support"),
            pick("Banned", "support"), pick("WrongRole", "mid"),
            pick("EnemyMid", "support"),
        ],
        { bans: ["Banned"] },
        (team, opponent, candidate) => {
            seen.push(candidate.key);
            expect(team.get(4)).toBe(candidate.key);
            expect(opponent.get(2)).toBe("EnemyMid");
            return { modelIndex: candidate.key === "High" ? 0.54 : 0.51, roleGames: 200 };
        },
    );
    expect(seen).toEqual(["Low", "High"]);
    expect(result.role).toBe("support");
    expect(result.evaluated).toBe(2);
    expect(result.top.map((entry) => entry.pick.key)).toEqual(["High", "Low"]);
    const ownedOnly = screenRiftTheoryReplacements(
        own, enemy, [pick("Low", "support"), pick("High", "support")],
        { bans: [], owned: new Set(["High"]) },
        () => ({ modelIndex: 0.5, roleGames: 10 }),
    );
    expect(ownedOnly.top.map((entry) => entry.pick.key)).toEqual(["High"]);
    expect(screenRiftTheoryReplacements(own.slice(0, 3), enemy, [], { bans: [] }, () => undefined).top)
        .toEqual([]);
});
