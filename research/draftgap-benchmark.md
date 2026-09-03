# DraftGap benchmark assessment

Assessment date: 2026-09-03

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

DraftOS will use DraftGap as:

- a functional benchmark;
- a research source for data structures and statistical approaches;
- a possible source for selectively reused MIT-licensed code;
- a comparison system for future DraftOS evaluations.

DraftOS will not adopt the full repository as its foundation. The initial
DraftOS decision and coaching engine remains an independently tested Python
codebase. Any substantial code reuse must preserve the DraftGap copyright and
MIT license notice and be recorded in third-party notices.

## Items requiring independent validation

- permission and stability of automated third-party data collection;
- fixed statistical priors used for small samples;
- conversion of combined ratings into estimated win probabilities;
- patch, rank, queue, and region normalization;
- matchup and synergy double-counting;
- calibration against unseen matches and future patches;
- behavior for rare and off-meta role samples;
- optional League Client integration and Riot policy compliance.

No automated test files were found in the reviewed repository snapshot. Any
concept or implementation adopted by DraftOS must therefore receive its own
tests and mathematical documentation.

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

