import { For } from "solid-js";
import { readStrategyDeck } from "../../utils/strategyDeckComparison";
import type { TeamStrategy } from "../../utils/strategyReview";

export default function StrategyDeckComparison(props: { blue: TeamStrategy; red: TeamStrategy }) {
    const blue = () => readStrategyDeck(props.blue);
    const red = () => readStrategyDeck(props.red);
    const rows = () => blue().capabilities.map((capability, index) => ({
        label: capability.label,
        blue: capability,
        red: red().capabilities[index],
    }));
    return (
        <details class="strategy-deck-comparison">
            <summary>Compare both decks · tools, costs and missing evidence</summary>
            <p>Recorded role capabilities indicate possible tools, not matchup wins. An empty cell means unconfirmed, not absent.</p>
            <div class="strategy-deck-columns" aria-label="Draft deck comparison">
                <div class="strategy-deck-capability-head">Tool</div>
                <div class="strategy-deck-capability-head">Blue · {blue().kitCoverage} kit profiles</div>
                <div class="strategy-deck-capability-head">Red · {red().kitCoverage} kit profiles</div>
                <For each={rows()}>{(row) => <>
                    <strong>{row.label}</strong>
                    <span>{row.blue.status === "recorded" ? row.blue.champions.join(", ") : "Unconfirmed"}</span>
                    <span>{row.red.status === "recorded" ? row.red.champions.join(", ") : "Unconfirmed"}</span>
                </>}</For>
            </div>
            <div class="strategy-deck-details">
                <For each={[["Blue", blue()], ["Red", red()]] as const}>{([side, deck]) =>
                    <article data-side={side}>
                        <h3>{side} deck · {deck.plan}</h3>
                        <dl>
                            <dt>Core enablers</dt><dd>{deck.enablers.join(", ") || "Unconfirmed"}</dd>
                            <dt>Connection to core plan unconfirmed</dt><dd>{deck.unconnected.join(", ") || "None identified"}</dd>
                            <dt>Damage</dt><dd>{deck.damage}</dd>
                            <dt>Farm and resources</dt><dd>{deck.resources}</dd>
                            <dt>Power windows</dt><dd>{deck.timing}</dd>
                            <dt>Role information</dt><dd>{deck.flex}</dd>
                            <dt>Needs next</dt><dd>{deck.next}</dd>
                            <dt>What breaks it</dt><dd>{deck.breaks}</dd>
                        </dl>
                        <small>Coaching profiles: {deck.coachingCoverage}. Current patch and matchup verification remain separate.</small>
                    </article>
                }</For>
            </div>
        </details>
    );
}
