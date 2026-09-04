# Draft-theory research plan

Audience: Marvin and the RiftTheory implementation team. Date: 2026-09-04.
Decision: improve the learning guide now; specify evidence requirements for later
explainable champion suggestions without claiming calibrated win probabilities.

Assumptions: English engineering documents, EN/KO/ZH UI; historical theory must
be separated from current champion balance. No current champion-color bulk import,
training job, database rollout or predictive scoring implementation in this task.

Source classes: LS's original explanations where accessible; the user-supplied
community spreadsheet; existing DraftGap code; primary statistical/ML research and
Riot documentation for future data and evaluation requirements. Secondary summaries
are discovery aids, not proof of what LS said.

1. Complete — source discovery: sheet CSV, LS interview, video metadata, local model.
2. Complete — checked LS interview text, evaluation guidance and model implementation; video-content access remains a declared gap.
3. Complete — source-labeled guide, canonical synthesis, user-facing review and claim ledger written.
4. Complete for this bounded pass — citations/local links checked; typecheck and
   production build passed; six guide selectors, source links, EN/KO/ZH content,
   themes and persisted theme choice checked in the browser. Video-content review
   remains incomplete, as disclosed in the deliverable.

The session has no callable update_plan tool; this file records the plan instead.

## Initial gap matrix

| Claim family | Evidence | Confidence / gap | Next check |
| --- | --- | --- | --- |
| Color definitions | Supplied sheet's public CSV read directly | High for what this sheet says; authorship/currentness unverified | Compare accessible LS originals |
| Fixed color counters | No complete counter matrix in the sheet's legend | Not established | Look for LS's conditional explanations |
| Main/off and multi-color | Sheet legend and entries | Historical classification only | Keep roles/builds/context explicit |
| Anivia/Xerath access | Both Blue in old sheet; not a matchup verdict | Scenario hypothesis, not measured advantage | Explain reach, setup and counterplay without a score |
| Current suggestions | Existing code | Model scope to inspect | Read inference and candidate evaluation |
| Predictive validity | No RiftTheory validation dataset | Unproven | Specify temporal evaluation and expert review |

## Discovery outcome

The spreadsheet CSV was successfully read directly after the web reader failed.
An actual LS Q&A from 2021 supplies stronger evidence for context and optionality
than secondary color summaries. Video metadata was accessible for some records,
but video/transcript content was not; do not report those videos as watched.
The existing scoring path has no direct strategic-color/context features and uses
one most-likely role assignment. Follow-up focuses on limitations and evaluation,
not additional broad search variants.

## Follow-up / stopping decision

The 2025 Hotspawn LS interview is available as indexed Q&A and corroborates
context-dependent interactions. Scikit-learn calibration/leakage/time-order
documentation and Riot versioned-data guidance were spot-checked directly.
The bounded LS-video retrievals produced metadata, failed page reads or empty
captions, not usable transcripts. Further duplicate attempts are unlikely to
change evidence quality in this pass. Stop discovery; preserve that gap explicitly.
No claim that all LS videos, current matchups, or predictive efficacy were verified.

## Verification and handoff

The user-facing Markdown review matches its canonical source; all six relative
code-reference links resolve. The Markdown artifact was structurally checked,
not exported to a separately rendered document format. Browser visual QA sampled
the guide and palettes, rather than every possible viewport/content combination.
A viewport-constrained main layout was added after the expanded guide exposed
excess vertical growth; the content has its own scroll region.

No automated test suite, public deployment, Git commit or statistical model
changes. The existing large-bundle warning remains. The knowledge gap requiring
new source access is actual LS video content/transcripts; the outcome is not an
exhaustive video review.
