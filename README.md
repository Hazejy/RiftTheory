# RiftTheory

RiftTheory (formerly DraftOS) is an explainable coaching application for League of Legends.
It turns game knowledge into measurable hypotheses, executable game plans,
evidence-based reviews, and optimized practice.

## Current status

The main application now uses a local fork of DraftGap as its foundation:
SolidJS, TypeScript, its statistical core and its existing Tauri desktop source.
DraftOS adds an initial Strategy tab connecting both teams' picks to our curated
capabilities and MTG-inspired main/off colors. The Python core and earlier React
prototype remain intact; they are not the runtime backend of the new interface.

Curated knowledge is still small: Anivia Mid has a provisional color profile;
Anivia Mid and Malphite Top have capability profiles. DraftGap's larger statistical
catalog is separate from that coverage. No DraftOS desktop installer or machine
learning model has been built yet.

## Local application

Start the built application with `start-rifttheory.cmd` and open
<http://127.0.0.1:3000>. The server must stay running while using the app.

For setup, sources, attribution and current limits, see
[the DraftGap-based application guide](docs/draftgap-base.md).
The [earlier local application guide](docs/local-app.md) covers the preserved
Python/React prototype only.

The current interface supports English, Korean and Simplified Chinese for the
draft workspace and champion names. Picks advance automatically through
`B1 R1 R2 B2 B3 R3 R4 B4 B5 R5`. See [the RiftTheory update](docs/rifttheory-workspace.md)
for localization scope, data sources and pick/reset behavior. Logo and visual
redesign are intentionally deferred; DraftGap remains the technical foundation.

## Requirements

- Main application: Bun 1.3.6 and dependencies from `draftgap/bun.lock`.
- Internet access for upstream datasets and champion assets.
- Legacy Python tools below: Python 3.11+, with optional `requirements.txt`
  dependencies for the old FastAPI application.

## Preserved Python CLI

From the repository root:

```powershell
python -m src.draftos
```

Expected output:

```text
Demo selection: Malphite:top, Anivia:mid
Baseline capability check (not a draft score):
- engage: provided by Malphite.
- frontline: provided by Malphite.
- wave clear: provided by Anivia.

Champion profiles (curated interpretations; see review status):
Malphite (top):
  Capabilities: engage, frontline
  Capability source: manually_curated
  Strategic identity: not yet assessed
Anivia (mid):
  Capabilities: wave clear
  Capability source: manually_curated
  Main colors: blue
  Off colors: white
  Reasoning: AI-assisted interpretation: Blue reflects space control and denial through stun, wall and persistent area damage. White is a conditional defensive/peel interpretation, not universal draft flexibility. Wave clear does not guarantee safe access against long-range pressure; positioning, mana and allied setup must be assessed. No win probability is inferred.
  Source: DraftOS AI-assisted synthesis; evidence and limits: research/anivia-mid-profile.md
  Patch: unknown
  Review status: provisional
  Source URL: https://www.leagueoflegends.com/en-us/champions/anivia/
```

## Choose champions in the Python CLI

List the profiles currently available locally:

```powershell
python -m src.draftos --list-champions
```

Analyze one pick or repeat `--champion` for a fixed-role selection:

```powershell
python -m src.draftos --champion "Anivia:mid"
python -m src.draftos --champion "Malphite:top" --champion "Anivia:mid"
```

Names and roles are case-insensitive at the input boundary; surrounding spaces
are ignored. One to five picks are accepted. Repeated champions, repeated role
assignments, and missing local profiles produce an error without partial output.
Missing local data does not mean a role is unplayable. Flex-role inference and
opponent analysis are not implemented. Without picks, the CLI uses the explicit
Malphite-top/Anivia-mid demo selection, not the entire future catalog.

The baseline checks engage, frontline and wave clear even for partial selections.
A missing capability is not a verdict that the draft is bad or that a particular
next pick is required. Strategic context will determine requirements later.

Fictional role-share data is hidden by default. Request it explicitly or view help:

```powershell
python -m src.draftos --examples
python -m src.draftos --help
```

`--list-champions` is a standalone action and cannot be combined with other modes.

## Machine-readable analysis

```powershell
python -m src.draftos --champion "Anivia:mid" --format json
```

This prints one JSON document to stdout. Text remains the default. JSON analysis
cannot be combined with `--examples` or `--list-champions`. Selection and strategic
data errors go to stderr with exit code 2, without partial report output.
See [the report contract](docs/analysis-report.md) for fields and limitations.

## Interface direction

The product targets both a browser-based interface and an installable desktop
application sharing the analysis core and, where practical, the same UI.
The CLI is a development interface, not the intended final user experience.
A local visual champion-selection and analysis screen is now implemented.
Desktop packaging is a later milestone rather than a separate analysis rewrite.

## Optional legacy development checks

These commands concern the preserved prototype, not the DraftGap-based app.
They are not required for normal use. The migration was checked with a TypeScript
check, production build and a brief browser startup/pick check; no test suite was run.

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
npm.cmd --prefix web test
npm.cmd --prefix web run build
```

## Design notes

Champion profiles match by exact champion name and role. A missing strategic
profile is shown as not yet assessed, not as colorless. Multiple strategies for
the same champion and role are rejected rather than silently selecting a patch.
Strategic review status does not certify the separate capability assessment.

- [Contextual composition capabilities](docs/composition-context.md)

## Research

- [DraftGap benchmark assessment](research/draftgap-benchmark.md)
- [MTG-inspired strategic identities](research/mtg-color-draft-theory.md)
- [Anivia mid: provisional profile and evidence](research/anivia-mid-profile.md)
