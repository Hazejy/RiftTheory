# RiftTheory Data Foundation v1

## Boundary

The inherited DraftGap job remains an external statistical input. RiftTheory's
new local database owns curated strategic knowledge and official Riot static
metadata. It never writes to DraftGap's bucket and contains no cloud credential.

## Flow

```text
Riot Data Dragon (EN/KO/ZH)    Curated RiftTheory JSON
              \                 /
               versioned SQLite
                      |
             validated JSON export
                      |
              Web and desktop app
```

SQLite is the canonical working store. The generated JSON is the deployment
format and does not require a browser database. The runtime database and its WAL
files are gitignored; migration SQL and the generated export are versionable.

## Data model

- `sources`: provenance and access notes.
- `patches`: versions as discovered from the official provider.
- `champions`, `champion_aliases`, `champion_localizations`: stable identity and
  localized names.
- `role_observations`: patch/rank/region/queue/sample-scoped statistics.
- `capability_profiles`: role- and patch-scoped draft functions.
- `strategic_profiles`, `strategic_colors`: explainable Main/Off identities.
- `interaction_rules`: conditional reusable relationships, not unconditional
  champion-counter claims.
- `import_runs`: auditable updater outcomes.

All percentage-like values use the closed 0–1 interval. Unknown strategic patch
data is stored as `unknown`. Every assessment and observation references a
source. Example fixtures are excluded from production import.

## Next boundaries

1. Replace direct frontend imports with the generated knowledge export.
2. Add a reviewed internal profile editor.
3. Establish an allowed observed-statistics provider and independent storage.
4. Add a scheduled build only after credentials and failure alerts are owned.
5. Harden and enable the inherited League Client synchronization in a signed
   RiftTheory desktop build; browser builds remain disconnected.
