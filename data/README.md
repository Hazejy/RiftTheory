# Champion profile data

The profiles in this directory are small, manually curated prototype data.
Capability assignments are coaching judgments, not official Riot Games data,
performance statistics, or claims about champion strength on a specific patch.

Files ending in `.example.json` contain fictional samples used to explain and
test a data format. They must never be presented as real League statistics.

## Strategic profiles

`strategic_profiles.json` contains real-champion interpretations used by the CLI.
Anivia mid is the first provisional entry; its evidence, source-access limits,
and review requirements are in [the research note](../research/anivia-mid-profile.md).
Its patch is unknown until the assessment is verified for a specific patch.

`strategic_profiles.example.json` contains fictional champions, not reviewed
League of Legends classifications. Load it with
`load_strategic_profiles(Path("data/strategic_profiles.example.json"))` from
`src.draftos.strategy_data`.

The JSON array contains `champion_name`, `role`, `patch`, `review_status`,
`source_url`, and an `identity` object with:

- `main_colors`: one or more main categories;
- `off_colors`: alternative categories, with an empty array allowed;
- `reasoning`: an explanation, including conditions for alternative plans;
- `source_name`: the origin of the classification.

Allowed categories are `white`, `blue`, `black`, `red`, `green`, and `colorless`.
Colors must be unique within each list and cannot be both main and off colors.
Colorless is a dedicated strategic theme, not a missing-data marker. Missing
fields, invalid roles or colors, and blank explanations or sources are rejected.

Fictional strategic examples remain separate test fixtures; the CLI displays
the real-champion profiles with reasoning and source. The role-share CLI example
is still fictional, labeled as such, and only shown with `--examples`.
Colors are listed alphabetically, not
ranked by importance. `none` means
no off colors were recorded; it is distinct from `colorless`.

## Review metadata

All three metadata keys are required in JSON. `patch` is the patch the assessment
applies to, not the date a source was retrieved. Use `null` when unknown; do not
guess a current patch. `source_url` is an optional HTTP(S) reference, with `null`
when no public link exists. The loader checks URL structure but never fetches it
or verifies whether its content supports the classification.

Review states are manually assigned:

- `unreviewed`: not assessed; also used for the fictional examples;
- `provisional`: a working interpretation awaiting review;
- `reviewed`: a domain review has been performed for the recorded patch;
- `outdated`: explicitly flagged as requiring reassessment.

Reviewed profiles require a patch. A source link is not mandatory for private
coaching knowledge, but a source name and reasoning remain mandatory. These
fields do not prove that review occurred or that predictions are accurate.
No automatic review promotion or patch freshness check is performed. Reviewer
identity, review date, and structured context conditions remain future work.
This step does not evaluate conditions or infer a team's identity.

## Interaction evidence

`interaction_evidence.json` is the first real input for the contextual draft
layer. It contains provisional role-specific assessments and generic rules
consumed by the TypeScript data pipeline. Every assessment states its source,
confidence, limitations and review status. A 1–5 level is an ordinal coaching
judgment, not a measured winrate or a claim of absolute champion strength.

The initial Anivia Mid and Xerath Mid profiles are deliberately narrow. They
exercise the full data path for the distinction between having wave clear and
being able to access the wave safely under long-range pressure. Their official
Riot champion pages document the kits; RiftTheory owns and labels the derived
trait levels and interaction rule as provisional interpretations.

Interaction rules state the subject's impact explicitly so the same finding can
be viewed correctly from either side of a suggestion. This avoids treating every
matched rule as an advantage. The current suggestion UI presents these signals
without combining them into an unsupported score.
