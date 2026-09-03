"""Connect recorded capabilities and strategy without inventing missing knowledge."""

from dataclasses import dataclass

from .composition import ChampionProfile
from .strategy import ChampionStrategicProfile, explain_strategic_profile


@dataclass
class ChampionAssessment:
    """A capability profile and its optional role-matched strategy."""

    champion: ChampionProfile
    strategy: ChampionStrategicProfile | None


def analyze_champions(
    champions: list[ChampionProfile],
    strategic_profiles: list[ChampionStrategicProfile],
) -> list[ChampionAssessment]:
    """Match exact names and roles, preserving capability-profile order.

    Multiple strategies for one key are ambiguous until explicit patch/context
    selection exists. Unmatched strategies are not part of this selection.
    """
    strategies = {}
    for profile in strategic_profiles:
        key = (profile.champion_name, profile.role)
        if key in strategies:
            raise ValueError(
                f"ambiguous strategic profiles for {profile.champion_name} "
                f"({profile.role.value})"
            )
        strategies[key] = profile

    return [
        ChampionAssessment(
            champion=champion,
            strategy=strategies.get((champion.name, champion.role)),
        )
        for champion in champions
    ]


def explain_champion_assessment(assessment: ChampionAssessment) -> list[str]:
    """Keep capability provenance and strategic review metadata distinct."""
    champion = assessment.champion
    capabilities = ", ".join(
        sorted(capability.value.replace("_", " ") for capability in champion.capabilities)
    )
    lines = [
        f"{champion.name} ({champion.role.value}):",
        f"  Capabilities: {capabilities or 'none recorded'}",
        f"  Capability source: {champion.source.value}",
    ]
    if assessment.strategy is None:
        lines.append("  Strategic identity: not yet assessed")
    else:
        lines.extend(explain_strategic_profile(assessment.strategy)[1:])
    return lines
