import { Role, ROLES } from "@draftgap/core/src/models/Role";

export type PrepSection = "board" | "rosters" | "pools" | "calendar";
export type PrepSide = "blue" | "either" | "red";
export type PrepPriority = "must" | "high" | "medium" | "idea";
export type PrepSlot =
    | `blue-ban-${0 | 1 | 2 | 3 | 4}`
    | `red-ban-${0 | 1 | 2 | 3 | 4}`
    | `blue-pick-${0 | 1 | 2 | 3 | 4}`
    | `red-pick-${0 | 1 | 2 | 3 | 4}`;

export type PrepScenario = {
    id: string;
    gameNumber: number;
    title: string;
    matchup: string;
    side: PrepSide;
    priority: PrepPriority;
    notes: string;
    selections: Partial<Record<PrepSlot, string>>;
};

export type PrepPoolCategory = {
    id: string;
    label: string;
};
export type PrepPlayer = {
    id: string;
    name: string;
    role: Role;
    pools: Record<string, string[]>;
};

export type PrepBooking = {
    id: string;
    title: string;
    opponent: string;
    date: string;
    time: string;
};

export type PrepDocument = {
    scenarios: PrepScenario[];
    players: PrepPlayer[];
    poolCategories: PrepPoolCategory[];
    availability: Record<string, "available" | "unavailable">;
    bookings: PrepBooking[];
};

export const PREP_STORAGE_KEY = "rifttheory.draft-prep.workspace.v1";
const LEGACY_SCENARIO_KEY = "rifttheory.draft-prep.scenarios.v2";

export const DEFAULT_POOL_CATEGORIES: readonly PrepPoolCategory[] = [
    { id: "comfort", label: "Comfort" },
    { id: "engage", label: "Engage" },
    { id: "pocket", label: "Pocket picks" },
];

export function createPrepScenario(
    gameNumber: number,
    index: number,
): PrepScenario {
    return {
        id: crypto.randomUUID(),
        gameNumber,
        title: `Scenario ${index + 1}`,
        matchup: "",
        side: "either",
        priority: "medium",
        notes: "",
        selections: {},
    };
}

export function createPrepPlayer(role: Role, name = ""): PrepPlayer {
    return {
        id: crypto.randomUUID(),
        name,
        role,
        pools: Object.fromEntries(
            DEFAULT_POOL_CATEGORIES.map((category) => [category.id, []]),
        ),
    };
}

export function emptyPrepDocument(): PrepDocument {
    return {
        scenarios: [],
        players: ROLES.map((role) => createPrepPlayer(role)),
        poolCategories: DEFAULT_POOL_CATEGORIES.map((category) => ({
            ...category,
        })),
        availability: {},
        bookings: [],
    };
}

export function loadPrepDocument(): PrepDocument {
    try {
        const value = JSON.parse(
            localStorage.getItem(PREP_STORAGE_KEY) ?? "null",
        );
        if (
            value &&
            typeof value === "object" &&
            Array.isArray(value.scenarios) &&
            Array.isArray(value.players) &&
            value.availability &&
            Array.isArray(value.bookings)
        ) {
            return {
                ...(value as PrepDocument),
                poolCategories: Array.isArray(value.poolCategories)
                    ? value.poolCategories
                    : DEFAULT_POOL_CATEGORIES.map((category) => ({
                          ...category,
                      })),
            };
        }

        const legacy = JSON.parse(
            localStorage.getItem(LEGACY_SCENARIO_KEY) ?? "[]",
        );
        if (!Array.isArray(legacy)) return emptyPrepDocument();
        return {
            ...emptyPrepDocument(),
            scenarios: legacy.map((scenario, index) => ({
                ...createPrepScenario(1, index),
                id:
                    typeof scenario.id === "string"
                        ? scenario.id
                        : crypto.randomUUID(),
                title:
                    typeof scenario.title === "string"
                        ? scenario.title
                        : `Scenario ${index + 1}`,
                matchup:
                    typeof scenario.matchup === "string"
                        ? scenario.matchup
                        : "",
                side: ["blue", "either", "red"].includes(scenario.side)
                    ? scenario.side
                    : "either",
                priority: ["must", "high", "medium", "idea"].includes(
                    scenario.priority,
                )
                    ? scenario.priority
                    : "medium",
                notes: [scenario.picks, scenario.bans, scenario.notes]
                    .filter((entry) => typeof entry === "string" && entry)
                    .join(" · "),
            })),
        };
    } catch {
        return emptyPrepDocument();
    }
}

export function copyPrepDocument(document: PrepDocument): PrepDocument {
    const poolCategories = Array.isArray(document.poolCategories)
        ? document.poolCategories
        : DEFAULT_POOL_CATEGORIES;

    return {
        scenarios: document.scenarios.map((scenario) => ({
            ...scenario,
            selections: { ...scenario.selections },
        })),
        players: document.players.map((player) => ({
            ...player,
            pools: Object.fromEntries(
                poolCategories.map((category) => [
                    category.id,
                    Array.isArray(player.pools?.[category.id])
                        ? [...player.pools[category.id]]
                        : [],
                ]),
            ),
        })),
        poolCategories: poolCategories.map((category) => ({
            ...category,
        })),
        availability: { ...document.availability },
        bookings: document.bookings.map((booking) => ({ ...booking })),
    };
}
