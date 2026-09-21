import type {
    KnowledgeChampion,
    KnowledgeCoachingProfile,
} from "../types/RiftTheoryKnowledge";
import { effectiveColorEvidence } from "./colorEvidence";

export const STRATEGY_ROLES = [
    "top",
    "jungle",
    "mid",
    "bot",
    "support",
] as const;
export type StrategyRole = (typeof STRATEGY_ROLES)[number];
export type StrategyPick = {
    key: string;
    name: string;
    role?: StrategyRole;
    possibleRoles: StrategyRole[];
    knowledge?: KnowledgeChampion;
};
export type ResolvedPick = StrategyPick & {
    roles: StrategyRole[];
    capabilities: string[];
    coaching?: KnowledgeCoachingProfile;
};
export type StrategyClaim = {
    id: string;
    title: string;
    detail: string;
    champions: string[];
    requires: string;
    answer: string;
    kind: "interaction" | "risk" | "timing";
};
export type StrategyNeed = {
    key: string;
    title: string;
    why: string;
    capabilities: string[];
};
export type TeamStrategy = {
    picks: ResolvedPick[];
    scenarios: number;
    plans: {
        key: string;
        title: string;
        champions: string[];
        win: string;
        requires: string;
        answer: string;
    }[];
    claims: StrategyClaim[];
    needs: StrategyNeed[];
    timeline: { phase: string; action: string; check: string }[];
    objective: string;
    execution: string;
    unknowns: string[];
    covered: number;
};
export type StrategyReview = {
    blue: TeamStrategy;
    red: TeamStrategy;
    title: string;
    detail: string;
    complete: boolean;
};

const usable = (value: { review_status: string }) =>
    !["deprecated", "outdated", "rejected"].includes(value.review_status);
const unique = <T>(values: T[]) => [...new Set(values)];
const names = (picks: { name: string }[]) =>
    picks.map((p) => p.name).join(", ");

// At most 5! assignments; never merge incompatible role profiles into one kit.
export function roleScenarios(picks: StrategyPick[]): StrategyRole[][] {
    if (
        picks.length > 5 ||
        new Set(picks.map((p) => p.key)).size !== picks.length
    )
        return [];
    const result: StrategyRole[][] = [];
    const visit = (roles: StrategyRole[]) => {
        if (roles.length === picks.length) {
            result.push(roles);
            return;
        }
        const pick = picks[roles.length];
        for (const role of pick.role
            ? [pick.role]
            : unique(pick.possibleRoles)) {
            if (!STRATEGY_ROLES.includes(role)) continue;
            if (!roles.includes(role)) visit([...roles, role]);
        }
    };
    visit([]);
    return result;
}

export function resolveStrategyPicks(picks: StrategyPick[]) {
    const scenarios = roleScenarios(picks);
    return {
        scenarios: scenarios.length,
        picks: picks.map<ResolvedPick>((pick, index) => {
            const roles = unique(scenarios.map((s) => s[index]));
            const sets = roles.map((role) =>
                (pick.knowledge?.capabilities ?? [])
                    .filter(
                        (c) =>
                            c.role === role &&
                            usable(c) &&
                            Number.isFinite(c.strength) &&
                            c.strength > 0,
                    )
                    .map((c) => c.capability),
            );
            const capabilities = unique(sets[0] ?? []).filter((c) =>
                sets.every((set) => set.includes(c)),
            );
            return {
                ...pick,
                roles,
                capabilities,
                // Timings/resources remain unknown until a role is resolved.
                coaching:
                    roles.length === 1
                        ? pick.knowledge?.coachingProfiles?.find(
                              (c) => c.role === roles[0] && usable(c),
                          )
                        : undefined,
            };
        }),
    };
}

const providers = (picks: ResolvedPick[], ...keys: string[]) =>
    picks.filter((p) => p.capabilities.some((c) => keys.includes(c)));
const curve = (picks: ResolvedPick[], values: string[]) =>
    picks.filter((p) => p.coaching && values.includes(p.coaching.power_curve));

