# RiftTheory runtime architecture

The maintained SolidJS/Tauri product lives in `RiftTheory/`. The root Python
`src/draftos` and React `web` application are a preserved, separate prototype.

## Data flow and ownership

- `packages/core` owns provider-neutral draft, role, rating, interaction, build
  conversion and live-series calculations. It must not import from `apps/*`.
- `apps/dataset` collects and publishes external statistical datasets. The
  frontend downloads the current-patch and 30-day exports via `api/dataset-api`
  and `api/dataset-loader`; the dataset context owns their reactive load state.
  Successfully validated exports are cached in IndexedDB by dataset URL. If
  the network later fails, the same ranked export can be reused as unavailable
  (stale) data. With no cache, local planning workspaces remain accessible.
- `apps/rifttheory-data` owns SQLite migrations and imports of Riot metadata and
  curated knowledge. Its validated JSON export is bundled with the frontend.
  SQLite is not opened by the desktop runtime.
- The draft context owns manual picks, bans, role selection and ownership.
  `LolClientContext` polls the Tauri LCU commands and applies client state to
  that draft. The LCU may be absent; manual drafting is independent of it.
- Analysis and suggestion contexts derive results from draft, datasets,
  settings and knowledge. The Strategy workspace derives bounded coaching
  scenarios; a live-draft handoff is a deliberate, session-only snapshot owned
  by `StrategySessionProvider` rather than a module-level global.
- Settings and saved workspaces use browser local storage. Each feature owns
  its keys and migration rules.

## Dependency rules

1. `core` cannot depend on SolidJS, Tauri, HTTP, filesystem or an `apps/*` package.
2. Frontend UI reads feature state and calls feature actions. External payloads
   are translated or validated at API/adapter boundaries.
3. Infrastructure can implement HTTP, Tauri and storage access; it must not own
   coaching or draft decisions.
4. The data jobs may depend on `core` models, never the reverse.
5. Keep failure, timeout and cleanup ownership with the code that starts an
   asynchronous operation.

The current provider graph in `apps/frontend/src/index.tsx` is the composition
root. It is intentionally retained while feature boundaries are tightened.
`components/rifttheory/RiftTheoryStrategy.tsx` is an intentionally retained
historical comparison, not the active Strategy route; `App.tsx` imports
`StrategyWorkspace.tsx` for that route.
