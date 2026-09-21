import type { ResolvedPick } from "./strategyReview";

// Kit facts are paraphrased from Riot's versioned Data Dragon descriptions.
// Draft implications are editorial questions, NOT verified spell-vs-spell tests.
export const MECHANICS_DATA_VERSION = "16.18.1";
export const MECHANICS_REVIEW_DATE = "2026-09-20";

type MechanicProfile = {
    key: string;
    championId: string;
    ability: string;
    title: string;
    fact: string;
    implication: string;
    requires: string;
    answer: string;
    limit: string;
    trigger: "opponent" | "ally";
    capabilities: readonly string[];
};

export const MECHANIC_PROFILES: readonly MechanicProfile[] = [
    {
        key: "254",
        championId: "Vi",
        ability: "R · Cease and Desist",
        title: "Reaching the target is only the first step",
        fact: "Vi pursues one enemy and knocks the target airborne on arrival.",
        implication:
            "Identify who can damage that target when Vi arrives. Access alone does not supply the follow-up or an exit.",
        requires:
            "A usable target, R available and allies able to follow from their actual positions.",
        answer: "Separate Vi from the damage behind her; keep a defensive response for the arrival rather than spending everything on the approach.",
        limit: "This description does not establish which defensive spell cancels her R. No such cancellation is assumed.",
        trigger: "opponent",
        capabilities: [],
    },
    {
        key: "78",
        championId: "Poppy",
        ability: "W · Steadfast Presence",
        title: "Check the entry spell, not just the engage label",
        fact: "Poppy's active W stops nearby enemy dashes; an enemy whose dash is stopped is slowed and grounded.",
        implication:
            "An entry-heavy opponent must check whether its approach actually relies on a dash that W can stop.",
        requires:
            "W available, Poppy covering the threatened approach and a susceptible dash entering her area.",
        answer: "Bait W before committing, create a second angle, or use an entry that does not depend on a stoppable dash.",
        limit: "Engage and dive tags do not prove dash vulnerability. Blinks and unstoppable interactions require separate verification; this is not a claim that W stops Vi R.",
        trigger: "opponent",
        capabilities: ["engage", "dive"],
    },
    {
        key: "25",
        championId: "Morgana",
        ability: "E · Black Shield",
        title: "Protect one target — not the whole formation",
        fact: "Black Shield protects an ally against magic damage and disabling effects while the barrier holds.",
        implication:
            "Choose whose freedom to act matters most. Saving one target can leave another entry point unprotected.",
        requires:
            "Shield available on the intended target before the disabling effect, with the barrier still intact.",
        answer: "Pressure a different target or threaten the shield with magic damage before the decisive control spell.",
        limit: "Not a physical-damage shield or a team-wide immunity. Exact effect ordering and special ability exceptions are not simulated.",
        trigger: "opponent",
        capabilities: ["engage", "dive", "pick"],
    },
    {
        key: "15",
        championId: "Sivir",
        ability: "E · Spell Shield",
        title: "Self-protection is not team protection",
        fact: "Spell Shield can block a single enemy ability affecting Sivir herself.",
        implication:
            "Sivir has a personal defensive layer, but the other four champions still need an answer to the enemy's threat.",
        requires:
            "E available and timed for the relevant ability, rather than consumed by a different spell.",
        answer: "Threaten multiple spells or another champion instead of treating one protected target as the only possible entry.",
        limit: "Do not count this as allied peel. Specific multi-hit, area and persistent-spell interactions are not established by this description.",
        trigger: "opponent",
        capabilities: ["engage", "dive", "pick", "poke"],
    },
    {
        key: "40",
        championId: "Janna",
        ability: "R · Monsoon",
        title: "Preserve the reset for the committed fight",
        fact: "Monsoon pushes enemies away from Janna, then heals nearby allies while active.",
        implication:
            "Her team can plan around separating an entry from its follow-up, provided the carry and Janna remain in a useful formation.",
        requires:
            "R available, Janna positioned to affect the fight and room for allies to use the separation and healing.",
        answer: "Force the reset first, approach from more than one direction, or threaten Janna's position before committing everything.",
        limit: "A displacement tool does not prove it interrupts every dash or ultimate. Healing is not an unconditional reset of all damage.",
        trigger: "opponent",
        capabilities: ["engage", "dive"],
    },
    {
        key: "16",
        championId: "Soraka",
        ability: "Q · Starcall / W · Astral Infusion",
        title: "Sustain has a resource and positioning cost",
        fact: "W spends Soraka's health to heal an ally; hitting an enemy champion with Q restores her own health.",
        implication:
            "Repeated poke may be recoverable, but only if Soraka can maintain her resources without taking an unsafe position.",
        requires:
            "Enough resources, access to the ally who needs healing and a safe way to maintain Soraka's own health.",
        answer: "Deny safe Q contact, pressure Soraka herself, or convert damage into a committed fight before repeated healing can matter.",
        limit: "No infinite sustain is assumed. Items, heal reduction, exact costs and current health are not supplied by a draft alone.",
        trigger: "opponent",
        capabilities: ["poke", "siege"],
    },
    {
        key: "34",
        championId: "Anivia",
        ability: "W · Crystallize / R · Glacial Storm",
        title: "Make the opponent enter the controlled area",
        fact: "Anivia creates a temporary ice wall; her storm damages and slows enemies in its area.",
        implication:
            "Set up the approach before the fight. A zone has less value if the opponent can fight elsewhere or attack without entering it.",
        requires:
            "Usable terrain, spells and mana available, plus allied positioning that benefits from the controlled approach.",
        answer: "Change the route or angle, threaten from outside the zone, or make Anivia reposition before the commitment.",
        limit: "A wall is not a universal answer to mobility. Wave-clear capability alone does not prove that Anivia can safely reach the wave.",
        trigger: "opponent",
        capabilities: ["engage", "dive", "side_lane_pressure"],
    },
    {
        key: "61",
        championId: "Orianna",
        ability: "E · Command: Protect / R · Command: Shockwave",
        title: "Check ball delivery before calling it a combo",
        fact: "Orianna can attach her Ball to an ally; Shockwave affects enemies near the Ball after a delay.",
        implication:
            "An allied initiator can be a delivery option, but only if the Ball and follow-up are in the right place when the entry happens.",
        requires:
            "Ball attached or positioned correctly, an effective delivery path and valid spell/tether range at the moment of use.",
        answer: "Track the Ball and spread or disengage from its landing area; challenge the carrier before both parts of the play connect.",
        limit: "A dive tag does not prove a reliable combo. Tether distances, travel time and live positions are not simulated.",
        trigger: "ally",
        capabilities: ["engage", "dive"],
    },
    {
        key: "412",
        championId: "Thresh",
        ability: "W · Dark Passage",
        title: "Plan the lantern destination before the rescue",
        fact: "Thresh's lantern shields nearby allies; an ally can click it to dash to Thresh.",
        implication:
            "Keep a usable retreat position for the teammate who may need the lantern. Moving Thresh into the fight changes where that teammate would arrive.",
        requires:
            "W available, the ally able to reach and click the lantern, and Thresh at a useful destination when it is used.",
        answer: "Pressure Thresh's destination or force him to reposition before committing to the isolated teammate.",
        limit: "Not an automatic rescue or a cleanse. Cast range, click access under crowd control, and interactions with dash denial require separate verification.",
        trigger: "ally",
        capabilities: [],
    },
    {
        key: "12",
        championId: "Alistar",
        ability: "Q · Pulverize / W · Headbutt",
        title: "Choose between starting the fight and guarding the carry",
        fact: "Pulverize knocks nearby enemies airborne; Headbutt knocks its target back.",
        implication:
            "Using these tools to initiate spends the same cooldowns that could protect an ally. Decide which job matters before Alistar commits.",
        requires:
            "The needed spell still available, Alistar close enough to affect the threat, and a displacement direction that helps his team.",
        answer: "Draw out his control spells or pull him away from the carry, then assess whether a second entry has an opening.",
        limit: "No guaranteed W-Q combo or interruption of a particular dash is inferred. A knockback can also move a target away from allied damage.",
        trigger: "opponent",
        capabilities: ["engage", "dive"],
    },
    {
        key: "203",
        championId: "Kindred",
        ability: "R · Lamb's Respite",
        title: "Plan for both teams surviving the zone",
        fact: "While the zone lasts, units inside cannot die, including enemies; units inside are healed when it ends.",
        implication:
            "The zone buys time for either team. Coordinate who benefits from staying inside and what happens when its protection ends.",
        requires:
            "R cast before the threatened death, the intended beneficiaries inside the zone, and allies ready for its end.",
        answer: "Account for your own team benefiting inside the zone; preserve a follow-up for its end or pressure targets outside it.",
        limit: "Not allied-only protection, damage immunity or crowd-control immunity. Exact health thresholds, objective interactions and spell-specific exceptions are not modeled.",
        trigger: "opponent",
        capabilities: [],
    },
    {
        key: "267",
        championId: "Nami",
        ability: "E · Tidecaller's Blessing",
        title: "Time the buff for an ally who can actually connect",
        fact: "Nami briefly empowers an ally's attacks and spells with extra magic damage and a slow.",
        implication:
            "Coordinate the buff with the intended recipient's next opportunity to hit. A teammate who cannot reach a target cannot be assumed to convert it into pressure.",
        requires:
            "E available, a valid allied recipient in cast range, and an attack or spell that can connect during the buff.",
        answer: "Deny the empowered ally a useful hit during the window, or make Nami spend the buff before the planned exchange.",
        limit: "No named lane pairing, guaranteed trade win or lane priority follows from this buff alone. Proc counts and multi-hit spell interactions require separate verification.",
        trigger: "ally",
        capabilities: [],
    },
];

