# DraftGap benchmark assessment

Assessment date: 2026-09-03

Decision updated: 2026-09-04, following the user's explicit request to adopt
DraftGap as the application foundation. See [the migration guide](../docs/draftgap-base.md).

Repository: <https://github.com/vigovlugt/draftgap>

## Why DraftGap matters

DraftGap is the primary functional benchmark for the first DraftOS draft-analysis
milestone. It already combines champion-role statistics, matchup data, ally
synergies, role prediction, draft suggestions, and a usable web and desktop
experience.

## Technical snapshot

The reviewed repository uses an MIT license and a TypeScript monorepo built
with Bun and Turbo. Its frontend uses SolidJS and Vite, with Tauri for the
desktop application. A shared core package contains draft analysis, ratings,
risk settings, role prediction, damage distribution, and statistical models.

The dataset application combines Riot Data Dragon metadata with role,
matchup, synergy, build, and game-count observations obtained from LoLalytics.
Role probabilities are derived from observed games across possible roles.

## Reuse decision

DraftOS now adopts a pinned copy of the full DraftGap source under `draftgap/`.
This supersedes the initial decision to use it only as a benchmark. Its UI and
statistical core provide the main application; our explainable coaching layer
is added incrementally. The earlier Python core and React prototype are preserved.
The upstream copyright and MIT license are retained and the import is recorded
in [third-party notices](../THIRD_PARTY_NOTICES.md).

## Items requiring independent validation

- permission and stability of automated third-party data collection;
- fixed statistical priors used for small samples;
- conversion of combined ratings into estimated win probabilities;
- patch, rank, queue, and region normalization;
- matchup and synergy double-counting;
- calibration against unseen matches and future patches;
- behavior for rare and off-meta role samples;
- optional League Client integration and Riot policy compliance.

No automated test files were found in the original reviewed snapshot. The initial
fork was checked with type checking, a production build and a brief browser check,
without a new test suite or manual test loop. These checks do not validate the
statistical model; independent mathematical review and calibration remain future work.

## DraftOS differentiation

DraftOS aims to match the practical value of statistical draft analysis while
adding:

- explainable Composition Debt;
- contextual capability access and denial;
- Draft Optionality and credible flex-pick analysis;
- Draft Robustness under adverse responses;
- player- and team-specific Execution Fit;
- falsifiable coaching hypotheses;
- plan-versus-execution review;
- long-term coaching memory;
- evidence-based practice optimization.

## First DraftOS Draft Lab milestone

Input:

- allied and opposing picks;
- unresolved and assigned roles;
- observed role samples with full data context;
- player champion pools and role experience.

Output:

- likely role assignments;
- flex-pick credibility with sample evidence;
- matchup and synergy evidence;
- composition capability coverage and debt;
- uncertainty and data limitations;
- multiple options with understandable trade-offs.
