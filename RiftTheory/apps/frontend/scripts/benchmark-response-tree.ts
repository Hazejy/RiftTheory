/** Reproducible CPU benchmark against the shipped RiftTheory role evidence. */
import knowledge from "../public/data/rifttheory-knowledge.json";
import { DATASET_VERSION } from "@rifttheory/core/src/models/dataset/Dataset";
import { parseDataset } from "../src/api/dataset-loader";
import { responseSequence, searchDraftResponse, searchPendingBans, type DraftState, type SearchConfig } from "../src/utils/draftResponseTree";
import { buildStrategyPool, strategyRoleCandidates } from "../src/utils/strategyPool";
import { compareStrategyOption, STRATEGY_ROLES, type StrategyPick } from "../src/utils/strategyReview";

const shippedPool: StrategyPick[] = knowledge.champions.flatMap((champion) =>
    STRATEGY_ROLES.filter((role) => champion.capabilities.some((capability) =>
        capability.role === role && !["deprecated", "outdated", "rejected"].includes(capability.review_status) && capability.strength > 0,
    )).map((role) => ({
        key: champion.riotKey, name: champion.name, role, possibleRoles: [role],
        knowledge: champion as StrategyPick["knowledge"],
    })),
);
const ranked = process.argv.includes("--ranked");
const dataset = ranked ? parseDataset(await (async () => {
    const url = `https://bucket.draftgap.com/datasets/v${DATASET_VERSION}/current-patch.json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Ranked dataset request failed: ${response.status}`);
    return response.json();
})()) : undefined;
const byKey = new Map(shippedPool.map((pick) => [pick.key, pick.knowledge]));
const pool = dataset
    ? strategyRoleCandidates(buildStrategyPool(dataset, (key) => byKey.get(key)))
    : shippedPool;
const order = responseSequence("blue");
const slotRole = STRATEGY_ROLES;

function scenario(side: "blue" | "red", slot: number, variant = 0): DraftState {
    const cursor = order.findIndex((step) => step.kind === "pick" && step.side === side && step.slot === slot);
    const picks: DraftState["picks"] = { blue: [], red: [] };
    const used = new Set<string>();
    for (const step of order.slice(0, cursor)) {
        if (step.kind !== "pick") continue;
        const pick = pool.filter((candidate) => candidate.role === slotRole[step.slot] &&
            !used.has(candidate.key))[variant];
        if (!pick) throw new Error(`Missing benchmark pick for ${step.side} ${step.slot}`);
        picks[step.side].push(pick);
        used.add(pick.key);
    }
    return {
        patch: dataset?.version ?? knowledge.metadata.latestPatch?.version ?? "unknown", context: "solo",
        rank: dataset ? "emerald_plus" : "benchmark", region: "all",
        datasetId: dataset ? `ranked:${dataset.version}:${dataset.date}` : `shipped:${knowledge.metadata.generatedAt}`,
        firstPick: "blue", cursor, picks, bans: [], pool,
        unavailable: { blue: [], red: [] },
    };
}

const observations: { variant: number; config: string; ms: number; truncated: boolean }[] = [];
for (const variant of process.argv.includes("--matrix") ? [0, 1, 2] : [0])
for (const side of ["blue", "red"] as const) for (let slot = 0; slot < 5; slot++) {
    const state = scenario(side, slot, variant);
    const enemy = side === "blue" ? "red" : "blue";
    const choice = pool.filter((pick) => pick.role === slotRole[slot] &&
        !state.picks.blue.some((used) => used.key === pick.key) &&
        !state.picks.red.some((used) => used.key === pick.key))[variant];
    if (!choice) throw new Error(`Missing candidate for ${side} ${slot}`);
    for (const config of [
        { pickBeam: 2, banBeam: 1, maxNodes: 96 },
        { pickBeam: 2, banBeam: 2, maxNodes: 256 },
    ] satisfies SearchConfig[]) {
        const option = compareStrategyOption(state.picks[side], state.picks[enemy], [choice]);
        const start = performance.now();
        const line = searchDraftResponse(state, option, config);
        const ms = Math.round(performance.now() - start);
        observations.push({ variant, config: `${config.pickBeam}/${config.banBeam}/${config.maxNodes}`,
            ms, truncated: line?.stopReason === "node_cap" });
        console.log(JSON.stringify({ slot: `${side[0].toUpperCase()}${slot + 1}`, variant,
            dataset: dataset ? `${dataset.version}:${dataset.date}` : "shipped role evidence",
            pool: new Set(pool.map((pick) => pick.key)).size,
            config, ms,
            nodes: line?.nodes, screened: line?.screenedActions,
            supported: line?.supportedActions, status: line?.status,
            stop: line?.stopReason, tradeoffs: line?.branchTradeoffs,
        }));
    }
}

for (const config of [...new Set(observations.map((item) => item.config))]) {
    const samples = observations.filter((item) => item.config === config);
    const times = samples.map((item) => item.ms).sort((a, b) => a - b);
    console.log(JSON.stringify({ summary: config, cases: samples.length,
        p95Ms: times[Math.ceil(times.length * 0.95) - 1], maxMs: times.at(-1),
        nodeCaps: samples.filter((item) => item.truncated).length }));
}

const beforeSecondBans = scenario("red", 3);
beforeSecondBans.cursor = order.findIndex((step) =>
    step.kind === "ban" && step.side === "red" && step.slot === 3);
const banStart = performance.now();
const banTree = searchPendingBans(beforeSecondBans,
    { pickBeam: 2, banBeam: 2, maxNodes: 64 });
console.log(JSON.stringify({ phase: "pending second bans",
    dataset: dataset ? `${dataset.version}:${dataset.date}` : "shipped role evidence",
    ms: Math.round(performance.now() - banStart), nodes: banTree?.nodes,
    lines: banTree?.lines.length, truncated: banTree?.truncated,
    supported: banTree?.supportedActions, screened: banTree?.screenedActions,
}));