function readTeam(
    picks: ResolvedPick[],
    enemy: ResolvedPick[],
    scenarios: number,
): TeamStrategy {
    const get = (...keys: string[]) => providers(picks, ...keys);
    const against = (...keys: string[]) => providers(enemy, ...keys);
    const engage = get("engage"),
        dive = get("dive"),
        poke = get("poke");
    // A disengage tag may mean only self-escape (for example Ezreal).
    // Ally protection needs explicit peel/anti-dive evidence.
    const peel = get("peel", "anti_dive"),
        wave = get("wave_clear");
    const front = get("frontline"),
        pickers = get("pick"),
        side = get("side_lane_pressure");
    const enemyPeel = against("peel", "anti_dive");
    const enemyAccess = against("engage", "dive", "pick");
    const enemyPoke = against("poke"),
        enemySustain = against("sustain");
    const late = curve(picks, ["late", "mid_late"]),
        early = curve(picks, ["early", "early_mid"]);
    const enemyLate = curve(enemy, ["late", "mid_late"]);
    const groupTools = get("wave_clear", "peel", "anti_dive");
    const sideLeader = side.find((p) =>
        groupTools.some((holder) => holder.key !== p.key),
    );
    const holders = sideLeader
        ? groupTools.filter((p) => p.key !== sideLeader.key)
        : [];
    const carries = picks.filter(
        (p) =>
            p.coaching &&
            p.coaching.damage_focus !== "utility" &&
            p.coaching.resource_demand === "high",
    );
    const plans: TeamStrategy["plans"] = [];
    const addPlan = (
        key: string,
        title: string,
        actors: ResolvedPick[],
        win: string,
        requires: string,
        answer: string,
    ) =>
        plans.push({
            key,
            title,
            champions: unique(actors.map((p) => p.key)),
            win,
            requires,
            answer,
        });
    if (
        dive.length &&
        unique([...dive, ...engage].map((p) => p.key)).length >= 2
    )
        addPlan(
            "dive",
            "Reach the backline together",
            [...dive, ...engage],
            `${names(dive)} can threaten a carry; ${names(engage.length ? engage : dive)} must coordinate the entry. Win the same target before the enemy trades onto your backline.`,
            "A usable entry angle, damage in follow-up range and a shared target. Target access alone does not guarantee a kill.",
            enemyPeel.length
                ? `${names(enemyPeel)} can preserve defensive cooldowns for the follow-up. Draw out protection before committing the whole team.`
                : "The opponent can deny flanks, spread the formation and trade onto the unprotected backline.",
        );
    if (
        poke.length >= 2 &&
        (wave.length || get("siege", "zone_control").length)
    )
        addPlan(
            "poke",
            "Make them arrive already damaged",
            poke,
            `${names(poke)} can threaten repeated damage before contact. Prepare waves${wave.length ? ` with ${names(wave)}` : ""} to make time for the setup. Convert a retreat into space or a structure.`,
            "First access to the area, mana, vision on engage angles and repeated safe casts. Waveclear does not automatically mean lane priority.",
            enemySustain.length
                ? `${names(enemySustain)} may erase chip damage if healing is available. Force a meaningful concession before they reset.`
                : `${names(enemyAccess) || "The enemy"} can contest the first move and force contact before repeated poke lands.`,
        );
    if (front.length && peel.length && carries.length)
        addPlan(
            "front",
            "Keep damage alive through first contact",
            [...front, ...peel, ...carries],
            `${names(front)} can anchor the formation; ${names(peel)} should protect ${names(carries)} so they can damage the nearest safe target.`,
            "The carry has enough damage at the intended item breakpoint and stays within protection range. Tank count alone does not establish sustained damage.",
            `${names(enemyPoke.length ? enemyPoke : enemyAccess) || "The opponent"} can attack the setup or a second angle instead of fighting straight through the formation.`,
        );
    if (pickers.length)
        addPlan(
            "pick",
            "Create a catch, then take the map",
            pickers,
            `${names(pickers)} can threaten an isolated rotation. Use the temporary numbers advantage for the next available objective or wave.`,
            "A reason for the opponent to move, denied vision and enough nearby damage to finish the catch.",
            "The opponent can escort rotations, use another entrance and keep waves aligned; a catch plan must still work against informed movement.",
        );
    if (sideLeader && holders.length)
        addPlan(
            "split",
            "Pull the map apart",
            [sideLeader, ...holders],
            `${sideLeader.name} can pressure a side wave while ${names(holders)} can help the group hold space. Act when a defender shows.`,
            "A favorable side matchup, escape information and synchronized waves. Side-lane capability alone does not establish a winning duel.",
            `${names(enemyAccess) || "The opponent"} can force on the group before the side wave becomes a real threat.`,
        );
    if (peel.length && enemyAccess.length)
        addPlan(
            "disengage",
            "Punish the first commitment",
            peel,
            `${names(peel)} should preserve defensive tools for ${names(enemyAccess)}. Turn after the entry is spent and your damage dealers can safely follow.`,
            "Defensive spells available, carries in range and enough damage to punish the failed entry.",
            "The opponent can bait protection, pause the engage and re-enter from another angle. Defensive tools have competing jobs.",
        );
    const claims: StrategyClaim[] = [];
    const claim = (
        id: string,
        title: string,
        actors: ResolvedPick[],
        targets: ResolvedPick[],
        detail: string,
        requires: string,
        answer: string,
        kind: StrategyClaim["kind"] = "interaction",
    ) => {
        claims.push({
            id,
            title,
            detail,
            requires,
            answer,
            kind,
            champions: unique([...actors, ...targets].map((p) => p.key)),
        });
    };
    if (engage.length && enemyPeel.length)
        claim(
            "entry-protection",
            "Access is only the first half of the fight",
            engage,
            enemyPeel,
            `${names(engage)} can start contact, but protection from ${names(enemyPeel)} can separate entry from follow-up.`,
            "Identify the actual defensive spell and its legal targets; an anti-dive tag does not prove it cancels every dash or ultimate.",
            "Threaten one angle to draw protection, then use a second timing. Defenders should protect the carry instead of chasing the initiator.",
        );
    if (poke.length && enemySustain.length)
        claim(
            "poke-sustain",
            "Chip damage needs a conversion window",
            poke,
            enemySustain,
            `Poke from ${names(poke)} needs to persist; sustain from ${names(enemySustain)} may reduce that pressure.`,
            "Check whether the sustain reaches the threatened target and has enough health, mana and cooldowns. Self-healing is not team healing.",
            "Pressure multiple targets or force movement before recovery. The defending team can reset behind waveclear.",
        );
    if (enemyPoke.length && !dive.length && !engage.length && !pickers.length)
        claim(
            "unproven-access",
            "Who makes the ranged threat commit?",
            picks,
            enemyPoke,
            `${names(enemyPoke)} can threaten a setup; the selected role profiles do not yet establish a direct entry route for this team.`,
            "Effective spell reach, terrain and available cooldowns must be checked. Missing access evidence is not proof that access is impossible.",
            "Look for a flank, a catch on a rotation or a pick that supplies reliable access. Avoid a repeated front-door approach.",
            "risk",
        );
    if (late.length && enemyAccess.length)
        claim(
            "scaling-access",
            "Later items still need time to deal damage",
            late,
            enemyAccess,
            `Later power windows are recorded for ${names(late)}, while ${names(enemyAccess)} can threaten the space needed to use them.`,
            "Farm is accessible, protection survives the first rotation and damage reaches a useful target.",
            `${names(enemyAccess)} can attack setup before the formation is established; the scaling team should preserve escape and protection tools.`,
            "timing",
        );
    if (early.length && late.length)
        claim(
            "mixed-timing",
            "Use the early window to fund the later one",
            [...early, ...late],
            [],
            `${names(early)} and ${names(late)} have different recorded power windows. This can be a bridge, but requires a shared resource plan.`,
            "Fight only when the early champion's move also preserves the later carry's farm or next purchase.",
            "The opponent can force repeated skirmishes that delay the carry, or concede low-value action while reaching its own spike.",
            "timing",
        );
    if (carries.length >= 3)
        claim(
            "income",
            "Several champions want the next wave",
            carries,
            [],
            `${names(carries)} all have high recorded resource demand. Assign spare waves and camps by the next useful breakpoint.`,
            "Enough safe income exists on the map; three high-income profiles are a planning pressure, not automatic anti-synergy.",
            "The opponent can deny one side of the map and make those income demands compete.",
            "risk",
        );
    const damage = picks.filter(
        (p) =>
            p.coaching &&
            ["physical", "magic"].includes(p.coaching.damage_focus),
    );
    for (const focus of ["physical", "magic"] as const) {
        const matching = damage.filter(
            (p) => p.coaching?.damage_focus === focus,
        );
        if (
            matching.length >= 3 &&
            picks.every((p) => p.coaching) &&
            picks
                .filter((p) => p.coaching?.damage_focus !== "utility")
                .every((p) => p.coaching?.damage_focus === focus)
        )
            claim(
                `damage-${focus}`,
                `Several recorded sources lean ${focus}`,
                matching,
                enemy,
                `${names(matching)} share a ${focus} damage focus. This can make one resistance purchase useful against several threats.`,
                "Check actual builds, penetration, true damage and unassessed teammates before calling the composition one-dimensional.",
                "Add another relevant damage source or exploit a timing before resistance items arrive.",
                "risk",
            );
    }
    const needs: StrategyNeed[] = [];
    const need = (
        key: string,
        title: string,
        why: string,
        capabilities: string[],
    ) => needs.push({ key, title, why, capabilities });
    if (enemyAccess.length && !peel.length)
        need(
            "protect",
            "A way to survive the first entry",
            `${names(enemyAccess)} can threaten a commitment; protection is not established in the current profiles.`,
            ["peel", "anti_dive"],
        );
    if (enemyPoke.length && !engage.length && !dive.length && !pickers.length)
        need(
            "reach",
            "A route into the ranged setup",
            `${names(enemyPoke)} can benefit from repeated safe casts. Test an entry or catch mechanism.`,
            ["engage", "dive", "pick"],
        );
    if (picks.length && !wave.length)
        need(
            "wave",
            "A reliable way to prepare waves",
            "No current role profile establishes waveclear; confirm it before committing to an objective setup.",
            ["wave_clear"],
        );
    if (
        engage.length &&
        !get("zone_control", "dive").some((p) =>
            engage.some((initiator) => initiator.key !== p.key),
        )
    )
        need(
            "follow",
            "Follow-up that arrives with the engage",
            `${names(engage)} can start the play. Check who contributes while the target is controlled.`,
            ["dive", "zone_control"],
        );
    if (side.length && !holders.length)
        need(
            "hold",
            "A group that can refuse the fight",
            `Side pressure from ${names(side)} needs time. The other players must avoid forced contact.`,
            ["wave_clear", "peel", "anti_dive"],
        );
    const covered = picks.filter((p) => p.capabilities.length).length;
    const unknowns: string[] = [];
    if (!scenarios && picks.length)
        unknowns.push(
            "No legal role assignment fits these picks. Assign roles explicitly or check the role sample filter.",
        );
    if (picks.some((p) => p.roles.length > 1))
        unknowns.push(
            "Roles are still flexible. Only capabilities shared across every feasible role are used; timing profiles wait for a resolved role.",
        );
    const missing = picks.filter((p) => !p.capabilities.length);
    if (missing.length)
        unknowns.push(
            `Role-specific capabilities unresolved: ${names(missing)}.`,
        );
    const missingCoaching = picks.filter((p) => !p.coaching);
    if (missingCoaching.length)
        unknowns.push(
            `Timing, resources or execution profiles unavailable for: ${names(missingCoaching)}.`,
        );
    if (
        picks.some((p) =>
            p.knowledge?.capabilities.some(
                (c) =>
                    p.roles.includes(c.role as StrategyRole) &&
                    (c.patch_version === "unknown" ||
                        c.review_status !== "reviewed"),
            ),
        )
    )
        unknowns.push(
            "Some capability profiles are provisional or have no reviewed patch; these plans are hypotheses to check.",
        );
    const demanding = picks.filter(
        (p) => (p.coaching?.execution_demand ?? 0) >= 4,
    );
    const plan = plans[0];
    return {
        picks,
        scenarios,
        plans,
        claims,
        needs,
        unknowns,
        covered,
        execution: demanding.length
            ? `Demanding execution is recorded for ${names(demanding)}. Agree the entry signal and fallback before taking a high-commitment fight.`
            : picks.every((p) => p.coaching) && picks.length
              ? "No selected profile marks high mechanical demand. Shared target selection, vision and cooldown timing still determine whether the plan works."
              : "Execution difficulty is not fully assessed. Champion familiarity and coordination still need a team-specific check.",
        objective: poke.length
            ? `Occupy the area before the opponent to give ${names(poke)} time. Prepare the nearest waves, cover flank entrances and spend poke for a health advantage before starting an objective.`
            : engage.length
              ? `${names(engage)} can threaten the approach. Prepare waves, deny one route and decide whether to turn on the opponent or finish the objective before starting it.`
              : side.length
                ? `${names(side)} should align side pressure with the objective wave. The group holds a safe position until a defender is shown.`
                : "Objective control is not established yet. Resolve the wave, entry and damage assignments before assuming the team can start safely.",
        timeline: [
            {
                phase: "Early game",
                action: early.length
                    ? `An early window is recorded for ${names(early)}. Use it where the neighboring lane can actually move.`
                    : late.length
                      ? `Preserve safe income for ${names(late)} while checking which early objectives can be contested.`
                      : "Establish lane matchups and first-move conditions before choosing an early route.",
                check: "Priority is unassessed: waves, lane opponents, runes, levels and jungle position can change who moves first.",
            },
            {
                phase: "Mid game",
                action:
                    plan?.win ??
                    "Complete a shared fighting or map-pressure plan before committing all five players.",
                check:
                    picks
                        .flatMap(
                            (p) =>
                                p.coaching?.spike_notes
                                    .slice(0, 1)
                                    .map((note) => `${p.name}: ${note}`) ?? [],
                        )
                        .join(" · ") ||
                    "No role-specific item or level breakpoints are recorded.",
            },
            {
                phase: "Late game",
                action: late.length
                    ? `${names(late)} can gain value from later items only while they can reach targets and survive the entry.`
                    : "Reassess target access and available cooldowns at each item breakpoint; an early power curve does not make a champion useless later.",
                check: enemyLate.length
                    ? `The opponent also has later windows through ${names(enemyLate)}. There is no unconditional scaling winner.`
                    : "Opponent timing coverage may be incomplete. Do not infer inevitability from a missing late-game label.",
            },
        ],
    };
}

