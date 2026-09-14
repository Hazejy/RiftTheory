"""Command-line entry point for DraftOS."""

import argparse
import json
from pathlib import Path

from .champion_analysis import analyze_champions, explain_champion_assessment
from .champion_data import load_champion_profiles
from .coaching_data import (
    count_coaching_profiles_by_role,
    find_missing_coaching_profiles,
    load_coaching_profiles,
)
from .composition import (
    BASELINE_CAPABILITIES,
    ChampionRole,
    ChampionProfile,
    CoachingProfile,
    analyze_composition,
    explain_composition,
)
from .flex import explain_role_shares
from .flex_data import load_role_observations
from .strategy_data import load_strategic_profiles
from .selection import select_champions
from .report import build_report


def _find_coaching_profile(
    champion: ChampionProfile,
    coaching_profiles: list[CoachingProfile],
) -> CoachingProfile | None:
    return next(
        (
            profile
            for profile in coaching_profiles
            if profile.champion_name.lower() == champion.name.lower()
            and profile.role is champion.role
        ),
        None,
    )


def _explain_coaching_profile(profile: CoachingProfile) -> list[str]:
    spike_notes = "; ".join(profile.spike_notes)
    return [
        f"- {profile.champion_name}:{profile.role.value}",
        f"  damage: {profile.damage_focus.value}; curve: {profile.power_curve.value}; "
        f"resource: {profile.resource_demand.value}; execution: {profile.execution_demand}/5",
        f"  spikes: {spike_notes}",
        f"  reasoning: {profile.reasoning}",
        f"  review: {profile.review_status.value}; confidence: {profile.confidence:.2f}; "
        f"patch: {profile.patch}",
    ]


def _print_coaching_coverage(
    catalog: list[ChampionProfile],
    coaching_profiles: list[CoachingProfile],
) -> None:
    missing_profiles = find_missing_coaching_profiles(catalog, coaching_profiles)
    covered_count = len(catalog) - len(missing_profiles)
    coverage = covered_count / len(catalog) if catalog else 0
    role_counts = count_coaching_profiles_by_role(coaching_profiles)
    catalog_counts = {
        role: sum(1 for profile in catalog if profile.role is role)
        for role in ChampionRole
    }

    print("Coaching profile coverage")
    print(f"- covered: {covered_count}/{len(catalog)} ({coverage:.1%})")
    for role in ChampionRole:
        total = catalog_counts[role]
        count = role_counts[role]
        role_coverage = count / total if total else 0
        print(f"- {role.value}: {count}/{total} ({role_coverage:.1%})")

    print("\nNext missing champion-role profiles:")
    for profile in missing_profiles[:20]:
        print(f"- {profile.name}:{profile.role.value}")


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
        "--coaching-coverage",
        action="store_true",
        help="show coaching profile coverage and exit",
    )
    parser.add_argument(
        "--examples", action="store_true", help="also display the fictional role-share example",
    )
    parser.add_argument(
        "--format", choices=("text", "json"), default="text",
        help="analysis output format (default: text)",
    )
    args = parser.parse_args(argv)
    if args.format == "json" and (
        args.examples or args.list_champions or args.coaching_coverage
    ):
        parser.error(
            "JSON analysis cannot be combined with --examples, --list-champions "
            "or --coaching-coverage"
        )
    if args.list_champions and (args.champion or args.examples or args.coaching_coverage):
        parser.error(
            "--list-champions cannot be combined with --champion, --examples "
            "or --coaching-coverage"
        )
    if args.coaching_coverage and (args.champion or args.examples):
        parser.error("--coaching-coverage cannot be combined with --champion or --examples")

    data_directory = Path(__file__).resolve().parents[2] / "data"
    catalog = load_champion_profiles(data_directory / "champion_profiles.json")

    if args.list_champions:
        print("Available local profiles (not a complete champion or role catalog):")
        for profile in sorted(catalog, key=lambda item: (item.name, item.role.value)):
            print(f"- {profile.name}:{profile.role.value}")
        return
    if args.coaching_coverage:
        try:
            coaching_profiles = load_coaching_profiles(
                data_directory / "coaching_profiles.json"
            )
        except (OSError, ValueError) as error:
            parser.error(f"cannot load coaching profiles: {error}")
        _print_coaching_coverage(catalog, coaching_profiles)
        return

    try:
        champions = select_champions(args.champion or ["Malphite:top", "Anivia:mid"], catalog)
    except ValueError as error:
        parser.error(str(error))
    required_capabilities = set(BASELINE_CAPABILITIES)

    try:
        strategic_profiles = load_strategic_profiles(
            data_directory / "strategic_profiles.json"
        )
        assessments = analyze_champions(champions, strategic_profiles)
    except (OSError, ValueError) as error:
        parser.error(f"cannot load strategic assessments: {error}")

    try:
        coaching_profiles = load_coaching_profiles(
            data_directory / "coaching_profiles.json"
        )
    except (OSError, ValueError) as error:
        parser.error(f"cannot load coaching profiles: {error}")

    if args.format == "json":
        report = build_report(
            assessments,
            analyze_composition(champions, required_capabilities),
            is_demo=not args.champion,
            coaching_profiles=coaching_profiles,
        )
        print(json.dumps(report, indent=2, ensure_ascii=False, allow_nan=False))
        return

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

    print("\nChampion profiles (curated interpretations; see review status):")
    for assessment in assessments:
        for line in explain_champion_assessment(assessment):
            print(line)

    print("\nCoaching context (role-specific; provisional where marked):")
    for champion in champions:
        coaching_profile = _find_coaching_profile(champion, coaching_profiles)
        if coaching_profile is None:
            print(
                f"- {champion.name}:{champion.role.value}: "
                "no coaching profile recorded."
            )
            continue
        for line in _explain_coaching_profile(coaching_profile):
            print(line)


if __name__ == "__main__":
    main()
