# Draft outcome study — 23 September 2026

## What is available now

[ChainCC Open Data](https://chaincc.lol/free/data) publishes professional match
team and player CSVs under CC BY 4.0. The 2026 season export was downloaded and
copied to the gitignored local `data/runtime/pro/` directory, **not committed**.
Its stated schema has two team
rows and ten player rows per game. Team rows carry picks, bans, result, date,
league and patch; player rows carry the actual champion-role assignment and
player identity. [Their methodology](https://chaincc.lol/about/methodology)
says the underlying historical draft source is Oracle's Elixir and explicitly
distinguishes retrospective draft scores from validated win probabilities.

The local audit (`research/audit-chaincc-drafts.ts`) found:

| Check | Result |
| --- | ---: |
| Team rows / player rows | 18,408 / 92,040 |
| Distinct games | 9,204 |
| Games with two opposite results, ten matching players and five roles per side | 9,204 |
| Dates | 2025-07-29 to 2026-09-22 |
| Team rows missing at least one ban | 339 |
| Patch 16.18 games | 102 |

Downloaded file SHA-256 values: team file
`1CE11DF7DB239F7D976FE852F55B41B09AB3FE36C410BF63DBADDFC028F702AE`;
player file
`CB555A1FAA172371204EE31FB6F4B04E9F0CE5CEB13337CD80C5DA0B2665479E`.
The 2026 *season* file includes some games dated 2025; calendar year and season
must not be conflated. The 16.18 sample is too small for thousands of
free-standing champion-pair parameters.

To reproduce the local checks from the workspace root:

```powershell
bun research/audit-chaincc-drafts.ts data/runtime/pro/chaincc-teams-2026.csv.gz data/runtime/pro/chaincc-players-2026.csv.gz
bun research/backtest-pro-draft.ts data/runtime/pro/chaincc-teams-2026.csv.gz data/runtime/pro/chaincc-players-2026.csv.gz
```

Riot's [Match-V5 API](https://developer.riotgames.com/apis) can provide match
outcomes for ranked play, but collection requires an API key. Riot's
[portal documentation](https://developer.riotgames.com/docs/portal) says
development keys expire every 24 hours; public products need a production key.
Riot's [LoL security guidance](https://developer.riotgames.com/docs/lol)
requires keys to stay out of a distributed binary. The present desktop app has
no source of individual Solo Queue match outcomes. The user selected **both**;
professional and Solo Queue probabilities must be estimated and validated
separately.

## First held-out experiment

`research/backtest-pro-draft.ts` joins the audited exports, constructs only
features known before game start and compares regularized logistic models:
side alone, prior team results, prior player results and champion familiarity,
champion-role picks, pair/matchup terms, and bans. Team and player strength use
only **earlier dates**. Feature vocabulary is learned
only from training. A chronological training/validation/test split has seven-day
embargoes. The validation set chooses the model; the test set is read once for
that selected model. Postgame kills, gold, objectives and game length are never
features. Probabilities are fitted on validation and measured with log loss,
Brier score and ten-bin calibration error on test.

| Cohort | Games | Dates |
| --- | ---: | --- |
| Train | 6,189 | before 2026-06-29 |
| Validation | 1,234 | after first embargo, before 2026-08-11 |
| Test | 1,353 | from 2026-08-18 |

The lowest validation log loss was **0.6218** for the prior-team/player model
(including prior player-champion familiarity). Its raw test log loss was
**0.6326**, Brier score **0.2216**, accuracy **63.3%**, and ten-bin calibration
error **0.0233**. Validation log loss for the champion-role model *with* these
prior team/player features was **0.6294** at penalty 0.01; adding sparse
synergy and matchup terms gave **0.6506**. A champion-role-only model (no team
or player strength) gave **0.6859**. These are outcomes of this simple experiment, not a
universal ranking of possible models. The game count, hyperparameter search and
one time split limit precision; ten-bin calibration error is noisy and does not
prove individual predictions are well calibrated. The pro team model is also
inapplicable to the app's ordinary Solo Queue draft without team history.

**Decision:** do not present this experiment as the app's draft win probability
or use it to choose picks. It currently measures prior team/player strength better
than the incremental value of its draft features. Retain the existing UI's
explicitly uncalibrated rating index until a draft-aware model beats strong
baselines out of time and in the intended queue.

The Solo Queue path is being prepared independently in
`research/collect-riot-soloq.ts`. It samples a specified rank page through
League-V4 and fetches queue-420 Match-V5 games with throttling and retry. The
normalizer rejects remakes, missing roles and inconsistent results; it stores
only draft/context/outcome fields and pseudonymizes player IDs under an ignored
local runtime directory. Four focused data/collector tests pass. A user-run EUW
Diamond collection now contains **489 distinct, structurally valid ranked
games** in `data/runtime/soloq/euw1-DIAMOND-I.jsonl` (72 on patch 16.18,
129 on 16.17, 139 on 16.16, with the rest spread across seven other patches).
This is a pipeline and data-quality pilot, not a representative or sufficiently
large training cohort. The key was entered locally and removed from that shell
after collection; it must stay out of source, chat and the distributed app.

## Path to a serious draft model

1. Obtain a licensed, recent Solo Queue match-outcome sample through Riot
   Match-V5 for the app's ranked use case, and keep a separate pro cohort. Save
   source, collection time, queue, rank, region, patch and match ID. Deduplicate
   games, validate five legal roles and account for remake/abnormal games.
2. Precompute **pregame-only** player familiarity, team strength where relevant,
   champion-role priors, matchup and synergy estimates using strictly earlier
   games. Use hierarchical shrinkage across patches and sparse pairs. Add bans,
   side, flex ambiguity and series restrictions when observed and valid.
3. Treat scaling, engage, protection, wave access, resources and MTG-inspired
   color identities as candidate features or conditional explanations. Test each
   feature family by held-out ablation. Color labels and a commentator's draft
   judgment are not measured outcomes and receive no automatic numeric weight.
   Never use the evaluated game's duration, gold or later objectives as draft
   inputs.
4. Compare against side, champion-only and pregame skill baselines on rolling
   future patches, separate leagues/ranks/regions and side swaps. Report log
   loss, Brier, calibration curves, confidence intervals and coverage. Reject
   a more complex model if it fails to improve a strong baseline reliably.
5. For incomplete drafts, model *legal future picks and bans*. Estimate opponent
   responses from an observed draft policy, and search a bounded alternating
   game tree with role, ownership, Fearless and player-pool constraints. Expose
   scenarios and uncertainty. This is an approximation to adversarial draft
   planning, **not a solved Nash equilibrium or a proven causal pick effect**.

The user supplied images summarizing an LS Draft Kingdom video. The visible
sections concern ban decisions, a Skarner transition, probabilistic draft
thinking, green/white color language, cohesion and FlyQuest's Galio response.
These are useful hypotheses for option preservation and response planning; the
images are not match outcome data or verified video transcript. Detailed
mechanical claims still need a readable source and patch check.

## Solo Queue pilot audit — 24 September 2026

`research/audit-riot-soloq.ts` independently checks the saved normalized rows
for unique match IDs, legal role and champion assignments, opposing results,
valid timestamps and pseudonymous player keys. It prints aggregate counts only:

```powershell
bun research/audit-riot-soloq.ts data/runtime/soloq/euw1-DIAMOND-I.jsonl
```

The existing local EUW1 file contains **489 unique, structurally valid games**,
zero duplicate rows, and 4,101 distinct pseudonymous players. Dates run from
2026-05-08 to 2026-09-23; Blue won 215 of 489 games. Monthly counts are May 4,
June 36, July 73, August 267, September 109. Patch counts are 16.9: 2,
16.10: 2, 16.12: 12, 16.13: 51, 16.14: 43, 16.15: 38, 16.16: 139,
16.17: 129, 16.18: 72, 16.19: 1. The file was seeded from an EUW Diamond I
ladder page; **the matches themselves are not all verified Diamond I matches**.
The 4,101 players are not necessarily 4,101 independent observations; players
and matches can recur across the sample.

As a feasibility check, an illustrative chronological split with seven-day
gaps would give 265 train games before 25 August, 32 validation games from
1–7 September, and 60 test games from 15 September onward. The validation
cohort is entirely patch 16.17; 59 of the 60 test games are patch 16.18.
The remaining 132 games lie outside those windows. This is too small and
patch-confounded for comparing several draft feature families or fitting a
calibration curve. No Solo Queue win-probability model was trained or exposed
in the app from this pilot. New collector rows now record the seed ladder's
platform, tier, division, page and collection time; the earlier 489 rows lack
that per-row provenance. The next collection should cover more ladder pages,
regions and rank strata and retain separate future-patch test cohorts. This
requires a valid Riot API key kept outside the repository and distributed binary.

`research/collect-riot-campaign.ts` now automates consecutive ladder pages
through the existing rate-limited, resumable collector. For example,
`bun research/collect-riot-campaign.ts euw1 DIAMOND I 1 10 25 20 --plan`
shows the ten-page plan without network calls or a key. Omit `--plan` only
after setting `RIOT_API_KEY` privately in the local shell. Each page remains
sequential, and rerunning skips already saved match IDs. The key is never a
command-line argument or written to the dataset. A wider study still needs
deliberate rank, region and patch sampling; running more pages of one seed
cohort alone does not make the sample representative.