export function reviewStrategy(
    bluePicks: StrategyPick[],
    redPicks: StrategyPick[],
): StrategyReview {
    const blueResolved = resolveStrategyPicks(bluePicks),
        redResolved = resolveStrategyPicks(redPicks);
    const blue = readTeam(
        blueResolved.picks,
        redResolved.picks,
        blueResolved.scenarios,
    );
    const red = readTeam(
        redResolved.picks,
        blueResolved.picks,
        redResolved.scenarios,
    );
    const complete = bluePicks.length === 5 && redPicks.length === 5;
    const title =
        !bluePicks.length && !redPicks.length
            ? "Build a draft. Find its plan."
            : blue.plans[0] && red.plans[0]
              ? `${blue.plans[0].title} vs ${red.plans[0].title.toLowerCase()}`
              : "The draft is still finding its identity";
    const detail = complete
        ? "Compare the enabling conditions below. The preferred fight can change with vision, cooldowns, items and role assignments; these profiles do not establish a calibrated winner."
        : "Each pick changes what the teams can threaten and what they still need. Open slots and uncertain roles keep this read conditional.";
    return { blue, red, title, detail, complete };
}

export type StrategyConstraints = {
    bans: readonly string[];
    unavailable?: readonly string[];
    owned?: ReadonlySet<string>;
};

