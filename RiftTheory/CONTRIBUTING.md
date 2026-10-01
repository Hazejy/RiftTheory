# RiftTheory Contribution Guide

RiftTheory is a League of Legends draft analyzer built as a Tauri desktop app and web app.

## Project layout

- `apps/frontend`: SolidJS/Tauri desktop client
- `packages/core`: provider-neutral draft, role, rating, and build calculations
- `apps/dataset`: external statistical dataset collection
- `apps/rifttheory-data`: SQLite schema, imports, and knowledge export
- `../data`: curated coaching and interaction data
- `../research`: evidence notes and profile documentation
- `../tests`: tests for the separate Python prototype

See [`../docs/rifttheory-architecture.md`](../docs/rifttheory-architecture.md)
for runtime boundaries and state ownership.

## Common commands

From `RiftTheory/`:

```bash
bun install
bun run dev
bun run typecheck
bun run --filter @rifttheory/frontend build
bun run data:build:offline
bun test apps/frontend/src apps/dataset/src/lolalytics/champion.test.ts packages/core/src
```

Keep generated exports synchronized with their source data. Run the typecheck and the relevant tests before opening a pull request.

## Style

Use the existing TypeScript and Python formatting conventions. Keep strategy explanations evidence-based and avoid presenting estimates as guaranteed outcomes.
