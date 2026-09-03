"""Command-line entry point for DraftOS."""

from pathlib import Path

from .champion_data import load_champion_profiles
from .composition import (
    CompositionCapability,
    explain_composition,
)
from .flex import explain_role_shares
from .flex_data import load_role_observations
from .strategy import explain_strategic_profile
from .strategy_data import load_strategic_profiles


def main() -> None:
    """Run a small, explainable composition analysis."""
    data_directory = Path(__file__).resolve().parents[2] / "data"
    champions = load_champion_profiles(data_directory / "champion_profiles.json")
    required_capabilities = {
        CompositionCapability.ENGAGE,
        CompositionCapability.FRONTLINE,
        CompositionCapability.WAVE_CLEAR,
    }

    print("Composition analysis:")
    for explanation in explain_composition(champions, required_capabilities):
        print(f"- {explanation}")

    observations = load_role_observations(
        data_directory / "role_observations.example.json"
    )
    print("\nRole share example (fictional data):")
    for explanation in explain_role_shares(observations):
        print(f"- {explanation}")

    strategic_profiles = load_strategic_profiles(
        data_directory / "strategic_profiles.example.json"
    )
    print("\nStrategic profile examples (fictional data):")
    for profile in strategic_profiles:
        for line in explain_strategic_profile(profile):
            print(line)


if __name__ == "__main__":
    main()
