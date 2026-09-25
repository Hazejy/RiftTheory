import {
    createEffect,
    createMemo,
    createSignal,
    For,
    Show,
    untrack,
} from "solid-js";
import { assessObservedRoles } from "@draftgap/core/src/role/flex-evidence";
import { analyzeDraft } from "@draftgap/core/src/draft/analysis";
import type { Role } from "@draftgap/core/src/models/Role";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import { useDraftAnalysis } from "../../contexts/DraftAnalysisContext";
import { useDraftView } from "../../contexts/DraftViewContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import {
    strategyLiveSnapshot,
    setStrategyLiveSnapshot,
    strategySource,
    setStrategySource,
} from "../../contexts/StrategySession";
import {
    LIVE_STRATEGY_ORDER,
    type StrategySlot,
} from "../../utils/strategyLiveDraft";
import { draftResponseWindow, pickLabel } from "../../utils/draftOrder";
import { draftCoachWindow, sameSlotAlternative } from "../../utils/draftCoach";
import { draftGapPickEvidence, type DraftGapPickEvidence } from "../../utils/draftGapPickEvidence";
import { screenDraftGapReplacements } from "../../utils/draftGapReplacementScreen";
import { ChampionIcon } from "../icons/ChampionIcon";
import { RoleIcon } from "../icons/roles/RoleIcon";
import StrategicColorChips from "./StrategicColorChips";
import StrategyMechanicsPanel from "./StrategyMechanicsPanel";
import { assessStrategyOutcome } from "../../utils/strategyOutcome";
import { reviewStrategyMechanics } from "../../utils/strategyMechanics";
import {
    reviewStrategy,
    compareStrategyDraft,
    compareStrategyOption,
    strategyOptions,
    strategyColorEvidence,
    strategyThemeFits,
    STRATEGY_ROLES,
    type StrategyClaim,
    type StrategyOption,
    type StrategyPick,
    type TeamStrategy,
} from "../../utils/strategyReview";
import "./strategyWorkspace.css";

function colorProvenance(entry: NonNullable<ReturnType<typeof strategyColorEvidence>>) {
    return entry.scope === "role"
        ? `Role profile · ${entry.profile.review_status} · patch ${"patch_version" in entry.profile ? entry.profile.patch_version : "unknown"}`
        : entry.tier === "historical_reference"
          ? "Historical champion-wide color reference"
          : `Champion-wide baseline · ${entry.profile.review_status}`;
}

function Claim(props: { claim: StrategyClaim }) {
    return (
        <article class="strategy-claim">
            <div class="strategy-portraits">
                <For each={props.claim.champions}>
                    {(key) => <ChampionIcon championKey={key} size={28} />}
                </For>
            </div>
            <h4>{props.claim.title}</h4>
            <p>{props.claim.detail}</p>
            <details>
                <summary>When it works · how to answer</summary>
                <p>
                    <strong>Requires </strong>
                    {props.claim.requires}
                </p>
                <p>
                    <strong>Counterplay </strong>
                    {props.claim.answer}
                </p>
            </details>
        </article>
    );
}

