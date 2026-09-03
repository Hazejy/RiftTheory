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
Composition analysis:
- engage: provided by Malphite.
- frontline: provided by Malphite.
- wave clear: provided by Anivia.

Role share example (fictional data):
- top: 80.0% (800 games)
- jungle: 15.0% (150 games)
- mid: 5.0% (50 games)

Strategic profiles (curated interpretations; see review status):
Anivia (mid):
  Main colors: blue
  Off colors: white
  Reasoning: AI-assisted interpretation: Blue reflects space control and denial through stun, wall and persistent area damage. White is a conditional defensive/peel interpretation, not universal draft flexibility. Wave clear does not guarantee safe access against long-range pressure; positioning, mana and allied setup must be assessed. No win probability is inferred.
  Source: DraftOS AI-assisted synthesis; evidence and limits: research/anivia-mid-profile.md
  Patch: unknown
  Review status: provisional
  Source URL: https://www.leagueoflegends.com/en-us/champions/anivia/
```

## Test

```powershell
python -m unittest discover -s tests -v
```

## Design notes

- [Contextual composition capabilities](docs/composition-context.md)

## Research

- [DraftGap benchmark assessment](research/draftgap-benchmark.md)
- [MTG-inspired strategic identities](research/mtg-color-draft-theory.md)
- [Anivia mid: provisional profile and evidence](research/anivia-mid-profile.md)
