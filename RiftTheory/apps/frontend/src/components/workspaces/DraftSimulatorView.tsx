import { STANDARD_DRAFT_SEQUENCE, type LiveDraftAction } from "@rifttheory/core/src/live-draft/series";
import { analyzeDraft } from "@rifttheory/core/src/draft/analysis";
import type { Role } from "@rifttheory/core/src/models/Role";
import { getTeamComps } from "@rifttheory/core/src/role/role-predictor";
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { useDataset } from "../../contexts/DatasetContext";
import { useRiftTheoryKnowledge } from "../../contexts/RiftTheoryKnowledgeContext";
import { useUser } from "../../contexts/UserContext";
import { buildStrategyPool } from "../../utils/strategyPool";
import { chooseEngineMove, legalSimulatorActions, newSimulatorDraft, type EngineStyle } from "../../utils/draftSimulator";
import { transitionDraft, type DraftAction, type DraftSide, type DraftState } from "../../utils/draftResponseTree";
import { STRATEGY_ROLES, reviewStrategy } from "../../utils/strategyReview";
import { Icon, broadcast, columns } from "../icons/RiftIcons";
import LiveDraftBroadcastStage from "./live-draft/LiveDraftBroadcastStage";
import LiveDraftChampionPool from "./live-draft/LiveDraftChampionPool";
import LiveDraftTeamPanel from "./live-draft/LiveDraftTeamPanel";

type MoveRecord = { action: DraftAction; reason?: string };
type Layout = "classic" | "broadcast";
const sideName = (side: DraftSide) => side === "blue" ? "Blue" : "Red";

