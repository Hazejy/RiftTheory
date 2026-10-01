import { expect, test } from "bun:test";
import { readStrategyDeck } from "./strategyDeckComparison";
import { reviewStrategy, type TeamStrategy } from "./strategyReview";

test("missing kit and coaching evidence stays unconfirmed", () => {
    const review = reviewStrategy([{
        key: "unknown", name: "Unknown", possibleRoles: ["mid", "top"],
    }], []);
    const deck = readStrategyDeck(review.blue);
    expect(deck.capabilities.every((tool) => tool.status === "unconfirmed")).toBe(true);
    expect(deck.damage).toContain("unconfirmed");
    expect(deck.resources).toContain("unconfirmed");
    expect(deck.flex).toContain("mid/top");
    expect(deck.enablers).toEqual([]);
});

test("only recorded actors support a capability or core plan", () => {
    const team: TeamStrategy = {
        ...reviewStrategy([], []).blue,
        picks: [
            { key: "a", name: "A", possibleRoles: ["top"], roles: ["top"], capabilities: ["engage", "frontline"] },
            { key: "b", name: "B", possibleRoles: ["mid"], roles: ["mid"], capabilities: ["poke"] },
        ],
        covered: 2,
        scenarios: 1,
        plans: [{ key: "entry", title: "Enter", champions: ["a"], win: "", requires: "", answer: "Deny the entry" }],
    };
    const deck = readStrategyDeck(team);
    expect(deck.enablers).toEqual(["A"]);
    expect(deck.unconnected).toEqual(["B"]);
    expect(deck.capabilities.find((tool) => tool.label === "Engage")?.champions).toEqual(["A"]);
    expect(deck.capabilities.find((tool) => tool.label === "Waveclear")?.status).toBe("unconfirmed");
    expect(deck.breaks).toBe("Deny the entry");
});