/** Compare with the actual draft, including the outgoing pick in a replacement. */
export function compareStrategyDraft(
    current: StrategyPick[],
    enemy: StrategyPick[],
    proposed: StrategyPick[],
) {
    const before = reviewStrategy(current, enemy);
    const after = reviewStrategy(proposed, enemy);
    const changes = (previous: TeamStrategy, next: TeamStrategy) => ({
        gainedPlans: next.plans.filter(
            (plan) => !previous.plans.some((p) => p.key === plan.key),
        ),
        lostPlans: previous.plans.filter(
            (plan) => !next.plans.some((p) => p.key === plan.key),
        ),
        answeredNeeds: previous.needs.filter(
            (need) => !next.needs.some((n) => n.key === need.key),
        ),
        newNeeds: next.needs.filter(
            (need) => !previous.needs.some((n) => n.key === need.key),
        ),
    });
    return {
        before,
        after,
        own: changes(before.blue, after.blue),
        opponent: changes(before.red, after.red),
    };
}

export type StrategyOption = {
    picks: StrategyPick[];
    answers: string[];
    remaining: string[];
    risks: StrategyClaim[];
    newRisks: StrategyClaim[];
    plan?: string;
    scenarios: number;
    covered: number;
    newNeeds: string[];
    roleCommitments: string[];
};

