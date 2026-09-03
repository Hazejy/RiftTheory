"""Command-line entry point for DraftOS."""

import argparse
from pathlib import Path

from .champion_analysis import analyze_champions, explain_champion_assessment
from .champion_data import load_champion_profiles
from .composition import (
    CompositionCapability,
    explain_composition,
)
from .flex import explain_role_shares
from .flex_data import load_role_observations
from .strategy_data import load_strategic_profiles
from .selection import select_champions


def main(argv: list[str] | None = None) -> None:
    """Analyze selected local profiles, or run the two-champion demo."""
    parser = argparse.ArgumentParser(description="Explain a local DraftOS champion selection.")
    parser.add_argument(
        "--champion", action="append", metavar="NAME:ROLE",
        help="select a local champion profile; repeat for multiple picks",
    )
    parser.add_argument(
        "--list-champions", action="store_true", help="list available local profiles and exit",
    )
    parser.add_argument(
        "--examples", action="store_true", help="also display the fictional role-share example",
    )
    args = parser.parse_args(argv)
    if args.list_champions and (args.champion or args.examples):
        parser.error("--list-champions cannot be combined with --champion or --examples")

    data_directory = Path(__file__).resolve().parents[2] / "data"
    catalog = load_champion_profiles(data_directory / "champion_profiles.json")
    if args.list_champions:
        print("Available local profiles (not a complete champion or role catalog):")
        for profile in sorted(catalog, key=lambda item: (item.name, item.role.value)):
            print(f"- {profile.name}:{profile.role.value}")
        return
    try:
        champions = select_champions(args.champion or ["Malphite:top", "Anivia:mid"], catalog)
    except ValueError as error:
        parser.error(str(error))
    required_capabilities = {
        CompositionCapability.ENGAGE,
        CompositionCapability.FRONTLINE,
        CompositionCapability.WAVE_CLEAR,
    }

    if not args.champion:
        print("Demo selection: Malphite:top, Anivia:mid")
    print("Baseline capability check (not a draft score):")
    for explanation in explain_composition(champions, required_capabilities):
        print(f"- {explanation}")

    if args.examples:
        observations = load_role_observations(
            data_directory / "role_observations.example.json"
        )
        print("\nRole share example (fictional data):")
        for explanation in explain_role_shares(observations):
            print(f"- {explanation}")

    strategic_profiles = load_strategic_profiles(
        data_directory / "strategic_profiles.json"
    )
    print("\nChampion profiles (curated interpretations; see review status):")
    for assessment in analyze_champions(champions, strategic_profiles):
        for line in explain_champion_assessment(assessment):
            print(line)


if __name__ == "__main__":
    main()
