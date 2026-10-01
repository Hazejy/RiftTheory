import { createSignal, For } from "solid-js";
import type { DraftPlayerPool } from "@rifttheory/core/src/draft/player-pool";
import { resolveChampionNames, type StrategyPlayerPools } from "../../utils/strategyPlayerPools";

const roles = ["top", "jungle", "mid", "bot", "support"] as const;
type Side = "blue" | "red";

export default function StrategyPlayerPoolPanel(props: {
    pools: StrategyPlayerPools;
    champions: readonly { key: string; name: string }[];
    onChange: (pools: StrategyPlayerPools) => void;
}) {
    const [error, setError] = createSignal("");
    const player = (side: Side, role: string) => props.pools[side].find((entry) => entry.id === `${side}-${role}`);
    const names = (keys?: readonly string[]) => keys?.map((key) =>
        props.champions.find((champion) => champion.key === key)?.name ?? key,
    ).join(", ") ?? "";
    const change = (side: Side, role: string, field: "name" | "source" | "roles" | "availableChampionKeys" | "comfortableChampionKeys", value: string) => {
        let nextValue: string | string[] | undefined = value.trim();
        if (field === "roles") {
            const requested = value.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
            if (!requested.length || requested.some((entry) => !roles.includes(entry as typeof roles[number]))) {
                setError("Use one or more of: top, jungle, mid, bot, support.");
                return;
            }
            nextValue = [...new Set(requested)];
        }
        if (field === "availableChampionKeys" || field === "comfortableChampionKeys") {
            const resolved = resolveChampionNames(value, props.champions);
            if (resolved.unknown.length) {
                setError(`Unknown champion: ${resolved.unknown.join(", ")}. Use names from the active dataset.`);
                return;
            }
            nextValue = value.trim() ? resolved.keys : undefined;
        }
        setError("");
        const current = player(side, role) ?? {
            id: `${side}-${role}`, name: "", roles: [role], source: "Manual entry",
            updatedAt: "unknown", confidence: "self_reported" as const,
        };
        const updated: DraftPlayerPool = { ...current, [field]: nextValue,
            updatedAt: new Date().toISOString().slice(0, 10) };
        const others = props.pools[side].filter((entry) => entry.id !== updated.id);
        const keep = Boolean(updated.name || updated.availableChampionKeys?.length || updated.comfortableChampionKeys?.length);
        props.onChange({ ...props.pools, [side]: keep ? [...others, updated] : others });
    };
    return (
        <details class="strategy-player-pools">
            <summary>Player pools and comfort</summary>
            <p>Optional solo queue profiles. Available champions are a hard limit for that player's role. Blank means unknown. Comfort is shown as reported information and does not create a bonus in the search.</p>
            <div class="strategy-player-pool-sides">
                <For each={["blue", "red"] as const}>{(side) => (
                    <section aria-label={`${side} player pools`}>
                        <h3>{side === "blue" ? "Blue" : "Red"} players</h3>
                        <For each={roles}>{(role) => (
                            <div class="strategy-player-pool-row">
                                <strong>{role}</strong>
                                <label>Player name
                                    <input type="text" value={player(side, role)?.name ?? ""}
                                        onChange={(event) => change(side, role, "name", event.currentTarget.value)} />
                                </label>
                                <label>Possible roles, comma separated
                                    <input type="text" value={player(side, role)?.roles.join(", ") ?? role}
                                        onChange={(event) => change(side, role, "roles", event.currentTarget.value)} />
                                </label>
                                <label>Available champions, comma separated
                                    <input type="text" value={names(player(side, role)?.availableChampionKeys)}
                                        onChange={(event) => change(side, role, "availableChampionKeys", event.currentTarget.value)} />
                                </label>
                                <label>Comfortable champions, comma separated
                                    <input type="text" value={names(player(side, role)?.comfortableChampionKeys)}
                                        onChange={(event) => change(side, role, "comfortableChampionKeys", event.currentTarget.value)} />
                                </label>
                                <label>Source
                                    <input type="text" value={player(side, role)?.source ?? "Manual entry"}
                                        onChange={(event) => change(side, role, "source", event.currentTarget.value)} />
                                </label>
                                <small>Self reported · updated {player(side, role)?.updatedAt ?? "unknown"}</small>
                            </div>
                        )}</For>
                    </section>
                )}</For>
            </div>
            {error() && <p role="alert">{error()}</p>}
        </details>
    );
}
