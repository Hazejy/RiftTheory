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

Runtime database:

`data/runtime/rifttheory.sqlite` (local and gitignored)

Versioned web export:

`draftgap/apps/frontend/public/data/rifttheory-knowledge.json`

Migration SQL and application code are the source of truth. Example JSON files
are never imported. Re-running any importer is idempotent; import runs and
failures are recorded. Strategic `unknown` patches remain unknown instead of
being silently assigned to the current patch.

The observed-statistics and interaction-rule tables are intentionally ready but
empty. Adding a provider requires a documented source, allowed access method,
sample context and independent validation before it becomes production data.