export type MechanicCheck = MechanicProfile & {
    holder: ResolvedPick;
    side: "own" | "enemy";
    related: ResolvedPick[];
    sourceUrl: string;
};

export function reviewStrategyMechanics(
    own: ResolvedPick[],
    enemy: ResolvedPick[],
    dataVersion?: string,
) {
    const all = [...own, ...enemy];
    const valid =
        all.every((p) => p.roles.length > 0) &&
        new Set(all.map((p) => p.key)).size === all.length;
    const profiles = new Map(MECHANIC_PROFILES.map((p) => [p.key, p]));
    const checks: MechanicCheck[] = [];
    if (valid && own.length && enemy.length) {
        for (const [team, opposition, side] of [
            [own, enemy, "own"],
            [enemy, own, "enemy"],
        ] as const) {
            for (const holder of team) {
                const profile = profiles.get(holder.key);
                if (!profile) continue;
                const related = (
                    profile.trigger === "ally" ? team : opposition
                ).filter(
                    (p) =>
                        p.key !== holder.key &&
                        (!profile.capabilities.length ||
                            p.capabilities.some((c) =>
                                profile.capabilities.includes(c),
                            )),
                );
                if (!related.length) continue;
                checks.push({
                    ...profile,
                    holder,
                    side,
                    related,
                    sourceUrl: `https://ddragon.leagueoflegends.com/cdn/${MECHANICS_DATA_VERSION}/data/en_US/champion/${profile.championId}.json`,
                });
            }
        }
    }
    return {
        checks,
        valid,
        // Missing does not mean weak. These kits have not been reviewed here.
        uncovered: all.filter((p) => !profiles.has(p.key)),
        covered: all.filter((p) => profiles.has(p.key)).length,
        total: all.length,
        // Compare the exact source version, never silently relabel old evidence.
        sameVersion: dataVersion === MECHANICS_DATA_VERSION,
    };
}
