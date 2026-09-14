# DraftGap Contribution Guide

RiftTheory is a League of Legends draft analyzer built as a Tauri desktop app and web app.

## Project layout

- `apps/frontend`: SolidJS/Tauri desktop client
- `apps/rifttheory-data`: SQLite schema, imports, and data tooling
- `data`: curated coaching and interaction data
- `research`: evidence notes and profile documentation
- `tests`: Python validation suite

## Common commands

From `RiftTheory/`:

```bash
bun install
bun run dev
bun run typecheck
bun run build
bun run data:build:offline
```

Keep generated exports synchronized with their source data. Run the typecheck and the relevant tests before opening a pull request.

## Style

Use the existing TypeScript and Python formatting conventions. Keep strategy explanations evidence-based and avoid presenting estimates as guaranteed outcomes.
