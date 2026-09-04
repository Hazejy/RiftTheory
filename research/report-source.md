# RiftTheory — Draft Intelligence Research
## Evidence review and implementation direction · v0.1

**For:** Marvin and the RiftTheory team  
**Date:** 4 September 2026  
**Status:** usable foundation; video-content review remains incomplete.

## Executive answer

Build recommendations around **conditional interactions and executable plans**.
Use colors as a compact description of those plans, not as numerical counter
bonuses. Keep the inherited statistical estimate separate until a new model has
been evaluated independently.

This review supports a better learning guide now and a concrete research backlog
for the future recommendation engine. It does **not** establish that RiftTheory
beats other tools, improves winrate, or reproduces all of LS's teaching.

The app update adds per-color strengths, opposing answers and draft questions,
with definitions separated from our interpretation. It also introduces Obsidian,
Aurora and Nebula themes. It does not train or activate a strategic ranker.

## 1. What the sources actually establish

### LS: context, options and execution

In a published 2021 interview, LS discusses interacting lanes, gold and item
breakpoints, changing strength across game stages, and reducing the burden on the
team executing a draft. He distinguishes theory-optimal choices from choices that
fit the players' actual champion pools. He also criticizes early commitments that
cannot pivot and distinguishes a sound drafting process from a favorable final
composition. These are expert positions, not measured proof of predictive
superiority. [LS interview, Inven Global, 29 March 2021](https://www.invenglobal.com/articles/13666/part-2-of-talking-with-ls-riot-saved-my-life-with-this-game-i-was-homeless-i-was-struggling-i-didnt-have-anywhere-to-go-back-to).

A 2025 interview again uses specific interactions and response thresholds to
explain why combinations matter. This reinforces evaluating the actual threat
and available response rather than relying on labels alone. The relevant Q&A was
accessible through the search index; direct page retrieval failed.
[LS interview, Hotspawn, 9 June 2025](https://www.hotspawn.com/league-of-legends/news/fly-ls-interview).

**Our design inference:** a recommendation should reveal the plan, its enabling
conditions, the opponent's credible answer and the fallback. Do not attribute
our eventual rule schema or ranking weights to LS.

### The supplied spreadsheet: vocabulary, not current balance truth

Its public CSV was read directly. The page identifies a community contact but
does not establish official LS authorship or current patch validity.

| Color | Concise reading of the historical legend |
| --- | --- |
| Red | Early aggression and continued snowball conversion. |
| Green | Synergy, aligned power windows and item timings. |
| Blue | Control, denial, resource management and often time. |
| White | Draft flexibility; an actual game may require one committed mode. |
| Black | Payoff attached to a cost, task or condition. |
| Colorless | A specific theme that shapes the surrounding composition. |

Main colors describe the core identity; off colors are conditional alternatives.
The legend does not supply a complete validated counter matrix. Both Anivia and
Xerath have Blue markings in this old table, illustrating why a shared label alone
cannot settle an interaction. [User-supplied community spreadsheet, undated; accessed 4 September 2026](https://docs.google.com/spreadsheets/d/1ea8M5VYR6qNS005Hd6DyplX9Z5UZOjmYYxzpTgyueF0/edit?gid=0#gid=0).

**Important correction to the initial guide:** Green is not merely “support a
carry”; item timing and coordinated strength matter. White does not promise every
possible function simultaneously. Missing classification is not Colorless.

We did not bulk-import historical champion classifications or label the entire
catalogue as reviewed.

### What was not viewed

| Video lead | Access obtained | What remains |
| --- | --- | --- |
| [LS Explains MTG Colors and Draft Identities in LoL + Goes Through a Mock Draft!](https://www.youtube.com/watch?v=T5MFmezx5ow) | Indexed metadata: Eravohn Rname upload, 5 October 2019. An archive upload, not verified as LS's own channel. | Actual audiovisual content/transcript. |
| [LS, Matthew Foulkes, and PVDDR discuss MTG colors in relation to LoL — Part 1](https://www.youtube.com/watch?v=Qj3JV5CeLBk) | Page/player metadata; 27 April 2020. An English auto-caption track was advertised. | The caption request returned an empty body. No usable transcript or audiovisual review. |

These are a **review queue**, not evidence behind claimed quotations or detailed
interpretations. No invented timestamps, watched-video claims or supposedly
complete LS taxonomy are included. User-provided transcripts or accessible
recordings would materially improve this review.

## 2. What the existing software already does

The local code audit found a genuine statistical starting point:

- Candidate generation considers champion–role pairs, available roles and a
  sample threshold. Its 30-day count scaled by 7/30 is a rate proxy, not an observed
  seven-day sample.
- Draft scoring combines champion base ratings, allied duo residuals and
  cross-team matchup residuals, subtracts enemy base/duo terms, then converts the
  rating to a percentage with an Elo-style logistic function.
- Risk Level changes pseudo-game shrinkage, not strategic aggression.
- Flex assignments are computed, but the main score and suggestion path use the
  highest-ranked assignment rather than propagating all role uncertainty.
- Reviewed colors, effective access, setup, timing and execution conditions are not
  direct inputs to this inspected scoring path.

Evidence: local [candidate generation](../draftgap/packages/core/src/draft/suggestions.ts),
[analysis](../draftgap/packages/core/src/draft/analysis.ts),
[rating transform](../draftgap/packages/core/src/rating/ratings.ts),
[risk shrinkage](../draftgap/packages/core/src/risk/risk-level.ts),
[role assignments](../draftgap/packages/core/src/role/role-predictor.ts) and
[frontend selection of role scenarios](../draftgap/apps/frontend/src/contexts/DraftAnalysisContext.tsx).

**Interpretation:** statistical matchup residuals can indirectly reflect complex
interactions, but they do not explain the mechanism or establish that choosing
an alternative champion would cause a better outcome. A percentage-shaped output
is not proof of calibrated probability.

## 3. A counter must describe a mechanism

The following is our proposed coaching representation, not a sourced LS formula:

| Field | Required question |
| --- | --- |
| Interaction | What action or resource is helped or denied? |
| Preconditions | Which role, items, range, setup and game stage are assumed? |
| Benefit | What practical opportunity could this create? |
| Opposing answer | How could the other team avoid, interrupt or reverse it? |
| Evidence | Who reviewed it, on what patch, using which source or case? |
| Uncertainty | Which premises are unknown or disputed? |

### Worked scenario: wave-clear access

“Anivia has wave clear” describes a capability, not guaranteed execution.
Consider a scenario where Xerath can pressure her approach while staying outside
her effective zone. That could limit access despite the capability. Allied cover,
engage, available cooldowns, wave position or a different approach may reverse
the situation.

This is a **conditional scenario to review**, not a current Anivia-versus-Xerath
counter declaration. No numeric range, winrate, color bonus or patch-specific
verdict is assigned here.

Two further hypotheses worth expert review:

- A forcing plan may exploit missing disengage, but only if it has target access
  and follow-up at the intended timing.
- A scaling plan may benefit from uneventful play, but only relative to what the
  opponent gains and what objectives/resources are being conceded.

For every positive example, preserve an example in which its enabling condition
fails. That gives the future engine a reason to withhold or qualify advice.

## 4. Proposed recommendation architecture

These are engineering recommendations, not implemented features.

1. **Versioned knowledge.** Store champion, role, main/off identity, capabilities,
   enabling/denial conditions, source, evidence type, patch applicability,
   review status and reviewer. Unknown, disputed and stale remain distinct.
2. **Legal candidates and user constraints.** Respect bans, chosen slots, role
   locks and an explicitly supplied player pool. Keep multiple useful candidates.
3. **Plausible role scenarios.** Evaluate credible flex assignments, not only the
   most common assignment. Treat usage shares as observational priors, not proof
   of viability or certainty.
4. **Conditional strategic assessment.** Determine which reviewed rules apply,
   which fail and which have unknown premises. Avoid silently treating unknown
   as favorable or unfavorable.
5. **Separate evidence panels.** Initially show the inherited statistical estimate
   alongside strategic reasons, drawbacks and uncertainty. Do not add arbitrary
   color points into the existing win percentage.
6. **Reply sensitivity.** Compare how a candidate's rationale changes under a
   small, explicitly scoped set of plausible opposing replies. Disclose when this
   is a sampled scenario set, not exhaustive game-tree search.
7. **Learn only after evaluation.** A later model may learn useful weights if it
   improves held-out performance and retains understandable explanations.
   A model should be able to abstain when support is weak.

Suggested future recommendation card:

> Candidate and role — supports the proposed plan.  
> Why: reviewed interaction and evidence.  
> Requires: the setup needed for it to work.  
> Watch out: the opponent's relevant answer.  
> Confidence: evidence quality, role ambiguity and patch freshness.  
> Alternatives: other candidates with different trade-offs.

No training, learned weights, recommendation API, database migration or new
strategic win-probability calculation was introduced in this task.

## 5. How we would know it is getting better

Evaluate different claims separately:

- **Explanation quality:** expert-reviewed cases, contradictory examples, missing
  information, ability to state when a rule does not apply.
- **Prediction quality:** compare the unchanged DraftGap baseline and simpler
  role-strength baselines against the candidate model.
- **Probability calibration:** use reliability diagrams with sample support,
  plus log loss and Brier score. A better Brier score alone does not prove better
  calibration; it also reflects discrimination.
  [scikit-learn, Probability calibration](https://scikit-learn.org/stable/modules/calibration.html).
- **Time validity:** use held-out future timestamp/patch windows. Reconstruct
  statistics as they were available at the pick; do not use subsequent picks or
  later match outcomes. Keep training, tuning and final evaluation separate.
  [Data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage),
  [TimeSeriesSplit](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html).
- **Recommendation usefulness:** do not confuse matching historical player
  choices with improving outcomes. A 2020 champion-recommendation study reports
  a preliminary user preference/enjoyment result, not a demonstrated causal
  winrate increase. Only its abstract and provenance were reviewed here.
  [Do et al., 2020](https://arxiv.org/abs/2006.10191).

Our additional safeguards: prevent duplicate matches across splits; evaluate
relevant queues, ranks and patches separately; review coverage for rare roles;
keep an untouched final evaluation period; do not choose feature weights from
the final test results. Exact acceptance thresholds should be fixed before
examining final outcomes.

## 6. Data and patch handling

Static champion assets are not a strategic knowledge base. Riot documents Data
Dragon as versioned static data and notes that updates can lag a patch and that
regional client versions can differ. Store source-data version separately from
the patch on which a strategic interpretation was reviewed.
[Riot Games, Data Dragon documentation](https://developer.riotgames.com/docs/lol#data-dragon).

Recommended future storage separates:

- raw, timestamped statistical snapshots;
- curated strategic claims and their sources;
- role observations and their sample context;
- reviewed example drafts and failure cases;
- versioned evaluations and recommendation outputs.

SQLite is a reasonable future local implementation choice for this structure,
not a requirement established by this research. Public-release data licensing,
client-integration behavior and Riot policy compliance remain separate review
gates; this report is not product approval.

## 7. Next useful work package

Before ML, build a small **reviewable knowledge-and-case package**:

- a structured claim schema with conditions and provenance;
- a representative set of complete and partial drafts, including counterexamples;
- reviewed reach/setup/timing interactions across several composition plans;
- a read-only explanation prototype that leaves the statistical baseline intact;
- an agreed review process in which Marvin's draft expertise is recorded as
  expert judgement, separately from measured evidence.

Then evaluate candidate explanations before deciding whether to combine them
numerically. The product's quality should come from specific, testable reasoning,
not the appearance of precision.

## Limits and research stopping point

This was a targeted evidence review, not an exhaustive study of all LS content.
Video metadata, failed reads and empty captions cannot establish video claims.
No current-patch champion taxonomy, all-matchup counter map, professional-player
consensus, causal recommendation benefit or live winrate lift was established.

The accessible interviews, sheet legend and code audit are sufficient for the
bounded guide update and architecture direction. Further duplicate searches were
unlikely to fix the video-access gap; actual transcripts and reviewed draft cases
are the highest-value next evidence.

