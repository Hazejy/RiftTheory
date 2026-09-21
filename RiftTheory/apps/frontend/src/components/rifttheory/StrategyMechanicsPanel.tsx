import { For, Show } from "solid-js";
import {
    MECHANICS_DATA_VERSION,
    MECHANICS_REVIEW_DATE,
    type reviewStrategyMechanics,
} from "../../utils/strategyMechanics";
import { ChampionIcon } from "../icons/ChampionIcon";

export default function StrategyMechanicsPanel(props: {
    report: ReturnType<typeof reviewStrategyMechanics>;
}) {
    return (
        <section class="strategy-mechanics" aria-label="Ability checks">
            <div class="strategy-section-heading">
                <h3>Abilities that change the plan</h3>
                <small>
                    {props.report.covered}/{props.report.total} champions with a
                    reviewed ability note
                </small>
            </div>
            <p class="strategy-explanation">
                Read both sides of the exchange. These are conditional planning
                checks, not proven counters or extra winrate points.
            </p>
            <Show when={!props.report.sameVersion}>
                <p role="status" class="strategy-mechanics-warning">
                    Kit source: Data Dragon {MECHANICS_DATA_VERSION}. The active
                    dataset version differs or is unavailable. Recheck mechanics
                    for that patch; these notes have not been revalidated for
                    it.
                </p>
            </Show>
            <div class="strategy-claims">
                <For
                    each={props.report.checks}
                    fallback={
                        <p class="strategy-explanation">
                            {props.report.valid
                                ? "No reviewed ability check matches these picks yet. Missing coverage is not evidence that a champion lacks an answer."
                                : "Resolve duplicate picks or conflicting roles before comparing abilities."}
                        </p>
                    }
                >
                    {(check) => (
                        <article class="strategy-claim">
                            <div class="strategy-evidence-heading">
                                <ChampionIcon
                                    championKey={check.holder.key}
                                    size={32}
                                />
                                <div>
                                    <span class="strategy-eyebrow">
                                        {check.side === "own"
                                            ? "Your team's tool"
                                            : "Opponent's tool"}
                                    </span>
                                    <p class="strategy-mechanic-ability">
                                        {check.holder.name} · {check.ability}
                                    </p>
                                </div>
                            </div>
                            <h4>{check.title}</h4>
                            <p>
                                <strong>Interpretation: </strong>
                                {check.implication}
                            </p>
                            <small>
                                {check.trigger === "ally"
                                    ? "Potential partners to check: "
                                    : "Relevant opposing picks to check: "}
                                {check.related.map((p) => p.name).join(", ")}
                            </small>
                            <details>
                                <summary>
                                    Ability fact, conditions & counterplay
                                </summary>
                                <p>
                                    <strong>Kit fact: </strong>
                                    {check.fact}
                                </p>
                                <p>
                                    <strong>Requires: </strong>
                                    {check.requires}
                                </p>
                                <p>
                                    <strong>Possible response: </strong>
                                    {check.answer}
                                </p>
                                <p>
                                    <strong>Do not assume: </strong>
                                    {check.limit}
                                </p>
                                <a
                                    class="strategy-link"
                                    href={check.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Riot ability data · {MECHANICS_DATA_VERSION}
                                </a>
                                <p class="strategy-source-line">
                                    Source read {MECHANICS_REVIEW_DATE}. Draft
                                    implications are RiftTheory interpretations,
                                    not Riot counter ratings.
                                </p>
                            </details>
                        </article>
                    )}
                </For>
            </div>
            <Show when={props.report.uncovered.length}>
                <p class="strategy-explanation">
                    Ability review still missing:{" "}
                    {props.report.uncovered.map((p) => p.name).join(", ")}.
                    These champions remain part of the broader composition
                    analysis.
                </p>
            </Show>
        </section>
    );
}