export function compareStrategyOption(
    own: StrategyPick[],
    enemy: StrategyPick[],
    additions: StrategyPick[],
): StrategyOption {
    const before = reviewStrategy(own, enemy).blue;
    const after = reviewStrategy([...own, ...additions], enemy).blue;
    const remainingKeys = new Set(after.needs.map((n) => n.key));
    const risks = after.claims.filter(
        (c) =>
            c.kind === "risk" ||
            c.id === "entry-protection" ||
            c.id === "poke-sustain",
    );
    return {
        picks: additions,
        answers: before.needs
            .filter((n) => !remainingKeys.has(n.key))
            .map((n) => n.title),
        remaining: after.needs.map((n) => n.title),
        risks,
        newRisks: risks.filter(
            (c) => !before.claims.some((b) => b.id === c.id),
        ),
        plan: after.plans[0]?.title,
        scenarios: after.scenarios,
        covered: after.covered,
        newNeeds: after.needs
            .filter((n) => !before.needs.some((b) => b.key === n.key))
            .map((n) => n.title),
        roleCommitments: after.picks.flatMap((p) => {
            const previous = before.picks.find((b) => b.key === p.key);
            return previous && previous.roles.length > p.roles.length
                ? [
                      `${p.name}: ${previous.roles.join(" / ")} → ${p.roles.join(" / ")}`,
                  ]
                : [];
        }),
    };
}

