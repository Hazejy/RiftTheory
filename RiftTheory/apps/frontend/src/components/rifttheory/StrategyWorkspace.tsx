import {
    createEffect,
    createMemo,
    createSignal,
    For,
    Show,
    untrack,
} from "solid-js";
import { assessObservedRoles } from "@draftgap/core/src/role/flex-evidence";
import type { Role } from "@draftgap/core/src/models/Role";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
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
import { ChampionIcon } from "../icons/ChampionIcon";
import { RoleIcon } from "../icons/roles/RoleIcon";
import StrategicColorChips from "./StrategicColorChips";
import StrategyMechanicsPanel from "./StrategyMechanicsPanel";
import { reviewStrategyMechanics } from "../../utils/strategyMechanics";
import {
    reviewStrategy,
    compareStrategyDraft,
    strategyOptions,
    strategyColorEvidence,
    STRATEGY_ROLES,
    type StrategyClaim,
    type StrategyOption,
    type StrategyPick,
    type TeamStrategy,
} from "../../utils/strategyReview";
import "./strategyWorkspace.css";

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
    return (
        <article class="strategy-team" data-side={props.side}>
            <div class="strategy-team-heading">
                <span>{props.side} Side</span>
                <small>
                    {props.team.picks.length}/5 picks · {props.team.scenarios}{" "}
                    role scenarios
                </small>
            </div>
            <h3>
                {props.team.plans[0]?.title ??
                    "A shared plan is not established yet"}
            </h3>
            <p>
                {props.team.plans[0]?.win ??
                    "Add picks or resolve their roles to identify how this team can create and convert an advantage."}
            </p>
            <Show when={props.team.plans[0]}>
                {(plan) => (
                    <>
                        <div class="strategy-condition">
                            <span>Make it work</span>
                            <p>{plan().requires}</p>
                        </div>
                        <div class="strategy-condition">
                            <span>Opponent's best question</span>
                            <p>{plan().answer}</p>
                        </div>
                    </>
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
    const { dataset, dataset30Days, rankStatus } = useDataset();
    const { allyDraftAnalysis } = useDraftAnalysis();
    const { setCurrentDraftView } = useDraftView();
    const { knowledge, championForKey } = useRiftTheoryKnowledge();
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
        const candidates = pool().flatMap((p) =>
            p.possibleRoles.map((role) => ({ ...p, role })),
        );
        const unavailable = [
            ...(live()?.unavailable[current.isBlue ? "ally" : "opponent"] ??
                []),
            ...(current.outgoing ? [current.outgoing] : []),
        ];
        return strategyOptions(
            current.own,
            current.enemy,
            candidates,
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
            <span>
                {props.option.answers.length
                    ? `Adds an answer: ${props.option.answers.join("; ")}.`
                    : props.option.plan
                      ? `Explore: ${props.option.plan}.`
                      : "Explore this role assignment."}
            </span>
            <small>
                {props.option.remaining.length
                    ? `Still needs: ${props.option.remaining.slice(0, 2).join("; ")}`
                    : "Check conditions and enemy replies before locking."}
            </small>
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
            </div>
            <div class="strategy-team-grid">
                <TeamPlan side="Blue" team={review().blue} />
                <TeamPlan side="Red" team={review().red} />
            </div>
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
                                        · reviewed patch{" "}
                                        {p.coaching?.patch_version ?? "unknown"}
                                    </small>
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
                                                {c.source_key}
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
                            with capability evidence
                        </small>
                    </div>
                    <p class="strategy-explanation">
                        Ordered by answered draft needs, fewer new concerns,
                        then capability coverage. Ties are alphabetical. Pair
                        comparisons sample the top 12 champions; a search pairs
                        up to 12 matches with up to 12 other partners. This is a
                        shortlist to examine, not a winrate ranking.
                    </p>
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
                    <div class="strategy-options">
                        <For
                            each={options().singles}
                            fallback={
                                <p>
                                    No supported legal options found. Check
                                    bans, role assignments and dataset samples.
                                </p>
                            }
                        >
                            {(option) => <OptionCard option={option} />}
                        </For>
                    </div>
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
                                <Show when={previewRead()}>
                                    {(comparison) => (
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
                <Show
                    when={
                        !live() &&
                        review().complete &&
                        typeof statistical() === "number" &&
                        Number.isFinite(statistical())
                    }
                >
                    <p>
                        Separate statistical estimate: Blue{" "}
                        {(statistical()! * 100).toFixed(1)}% · Red{" "}
                        {((1 - statistical()!) * 100).toFixed(1)}%. Strategy
                        does not adjust this estimate.
                    </p>
                </Show>
            </details>
        </section>
    );
}
