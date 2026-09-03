# Champion profile data

The profiles in this directory are small, manually curated prototype data.
Capability assignments are coaching judgments, not official Riot Games data,
performance statistics, or claims about champion strength on a specific patch.

Files ending in `.example.json` contain fictional samples used to explain and
test a data format. They must never be presented as real League statistics.

## Strategic profiles

`strategic_profiles.example.json` contains fictional champions, not reviewed
League of Legends classifications. Load it with
`load_strategic_profiles(Path("data/strategic_profiles.example.json"))` from
`src.draftos.strategy_data`.

The JSON array contains `champion_name`, `role`, and an `identity` object with:

- `main_colors`: one or more main categories;
- `off_colors`: alternative categories, with an empty array allowed;
- `reasoning`: an explanation, including conditions for alternative plans;
- `source_name`: the origin of the classification.

Allowed categories are `white`, `blue`, `black`, `red`, `green`, and `colorless`.
Colors must be unique within each list and cannot be both main and off colors.
Colorless is a dedicated strategic theme, not a missing-data marker. Missing
fields, invalid roles or colors, and blank explanations or sources are rejected.

The CLI displays these fictional profiles with their recorded reasoning and
source. Colors are listed alphabetically, not ranked by importance. `none` means
no off colors were recorded; it is distinct from `colorless`.

This step does not evaluate conditions or infer a team's identity. Patch and
structured context metadata remain future work before adopting reviewed
real-champion classifications.