function TeamPlan(props: { team: TeamStrategy; side: "Blue" | "Red" }) {
    const fits = () => strategyThemeFits(props.team);
    return (
        <article class="strategy-team" data-side={props.side}>
            <div class="strategy-team-heading">
                <span>{props.side} Side</span>
                <small>
                    {props.team.picks.length}/5 picks · {props.team.scenarios}{" "}
                    role scenarios
                </small>
            </div>
            <span class="strategy-eyebrow">TEAM THEME</span>
            <h3>{props.team.plans[0]?.title ?? "Theme not established yet"}</h3>
            <p>{props.team.plans[0]?.win ??
                "Add picks or resolve roles to see how this team creates an advantage."}</p>
            <Show when={props.team.picks.length}>
                <div class="strategy-team-colors" aria-label={`${props.side} color identities`}>
                    <span class="strategy-eyebrow">COLOR MAP · THEME FIT BY PICK</span>
                    <For each={props.team.picks}>
                        {(pick) => {
                            const evidence = () => strategyColorEvidence(pick);
                            const fit = () => fits().find((entry) => entry.key === pick.key);
                            return (
                                <div class="strategy-team-color">
                                    <div class="strategy-team-color-text">
                                        <strong>{pick.name}</strong>
                                        <small>
                                            <b data-fit={fit()?.label}>{fit()?.label}</b>
                                            {" · "}{fit()?.reason}
                                        </small>
                                    </div>
                                    <Show when={evidence()} fallback={<small>Unreviewed</small>}>
                                        {(entry) => (
                                            <div class="strategy-team-color-evidence">
                                                <StrategicColorChips
                                                    compact
                                                    english
                                                    colors={entry().profile.colors
                                                        .filter((color) => color.assignment === "main")
                                                        .map((color) => color.color)}
                                                />
                                                <small>{colorProvenance(entry())}</small>
                                            </div>
                                        )}
                                    </Show>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </Show>
            <Show when={props.team.plans[0]}>
                {(plan) => (
                    <div class="strategy-team-logic">
                        <div>
                            <span class="strategy-eyebrow">WHY IT WORKS</span>
                            <p>{plan().requires}</p>
                        </div>
                        <div>
                            <span class="strategy-eyebrow">OPPONENT RESPONSE</span>
                            <p>{plan().answer}</p>
                        </div>
                    </div>
                )}
            </Show>
            <Show when={props.team.plans.length > 1}>
                <details>
                    <summary>
                        Other possible plans ({props.team.plans.length - 1})
                    </summary>
                    <For each={props.team.plans.slice(1)}>
                        {(plan) => (
                            <div class="strategy-alternative">
                                <h4>{plan.title}</h4>
                                <p>{plan.win}</p>
                                <p>
                                    <strong>Requires </strong>
                                    {plan.requires}
                                </p>
                                <p>
                                    <strong>Answer </strong>
                                    {plan.answer}
                                </p>
                            </div>
                        )}
                    </For>
                </details>
            </Show>
        </article>
    );
}

function ChoiceSummary(props: {
    label: string;
    option: StrategyOption;
    samples?: DraftGapPickEvidence[];
}) {
    const costs = () => [...new Set([
        ...props.option.newNeeds,
        ...props.option.newRisks.map((risk) => risk.title),
        ...props.option.roleCommitments,
        ...props.option.opponentAnswers.map((answer) => `Opponent answers: ${answer}`),
    ])];
    return (
        <article class="strategy-choice-card">
            <span class="strategy-eyebrow">{props.label}</span>
            <h4>{props.option.picks.map((pick) => `${pick.name} · ${pick.role}`).join(" + ")}</h4>
            <dl>
                <div>
                    <dt>Team theme</dt>
                    <dd>{props.option.plan ?? "No shared plan established"}</dd>
                </div>
                <div>
                    <dt>Needs answered</dt>
                    <dd>{props.option.answers.join("; ") || "None established"}</dd>
                </div>
                <div>
                    <dt>Pressure created</dt>
                    <dd>{props.option.opponentNewNeeds.join("; ") || "No new opponent need established"}</dd>
                </div>
                <div>
                    <dt>New costs</dt>
                    <dd>{costs().join("; ") || "No new concern established"}</dd>
                </div>
            </dl>
            <Show when={props.samples?.length}>
                <div class="strategy-choice-samples">
                    <strong>DraftGap role samples · current patch</strong>
                    <For each={props.samples}>
                        {(sample) => (
                            <p>
                                {sample.champion} · {sample.role}: {sample.roleGames.toLocaleString()} games
                                {sample.roleRate === undefined
                                    ? " · rate unavailable"
                                    : ` · ${(sample.roleRate * 100).toFixed(1)}% rank-adjusted rate`}
                                {sample.roleThin ? " · small sample" : ""}
                            </p>
                        )}
                    </For>
                </div>
            </Show>
        </article>
    );
}

function ComparisonTeam(props: {
    label: string;
    before: TeamStrategy;
    after: TeamStrategy;
    changes: ReturnType<typeof compareStrategyDraft>["own"];
    comparable: boolean;
}) {
    return (
        <article class="strategy-claim">
            <h4>{props.label}</h4>
            <p>
                <strong>Current plan: </strong>
                {props.before.plans[0]?.title ?? "Not established yet"}
            </p>
            <p>
                <strong>With this choice: </strong>
                {props.after.plans[0]?.title ?? "Not established yet"}
            </p>
            <p>
                {props.after.plans[0]?.win ??
                    "More role and capability evidence is needed to establish a shared plan."}
            </p>
            <Show when={props.changes.gainedPlans.length}>
                <p>
                    <strong>New routes: </strong>
                    {props.changes.gainedPlans.map((p) => p.title).join("; ")}
                </p>
            </Show>
            <Show when={props.changes.lostPlans.length}>
                <p>
                    <strong>Routes no longer supported: </strong>
                    {props.changes.lostPlans.map((p) => p.title).join("; ")}
                </p>
            </Show>
            <p>
                <strong>Needs addressed: </strong>
                {!props.comparable
                    ? "Comparison unavailable until the current draft issues are resolved."
                    : props.changes.answeredNeeds
                          .map((n) => n.title)
                          .join("; ") ||
                      "No previously identified need is fully answered."}
            </p>
            <Show when={props.changes.newNeeds.length}>
                <p>
                    <strong>New obligations: </strong>
                    {props.changes.newNeeds.map((n) => n.title).join("; ")}
                </p>
            </Show>
            <Show when={props.after.plans[0]}>
                {(plan) => (
                    <details>
                        <summary>Conditions & possible response</summary>
                        <p>
                            <strong>Requires: </strong>
                            {plan().requires}
                        </p>
                        <p>
                            <strong>Possible response: </strong>
                            {plan().answer}
                        </p>
                    </details>
                )}
            </Show>
        </article>
    );
}

export default function StrategyWorkspace() {
    const draft = useDraft();
    const { config: userConfig } = useUser();
    const { dataset, dataset30Days, rankStatus } = useDataset();
    const { allyDraftAnalysis } = useDraftAnalysis();
    const { setCurrentDraftView } = useDraftView();
    const { knowledge, championForKey } = useRiftTheoryKnowledge();
    const capabilitySource = (sourceKey: string) =>
        knowledge()?.sources.find((source) => source.source_key === sourceKey);
    const [focus, setFocus] = createSignal<"blue" | "red">("blue");
    const [section, setSection] = createSignal<"plan" | "timing" | "evidence">(
        "plan",
    );
    const [preview, setPreview] = createSignal<{
        fingerprint: string;
        option: StrategyOption;
    }>();
    const [candidateSearch, setCandidateSearch] = createSignal("");
    let previewPanel: HTMLElement | undefined;
    let previewTrigger: HTMLButtonElement | undefined;
    let searchInput: HTMLInputElement | undefined;
    const live = () =>
        strategySource() === "live" ? strategyLiveSnapshot() : undefined;
    const [liveSelection, setLiveSelection] = createSignal<{
        team: "ally" | "opponent";
        index: number;
    }>();
    const teamSlots = (team: "ally" | "opponent") =>
        live()?.teams[team] ??
        (team === "ally" ? draft.allyTeam : draft.opponentTeam);
    const bans = () => live()?.bans ?? draft.bans;
    const editSource = () =>
        setCurrentDraftView(
            live()
                ? { type: "liveDraft" }
                : { type: "draft", subType: "draft" },
        );

    // Use the active statistical dataset, not historical role observations from
    // the knowledge snapshot, when determining which flexes are credible.
    const pool = createMemo(() =>
        Object.values(dataset()?.championData ?? {}).map((champion) => {
            const samples = STRATEGY_ROLES.map((role, index) => ({
                role,
                games: champion.statsByRole[index as Role]?.games ?? 0,
            }));
            const total = samples.reduce(
                (sum, sample) => sum + sample.games,
                0,
            );
            const roles = assessObservedRoles(
                samples.map((sample) => ({
                    ...sample,
                    sampleTotal: total,
                    roleShare: total ? sample.games / total : 0,
                })),
            ).roles;
            const possibleRoles = roles
                .filter((r) => r.tier === "primary" || r.tier === "established")
                .map((r) => r.role);
            return {
                key: champion.key,
                name: champion.name,
                possibleRoles,
                knowledge: championForKey(champion.key),
            } satisfies StrategyPick;
        }),
    );
    const poolByKey = createMemo(() => new Map(pool().map((p) => [p.key, p])));
    const roleCandidates = createMemo(() => pool().flatMap((pick) =>
        pick.possibleRoles.map((role) => ({ ...pick, role })),
    ));
    const toPicks = (team: readonly StrategySlot[]): StrategyPick[] =>
        team.flatMap((p) => {
            if (!p.championKey) return [];
            const source = poolByKey().get(p.championKey);
            return [
                {
                    ...(source ?? {
                        key: p.championKey,
                        name: p.championKey,
                        possibleRoles: [],
                    }),
                    role:
                        p.role === undefined
                            ? undefined
                            : STRATEGY_ROLES[p.role],
                },
            ];
        });
    const blue = createMemo(() => toPicks(teamSlots("ally")));
    const red = createMemo(() => toPicks(teamSlots("opponent")));
    const review = createMemo(() => reviewStrategy(blue(), red()));
    const focusedTeam = () => review()[focus()];
    const mechanics = createMemo(() =>
        reviewStrategyMechanics(
            focusedTeam().picks,
            review()[focus() === "blue" ? "red" : "blue"].picks,
            dataset()?.version,
        ),
    );
    const selectedStep = () =>
        live()
            ? (liveSelection() ?? live()?.next)
            : draft.selection.team
              ? { team: draft.selection.team, index: draft.selection.index }
              : draft.activeDraftPick();
    const windowSteps = createMemo(() =>
        draftResponseWindow(
            selectedStep(),
            { ally: teamSlots("ally"), opponent: teamSlots("opponent") },
            live() ? LIVE_STRATEGY_ORDER : undefined,
        ),
    );
    const coachWindow = createMemo(() => draftCoachWindow(
        selectedStep(),
        windowSteps(),
        { ally: teamSlots("ally"), opponent: teamSlots("opponent") },
    ));
    const planning = createMemo(() => {
        const step = selectedStep();
        const isBlue = step?.team !== "opponent";
        const raw = teamSlots(isBlue ? "ally" : "opponent");
        const outgoing = step ? raw[step.index]?.championKey : undefined;
        const current = isBlue ? blue() : red();
        const own = step
            ? toPicks(raw.filter((_, index) => index !== step.index))
            : current;
        return {
            own,
            current,
            enemy: isBlue ? red() : blue(),
            outgoing,
            isBlue,
        };
    });
    const options = createMemo(() => {
        const current = planning();
        const unavailable = [
            ...(live()?.unavailable[current.isBlue ? "ally" : "opponent"] ??
                []),
            ...(current.outgoing ? [current.outgoing] : []),
        ];
        return strategyOptions(
            current.own,
            current.enemy,
            roleCandidates(),
            {
                bans: bans(),
                unavailable,
                owned: live() ? undefined : draft.ownedChampions(),
            },
            windowSteps().length,
            candidateSearch(),
            current.current,
        );
    });
    const fingerprint = () =>
        JSON.stringify([
            strategySource(),
            live()?.capturedAt,
            live()?.unavailable,
            blue().map((p) => [p.key, p.role, p.possibleRoles]),
            red().map((p) => [p.key, p.role, p.possibleRoles]),
            selectedStep(),
            bans(),
            [...draft.ownedChampions()].sort(),
            dataset()?.date,
            dataset()?.version,
            rankStatus().active,
            knowledge()?.metadata.generatedAt,
        ]);
    const activePreview = () =>
        preview()?.fingerprint === fingerprint()
            ? preview()?.option
            : undefined;
    const sameSlotChoice = createMemo(() => {
        const selected = activePreview();
        if (!selected) return undefined;
        const current = planning();
        const shortlist = candidateSearch().trim()
            ? strategyOptions(
                  current.own,
                  current.enemy,
                  roleCandidates(),
                  {
                      bans: bans(),
                      unavailable: [
                          ...(live()?.unavailable[current.isBlue ? "ally" : "opponent"] ?? []),
                          ...(current.outgoing ? [current.outgoing] : []),
                      ],
                      owned: live() ? undefined : draft.ownedChampions(),
                  },
                  windowSteps().length,
                  "",
                  current.current,
              )
            : options();
        return sameSlotAlternative(
            selected,
            selected.picks.length > 1 ? shortlist.pairs : shortlist.singles,
        );
    });
    createEffect(() => {
        if (preview() && preview()!.fingerprint !== fingerprint())
            setPreview(undefined);
    });
    const previewRead = createMemo(() => {
        const option = activePreview();
        if (!option) return undefined;
        const p = planning();
        return compareStrategyDraft(p.isBlue ? blue() : red(), p.enemy, [
            ...p.own,
            ...option.picks,
        ]);
    });
    const previewReplies = createMemo(() => {
        const option = activePreview();
        const window = coachWindow();
        if (!option || !window?.chronological || !window.nextOpponentPick ||
            window.bansBeforeReply.length || !previewRead()?.after) return [];
        const current = planning();
        return strategyOptions(
            current.enemy,
            [...current.own, ...option.picks],
            roleCandidates(),
            {
                bans: bans(),
                unavailable: live()?.unavailable[current.isBlue ? "opponent" : "ally"] ?? [],
            },
            1,
            "",
            current.enemy,
            "pressure",
        ).singles.slice(0, 3);
    });
    const previewReplyEvidence = createMemo(() => {
        const activeDataset = dataset();
        const fullDataset = dataset30Days();
        const option = activePreview();
        if (!option || !activeDataset || !fullDataset || !rankStatus().available)
            return new Map<string, DraftGapPickEvidence>();
        const current = planning();
        return new Map(previewReplies().flatMap((reply) => {
            const entry = draftGapPickEvidence(
                activeDataset,
                fullDataset,
                reply.picks,
                current.enemy,
                [...current.own, ...option.picks],
                userConfig.minGames,
            )[0];
            return entry ? [[reply.picks[0].key, entry] as const] : [];
        }));
    });
    const draftGapForOption = (option: Pick<StrategyOption, "picks"> | undefined) => {
        const activeDataset = dataset();
        const fullDataset = dataset30Days();
        if (
            !option || live() || !rankStatus().available ||
            !activeDataset || !fullDataset
        ) return undefined;
        const after = reviewStrategy(
            [...planning().own, ...option.picks],
            planning().enemy,
        );
        if (!after.complete || after.issues.length) return undefined;
        const roleMap = (picks: typeof after.blue.picks) => {
            if (picks.length !== 5 || picks.some((pick) => pick.roles.length !== 1))
                return undefined;
            return new Map(picks.map((pick) => [
                STRATEGY_ROLES.indexOf(pick.roles[0]) as Role,
                pick.key,
            ]));
        };
        const own = roleMap(after.blue.picks);
        const enemy = roleMap(after.red.picks);
        if (!own || !enemy || own.size !== 5 || enemy.size !== 5) return undefined;
        if ([...own, ...enemy].some(([role, key]) =>
            !activeDataset.championData[key]?.statsByRole[role])) return undefined;
        const rating = analyzeDraft(activeDataset, fullDataset, own, enemy, {
            ignoreChampionWinrates: userConfig.ignoreChampionWinrates,
            riskLevel: userConfig.riskLevel,
            minGames: userConfig.minGames,
        });
        return Number.isFinite(rating.winrate) ? rating : undefined;
    };
    const previewDraftGap = createMemo(() => draftGapForOption(activePreview()));
    const alternativeDraftGap = createMemo(() => draftGapForOption(sameSlotChoice()));
    const currentDraftGap = createMemo(() => {
        const current = planning();
        const original = current.current.find((pick) => pick.key === current.outgoing);
        return original ? draftGapForOption({ picks: [original] }) : undefined;
    });
    const previewDraftGapPicks = createMemo(() => {
        const option = activePreview();
        const activeDataset = dataset();
        const fullDataset = dataset30Days();
        if (!option || !activeDataset || !fullDataset || !rankStatus().available)
            return undefined;
        return draftGapPickEvidence(
            activeDataset,
            fullDataset,
            option.picks,
            planning().own,
            planning().enemy,
            userConfig.minGames,
        );
    });
    const alternativeDraftGapPicks = createMemo(() => {
        const option = sameSlotChoice();
        const activeDataset = dataset();
        const fullDataset = dataset30Days();
        if (!option || !activeDataset || !fullDataset || !rankStatus().available)
            return undefined;
        return draftGapPickEvidence(
            activeDataset,
            fullDataset,
            option.picks,
            planning().own,
            planning().enemy,
            userConfig.minGames,
        );
    });
    const replacementScreen = createMemo(() => {
        const activeDataset = dataset();
        const fullDataset = dataset30Days();
        const current = planning();
        if (live() || !current.outgoing || windowSteps().length !== 1 ||
            !rankStatus().available || !activeDataset || !fullDataset)
            return undefined;
        return screenDraftGapReplacements(
            current.own,
            current.enemy,
            roleCandidates(),
            {
                bans: bans(),
                unavailable: [current.outgoing],
                owned: draft.ownedChampions(),
            },
            (team, enemy, pick) => {
                if ([...team, ...enemy].some(([role, key]) =>
                    !activeDataset.championData[key]?.statsByRole[role])) return undefined;
                const rating = analyzeDraft(activeDataset, fullDataset, team, enemy, {
                    ignoreChampionWinrates: userConfig.ignoreChampionWinrates,
                    riskLevel: userConfig.riskLevel,
                    minGames: userConfig.minGames,
                });
                return {
                    modelIndex: rating.winrate,
                    roleGames: activeDataset.championData[pick.key]
                        ?.statsByRole[STRATEGY_ROLES.indexOf(pick.role!) as Role]?.games ?? 0,
                };
            },
        );
    });
    const choosePreview = (
        option: StrategyOption,
        trigger: HTMLButtonElement,
    ) => {
        previewTrigger = trigger;
        setPreview({ fingerprint: fingerprint(), option });
        queueMicrotask(() => {
            if (untrack(activePreview) !== option) return;
            previewPanel?.focus({ preventScroll: true });
            previewPanel?.scrollIntoView({ block: "start" });
        });
    };
    const closePreview = () => {
        setPreview(undefined);
        (previewTrigger?.isConnected ? previewTrigger : searchInput)?.focus();
    };
    const previewMechanics = createMemo(() => {
        const result = previewRead()?.after;
        if (!result) return undefined;
        return reviewStrategyMechanics(
            result.blue.picks,
            result.red.picks,
            dataset()?.version,
        );
    });
    const selectSlot = (team: "ally" | "opponent", index: number) => {
        if (live()) setLiveSelection({ team, index });
        else draft.select(team, index, false, false);
        setFocus(team === "ally" ? "blue" : "red");
    };
    const statistical = () => allyDraftAnalysis()?.winrate;
    const outcome = createMemo(() =>
        assessStrategyOutcome(
            review(),
            rankStatus().available ? statistical() : undefined,
            !!live(),
        ),
    );
    const assignRole = (
        team: "ally" | "opponent",
        index: number,
        role: Role | undefined,
    ) => {
        if (live())
            setStrategyLiveSnapshot((snapshot) =>
                snapshot
                    ? {
                          ...snapshot,
                          teams: {
                              ...snapshot.teams,
                              [team]: snapshot.teams[team].map((slot, i) =>
                                  i === index ? { ...slot, role } : slot,
                              ),
                          },
                      }
                    : snapshot,
            );
        else
            draft.pickChampion(
                team,
                index,
                teamSlots(team)[index].championKey,
                role,
                {
                    updateView: false,
                    updateSelection: false,
                    reportEvent: false,
                    resetFilters: false,
                },
            );
    };

    const OptionCard = (props: { option: StrategyOption }) => (
        <button
            class="strategy-option"
            aria-pressed={activePreview() === props.option}
            onClick={(event) =>
                choosePreview(props.option, event.currentTarget)
            }
        >
            <div class="strategy-portraits">
                <For each={props.option.picks}>
                    {(p) => <ChampionIcon championKey={p.key} size={36} />}
                </For>
            </div>
            <strong>
                {props.option.picks
                    .map((p) => `${p.name} · ${p.role}`)
                    .join(" + ")}
            </strong>
            <span class="strategy-option-reason">
                {props.option.unassessedPicks.length
                    ? "Role capability profile missing. Inspect this legal pick without a strength ranking."
                    : props.option.answers.length
                    ? `Answers: ${props.option.answers.join("; ")}.`
                    : props.option.plan
                      ? `Team theme: ${props.option.plan}.`
                      : "Explore this role assignment."}
            </span>
            <span class="strategy-option-response">
                {props.option.unassessedPicks.length
                    ? "Team fit, timing and counterplay need a manual check."
                    : props.option.opponentAnswers.length
                    ? `Opponent gains: ${props.option.opponentAnswers.slice(0, 2).join("; ")}`
                    : props.option.opponentNewNeeds.length
                      ? `Opponent must solve: ${props.option.opponentNewNeeds.slice(0, 2).join("; ")}`
                      : props.option.remaining.length
                        ? `Still needs: ${props.option.remaining.slice(0, 2).join("; ")}`
                        : "Check enemy replies before locking."}
            </span>
            <span class="strategy-link">
                Compare this {props.option.picks.length > 1 ? "pair" : "pick"} →
            </span>
        </button>
    );

    return (
        <section class="strategy-workspace" aria-label="Draft strategy">
            <header class="strategy-header">
                <div>
                    <span class="strategy-eyebrow">
                        RIFTTHEORY / DRAFT ROOM
                    </span>
                    <h1>Strategy</h1>
                    <p>Understand the fight. Build the response.</p>
                </div>
                <button class="strategy-button" onClick={editSource}>
                    {live() ? "Back to Live Draft →" : "Edit draft →"}
                </button>
            </header>
            <Show when={strategyLiveSnapshot()}>
                <div class="strategy-segment" aria-label="Draft source">
                    <button
                        aria-pressed={!live()}
                        onClick={() => setStrategySource("draft")}
                    >
                        Main draft
                    </button>
                    <button
                        aria-pressed={!!live()}
                        onClick={() => setStrategySource("live")}
                    >
                        Live Draft · G{strategyLiveSnapshot()?.gameNumber}
                    </button>
                </div>
            </Show>
            <Show when={live()}>
                {(snapshot) => (
                    <p class="strategy-explanation">
                        Snapshot · Game {snapshot().gameNumber} ·{" "}
                        {snapshot().mode} · {snapshot().names.ally} (Blue) vs{" "}
                        {snapshot().names.opponent} (Red). Captured{" "}
                        {new Date(snapshot().capturedAt).toLocaleTimeString()}.
                        Current bans and previous-game locks apply. Use Analyze
                        game in Live Draft to refresh; role edits here only
                        change this snapshot.
                        {snapshot().pendingBans
                            ? " Bans are still pending: pick previews are provisional until those bans finish."
                            : ""}
                    </p>
                )}
            </Show>
            <Show when={knowledge.loading}>
                <p role="status">Loading champion knowledge…</p>
            </Show>
            <Show when={knowledge.error}>
                <p role="alert">
                    Champion knowledge could not be loaded. Strategic
                    conclusions are unavailable.
                </p>
            </Show>
            <div class="strategy-rosters">
                <For each={["ally", "opponent"] as const}>
                    {(team) => (
                        <div
                            class="strategy-roster"
                            data-side={team === "ally" ? "Blue" : "Red"}
                        >
                            <div class="strategy-team-heading">
                                <strong>
                                    {team === "ally" ? "Blue Side" : "Red Side"}
                                </strong>
                                <small>
                                    Select a slot to plan its response
                                </small>
                            </div>
                            <div class="strategy-slots">
                                <For each={teamSlots(team)}>
                                    {(p, index) => (
                                        <div
                                            class="strategy-slot"
                                            classList={{
                                                selected:
                                                    selectedStep()?.team ===
                                                        team &&
                                                    selectedStep()?.index ===
                                                        index(),
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    selectSlot(team, index())
                                                }
                                                aria-label={`Plan ${pickLabel(team, index())}`}
                                                aria-pressed={
                                                    selectedStep()?.team ===
                                                        team &&
                                                    selectedStep()?.index ===
                                                        index()
                                                }
                                            >
                                                <span class="strategy-slot-label">
                                                    {pickLabel(team, index())}
                                                </span>
                                                <Show
                                                    when={p.championKey}
                                                    fallback={
                                                        <span class="strategy-empty-slot">
                                                            +
                                                        </span>
                                                    }
                                                >
                                                    {(key) => (
                                                        <ChampionIcon
                                                            championKey={key()}
                                                            size={42}
                                                        />
                                                    )}
                                                </Show>
                                                <strong>
                                                    {p.championKey
                                                        ? (poolByKey().get(
                                                              p.championKey!,
                                                          )?.name ??
                                                          p.championKey)
                                                        : "Open pick"}
                                                </strong>
                                            </button>
                                            <Show when={p.championKey}>
                                                <label class="strategy-role-select">
                                                    <Show
                                                        when={
                                                            p.role !== undefined
                                                        }
                                                    >
                                                        <RoleIcon
                                                            role={p.role!}
                                                            class="w-3.5 h-3.5"
                                                        />
                                                    </Show>
                                                    <select
                                                        aria-label={`${pickLabel(team, index())} role`}
                                                        value={
                                                            p.role === undefined
                                                                ? "auto"
                                                                : String(p.role)
                                                        }
                                                        onChange={(event) =>
                                                            assignRole(
                                                                team,
                                                                index(),
                                                                event
                                                                    .currentTarget
                                                                    .value ===
                                                                    "auto"
                                                                    ? undefined
                                                                    : (Number(
                                                                          event
                                                                              .currentTarget
                                                                              .value,
                                                                      ) as Role),
                                                            )
                                                        }
                                                    >
                                                        <option value="auto">
                                                            Unassigned
                                                        </option>
                                                        <For
                                                            each={
                                                                STRATEGY_ROLES
                                                            }
                                                        >
                                                            {(role, i) => (
                                                                <option
                                                                    value={String(
                                                                        i(),
                                                                    )}
                                                                >
                                                                    {role}
                                                                </option>
                                                            )}
                                                        </For>
                                                    </select>
                                                </label>
                                            </Show>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    )}
                </For>
            </div>
            <div class="strategy-overview">
            <div class="strategy-verdict">
                <span class="strategy-eyebrow">
                    {review().complete
                        ? "FULL DRAFT · CONDITIONAL READ"
                        : "DRAFT IN PROGRESS"}
                </span>
                <h2>{review().title}</h2>
                <p>{review().detail}</p>
                <Show when={review().issues.length}>
                    <div class="strategy-mechanics-warning" role="alert">
                        <For each={review().issues}>
                            {(issue) => <p>{issue}</p>}
                        </For>
                    </div>
                </Show>
                <small>
                    Role capabilities covered: Blue {review().blue.covered}/
                    {blue().length} · Red {review().red.covered}/{red().length}.
                    Coverage is not confidence.
                </small>
                <Show when={blue().length || red().length}>
                    <p class="strategy-evidence-caveat">
                        Capability tags include curated interpretations without
                        current-patch verification. Knowledge snapshot: patch{" "}
                        {knowledge()?.metadata.latestPatch?.version ?? "unknown"}.
                        Check role, build and matchup conditions before locking a pick.
                    </p>
                </Show>
            </div>
            <section class="strategy-outcome" aria-label="Draft outcome assessment">
                <span class="strategy-eyebrow">WHICH DRAFT WINS?</span>
                <h2>{outcome().heading}</h2>
                <p>{outcome().explanation}</p>
                <Show when={outcome().modelIndex !== undefined}>
                    <small>
                        Rating index: Blue {outcome().modelIndex!.toFixed(1)} ·
                        Red {(100 - outcome().modelIndex!).toFixed(1)}. This is
                        not a calibrated win chance.
                    </small>
                </Show>
            </section>
            </div>
            <div class="strategy-team-grid">
                <TeamPlan side="Blue" team={review().blue} />
                <TeamPlan side="Red" team={review().red} />
            </div>
            <details class="strategy-deep-dive">
                <summary>
                    <span>Explore mechanics, timing and source evidence</span>
                    <small>Detailed claims and champion records</small>
                </summary>
            <div class="strategy-toolbar">
                <div class="strategy-segment" aria-label="Team to inspect">
                    <button
                        aria-pressed={focus() === "blue"}
                        onClick={() => setFocus("blue")}
                    >
                        Blue plan
                    </button>
                    <button
                        aria-pressed={focus() === "red"}
                        onClick={() => setFocus("red")}
                    >
                        Red plan
                    </button>
                </div>
                <nav class="strategy-segment" aria-label="Strategy sections">
                    <button
                        aria-pressed={section() === "plan"}
                        onClick={() => setSection("plan")}
                    >
                        Deciding interactions
                    </button>
                    <button
                        aria-pressed={section() === "timing"}
                        onClick={() => setSection("timing")}
                    >
                        Game plan
                    </button>
                    <button
                        aria-pressed={section() === "evidence"}
                        onClick={() => setSection("evidence")}
                    >
                        Colors & evidence
                    </button>
                </nav>
            </div>
            <Show when={section() === "plan"}>
                <StrategyMechanicsPanel report={mechanics()} />
                <div class="strategy-claims">
                    <For
                        each={focusedTeam().claims}
                        fallback={
                            <p class="strategy-empty">
                                No supported interaction is established yet. Add
                                opposing picks and resolve roles to build the
                                analysis.
                            </p>
                        }
                    >
                        {(claim) => <Claim claim={claim} />}
                    </For>
                </div>
                <Show when={focusedTeam().needs.length}>
                    <section class="strategy-needs">
                        <h3>Questions for the next pick</h3>
                        <div class="strategy-claims">
                            <For each={focusedTeam().needs}>
                                {(need) => (
                                    <article>
                                        <h4>{need.title}</h4>
                                        <p>{need.why}</p>
                                    </article>
                                )}
                            </For>
                        </div>
                    </section>
                </Show>
            </Show>
            <Show when={section() === "timing"}>
                <div class="strategy-timeline">
                    <For each={focusedTeam().timeline}>
                        {(step, i) => (
                            <article>
                                <span class="strategy-eyebrow">
                                    0{i() + 1} / {step.phase}
                                </span>
                                <h3>{step.phase}</h3>
                                <p>{step.action}</p>
                                <div class="strategy-condition">
                                    <span>Checkpoint</span>
                                    <p>{step.check}</p>
                                </div>
                            </article>
                        )}
                    </For>
                </div>
                <div class="strategy-team-grid">
                    <article class="strategy-claim">
                        <h3>Objective setup</h3>
                        <p>{focusedTeam().objective}</p>
                    </article>
                    <article class="strategy-claim">
                        <h3>Execution & fallback</h3>
                        <p>{focusedTeam().execution}</p>
                        <p>{focusedTeam().plans[0]?.answer}</p>
                    </article>
                </div>
                <div class="strategy-lanes">
                    <h3>Lane & jungle checkpoints</h3>
                    <For each={STRATEGY_ROLES}>
                        {(role) => {
                            const ally = () =>
                                focusedTeam().picks.filter(
                                    (p) =>
                                        p.roles.length === 1 &&
                                        p.roles[0] === role,
                                );
                            const enemy = () =>
                                review()[
                                    focus() === "blue" ? "red" : "blue"
                                ].picks.filter(
                                    (p) =>
                                        p.roles.length === 1 &&
                                        p.roles[0] === role,
                                );
                            return (
                                <div>
                                    <strong>{role}</strong>
                                    <span>
                                        {ally()
                                            .map((p) => p.name)
                                            .join(", ") || "Unresolved"}{" "}
                                        vs{" "}
                                        {enemy()
                                            .map((p) => p.name)
                                            .join(", ") || "Unresolved"}
                                    </span>
                                    <small>
                                        {role === "jungle"
                                            ? "Route depends on which neighboring lanes can move; check their wave states before entering river."
                                            : role === "bot" ||
                                                role === "support"
                                              ? "Evaluate the complete 2v2 and jungle access. An isolated champion matchup does not establish priority."
                                              : "Priority unassessed. Verify push access, trading windows and jungle exposure before planning a first move."}
                                    </small>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </Show>
            <Show when={section() === "evidence"}>
                <p class="strategy-explanation">
                    Main colors describe the recorded identity; off colors need
                    a particular build, matchup or playstyle. They do not
                    contribute points to a winner. Historical labels may not
                    match this patch.
                </p>
                <For each={focusedTeam().picks}>
                    {(p) => {
                        const evidence = () => strategyColorEvidence(p);
                        return (
                            <article class="strategy-evidence">
                                <div class="strategy-evidence-heading">
                                    <ChampionIcon
                                        championKey={p.key}
                                        size={42}
                                    />
                                    <div>
                                        <h3>{p.name}</h3>
                                        <small>
                                            {p.roles.join(" / ") ||
                                                "Role unresolved"}
                                            {p.role
                                                ? " · assigned"
                                                : " · observed possibilities"}
                                        </small>
                                    </div>
                                </div>
                                <Show
                                    when={evidence()}
                                    fallback={<p>No recorded color profile.</p>}
                                >
                                    {(entry) => (
                                        <>
                                            <div class="strategy-color-row">
                                                <span>Main</span>
                                                <StrategicColorChips
                                                    english
                                                    colors={entry()
                                                        .profile.colors.filter(
                                                            (c) =>
                                                                c.assignment ===
                                                                "main",
                                                        )
                                                        .map((c) => c.color)}
                                                />
                                                <span>Off</span>
                                                <StrategicColorChips
                                                    english
                                                    colors={entry()
                                                        .profile.colors.filter(
                                                            (c) =>
                                                                c.assignment ===
                                                                "off",
                                                        )
                                                        .map((c) => c.color)}
                                                />
                                            </div>
                                            <p>{entry().profile.reasoning}</p>
                                            <small>
                                                {entry().profile.review_status}{" "}
                                                · {entry().scope} profile
                                            </small>
                                            <Show when={entry().profile.source_url}>
                                                {(url) => (
                                                    <a href={url()} target="_blank" rel="noopener noreferrer">
                                                        Color source ↗
                                                    </a>
                                                )}
                                            </Show>
                                        </>
                                    )}
                                </Show>
                                <details>
                                    <summary>
                                        Capabilities, timing & provenance
                                    </summary>
                                    <p>
                                        {p.capabilities.join(" · ") ||
                                            "No capabilities shared across the plausible roles."}
                                    </p>
                                    <p>
                                        {p.coaching?.reasoning ??
                                            "No resolved-role coaching profile available."}
                                    </p>
                                    <p>{p.coaching?.spike_notes.join(" · ")}</p>
                                    <small>
                                        Coaching:{" "}
                                        {p.coaching?.review_status ?? "missing"}{" "}
                                        · profile patch{" "}
                                        {p.coaching?.patch_version ?? "unknown"}
                                    </small>
                                    <Show when={p.coaching?.source_url}>
                                        {(url) => (
                                            <p class="strategy-source-line">
                                                Kit reference: <a href={url()} target="_blank" rel="noopener noreferrer">Riot champion abilities ↗</a>.
                                                Coaching interpretation: RiftTheory, provisional unless marked reviewed.
                                            </p>
                                        )}
                                    </Show>
                                    <For
                                        each={
                                            p.knowledge?.capabilities.filter(
                                                (c) =>
                                                    p.roles.includes(
                                                        c.role as (typeof STRATEGY_ROLES)[number],
                                                    ),
                                            ) ?? []
                                        }
                                    >
                                        {(c) => (
                                            <p class="strategy-source-line">
                                                {c.role} · {c.capability} ·{" "}
                                                {c.review_status} · patch{" "}
                                                {c.patch_version} ·{" "}
                                                <Show
                                                    when={capabilitySource(c.source_key)?.url}
                                                    fallback={capabilitySource(c.source_key)?.label ?? c.source_key}
                                                >
                                                    {(url) => (
                                                        <a href={url()} target="_blank" rel="noopener noreferrer">
                                                            {capabilitySource(c.source_key)?.label ?? c.source_key} ↗
                                                        </a>
                                                    )}
                                                </Show>
                                                {c.reasoning
                                                    ? ` — ${c.reasoning}`
                                                    : ""}
                                            </p>
                                        )}
                                    </For>
                                </details>
                            </article>
                        );
                    }}
                </For>
            </Show>
            </details>
            <Show when={windowSteps().length}>
                <section class="strategy-next">
                    <div class="strategy-section-heading">
                        <div>
                            <span class="strategy-eyebrow">NEXT DECISION</span>
                            <h2>
                                {planning().outgoing ? "Reconsider " : "Plan "}
                                {windowSteps()
                                    .map((s) => pickLabel(s.team, s.index))
                                    .join(" + ")}
                            </h2>
                        </div>
                        <small>
                            {options().evaluated} legal champion-role options
                            with recorded capability tags
                        </small>
                    </div>
                    <details class="strategy-method">
                        <summary>How this shortlist is ordered</summary>
                        <p class="strategy-explanation">
                            Ordered by answered draft needs, opponent responses,
                            fewer new concerns, then capability coverage. Ties are
                            alphabetical. Pair comparisons sample the top 12
                            champions; a search pairs up to 12 matches with up to
                            12 other partners. This is a shortlist to examine,
                            not a winrate ranking.
                        </p>
                    </details>
                    <Show when={replacementScreen()?.top.length}>
                        <details class="strategy-method">
                            <summary>
                                DraftGap model screen · {replacementScreen()?.evaluated} legal
                                {" "}{replacementScreen()?.role} replacements
                            </summary>
                            <p class="strategy-explanation">
                                Fixed other nine picks and one role assignment. Highest DraftGap
                                rating indices in the screened legal pool are shown below.
                                The pool follows current bans, established role samples
                                and your available champions.
                                This retrospective model screen does not value the original
                                pick order, future opponent responses or player comfort.
                                The index is not a calibrated win chance.
                            </p>
                            <Show when={currentDraftGap()}>
                                {(rating) => (
                                    <p class="strategy-explanation">
                                        Current pick in this completed draft:{" "}
                                        <strong>{(rating().winrate * 100).toFixed(1)} / 100</strong>
                                        {" "}DraftGap rating index for the choosing team.
                                    </p>
                                )}
                            </Show>
                            <div class="strategy-replacement-list">
                                <For each={replacementScreen()?.top}>
                                    {(entry) => (
                                        <button
                                            class="strategy-button"
                                            onClick={(event) => choosePreview(
                                                compareStrategyOption(
                                                    planning().own,
                                                    planning().enemy,
                                                    [entry.pick],
                                                    planning().current,
                                                ),
                                                event.currentTarget,
                                            )}
                                        >
                                            <strong>{entry.pick.name} · {entry.pick.role}</strong>
                                            <span>{(entry.modelIndex * 100).toFixed(1)} / 100 rating index · {entry.roleGames.toLocaleString()} role games</span>
                                            <Show when={currentDraftGap()}>
                                                {(rating) => (
                                                    <small>
                                                        {((entry.modelIndex - rating().winrate) * 100) >= 0 ? "+" : ""}
                                                        {((entry.modelIndex - rating().winrate) * 100).toFixed(1)} index points vs current pick
                                                    </small>
                                                )}
                                            </Show>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </details>
                    </Show>
                    <Show when={coachWindow()}>
                        {(window) => (
                            <section class="strategy-coach" aria-label="Pick order coach">
                                <span class="strategy-eyebrow">PICK ORDER COACH · {window().label}</span>
                                <For each={window().questions}>
                                    {(question) => <p>{question}</p>}
                                </For>
                                <p>
                                    <strong>Next draft actions: </strong>
                                    {window().nextActions.join(" → ") || "Draft complete after this pick."}
                                </p>
                                <Show when={!window().chronological}>
                                    <small>
                                        Retrospective edit: later picks may already be visible.
                                        This comparison cannot prove what was best with only
                                        the information available at this original slot.
                                    </small>
                                </Show>
                            </section>
                        )}
                    </Show>
                    <label class="strategy-search">
                        Explore a champion
                        <input
                            ref={searchInput}
                            type="search"
                            placeholder="Search legal candidates…"
                            value={candidateSearch()}
                            onInput={(event) =>
                                setCandidateSearch(event.currentTarget.value)
                            }
                        />
                    </label>
                    <Show
                        when={
                            candidateSearch().trim() && windowSteps().length > 1
                        }
                    >
                        <p class="strategy-explanation">
                            Each pair includes a matching champion. Partners can
                            come from the rest of the legal pool.
                        </p>
                    </Show>
                    <Show
                        when={
                            !planning().own.length && !planning().enemy.length
                        }
                    >
                        <p class="strategy-explanation">
                            With no opposing picks, there is no supported
                            counter recommendation yet. These are opening ideas,
                            not the strongest blind picks.
                        </p>
                    </Show>
                    <Show when={options().pairs.length}>
                        <h3>Plan the picks together</h3>
                        <div class="strategy-options">
                            <For each={options().pairs}>
                                {(option) => <OptionCard option={option} />}
                            </For>
                        </div>
                    </Show>
                    <h3>Shortlist from recorded role profiles</h3>
                    <div class="strategy-options">
                        <For
                            each={options().singles}
                            fallback={
                                <p>
                                    No legal option with a recorded role capability profile
                                    matches this view. Check bans, roles and the search results below.
                                </p>
                            }
                        >
                            {(option) => <OptionCard option={option} />}
                        </For>
                    </div>
                    <Show when={options().unassessed.length}>
                        <section class="strategy-unassessed" aria-label="Search results with missing role evidence">
                            <h3>Legal picks with missing role evidence</h3>
                            <p class="strategy-explanation">
                                These match your search and are legal for the selected role. They are
                                outside the ranked shortlist because the role capability profile is
                                missing; missing data is not a weakness of the champion.
                            </p>
                            <div class="strategy-options">
                                <For each={options().unassessed}>
                                    {(option) => <OptionCard option={option} />}
                                </For>
                            </div>
                        </section>
                    </Show>
                    <Show when={activePreview()}>
                        {(option) => (
                            <section
                                class="strategy-preview"
                                ref={previewPanel}
                                tabIndex={-1}
                                aria-label="Pick comparison"
                                aria-live="polite"
                            >
                                <div class="strategy-section-heading">
                                    <h3>
                                        What changes with{" "}
                                        {option()
                                            .picks.map((p) => p.name)
                                            .join(" + ")}
                                        ?
                                    </h3>
                                    <button
                                        class="strategy-button"
                                        onClick={closePreview}
                                    >
                                        Close comparison
                                    </button>
                                </div>
                                <p class="strategy-explanation">
                                    Compared with the current draft
                                    {planning().outgoing
                                        ? `, replacing ${poolByKey().get(planning().outgoing!)?.name ?? planning().outgoing}`
                                        : ", filling the selected open slot(s)"}
                                    . Both teams are reassessed; these are
                                    conditional routes, not a predicted winner.
                                </p>
                                <Show when={option().unassessedPicks.length}>
                                    <p class="strategy-evidence-caveat">
                                        No role capability profile for {option().unassessedPicks.join(", ")}.
                                        Any displayed team plan is based on the other recorded picks.
                                        This comparison cannot establish this pick's theme fit or
                                        counterplay; check the champion kit, build and matchup.
                                    </p>
                                </Show>
                                <Show when={previewRead()}>
                                    {(comparison) => (
                                        <div class="strategy-preview-colors" aria-label="Candidate color reasoning">
                                            <span class="strategy-eyebrow">COLOR IDENTITY OF THIS CHOICE</span>
                                            <For each={option().picks}>
                                                {(candidate) => {
                                                    const picked = () => comparison().after.blue.picks.find((pick) => pick.key === candidate.key);
                                                    const evidence = () => {
                                                        const pick = picked();
                                                        return pick ? strategyColorEvidence(pick) : undefined;
                                                    };
                                                    const fit = () => strategyThemeFits(comparison().after.blue)
                                                        .find((entry) => entry.key === candidate.key);
                                                    return (
                                                        <div class="strategy-preview-color">
                                                            <strong>{candidate.name}</strong>
                                                            <Show when={evidence()} fallback={<small>No reviewed color profile for this role.</small>}>
                                                                {(entry) => (
                                                                    <>
                                                                        <StrategicColorChips
                                                                            english
                                                                            colors={entry().profile.colors
                                                                                .filter((color) => color.assignment === "main")
                                                                                .map((color) => color.color)}
                                                                        />
                                                                        <p>{entry().profile.reasoning}</p>
                                                                        <small>{colorProvenance(entry())}</small>
                                                                    </>
                                                                )}
                                                            </Show>
                                                            <small><strong>Theme fit: {fit()?.label ?? "Unconfirmed"}.</strong> {fit()?.reason}</small>
                                                        </div>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                    )}
                                </Show>
                                <Show when={sameSlotChoice()}>
                                    {(alternative) => (
                                        <section class="strategy-choice-compare" aria-label="Same-slot pick comparison">
                                            <div class="strategy-section-heading">
                                                <div>
                                                    <span class="strategy-eyebrow">WHY THIS PICK NOW?</span>
                                                    <h4>Compare the same draft slot</h4>
                                                </div>
                                                <button class="strategy-button" onClick={(event) => choosePreview(alternative(), event.currentTarget)}>
                                                    Inspect alternative →
                                                </button>
                                            </div>
                                            <p class="strategy-explanation">Both choices use the same visible draft state and legal slot window. This shortlist compares supported changes; it does not prove either pick wins more games.</p>
                                            <div class="strategy-choice-grid">
                                                <ChoiceSummary label="SELECTED CHOICE" option={option()} samples={previewDraftGapPicks()} />
                                                <ChoiceSummary label="SHORTLIST ALTERNATIVE" option={alternative()} samples={alternativeDraftGapPicks()} />
                                            </div>
                                            <Show when={previewDraftGapPicks()?.length && alternativeDraftGapPicks()?.length}>
                                                <small class="strategy-choice-sample-note">
                                                    DraftGap rates are rank-adjusted estimates; game
                                                    counts are samples. They do not predict this
                                                    unfinished draft or isolate a pick's effect.
                                                </small>
                                            </Show>
                                            <Show when={previewDraftGap() && alternativeDraftGap()}>
                                                <div class="strategy-choice-rating" aria-label="DraftGap same-slot rating comparison">
                                                    <strong>Complete-draft rating index</strong>
                                                    <p>
                                                        Selected {(previewDraftGap()!.winrate * 100).toFixed(1)} / 100
                                                        {" · "}Alternative {(alternativeDraftGap()!.winrate * 100).toFixed(1)} / 100
                                                    </p>
                                                    <small>
                                                        Same opponents and pick window, with the candidate
                                                        choice changed.
                                                        This is a DraftGap model comparison, not a calibrated
                                                        win chance or a proven effect of the pick.
                                                    </small>
                                                </div>
                                            </Show>
                                        </section>
                                    )}
                                </Show>
                                <Show when={coachWindow()?.chronological && coachWindow()?.nextOpponentPick && !coachWindow()?.bansBeforeReply.length}>
                                    <section class="strategy-replies" aria-label="Possible opponent replies">
                                        <span class="strategy-eyebrow">NEXT OPPONENT PICK · {coachWindow()?.nextOpponentPick}</span>
                                        <h4>Replies to stress-test</h4>
                                        <p class="strategy-explanation">Legal options screened from recorded capability tags for pressure on your plan. DraftGap role samples use the current patch; matchups use 30 days. Their rates are rank-adjusted estimates, and these scenarios do not predict the opponent's choice.</p>
                                        <div class="strategy-reply-list">
                                            <For each={previewReplies()} fallback={<p>No supported reply surfaced in this bounded screen. Counterplay may still exist.</p>}>
                                                {(reply) => (
                                                    <article>
                                                        <strong>{reply.picks[0].name} · {reply.picks[0].role}</strong>
                                                        <p>{reply.answers.length ? `Answers: ${reply.answers.join("; ")}` : reply.plan ? `Team theme: ${reply.plan}` : "Explore the resulting team plan."}</p>
                                                        <Show when={previewReplyEvidence().get(reply.picks[0].key)}>
                                                            {(sample) => (
                                                                <small>
                                                                    DraftGap: {sample().roleGames.toLocaleString()} role games
                                                                    {sample().roleRate === undefined
                                                                        ? " · rate unavailable"
                                                                        : ` · ${(sample().roleRate! * 100).toFixed(1)}% rank-adjusted rate`}
                                                                    {sample().roleThin ? " · small sample" : ""}
                                                                    {sample().matchups[0]
                                                                        ? ` · ${sample().matchups[0].label}: ${(sample().matchups[0].rate * 100).toFixed(1)}% / ${sample().matchups[0].games.toLocaleString()} games${sample().matchups[0].thin ? " · small sample" : ""}`
                                                                        : ""}
                                                                </small>
                                                            )}
                                                        </Show>
                                                        <Show when={reply.opponentLostPlans.length}>
                                                            <small>Your lost route: {reply.opponentLostPlans.join("; ")}</small>
                                                        </Show>
                                                        <Show when={reply.opponentNewNeeds.length}>
                                                            <small>Your draft must then solve: {reply.opponentNewNeeds.join("; ")}</small>
                                                        </Show>
                                                    </article>
                                                )}
                                            </For>
                                        </div>
                                    </section>
                                </Show>
                                <Show when={coachWindow()?.chronological && coachWindow()?.bansBeforeReply.length && !coachWindow()?.nextOpponentPick}>
                                    <p class="strategy-explanation">The second ban phase comes before another opponent pick. Recheck the reply set after those bans; the current pool cannot establish a final counterpick.</p>
                                </Show>
                                <Show when={previewRead()}>
                                    {(comparison) => (
                                        <div class="strategy-coach-grid" aria-label="Draft coach explanation">
                                            <article class="strategy-coach-card">
                                                <h4>What this choice gains</h4>
                                                <p>
                                                    {comparison().own.answeredNeeds.map((n) => n.title).join("; ") ||
                                                        "No previously identified team need is fully answered."}
                                                </p>
                                                <Show when={comparison().own.gainedPlans.length}>
                                                    <p>New route: {comparison().own.gainedPlans.map((p) => p.title).join("; ")}</p>
                                                </Show>
                                                <Show when={comparison().opponent.newNeeds.length}>
                                                    <p>Opponent must now solve: {comparison().opponent.newNeeds.map((n) => n.title).join("; ")}</p>
                                                </Show>
                                            </article>
                                            <article class="strategy-coach-card">
                                                <h4>What it costs or reveals</h4>
                                                <p>
                                                    {[
                                                        ...comparison().own.newNeeds.map((n) => n.title),
                                                        ...comparison().own.lostPlans.map((p) => `Lost route: ${p.title}`),
                                                        ...option().roleCommitments,
                                                    ].join("; ") || "No new obligation or lost route is established."}
                                                </p>
                                                <Show when={comparison().opponent.answeredNeeds.length}>
                                                    <p>Opponent gains an answer: {comparison().opponent.answeredNeeds.map((n) => n.title).join("; ")}</p>
                                                </Show>
                                            </article>
                                            <article class="strategy-coach-card">
                                                <h4>Win condition and response</h4>
                                                <p>{comparison().after.blue.plans[0]?.win ?? "A shared win route is not established yet."}</p>
                                                <p><strong>Requires: </strong>{comparison().after.blue.plans[0]?.requires ?? "More picks or role evidence."}</p>
                                                <p><strong>Opponent can test: </strong>{comparison().after.blue.plans[0]?.answer ?? "Compare legal replies as the draft continues."}</p>
                                            </article>
                                            <article class="strategy-coach-card">
                                                <h4>Timing and resources</h4>
                                                <For each={comparison().after.blue.timeline.slice(0, 3)} fallback={<p>No supported timing route yet.</p>}>
                                                    {(phase) => <p><strong>{phase.phase}: </strong>{phase.action} {phase.check}</p>}
                                                </For>
                                            </article>
                                        </div>
                                    )}
                                </Show>
                                <Show when={previewDraftGap()}>
                                    {(rating) => (
                                        <section class="strategy-coach-stats" aria-label="DraftGap statistical baseline">
                                            <h4>DraftGap statistical baseline</h4>
                                            <p>
                                                Complete-draft rating index for the choosing team:
                                                {" "}{(rating().winrate * 100).toFixed(1)} / 100.
                                                This is not a calibrated win probability.
                                            </p>
                                            <small>
                                                Rating contributions · champions {(
                                                    rating().allyChampionRating.totalRating -
                                                    rating().enemyChampionRating.totalRating
                                                ).toFixed(0)} · duos {(
                                                    rating().allyDuoRating.totalRating -
                                                    rating().enemyDuoRating.totalRating
                                                ).toFixed(0)} · matchups {rating().matchupRating.totalRating.toFixed(0)}.
                                                Positive values favor the choosing team within this rating model.
                                            </small>
                                        </section>
                                    )}
                                </Show>
                                <Show when={previewDraftGapPicks()?.length}>
                                    <section class="strategy-coach-stats" aria-label="DraftGap pick samples">
                                        <h4>DraftGap pick samples</h4>
                                        <p class="strategy-explanation">
                                            Current-patch role sample; duo and matchup samples use the
                                            30-day dataset. The percentages are DraftGap's rank-adjusted
                                            rates; game counts show sample size. They are not raw win
                                            rates, a pick's isolated value or an unfinished-draft forecast.
                                        </p>
                                        <small>
                                            {rankStatus().active} · patch {dataset()?.version} ·
                                            current-patch snapshot {dataset()?.date
                                                ? new Date(dataset()!.date).toLocaleDateString()
                                                : "date unknown"}
                                        </small>
                                        <For each={previewDraftGapPicks()}>
                                            {(entry) => (
                                                <div class="strategy-sample-pick">
                                                    <strong>{entry.champion} · {entry.role}</strong>
                                                    <p>
                                                        Role: {entry.roleGames.toLocaleString()} games
                                                        {entry.roleRate === undefined
                                                            ? " · rate unavailable"
                                                            : ` · ${(entry.roleRate * 100).toFixed(1)}% rank-adjusted rate`}
                                                        {entry.roleThin ? " · small sample" : ""}
                                                    </p>
                                                    <For each={entry.duos}>
                                                        {(sample) => (
                                                            <p>Duo {sample.label}: {(sample.rate * 100).toFixed(1)}% · {sample.games.toLocaleString()} games{sample.thin ? " · small sample" : ""}</p>
                                                        )}
                                                    </For>
                                                    <For each={entry.matchups}>
                                                        {(sample) => (
                                                            <p>Matchup {sample.label}: {(sample.rate * 100).toFixed(1)}% · {sample.games.toLocaleString()} games{sample.thin ? " · small sample" : ""}</p>
                                                        )}
                                                    </For>
                                                </div>
                                            )}
                                        </For>
                                    </section>
                                </Show>
                                <Show when={previewRead()}>
                                    {(comparison) => (
                                        <details class="strategy-comparison-detail">
                                            <summary>Full before and after comparison</summary>
                                            <div class="strategy-claims">
                                            <ComparisonTeam
                                                label={`${planning().isBlue ? "Blue" : "Red"} · team choosing`}
                                                before={
                                                    comparison().before.blue
                                                }
                                                after={comparison().after.blue}
                                                changes={comparison().own}
                                                comparable={
                                                    comparison().comparable
                                                }
                                            />
                                            <ComparisonTeam
                                                label={`${planning().isBlue ? "Red" : "Blue"} · opponent response`}
                                                before={comparison().before.red}
                                                after={comparison().after.red}
                                                changes={comparison().opponent}
                                                comparable={
                                                    comparison().comparable
                                                }
                                            />
                                            </div>
                                        </details>
                                    )}
                                </Show>
                                <p>
                                    <strong>Still open: </strong>
                                    {option().remaining.join("; ") ||
                                        "No further need triggered by the current rules. Check the plan conditions."}
                                </p>
                                <p>
                                    <strong>Trade-off: </strong>
                                    {previewRead()?.after.blue.plans[0]
                                        ?.requires ??
                                        "Role and capability coverage remains incomplete."}
                                </p>
                                <Show when={option().roleCommitments.length}>
                                    <p>
                                        <strong>
                                            Flex options committed:{" "}
                                        </strong>
                                        {option().roleCommitments.join("; ")}
                                    </p>
                                </Show>
                                <div class="strategy-claims">
                                    <For each={option().risks}>
                                        {(claim) => <Claim claim={claim} />}
                                    </For>
                                </div>
                                <Show when={previewMechanics()}>
                                    {(report) => (
                                        <StrategyMechanicsPanel
                                            report={report()}
                                        />
                                    )}
                                </Show>
                                <p class="strategy-explanation">
                                    Preview only. The actual draft has not
                                    changed.
                                </p>
                            </section>
                        )}
                    </Show>
                </section>
            </Show>
            <details class="strategy-limits">
                <summary>What this read knows — and still needs</summary>
                <For each={[review().blue, review().red]}>
                    {(team, i) => (
                        <div>
                            <h4>{i() ? "Red" : "Blue"} evidence gaps</h4>
                            <For each={team.unknowns}>
                                {(gap) => <p>{gap}</p>}
                            </For>
                        </div>
                    )}
                </For>
                <p>
                    Lane priority, actual item builds, player champion pools and
                    effective spell reach are not fully modeled. Live Draft is
                    analyzed through an explicit snapshot, never silently merged
                    with the main draft.
                </p>
                <p>
                    Source dataset:{" "}
                    {rankStatus().active ?? "mixed / unavailable"} · patch{" "}
                    {dataset()?.version} ·{" "}
                    {dataset()?.date
                        ? new Date(dataset()!.date).toLocaleDateString()
                        : "date unknown"}
                    . 30-day dataset: {dataset30Days()?.version}. Requested
                    rank: {rankStatus().requested}.
                </p>
            </details>
        </section>
    );
}