export default function DraftSimulatorView() {
    const { dataset, dataset30Days, rankStatus } = useDataset();
    const { config } = useUser();
    const { championForKey } = useRiftTheoryKnowledge();
    const pool = createMemo(() => buildStrategyPool(dataset(), championForKey).filter((pick) => pick.possibleRoles.length));
    const [humanSide, setHumanSide] = createSignal<DraftSide>("blue");
    const [engineStyle, setEngineStyle] = createSignal<EngineStyle>("balanced");
    const [layout, setLayout] = createSignal<Layout>("classic");
    const [state, setState] = createSignal<DraftState>();
    const [moves, setMoves] = createSignal<MoveRecord[]>([]);
    const [history, setHistory] = createSignal<DraftState[]>([]);
    const [search, setSearch] = createSignal("");
    const [selectedKey, setSelectedKey] = createSignal<string>();
    const [error, setError] = createSignal("");
    const [thinking, setThinking] = createSignal(false);

    const step = () => state()?.sequence?.[state()!.cursor];
    const humanTurn = () => step()?.side === humanSide();
    const legal = createMemo(() => state() && humanTurn() ? legalSimulatorActions(state()!) : []);
    const availableKeys = createMemo(() => new Set(legal().map((action) => action.championKey)));
    const champions = createMemo(() => {
        const query = search().trim().toLocaleLowerCase();
        return pool().filter((pick) => !query || pick.name.toLocaleLowerCase().includes(query))
            .map((pick) => ({ key: pick.key, name: pick.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    });
    const selectedActions = createMemo(() => legal().filter((action) => action.championKey === selectedKey()));
    const liveActions = createMemo<LiveDraftAction[]>(() => moves().map(({ action }) => ({
        kind: action.kind, side: action.side, slot: action.slot, championKey: action.championKey,
        teamId: action.side === "blue" ? "team1" : "team2",
    })));
    const review = createMemo(() => state() ? reviewStrategy(state()!.picks.blue, state()!.picks.red) : undefined);
    const result = createMemo(() => {
        const current = state();
        const data = dataset();
        const fullData = dataset30Days();
        if (!current || step() || !data || !fullData) return undefined;
        const composition = (side: DraftSide) => {
            const picks = current.picks[side].map((pick) => {
                const champion = data.championData[pick.key];
                const roleIndex = pick.role ? STRATEGY_ROLES.indexOf(pick.role) : -1;
                return champion && { ...champion, ...(roleIndex >= 0 ? { role: roleIndex as Role } : {}) };
            });
            if (picks.some((pick) => !pick)) return undefined;
            return getTeamComps(picks as NonNullable<(typeof picks)[number]>[]).find(([roles]) => roles.size === 5)?.[0];
        };
        const blue = composition("blue");
        const red = composition("red");
        if (!blue || !red) return undefined;
        const settings = { ignoreChampionWinrates: config.ignoreChampionWinrates, riskLevel: config.riskLevel, minGames: config.minGames };
        const blueRate = analyzeDraft(data, fullData, blue, red, settings).winrate;
        const redRate = analyzeDraft(data, fullData, red, blue, settings).winrate;
        return Number.isFinite(blueRate) && Number.isFinite(redRate) ? { blue: blueRate, red: redRate } : undefined;
    });

    const reset = () => {
        setError(""); setSearch(""); setSelectedKey(undefined); setMoves([]); setHistory([]); setState(undefined);
    };
    const start = () => {
        reset();
        if (pool().length < 20) {
            setError("The current dataset has too few role-eligible champions for a full practice draft.");
            return;
        }
        const initial = newSimulatorDraft(pool(), dataset()?.version ?? "unknown", dataset()?.date ?? "unknown");
        setHistory([initial]); setState(initial);
    };
    const changeSide = (side: DraftSide) => { reset(); setHumanSide(side); };
    const undo = () => {
        const index = moves().findLastIndex((move) => move.action.side === humanSide());
        if (index < 0) return;
        setState(history()[index]);
        setMoves((items) => items.slice(0, index));
        setHistory((items) => items.slice(0, index + 1));
        setSearch(""); setSelectedKey(undefined); setError("");
    };
    const play = (action: DraftAction) => {
        const current = state();
        if (!current || !humanTurn()) return;
        const next = transitionDraft(current, action);
        if (!next) { setError("That move is no longer legal. Choose another champion."); return; }
        setError(""); setSearch(""); setSelectedKey(undefined);
        setMoves((items) => [...items, { action }]);
        setHistory((items) => [...items, next]); setState(next);
    };
    const selectChampion = (key: string) => {
        const actions = legal().filter((action) => action.championKey === key);
        if (actions.length === 1) play(actions[0]);
        else if (actions.length) setSelectedKey(key);
    };
    createEffect(() => {
        const current = state();
        const side = humanSide();
        const style = engineStyle();
        if (!current || !step() || step()!.side === side) { setThinking(false); return; }
        setThinking(true);
        const timer = window.setTimeout(() => {
            const move = chooseEngineMove(current, style);
            if (!move) { setError("Engine has no legal move from this position. Start a new draft."); setThinking(false); return; }
            setMoves((items) => [...items, { action: move.action, reason: move.reason }]);
            setHistory((items) => [...items, move.next]);
            setState(move.next); setThinking(false);
        }, 450);
        onCleanup(() => window.clearTimeout(timer));
    });

    const DraftPool = (props: { compact?: boolean }) => <section class="min-w-0 rounded-xl border border-neutral-800 bg-primary p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h3 class="font-semibold" aria-live="polite">{step() ? `${sideName(step()!.side)} · ${step()!.kind === "pick" ? "Pick" : "Ban"} ${step()!.slot + 1}` : "Draft complete"}</h3>
                <p class="mt-1 text-xs text-neutral-500">{moves().length} / {STANDARD_DRAFT_SEQUENCE.length} draft actions · {step() ? humanTurn() ? "Your turn" : thinking() ? "Engine thinking…" : "Engine turn" : "Both teams complete"}</p>
            </div>
            <span class="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Simulator</span>
        </div>
        <LiveDraftChampionPool champions={champions()} search={search()} disabled={!humanTurn()} compact={props.compact}
            lockReason={(key) => availableKeys().has(key) ? undefined : "unavailable"}
            onSearchChange={(value) => { setSearch(value); setSelectedKey(undefined); }} onSelect={selectChampion} />
        <Show when={selectedKey() && selectedActions().length > 1}>
            <div class="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3">
                <p class="text-sm font-semibold">{pool().find((pick) => pick.key === selectedKey())?.name}: choose a role</p>
                <div class="mt-2 flex flex-wrap gap-2"><For each={selectedActions()}>{(action) =>
                    <button type="button" class="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm hover:border-accent" onClick={() => play(action)}>{action.role ?? "Keep flexible"}</button>
                }</For></div>
            </div>
        </Show>
    </section>;

    return <main class="h-full min-w-0 flex-1 overflow-y-auto bg-canvas px-4 py-3 text-white xl:px-8">
        <div class="mx-auto max-w-[1500px]">
            <header class="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div><p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Practice mode</p><h2 class="mt-1 text-xl font-semibold">Draft Simulator</h2></div>
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" aria-pressed={humanSide() === "blue"} onClick={() => changeSide("blue")} class={`rounded-lg border px-3 py-2 text-sm ${humanSide() === "blue" ? "border-ally text-ally" : "border-neutral-700 text-neutral-400"}`}>Play Blue</button>
                    <button type="button" aria-pressed={humanSide() === "red"} onClick={() => changeSide("red")} class={`rounded-lg border px-3 py-2 text-sm ${humanSide() === "red" ? "border-opponent text-opponent" : "border-neutral-700 text-neutral-400"}`}>Play Red</button>
                    <button type="button" onClick={start} class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black">{state() ? "New draft" : "Start draft"}</button>
                </div>
            </header>
            <section class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-primary px-3 py-2">
                <div class="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span>Patch {dataset()?.version ?? "unknown"} · Ranked {rankStatus().active ?? "fallback"}</span>
                    <span>{pool().length} champions</span>
                    <Show when={state()}><span class="text-neutral-200">You: {sideName(humanSide())} · Engine: {sideName(humanSide() === "blue" ? "red" : "blue")}</span></Show>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-neutral-500">Engine</span>
                    <select aria-label="Engine style" value={engineStyle()} onChange={(event) => setEngineStyle(event.currentTarget.value as EngineStyle)} class="rounded-lg border border-neutral-700 bg-canvas px-2 py-1.5 text-xs text-white">
                        <option value="balanced">Balanced</option><option value="pressure">Pressure</option><option value="flex">Flex</option>
                    </select>
                    <div class="flex rounded-lg border border-neutral-700 bg-canvas p-0.5"><For each={(["classic", "broadcast"] as const)}>{(option) =>
                        <button type="button" title={`${option} layout`} aria-label={`${option} layout`} aria-pressed={layout() === option} onClick={() => setLayout(option)} class={`rounded-md p-1.5 ${layout() === option ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-white"}`}><Icon path={option === "classic" ? columns : broadcast} class="h-4 w-4" /></button>
                    }</For></div>
                    <button type="button" disabled={!moves().some((move) => move.action.side === humanSide())} onClick={undo} class="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 disabled:opacity-30">Undo turn</button>
                </div>
            </section>
            <Show when={error()}><p role="alert" class="mb-3 rounded-lg border border-red-500 p-3 text-sm text-red-300">{error()}</p></Show>
            <Show when={state()} fallback={<section class="rounded-xl border border-neutral-800 bg-primary p-8 text-center text-neutral-300">Choose your side and start a practice draft. Blue makes the first ban.</section>}>
                <Show when={layout() === "classic"} fallback={<div class="grid gap-4"><DraftPool compact /><LiveDraftBroadcastStage blueName={humanSide() === "blue" ? "You" : "Engine"} redName={humanSide() === "red" ? "You" : "Engine"} currentStep={step()} actions={liveActions()} /></div>}>
                    <div class="grid items-stretch gap-3 xl:grid-cols-[240px_minmax(0,1fr)_240px]">
                        <LiveDraftTeamPanel side="blue" teamName={humanSide() === "blue" ? "You" : "Engine"} currentStep={step()} actions={liveActions()} />
                        <DraftPool />
                        <LiveDraftTeamPanel side="red" teamName={humanSide() === "red" ? "You" : "Engine"} currentStep={step()} actions={liveActions()} />
                    </div>
                </Show>
                <Show when={!step()}><section class="mt-4 rounded-xl border border-accent/40 bg-primary p-5" aria-label="Draft result">
                    <p class="text-xs font-semibold uppercase tracking-widest text-accent">Draft complete · predicted winrate</p>
                    <Show when={result()} fallback={<p class="mt-3 text-sm text-neutral-400">Winrate unavailable for this draft and dataset.</p>}>{(rates) => <>
                        <div class="mt-3 grid gap-3 sm:grid-cols-2"><For each={(["blue", "red"] as const)}>{(side) =>
                            <div class="rounded-lg border border-neutral-700 bg-canvas p-4"><p class={side === "blue" ? "text-ally" : "text-opponent"}>{sideName(side)} · {humanSide() === side ? "You" : "Engine"}</p><strong class="mt-1 block text-3xl tabular-nums">{(rates()[side] * 100).toFixed(2)}%</strong></div>
                        }</For></div>
                        <p class="mt-3 text-xs text-neutral-500">Model estimate from the current ranked dataset, using the same draft analysis as the Draft page.</p>
                    </>}</Show>
                </section></Show>
                <Show when={review()}>{(read) => <details class="mt-4 rounded-xl border border-neutral-800 bg-primary p-4"><summary class="cursor-pointer font-semibold">Coach read · {read().title}</summary><p class="mt-2 text-sm text-neutral-400">{read().detail}</p></details>}</Show>
                <details class="mt-4 rounded-xl border border-neutral-800 bg-primary p-4"><summary class="cursor-pointer font-semibold">Move history · {moves().length} / 20</summary>
                    <ol class="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><For each={moves()}>{(move, index) => <li class="rounded border border-neutral-700 p-2"><span>{index() + 1}. {sideName(move.action.side)} {move.action.kind} · {pool().find((pick) => pick.key === move.action.championKey)?.name ?? move.action.championKey}</span><Show when={move.reason}><p class="mt-1 text-xs text-neutral-500">{move.reason}</p></Show></li>}</For></ol>
                </details>
            </Show>
        </div>
    </main>;
}
