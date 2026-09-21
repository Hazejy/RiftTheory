import { describe, expect, test } from "bun:test";
import {
    MECHANIC_PROFILES,
    MECHANICS_DATA_VERSION,
    reviewStrategyMechanics,
} from "./strategyMechanics";
import { resolveStrategyPicks, type ResolvedPick } from "./strategyReview";
import type { RiftTheoryKnowledge } from "../types/RiftTheoryKnowledge";
import shippedKnowledge from "../../public/data/rifttheory-knowledge.json";

function pick(key: string, capabilities: string[] = []): ResolvedPick {
    return {
        key,
        name: key,
        role: "mid",
        possibleRoles: ["mid"],
        roles: ["mid"],
        capabilities,
    };
}

describe("ability-specific strategy checks", () => {
    test("uses unique Riot keys and a pinned official source, not champion display names", () => {
        expect(new Set(MECHANIC_PROFILES.map((p) => p.key)).size).toBe(
            MECHANIC_PROFILES.length,
        );
        const report = reviewStrategyMechanics(
            [pick("254")],
            [pick("unknown")],
            MECHANICS_DATA_VERSION,
        );
        expect(report.checks[0].sourceUrl).toBe(
            "https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Vi.json",
        );
        expect(report.sameVersion).toBe(true);
        expect(
            reviewStrategyMechanics(
                [{ ...pick("unknown"), name: "Vi" }],
                [pick("other")],
            ).checks,
        ).toEqual([]);
    });

    test("explicitly reports stale or unavailable patch and incomplete coverage", () => {
        for (const version of [undefined, "16.17.1", "16.19.1", "16.18.2"]) {
            const report = reviewStrategyMechanics(
                [pick("254")],
                [pick("unknown")],
                version,
            );
            expect(report.sameVersion).toBe(false);
            expect(report.covered).toBe(1);
            expect(report.total).toBe(2);
            expect(report.uncovered.map((p) => p.key)).toEqual(["unknown"]);
        }
    });

    test("does not claim counterplay without opposing picks or legal role scenarios", () => {
        expect(reviewStrategyMechanics([pick("254")], []).checks).toEqual([]);
        expect(
            reviewStrategyMechanics(
                [pick("254")],
                [{ ...pick("40"), roles: [] }],
            ).checks,
        ).toEqual([]);
        expect(
            reviewStrategyMechanics([pick("254")], [pick("254")]).valid,
        ).toBe(false);
    });

    test("reads both sides of an entry/protection exchange and reverses perspective", () => {
        const vi = pick("254", ["engage", "dive"]);
        const janna = pick("40", ["peel"]);
        const checks = reviewStrategyMechanics([vi], [janna]).checks;
        expect(checks.map((c) => [c.key, c.side])).toEqual([
            ["254", "own"],
            ["40", "enemy"],
        ]);
        expect(
            reviewStrategyMechanics([janna], [vi]).checks.find(
                (c) => c.key === "40",
            )?.side,
        ).toBe("own");
        expect(
            checks.every(
                (c) =>
                    c.limit.length > 0 &&
                    c.requires.length > 0 &&
                    c.answer.length > 0,
            ),
        ).toBe(true);
    });

    test("does not convert an engage tag into a verified Poppy vs Vi interruption", () => {
        const check = reviewStrategyMechanics(
            [pick("78")],
            [pick("254", ["engage"])],
        ).checks[0];
        expect(check.key).toBe("78");
        expect(check.limit).toContain("not a claim that W stops Vi R");
        expect(check.requires).toContain("susceptible dash");
        expect(
            reviewStrategyMechanics([pick("78")], [pick("unknown", ["poke"])])
                .checks,
        ).toEqual([]);
    });

    test("keeps Sivir self-protection distinct from Morgana's ally shield", () => {
        const enemy = [pick("unknown", ["pick"])];
        const sivir = reviewStrategyMechanics([pick("15")], enemy).checks[0];
        const morgana = reviewStrategyMechanics([pick("25")], enemy).checks[0];
        expect(sivir.fact).toContain("Sivir herself");
        expect(sivir.limit).toContain("allied peel");
        expect(morgana.fact).toContain("an ally");
        expect(morgana.limit).toContain("Not a physical-damage shield");
    });

    test("ball-delivery synergy requires another allied initiator, never an enemy or herself", () => {
        const orianna = pick("61", ["engage"]);
        const vi = pick("254", ["dive"]);
        expect(
            reviewStrategyMechanics([orianna], [vi]).checks.some(
                (c) => c.key === "61",
            ),
        ).toBe(false);
        const combo = reviewStrategyMechanics(
            [orianna, vi],
            [pick("unknown")],
        ).checks.find((c) => c.key === "61");
        expect(combo?.related.map((p) => p.key)).toEqual(["254"]);
        expect(combo?.trigger).toBe("ally");
    });

    test("missing opponent capability evidence does not invent a Soraka anti-poke claim", () => {
        expect(
            reviewStrategyMechanics([pick("16")], [pick("unknown")]).checks,
        ).toEqual([]);
        const check = reviewStrategyMechanics(
            [pick("16")],
            [pick("unknown", ["poke"])],
        ).checks[0];
        expect(check.requires).toContain("resources");
        expect(check.limit).toContain("No infinite sustain");
    });

    test("resolves actual shipped keys and keeps the draft inputs unchanged", () => {
        const knowledge = shippedKnowledge as RiftTheoryKnowledge;
        const make = (key: string, role: "jungle" | "support") => ({
            ...pick(key),
            role,
            possibleRoles: [role],
            knowledge: knowledge.champions.find((c) => c.riotKey === key),
        });
        const own = resolveStrategyPicks([make("254", "jungle")]).picks;
        const enemy = resolveStrategyPicks([make("40", "support")]).picks;
        const before = JSON.stringify([own, enemy]);
        expect(
            reviewStrategyMechanics(own, enemy).checks.map((c) => c.key),
        ).toEqual(["254", "40"]);
        expect(JSON.stringify([own, enemy])).toBe(before);
    });

    test("lantern and buff need an allied recipient, not a matching enemy or self", () => {
        for (const key of ["412", "267"]) {
            const holder = pick(key);
            const ally = {
                ...pick("recipient"),
                role: "bot" as const,
                roles: ["bot" as const],
            };
            const enemy = pick("opposition", ["engage"]);
            expect(reviewStrategyMechanics([holder], [enemy]).checks).toEqual(
                [],
            );
            const check = reviewStrategyMechanics([holder, ally], [enemy])
                .checks[0];
            expect(check.key).toBe(key);
            expect(check.trigger).toBe("ally");
            expect(check.related.map((p) => p.key)).toEqual(["recipient"]);
            const reverse = reviewStrategyMechanics([enemy], [holder, ally])
                .checks[0];
            expect(reverse.side).toBe("enemy");
            expect(reverse.related.map((p) => p.key)).toEqual(["recipient"]);
        }
    });

    test("lantern rescue needs an active click and a useful destination", () => {
        const check = reviewStrategyMechanics(
            [pick("412"), { ...pick("ally"), role: "bot", roles: ["bot"] }],
            [pick("enemy")],
        ).checks[0];
        expect(check.requires).toContain("reach and click");
        expect(check.requires).toContain("destination");
        expect(check.limit).toContain("Not an automatic rescue or a cleanse");
        expect(check.limit).toContain(
            "dash denial require separate verification",
        );
    });

    test("Alistar's control reservation is conditional on an evidenced entry threat", () => {
        expect(
            reviewStrategyMechanics([pick("12")], [pick("unknown")]).checks,
        ).toEqual([]);
        const check = reviewStrategyMechanics(
            [pick("12")],
            [pick("entry", ["dive"]), pick("poke", ["poke"])],
        ).checks[0];
        expect(check.related.map((p) => p.key)).toEqual(["entry"]);
        expect(check.requires).toContain("spell still available");
        expect(check.limit).toContain(
            "No guaranteed W-Q combo or interruption",
        );
    });

    test("Kindred's zone covers enemies too and does not grant damage or CC immunity", () => {
        const check = reviewStrategyMechanics([pick("203")], [pick("unknown")])
            .checks[0];
        expect(check.fact).toContain("including enemies");
        expect(check.requires).toContain("inside the zone");
        expect(check.answer).toContain("follow-up for its end");
        expect(check.limit).toContain(
            "damage immunity or crowd-control immunity",
        );
        expect(check.limit).toContain("objective interactions");
    });

    test("Nami's buff requires contact without inventing lane priority or a pairing", () => {
        const check = reviewStrategyMechanics(
            [pick("267"), { ...pick("ally"), role: "bot", roles: ["bot"] }],
            [pick("enemy")],
        ).checks[0];
        expect(check.requires).toContain("connect during the buff");
        expect(check.limit).toContain("No named lane pairing");
        expect(check.limit).toContain("lane priority");
    });

    test("new notes use shipped identities and remain separate from role evidence and ratings", () => {
        const knowledge = shippedKnowledge as RiftTheoryKnowledge;
        const make = (key: string, role: "support" | "jungle" | "bot") => ({
            ...pick(key),
            role,
            possibleRoles: [role],
            knowledge: knowledge.champions.find((c) => c.riotKey === key),
        });
        for (const key of ["412", "12", "203", "267"]) {
            const role = key === "203" ? "jungle" : "support";
            const own = resolveStrategyPicks([
                make(key, role),
                make("222", "bot"),
            ]).picks;
            const enemy = resolveStrategyPicks([make("254", "jungle")]).picks;
            const before = JSON.stringify([own, enemy]);
            const report = reviewStrategyMechanics(
                own,
                enemy,
                MECHANICS_DATA_VERSION,
            );
            const check = report.checks.find((c) => c.key === key)!;
            expect(check).toBeDefined();
            expect(check.holder.knowledge?.name).toBe(check.championId);
            expect(check.sourceUrl).toEndWith(`/${check.championId}.json`);
            expect(report.covered).toBe(2);
            expect(report.uncovered.map((p) => p.key)).toEqual(["222"]);
            expect(report).not.toHaveProperty("winrate");
            expect(JSON.stringify([own, enemy])).toBe(before);
        }
    });
});
