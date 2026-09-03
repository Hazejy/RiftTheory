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

Strategic profile examples (fictional data):
Example Control Champion (mid):
  Main colors: blue, green
  Off colors: white
  Reasoning: Fictional format example: control and allied power timings define the main plan. A supportive build offers a flexible alternative; it is not assumed to be active in every draft.
  Source: fictional_example_not_champion_analysis
Example Theme Champion (support):
  Main colors: colorless
  Off colors: none
  Reasoning: Fictional format example: a dedicated theme requires the composition to be built around it. Colorless does not mean an unknown classification.
  Source: fictional_example_not_champion_analysis
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
