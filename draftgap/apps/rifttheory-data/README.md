# RiftTheory Data Foundation

This package owns RiftTheory's versioned knowledge data. It does not publish to
DraftGap infrastructure, require S3 credentials, scrape third-party sites or
contain a Riot API key.

## Commands

Run from `draftgap/`:

```powershell
bun run data:init
bun run data:build
bun run data:build:offline
bun run data:check
bun run data:refresh
bun run data:import:roles -- C:\path\to\role-snapshot.json
bun run data:import:interactions
bun run data:sync:draftgap-roles
bun run data:status
```

`data:build` discovers the latest Data Dragon version, imports official champion
names for EN/KO/ZH, imports the real curated JSON files in the workspace, checks
database integrity and writes the frontend export. `data:build:offline` skips the
Riot request and is useful while editing curated profiles.

`data:check` compares the newest Riot Data Dragon version with the patch in the
published frontend export. `data:refresh` performs the same check and rebuilds
the export only when Riot has published a new version. A refresh marks champions
missing from the new roster as inactive and rejects incomplete localization
snapshots. The final JSON replaces the previous export atomically.

## Observed role snapshots

`data:import:roles` accepts provider-neutral JSON validated against
`schemas/role-observations.schema.json`. Every file describes exactly one data
context and records its provider, patch, region, rank bracket, queue, collection
time, games and optional wins/pick rate. Champions may be matched by their Riot
key or a known localized name. Unknown champions and duplicate champion-role
rows are rejected instead of being silently created.

Importing the same source and context replaces that complete snapshot, making
retries idempotent. Run `bun run data:build:offline` afterward to publish the
database state to the frontend. The export derives `role_share` and
`sample_total` per champion and context; it deliberately does not label a role
as a valid flex pick yet. That policy will be calibrated separately rather than
presented as source data.

### DraftGap compatibility provider

`data:sync:draftgap-roles` reads the public DraftGap v5 current-patch dataset,
imports positive role game samples and updates the frontend export. Its context
is recorded as Emerald+, ranked solo, all regions, matching the collector in the
vendored upstream code. DraftGap queries two-part Lolalytics patches, so an
upstream dataset version such as `16.17.1` is stored as observed patch `16.17`.

The adapter intentionally discards DraftGap's wins because its dataset applies a
rank-bias transformation that produces modeled fractional values. It also does
not import matchup or synergy estimates. Those require separate provenance and
validation contracts before RiftTheory may use them.

Runtime database:

`data/runtime/rifttheory.sqlite` (local and gitignored)

Versioned web export:

`draftgap/apps/frontend/public/data/rifttheory-knowledge.json`

Migration SQL and application code are the source of truth. Example JSON files
are never imported. Re-running any importer is idempotent; import runs and
failures are recorded. Strategic `unknown` patches remain unknown instead of
being silently assigned to the current patch.

## Interaction evidence

`data:build` and `data:build:offline` import `data/interaction_evidence.json`.
The format is documented by `schemas/interaction-evidence.schema.json` and keeps
three concepts separate:

- a fixed trait vocabulary with definitions;
- role-specific champion trait assessments with a 1–5 ordinal level, reasoning,
  conditions, patch, source, confidence and review status;
- generic interaction rules that compare two traits and explain a conditional
  draft implication.

Run `bun run data:import:interactions` to import the default file or append a
path to validate another file. Imports are idempotent for the same assessed
profile and rule sources. A `reviewed` profile must name a patch; unknown patches
remain unknown.

The first provisional path demonstrates why wave clear and safe wave access are
different concepts. The UI evaluates a rule only when both champions have
assigned roles and matching assessed traits. No rule creates a counter label or
win probability. Adding observed matchup data still requires a documented
source, allowed access method, sample context and independent validation.
