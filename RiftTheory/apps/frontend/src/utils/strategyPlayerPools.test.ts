import { expect, test } from "bun:test";
import { resolveChampionNames } from "./strategyPlayerPools";

test("manual champion names resolve to dataset keys without inventing missing entries", () => {
    expect(resolveChampionNames("Ashe, 22, Unknown", [{ key: "22", name: "Ashe" }]))
        .toEqual({ keys: ["22"], unknown: ["Unknown"] });
});
