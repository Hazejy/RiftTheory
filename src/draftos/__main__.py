"""Command-line entry point for DraftOS."""

from pathlib import Path

from .champion_data import load_champion_profiles
from .composition import (
    CompositionCapability,
    explain_composition,
)


def main() -> None:
    """Run a small, explainable composition analysis."""
    data_file = Path(__file__).resolve().parents[2] / "data" / "champion_profiles.json"
    champions = load_champion_profiles(data_file)
    required_capabilities = {
        CompositionCapability.ENGAGE,
        CompositionCapability.FRONTLINE,
        CompositionCapability.WAVE_CLEAR,
    }

    print("Composition analysis:")
    for explanation in explain_composition(champions, required_capabilities):
        print(f"- {explanation}")


if __name__ == "__main__":
    main()
