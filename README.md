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
- engage: provided by Example Vanguard.
- frontline: provided by Example Vanguard.
- wave clear: missing.
```

## Test

```powershell
python -m unittest discover -s tests -v
```
