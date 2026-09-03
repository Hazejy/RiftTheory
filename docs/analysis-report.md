# Analysis report v1

`--format json` serializes the existing domain assessments. It adds no scoring,
win-probability model, matchup inference or automatic review. The current
transports are CLI stdout and the local `POST /api/analyze` endpoint.

## Contract

- `schema_version`: integer `1`; consumers should check it.
- `analysis_type`: `baseline_capability_check`.
- `is_demo`: true when the default demo picks were selected. This describes
  selection mode, not whether the champion data is fictional.
- `limitations`: human-readable cautions, not machine-readable status codes.
- `champions`: records in selected order, with `champion_name`, `role`, sorted
  `capabilities`, `capability_source`, and `strategy`.
- `strategy`: null means no role-matched assessment exists. Otherwise it contains
  sorted `main_colors` and `off_colors`, verbatim `reasoning` and `source_name`,
  nullable `source_url` and `patch`, and `review_status`.
- `capability_assessments`: sorted baseline capabilities, each with `capability`,
  `providers` (names in selection order), and boolean `is_missing`.

Unknown metadata stays null; it is not replaced with a guessed patch or empty
string. An assessed colorless identity is an object containing `colorless`, not
null. Strategic review status applies only to that strategic assessment, not
the independently curated capabilities. A blank off-color list records no off
colors; it does not prove that none could apply in other contexts.

## CLI behavior

The JSON analysis mode emits no headings, examples or extra status text to stdout.
`--examples` and `--list-champions` are deliberately rejected with JSON analysis.
CLI selection and strategic-data validation errors use stderr and exit code 2.
No live network requests occur when generating a report.

The fixed engage/frontline/wave-clear baseline also runs for incomplete teams.
Missing entries are not a draft-quality verdict. The schema will need explicit
context and patch selection before it can represent full draft recommendations.