// A transparent shortlist, not a probability model or exhaustive game-tree search.
export function strategyOptions(
    own: StrategyPick[],
    enemy: StrategyPick[],
    candidates: StrategyPick[],
    constraints: StrategyConstraints,
    windowSize: number,
    search = "",
) {
    if (!windowSize || own.length >= 5)
        return { singles: [], pairs: [], evaluated: 0 };
    const blocked = new Set([
        ...constraints.bans,
        ...(constraints.unavailable ?? []),
        ...own.map((p) => p.key),
        ...enemy.map((p) => p.key),
    ]);
    const options: StrategyOption[] = [];
    const baselineCoverage = reviewCoverage(own);
    for (const candidate of candidates) {
        if (
            blocked.has(candidate.key) ||
            (constraints.owned?.size && !constraints.owned.has(candidate.key))
        )
            continue;
        const resolved = resolveStrategyPicks([...own, candidate]);
        if (!resolved.scenarios || !resolved.picks.at(-1)?.capabilities.length)
            continue;
        const option = compareStrategyOption(own, enemy, [candidate]);
        if (option.covered > baselineCoverage) options.push(option);
    }
    const sort = (a: StrategyOption, b: StrategyOption) =>
        b.answers.length - a.answers.length ||
        a.newRisks.length - b.newRisks.length ||
        b.covered - a.covered ||
        a.picks
            .map((p) => `${p.name}:${p.role}`)
            .join()
            .localeCompare(b.picks.map((p) => `${p.name}:${p.role}`).join());
    options.sort(sort);
    const distinct: StrategyOption[] = [];
    for (const option of options)
        if (!distinct.some((o) => o.picks[0].key === option.picks[0].key))
            distinct.push(option);
    const query = search.trim().toLowerCase();
    const matches = (option: StrategyOption) =>
        option.picks.some((p) => p.name.toLowerCase().includes(query));
    const matching = distinct.filter(matches);
    const pairs: StrategyOption[] = [];
    if (windowSize >= 2 && own.length <= 3) {
        // Search anchors the pair; its partner need not match the query.
        // Retain all legal role variants within each bounded champion pool.
        const shortlist = new Set(
            (query
                ? [
                      ...matching.slice(0, 12),
                      ...distinct.filter((o) => !matches(o)).slice(0, 12),
                  ]
                : distinct.slice(0, 12)
            ).map((o) => o.picks[0].key),
        );
        const pool = options.filter((o) => shortlist.has(o.picks[0].key));
        for (let i = 0; i < pool.length; i++)
            for (let j = i + 1; j < pool.length; j++) {
                const additions = [pool[i].picks[0], pool[j].picks[0]];
                if (
                    additions[0].key === additions[1].key ||
                    (query &&
                        !additions.some((p) =>
                            p.name.toLowerCase().includes(query),
                        )) ||
                    !roleScenarios([...own, ...additions]).length
                )
                    continue;
                pairs.push(compareStrategyOption(own, enemy, additions));
            }
        pairs.sort(sort);
    }
    // Show different champion pairs rather than spending all cards on role
    // permutations of the same pair. The best legal assignment remains visible.
    const pairKeys = new Set<string>();
    const distinctPairs = pairs.filter((option) => {
        const key = option.picks
            .map((p) => p.key)
            .sort()
            .join(":");
        if (pairKeys.has(key)) return false;
        pairKeys.add(key);
        return true;
    });
    return {
        singles: matching.slice(0, 6),
        pairs: distinctPairs.slice(0, 3),
        evaluated: options.filter(matches).length,
    };
}

const reviewCoverage = (picks: StrategyPick[]) =>
    resolveStrategyPicks(picks).picks.filter((p) => p.capabilities.length)
        .length;

export function strategyColorEvidence(pick: ResolvedPick) {
    return effectiveColorEvidence(
        pick.knowledge,
        pick.roles.length === 1 ? pick.roles[0] : undefined,
    );
}
