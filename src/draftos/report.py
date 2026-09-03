"""Serialize existing assessments for machine-readable consumers."""

from .champion_analysis import ChampionAssessment
from .composition import CapabilityAssessment


def build_report(
    champions: list[ChampionAssessment],
    capabilities: list[CapabilityAssessment],
    *,
    is_demo: bool,
) -> dict[str, object]:
    """Build schema v1 without inferring scores or changing recorded knowledge."""
    champion_data = []
    for assessment in champions:
        champion = assessment.champion
        profile = assessment.strategy
        strategy = None
        if profile is not None:
            strategy = {
                "main_colors": sorted(color.value for color in profile.identity.main_colors),
                "off_colors": sorted(color.value for color in profile.identity.off_colors),
                "reasoning": profile.identity.reasoning,
                "source_name": profile.identity.source_name,
                "source_url": profile.source_url,
                "patch": profile.patch,
                "review_status": profile.review_status.value,
            }
        champion_data.append({
            "champion_name": champion.name,
            "role": champion.role.value,
            "capabilities": sorted(capability.value for capability in champion.capabilities),
            "capability_source": champion.source.value,
            "strategy": strategy,
        })

    return {
        "schema_version": 1,
        "analysis_type": "baseline_capability_check",
        "is_demo": is_demo,
        "limitations": [
            "Not a draft score or win probability.",
            "Recorded capabilities do not guarantee execution in a matchup.",
            "Strategic review status does not certify capability assessments.",
        ],
        "champions": champion_data,
        "capability_assessments": [
            {
                "capability": assessment.capability.value,
                "providers": list(assessment.providers),
                "is_missing": assessment.is_missing,
            }
            for assessment in capabilities
        ],
    }
