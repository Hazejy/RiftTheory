import type { TeamStrategy } from "./strategyReview";

const CAPABILITY_ROWS = [
    ["Engage", ["engage"]],
    ["Follow-up", ["dive", "zone_control"]],
    ["Peel", ["peel", "anti_dive"]],
    ["Disengage", ["peel", "anti_dive"]],
    ["Poke", ["poke"]],
    ["Siege", ["siege"]],
    ["Catch", ["pick"]],
    ["Frontline", ["frontline"]],
    ["Waveclear", ["wave_clear"]],
    ["Side lane", ["side_lane_pressure"]],
    ["Terrain control", ["zone_control"]],
    ["Target access", ["dive", "pick", "engage"]],
] as const;

export type DeckCapability = {
    label: string;
    champions: string[];
    status: "recorded" | "unconfirmed";
};

export type DeckRead = {
    plan: string;
    enablers: string[];
    unconnected: string[];
    capabilities: DeckCapability[];
    damage: string;
    resources: string;
    timing: string;
    flex: string;
    next: string;
    breaks: string;
    kitCoverage: string;
    coachingCoverage: string;
};

const list = (names: string[]) => names.join(", ") || "Unconfirmed";

export function readStrategyDeck(team: TeamStrategy): DeckRead {
    const main = team.plans[0];
    const enablerKeys = new Set(main?.champions ?? []);
    const coached = team.picks.filter((pick) => pick.coaching);
    const damage = coached.filter((pick) => pick.coaching?.damage_focus !== "utility");
    const focus = (value: string) =>
        damage.filter((pick) => pick.coaching?.damage_focus === value).map((pick) => pick.name);
    const highIncome = coached.filter((pick) => pick.coaching?.resource_demand === "high");
    const early = coached.filter((pick) => ["early", "early_mid"].includes(pick.coaching!.power_curve));
    const late = coached.filter((pick) => ["mid_late", "late"].includes(pick.coaching!.power_curve));
    const flex = team.picks.filter((pick) => pick.roles.length > 1);

    return {
        plan: main?.title ?? "No supported core plan yet",
        enablers: team.picks.filter((pick) => enablerKeys.has(pick.key)).map((pick) => pick.name),
        unconnected: main
            ? team.picks.filter((pick) => !enablerKeys.has(pick.key)).map((pick) => pick.name)
            : team.picks.map((pick) => pick.name),
        capabilities: CAPABILITY_ROWS.map(([label, tags]) => {
            const champions = team.picks
                .filter((pick) => pick.capabilities.some((tag) => (tags as readonly string[]).includes(tag)))
                .map((pick) => pick.name);
            return { label, champions, status: champions.length ? "recorded" : "unconfirmed" };
        }),
        damage: damage.length
            ? `Physical: ${list(focus("physical"))}; magic: ${list(focus("magic"))}; mixed: ${list(focus("mixed"))}; build dependent: ${list(focus("build_dependent"))}. ${damage.length}/${team.picks.length} recorded damage sources.`
            : "Damage sources unconfirmed in the available role profiles.",
        resources: coached.length
            ? `High income: ${list(highIncome.map((pick) => pick.name))}. ${coached.length}/${team.picks.length} resource profiles covered.`
            : "Resource demand unconfirmed.",
        timing: coached.length
            ? `Early: ${list(early.map((pick) => pick.name))}; later: ${list(late.map((pick) => pick.name))}. Shared item and ultimate windows require game context.`
            : "Power windows unconfirmed.",
        flex: flex.length
            ? `${flex.map((pick) => `${pick.name} (${pick.roles.join("/")})`).join(", ")}. Role-specific timing withheld until assigned.`
            : `${team.scenarios} feasible role assignment${team.scenarios === 1 ? "" : "s"}; no unresolved role flex.`,
        next: team.needs[0]?.title ?? "No specific missing tool established; verify matchup and execution.",
        breaks: main?.answer ?? "No supported core plan to stress yet.",
        kitCoverage: `${team.covered}/${team.picks.length}`,
        coachingCoverage: `${coached.length}/${team.picks.length}`,
    };
}
