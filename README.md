# DraftOS

DraftOS is an explainable coaching operating system for League of Legends.
It turns game knowledge into measurable hypotheses, executable game plans,
evidence-based reviews, and optimized practice.

## Current status

Phase 0 establishes a small, tested Python foundation. Draft logic, Riot API
integration, web interfaces, and machine learning are intentionally out of
scope at this stage.

## Requirements

- Python 3.11 or newer

## Run

From the repository root:

```powershell
python -m src.draftos
```

Expected output:

```text
DraftOS foundation is ready.
```

## Test

```powershell
python -m unittest discover -s tests -v
```

