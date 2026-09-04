# DraftOS on the DraftGap foundation

The product is now **RiftTheory**. Use `start-rifttheory.cmd`; the old launcher
forwards to it. The top banner has since been removed and the workspace now adds
three interface languages and chronological picks. See the
[current RiftTheory update](rifttheory-workspace.md). The original import decisions
and setup below remain applicable.

## Decision and scope

On 2026-09-04, DraftOS adopted DraftGap 3.2.1 at commit
`9b79e8668cff4dfd2ba55a01cfa62d5895f98675` as its application foundation.
The source lives in `draftgap/`, with no nested Git repository. The MIT license
and attribution are retained; see [third-party notices](../THIRD_PARTY_NOTICES.md).

The main application keeps DraftGap's SolidJS/TypeScript interface, draft and
statistical analysis core, and Tauri source. It does not rewrite these in React
or call the earlier Python server. Existing `src/`, `web/`, `data/`, research,
and the untracked `Theory/` are preserved.

## Normal use

Double-click `start-draftos.cmd` in the project root, then open
[DraftOS](http://127.0.0.1:3000). Keep the server window open; Ctrl+C stops it.
If it is already running, simply open the address instead of launching a second
server. The launcher does not install packages or terminate other processes.

Select champions in Draft. Use each pick's menu to assign its role. Open DraftOS
Strategy to see matching curated profiles for either team. For example, Anivia
Mid displays wave clear, main Blue and off White, with provisional review status.
Anivia in a different role does not inherit that Mid assessment.

## Recreate the local setup

The current machine already has the runtime, dependencies and production build.
For a fresh checkout, use PowerShell from the repository root:

```powershell
npm.cmd install --prefix .upstream-cache/tools --save-exact bun@1.3.6
$env:Path = (Resolve-Path .upstream-cache/tools/node_modules/bun/bin).Path + ';' + $env:Path
& .upstream-cache/tools/node_modules/bun/bin/bun.exe install --cwd draftgap --frozen-lockfile
& .upstream-cache/tools/node_modules/bun/bin/bun.exe run --cwd draftgap/apps/frontend build
.\start-draftos.cmd
```

Bun is installed locally, not globally. The upstream lockfile is preserved.
Runtime downloads, dependencies, generated builds and Rust targets are ignored
by Git. Rebuild after changing frontend code or the imported JSON profiles.

## DraftOS additions and boundaries

- DraftOS branding and visible upstream attribution.
- A Strategy tab matching selected champion names and assigned roles to
  `data/champion_profiles.json` and `data/strategic_profiles.json` at build time.
- Anivia Mid has provisional colors; Anivia Mid and Malphite Top have capability
  profiles. Missing coverage is displayed explicitly, never assigned fake colors.
- The existing reasoning, source and unknown assessment patch are visible.
- No combined color score, contextual matchup engine or calibrated DraftOS win
  probability has been introduced. Upstream statistical estimates remain separate.
- No Google Analytics initialization or telemetry script is loaded by this fork.
- Preferences use separate DraftOS local-storage keys. League Client integration
  defaults to off; the browser app does not connect to the game client.
- Local serving binds to `127.0.0.1:3000`; do not expose the preview server online.

## External data

The browser still downloads upstream statistics from
`https://bucket.draftgap.com/datasets/v5/current-patch.json` and
`https://bucket.draftgap.com/datasets/v5/30-days.json`, along with champion assets.
It therefore needs internet access and depends on those external services.
The upstream patch and update timestamp are shown in the header; this does not
mean our curated strategic profiles have been reviewed for that patch.

No scraper, data-generation job, cloud deployment or credential setup was run.
Before independent distribution, review data access/redistribution conditions
and set up suitable infrastructure. Do not run inherited publishing, updater,
deployment or data-collection scripts against upstream accounts.

## Desktop status

The imported Tauri project is retained and renamed DraftOS with a separate app
identifier. Upstream update endpoints and update UI are disabled, so the fork
does not install official DraftGap updates over our changes. No Windows installer
was built or installed. Packaging, signing and an independent update mechanism
are later work; the browser version is the available application now.

## Checks performed

The frontend TypeScript check and production build passed. A brief browser check
confirmed external data loading, champion selection, role-specific matching and
the Anivia Mid strategy display. No automated test suite was run. The build's
large-chunk warning is non-fatal and comes from the inherited bundle size.
These checks do not certify all inherited behavior or statistical calibration.

## Preserved prototype

The old Python/React interface is still accessible with
`.\.venv\Scripts\python.exe -m src.draftos.web` on port 8000.
Its setup is documented in [the legacy guide](local-app.md). It is not needed
to start the new DraftGap-based application.
