# Internal claim-to-source ledger

Access date for all external sources: 2026-09-04. Dates below are publication
dates where known, not inferred from search crawl ages. User-facing synthesis:
draft-intelligence-review.md. Metadata-only records do not support content claims.

| Claim | Source / publisher / date | URL or local reference | Access / confidence / gaps |
| --- | --- | --- | --- |
| Sheet definitions, main/off and historical Anivia/Xerath Blue entries | MTG Color Spreadsheet; community contact named Rübezahl; undated | https://docs.google.com/spreadsheets/d/1ea8M5VYR6qNS005Hd6DyplX9Z5UZOjmYYxzpTgyueF0/edit?gid=0#gid=0 | Direct public CSV retrieved through PowerShell export endpoint. High for contents; official LS authorship and patch validity unverified. |
| Context, timings, execution, pivots and process vs result | LS interview; David Jang / Daniel Kwon, Inven Global; 2021-03-29 | https://www.invenglobal.com/articles/13666/part-2-of-talking-with-ls-riot-saved-my-life-with-this-game-i-was-homeless-i-was-struggling-i-didnt-have-anywhere-to-go-back-to | Full interview text; parent tool reference turn31view0, relevant lines 47–76. High for LS's expressed views, not empirical validation. |
| Specific combinations/responses matter | LS interview; Nicholas James, Hotspawn; 2025-06-09 | https://www.hotspawn.com/league-of-legends/news/fly-ls-interview | Indexed Q&A read directly by parent, turn33search0. Direct page unavailable. No general counter matrix. |
| Video 1 exists / metadata | Eravohn Rname archive upload; 2019-10-05 | https://www.youtube.com/watch?v=T5MFmezx5ow | Search metadata in research lane. Title: LS Explains MTG Colors and Draft Identities in LoL + Goes Through a Mock Draft! Parent page read failed. Not watched, no transcript. |
| Video 2 exists / metadata | Uploader unverified; 2020-04-27 | https://www.youtube.com/watch?v=Qj3JV5CeLBk | Lane read public player metadata. Title: LS, Matthew Foulkes, and PVDDR discuss MTG colors in relation to LoL - Part 1. Caption body empty; not watched. |
| Additive model, logistic transform, shrinkage | Local DraftGap fork; inspected 2026-09-04 | ../draftgap/packages/core/src/draft/analysis.ts ; ../draftgap/packages/core/src/rating/ratings.ts ; ../draftgap/packages/core/src/risk/risk-level.ts | Parent independently read implementations; high. No predictive calibration established. |
| Candidate scoring and game-count rate proxy | Local DraftGap fork | ../draftgap/packages/core/src/draft/suggestions.ts | Read by both lanes/main in task context; high. No actual seven-day sample claim. |
| Top role assignment used, not full uncertainty | Local fork | ../draftgap/apps/frontend/src/contexts/DraftAnalysisContext.tsx ; ../draftgap/apps/frontend/src/contexts/DraftSuggestionsContext.tsx | Parent independently checked .at(0)/[0] selection and suggestion calls. High for current inspected path. |
| Calibration, reliability diagrams and Brier limitations | scikit-learn developers; living docs, date unspecified | https://scikit-learn.org/stable/modules/calibration.html | Parent references turn31view1, turn32view3. Actual relevant paragraphs read. General method only. |
| Leakage and train/test separation | scikit-learn developers; living docs | https://scikit-learn.org/stable/common_pitfalls.html#data-leakage | Parent reference turn32view4; actual guidance read. |
| Future-before-past splitting is inappropriate | scikit-learn developers; living docs | https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html | Parent reference turn32view1 and research lane. Irregular match events need explicit temporal windows. |
| Recommendation preference differs from win benefit | Tiffany D. Do et al.; arXiv / IEEE CoG 2020; 2020-06-17 | https://arxiv.org/abs/2006.10191 | Abstract/provenance, turn32view0; not full methods. Only preliminary preference result used. |
| Static data versions may lag / differ regionally | Riot Games developer docs; living documentation | https://developer.riotgames.com/docs/lol#data-dragon | Parent reference turn33view1, lines 293–308. High for published guidance; no product approval. |
| Counter schema, scenario advice and roadmap | RiftTheory synthesis; 2026-09-04 | ../draftgap/apps/frontend/src/locales/colorGuide.ts ; draft-intelligence-review.md | Explicit recommendations/hypotheses. No verified current counter strengths or numeric weights. |

## Search / reconciliation log

- First wave: LS / MTG / color / draft queries, supplied video and spreadsheet,
  existing local theory notes. General secondary summaries used only for discovery.
- Sheet web-reader failures resolved by a direct public CSV read; no auth bypass.
- Independent bounded lanes: original LS sources; current model plus evaluation
  evidence. Coordinator verified the consequential interview and model passages.
- Follow-up: indexed 2025 interview, calibration/leakage/time-order docs, Riot
  data-version guidance. Newer recommendation preprint was considered by the lane
  but excluded from the core argument because its case evidence is too limited.
- Stop: repeated video/caption access did not produce usable content. Accessible
  sources support the bounded guide/specification; broader video synthesis remains
  incomplete, requiring new source access or user-provided transcripts.
