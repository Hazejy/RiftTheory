# Champion profile data

The profiles in this directory are manually curated prototype data.
Capability assignments are coaching judgments, not official Riot Games data,
performance statistics, or claims about champion strength on a specific patch.

## Composition capability vocabulary

`champion_profiles.json` records role-aware draft tools. A capability means that
the champion can materially provide that tool in a composition; it does not mean
the champion is always good, that the tool is equally strong in every build, or
that merely owning the ability guarantees access to it in game.

- `engage`: reliably starts or forces a fight;
- `disengage`: stops, delays, or breaks an enemy initiation;
- `pick`: isolates or locks down one target before a full fight;
- `poke`: creates meaningful damage pressure before commitment;
- `frontline`: can occupy contested space for the team;
- `wave_clear`: removes waves quickly enough to control map tempo;
- `peel`: repeatedly protects a priority teammate from access;
- `dive`: reaches and threatens protected back-line targets;
- `anti_dive`: specifically punishes champions committing into the team;
- `zone_control`: denies or reshapes an area for a meaningful duration;
- `siege`: pressures structures or defenders from a controlled setup;
- `side_lane_pressure`: creates a credible independent side-lane assignment;
- `global_pressure`: changes distant plays through global or near-global access;
- `objective_control`: materially improves setup, secure, or objective damage;
- `sustain`: restores enough health or shielding to extend a setup or attrition.

Temporal properties such as early pressure, scaling curve, item spikes, reset
dependency, and resource demand should become separate structured fields. They
must not be mixed into `capabilities`, because they describe _when or under what
conditions_ a champion functions rather than _which tool_ the champion brings.

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

## Role-specific coaching profiles

`coaching_profiles.json` contains the evidence contract used by the Strategy
coach read. Each entry belongs to one champion and role and records damage
focus, power-curve category, resource demand, execution demand, practical spike
notes, reasoning, patch, confidence, review status and source. Unknown patches
remain unknown, and provisional manual reviews must not be presented as measured
win probabilities.

The data build validates and imports these profiles into the versioned knowledge
export. A missing profile stays unassessed; the frontend may show a clearly
labeled color-based hypothesis but must not invent champion-specific scaling or
damage information.
