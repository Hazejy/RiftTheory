# Strategy workspace rebuild — implementation and evidence log

Work dates: 2026-09-19–20. This is a tested first implementation, not a claim of
complete coaching coverage or a solved draft game. No release was published.

## What changed

- Strategy is a full-width workspace with its own compact, editable role roster.
- Team routes, enabling conditions and opponent replies are separate from the
  statistical win estimate. Alternative routes are expandable.
- Interactions, early/mid/late checkpoints, lane/jungle questions and color
  provenance have separate views. Unassessed priority is never declared won.
- Each main-draft pick slot supports a replacement or its consecutive pick
  window. Pairs are legal simultaneous role assignments, not two independent
  recommendations. Previews do not lock picks or overwrite the draft.
- Live Draft has an explicit **Analyze game** handoff. The session-only snapshot
  includes current bans, mode, team identities and previous completed-game
  restrictions. Main draft remains separate. Refresh requires another handoff.
- Normal, team/global Fearless and Ironman use the existing series lock engine.
  Future and incomplete history games are excluded. Pending bans are visible.

## Primary-source research

The interviews are contextual methodology, not validation of a numeric model.
No author name is used as the product's branding or as a claim of endorsement.

### Video: how draft choices constrain later choices

[LS — How I analyze drafts, C9 vs EG](https://www.youtube.com/watch?v=asA77GBD7NY).
Accessed 2026-09-19 through the browser's YouTube transcript export. English,
auto-generated captions. Inspected the draft segment, approximately 00:00–14:30;
did not claim to watch the full recording or verify the ensuing gameplay.

Methodological observations: the 02:20–03:20 discussion considers responding
without committing the remaining composition too early. Around 04:40–06:15,
an isolated mid matchup is criticized for conflicting with the initial carry
plan. Around 09:10–12:20, jungle choices are evaluated through economy and the
remaining top-lane options. Around 13:15, actual player champion access is
explicitly uncertain. These support checking dependencies, preserving options
and comparing alternatives. Historical champion rankings, off-role suggestions
and item/patch claims were not imported as current facts. Automatic captions
mis-transcribe names; they are not a reviewed champion-mechanics dataset.

The other supplied videos were opened, but transcript export reported no
transcript available. Their content has **not** been silently inferred:

- [Complete drafting guide](https://www.youtube.com/watch?v=ohjVSB-WPjU)
- [Video dxSPqbGnTQw](https://www.youtube.com/watch?v=dxSPqbGnTQw)
- [MTG colors and draft identities](https://www.youtube.com/watch?v=T5MFmezx5ow)
- [Draft Kingdom 2, T1 vs Damwon](https://www.youtube.com/watch?v=oZJkwtLHbDE)
- [Draft Kingdom, KT vs HLE](https://www.youtube.com/watch?v=U9uzF-7zGos)

### Interviews rechecked

- [Inven Global interview, 2021-03-29](https://www.invenglobal.com/articles/13666/part-2-of-talking-with-ls-riot-saved-my-life-with-this-game-i-was-homeless-i-was-struggling-i-didnt-have-anywhere-to-go-back-to): direct text accessible. Context, timing and execution requirements matter; a game's result alone does not establish decision quality. Applied as conditional plans, not a copied verdict.
- [Hotspawn interview, 2025-06-09](https://www.hotspawn.com/league-of-legends/news/fly-ls-interview): direct page returned 403; indexed primary Q&A was readable. Specific responses and champion dependencies inform iterative draft planning. This does not establish a universal color-counter matrix.

### Official mechanics checks and limits

[Vi](https://www.leagueoflegends.com/en-us/champions/vi/),
[Janna](https://www.leagueoflegends.com/en-us/champions/janna/),
[Soraka](https://www.leagueoflegends.com/en-us/champions/soraka/), and
[Xerath](https://www.leagueoflegends.com/en-us/champions/xerath/) official pages
were opened. The extracted text exposes only some ability descriptions, not
complete kits. In particular, no claim that Janna interrupts Vi's ultimate was
derived from these pages. The generic protection interaction explicitly requires
checking the actual spell, legal target and follow-up timing. No champion profile
file was overwritten during this rebuild.

## Inference boundaries

1. Enumerate injective role assignments. Use only capabilities shared by every
   feasible role; role-specific timings wait until the role is resolved.
2. Observed flex candidates use the active ranked dataset and existing sample
   gates. An explicit user assignment is allowed but does not invent evidence.
3. Disengage alone may describe self-escape. Team protection requires peel or
   anti-dive evidence. Sustain remains conditional on who receives the healing.
4. One incidental poke provider does not establish an entire poke composition.
   A side-laner cannot simultaneously count as their own remaining group.
5. Initiators may follow each other. The rules do not require a separate
   non-engage label for the second champion's follow-up.
6. Mixed/unknown damage profiles block a single-resistance warning. Missing
   timing data cannot imply uncontested late-game superiority.
7. Candidate ordering is lexicographic: addressed needs, fewer new concerns,
   coverage, alphabetical tie-break. Pairs use a bounded top-12-champion pool.
   This is not an exhaustive search, player-pool model or probability estimate.
8. Main/off colors remain evidence labels, never fixed counter points. Provisional
   and patch-unknown profiles remain visibly provisional.

## Verification and remaining work

- Added synthetic counterexamples plus a full draft against shipped champion data.
- Added tests for all ten main-draft windows and detached live-series restrictions,
  including side swaps and Fearless/Ironman history.
- TypeScript and targeted lint passed; production frontend build passed. Build
  retains a bundle-size warning (roughly 924 KB main JS before compression).
- Browser checks: main draft Vi/Janna response, full ten-pick draft, game-plan and
  color views, candidate search, preview invalidation after changing slots,
  live Ahri ban exclusion and separation from main-draft candidates. Layout
  inspected at 1440×1000 and 390×844; no document horizontal overflow at either.
- Native packaged desktop runtime and installer have not been rebuilt/tested in
  this pass. Browser verification is not a substitute for a native smoke test.
- Detailed spell reach, actual item/rune breakpoints, dependable lane-priority
  evidence, player pools, broader champion coaching coverage, translations and
  outcome calibration remain follow-up work. Existing pick-order conventions
  differ between the main Draft and Live Draft engines; this adapter preserves
  each engine rather than silently rewriting saved series.

The previous Strategy component remains in the repository for comparison, but
the application now mounts StrategyWorkspace. The old component is not claimed
to be reviewed or modernized by this change.

## Ability-specific checks and detail-window hardening (2026-09-20)

Added a separate, offline-bundled `strategyMechanics` layer with an initial
reviewed ability note for Vi, Poppy, Morgana, Sivir, Janna, Soraka, Anivia and
Orianna. This is **not** a complete kit review or a spell-interaction simulator.
Public ability descriptions were read from Riot Data Dragon 16.18.1, for example:

- [Vi](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Vi.json)
- [Poppy](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Poppy.json)
- [Morgana](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Morgana.json)
- [Sivir](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Sivir.json)
- [Janna](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Janna.json)
- [Soraka](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Soraka.json)
- [Anivia](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Anivia.json)
- [Orianna](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Orianna.json)

The UI separates the paraphrased kit fact from editorial implications, required
conditions, the other side's response and unsupported assumptions. Each card
links its exact versioned source. A different or unknown active dataset version
shows a revalidation warning. No runtime request is needed to read these notes.
Notes cover both teams and candidate previews, without modifying pick rankings,
statistical winrates, user champion profiles or draft state.

Regression cases cover self-only versus allied protection, conditional dash
stopping (never inferred Vi-R cancellation), resource-limited healing, allied
ball delivery, version mismatch, unknown kits, illegal drafts and side reversal.
Frontend/core suite: 67 passing tests; TypeScript, targeted ESLint and production
build passed (existing bundle-size warning remains).

The candidate-detail dialog previously lived inside each virtualized table cell.
It now has a single controlled owner in DraftTable, with the selected evidence
snapshot retained independently of row remounts, reordering and async updates.
Dismiss/Escape clears the selection and restores focus to champion search.
The reported one-second disappearance was not reproduced in the development
browser before the change; the lifecycle vulnerability was removed rather than
claiming that this was a confirmed native-runtime diagnosis. After the change,
Malphite Top stayed visible through an extended open period and viewport resize;
Escape and reopening Malphite Mid were verified. Native packaged desktop testing
and installer generation remain separate, uncompleted steps.

The built frontend was also served locally and the same Malphite window remained
visibly open, then closed through its dismiss button; no console errors were
reported. Nested table buttons no longer propagate Enter into row-pick behavior:
only Enter on the row itself activates the row. This prevents opening a detail
button with the keyboard from accidentally drafting that champion.
Verified by opening Malphite Top with Enter: the dialog opened while the next
pick remained R2 and the draft retained only Vi and Janna. Ability cards were
also checked for both team perspectives and an Anivia candidate preview.

## Additional conditional ability notes (2026-09-20)

Read the existing uncommitted implementation and tests before extending it.
Reviewed the shipped capability/coaching records for the four additions; those
records remain unchanged. Read these official, versioned Riot JSON responses
directly (the web extraction tool could not retrieve them):

- [Thresh W](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Thresh.json): a nearby shield and an ally-activated dash to Thresh. The planning note requires lantern access, an active click and a useful destination; it does not assume a cleanse or verified interaction with dash denial.
- [Alistar Q/W](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Alistar.json): nearby knock-up and target knockback. Reserving control for protection versus using it to initiate is editorial reasoning. No guaranteed combo or named dash interruption is asserted.
- [Kindred R](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Kindred.json): temporary death prevention in the zone and healing at its end. Enemy beneficiaries are explicit; this does not imply damage/CC immunity or verified objective interactions.
- [Nami E](https://ddragon.leagueoflegends.com/cdn/16.18.1/data/en_US/champion/Nami.json): a temporary allied attack/spell buff with magic damage and slow. Successful contact is a condition, not proof of a named lane pairing, winning trade or lane priority.

The cards now label their main paragraph **Interpretation** and the opposing
option **Possible response**. Kit facts, conditions, limitations and exact
source links remain separately readable. Thresh/Nami checks require another
allied recipient; Alistar requires an evidenced opposing entry threat; Kindred
does not depend on an inferred opponent damage tag. None change candidate
rankings, statistical estimates, role evidence or saved champion profiles.

Six additional regression tests cover allied recipients and side reversal,
lantern access, conditional Alistar control, both-team Kindred protection,
Nami contact requirements and integration with shipped champion identities.
Frontend/core: 73 tests pass; workspace TypeScript and targeted ESLint pass.

### Native production-build verification

`tauri build --no-bundle` completed successfully, including the Vite production
build and optimized Rust executable. The initial sandboxed attempt hit a file
access restriction; the approved build outside the sandbox succeeded. The
existing main-bundle warning remains (938.61 kB minified, 305.22 kB gzip).

Tested the executable in `apps/frontend/src-tauri/target/release/RiftTheory.exe`,
not the older installed copy: the UI launch helper initially selected the
installed app, so it was closed and the exact build path was launched and
verified against the running process. Build SHA-256:
`D940E80E218DB7F1A055A245C7D263D6652433F8016E4695A7807261639AEEED`.

In the native WebView, Malphite Top's response-plan details remained visible
for 61 seconds, including a change from the initial 1600-wide window to a
maximized 1920-wide window. Escape dismissed the dialog, with the draft still
empty and the next pick still B1. This checks the current build's behavior;
it does not establish the cause of the originally reported disappearance.
No installer was generated, no release was created, and nothing was pushed.

## Both-team comparisons and searched pairs (2026-09-21)

The preview now compares the actual current draft with the proposed draft for
both sides. A replacement retains the outgoing champion in the baseline, so
lost plans and newly introduced needs are visible rather than measuring only
against an artificially empty slot. Existing protection is not reported as a
newly answered need. Opposing plans are recomputed against the proposed picks.

Champion search now anchors a pair instead of removing every nonmatching partner.
The ordinary top-12 pool remains unchanged without a query. Search uses up to
12 matching champions plus up to 12 other partners, preserving their legal role
variants; every returned pair contains a match. This remains a bounded shortlist.

Six new regression tests cover searched partners and anchors outside the ordinary
shortlist, legality constraints, flex assignments, replacement losses, opposing
responses, unchanged protection and input immutability. Frontend/core suite:
79 passing tests. Workspace TypeScript, targeted ESLint and the production
frontend build passed. The existing main-bundle warning remains (941.47 kB
minified, 308.30 kB gzip).

UI verification of these latest changes was not completed: the browser connector
was unavailable, then Computer Use stopped because it could not determine the
current browser URL on Windows with enough confidence to enforce policy. No
native rebuild or installer was produced for the September 21 changes. Earlier
native verification above applies only to its recorded September 20 build.

The user subsequently requested a GitHub handoff for another/local AI. The source,
tests and this evidence log are being preserved on a dedicated development
branch, with continuation instructions in `docs/strategy-handoff.md`.

## Replacement consistency and invalid-draft handling (2026-09-21, second pass)

Replacement candidate ranking and badges now use the same actual-current-draft
baseline as the expanded comparison. The previous slot-empty baseline could
credit an already-present protection tool as a new answer, or claim a flex was
newly committed even though the outgoing champion already fixed that role.
The remaining roster still supplies legality and coverage checks; a replacement
removes precisely the selected slot, not every occurrence of its champion key.

The strategy review now exposes duplicate champions and unsupported/conflicting
role assignments explicitly. Both teams' plans, claims, needs and timelines are
withheld in that state. Candidate search checks the remaining roster and opponent
before recommending picks. Replacing the source of a conflict remains possible,
but comparisons against an invalid baseline do not invent gained/lost plans or
answered needs. Empty slots alone do not invalidate a draft. Explicit assignment
can resolve missing observed-role evidence without inventing capability evidence.

Opening a preview now focuses and scrolls to the comparison, marks the selected
card and restores focus on dismissal. Draft changes clear the stored preview,
preventing it from reappearing merely because the user returns to the old state.
These focus/scroll changes still require a visual/keyboard smoke test.

Seven new tests cover replacement ordering and badge consistency, pre-existing
flex commitments, cross-team duplicate picks, conflicting enemy roles, missing
role samples versus empty drafts, conflict-repair replacements and invalid full
drafts. The frontend/core suite passes 86 tests (336 assertions); workspace
TypeScript passed. No champion-mechanics claims or sources were changed.

Final targeted ESLint passed with `--max-warnings 0`; frontend TypeScript was
rechecked after the focus callback adjustment. `tauri build --no-bundle` then
successfully built the final source, including the Vite production assets and
optimized Windows executable. Existing bundle-size warning: 943.39 kB main JS,
306.65 kB gzip. The executable is a local build artifact, not a GitHub release
asset or tracked source file. It has not received a new interactive smoke test;
the focus/scroll behavior and narrow-screen layout remain explicit handoff tasks.

Final local executable SHA-256:
`B48420C8AC3416C3A7A0FCCC946CB4CD0445FD2DB6B4AF20BD7088DD7CC47EAF`.
