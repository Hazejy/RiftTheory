# DraftOS

DraftOS is an explainable coaching operating system for League of Legends.
It turns game knowledge into measurable hypotheses, executable game plans,
evidence-based reviews, and optimized practice.

## Current status

Phase 1 builds the first explainable Composition Debt baseline. The initial
domain vocabulary covers engage, frontline, and wave clear. Riot API
integration, web interfaces, and machine learning remain out of scope.

## Requirements

- Python 3.11 or newer

## Run

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

## Choose champions

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

## Test

```powershell
python -m unittest discover -s tests -v
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
