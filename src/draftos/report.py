"""Serialize existing assessments for machine-readable consumers."""

from .champion_analysis import ChampionAssessment
from .composition import CapabilityAssessment, CoachingProfile


def _find_coaching_profile(
    assessment: ChampionAssessment,
    coaching_profiles: list[CoachingProfile],
) -> CoachingProfile | None:
    champion = assessment.champion
    return next(
        (
            profile
            for profile in coaching_profiles
            if profile.champion_name.lower() == champion.name.lower()
            and profile.role is champion.role
        ),
        None,
    )


def _serialize_coaching_profile(profile: CoachingProfile | None) -> dict[str, object] | None:
    if profile is None:
        return None
    return {
        "damage_focus": profile.damage_focus.value,
        "power_curve": profile.power_curve.value,
        "resource_demand": profile.resource_demand.value,
        "execution_demand": profile.execution_demand,
        "spike_notes": list(profile.spike_notes),
        "reasoning": profile.reasoning,
        "patch": profile.patch,
        "assessment_method": profile.assessment_method.value,
        "confidence": profile.confidence,
        "review_status": profile.review_status.value,
        "source_name": profile.source_name,
    }


def build_report(
    champions: list[ChampionAssessment],
    capabilities: list[CapabilityAssessment],
    *,
    is_demo: bool,
    coaching_profiles: list[CoachingProfile] | None = None,
) -> dict[str, object]:
    """Build schema v1 without inferring scores or changing recorded knowledge."""
    coaching_profiles = coaching_profiles or []
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
            "coaching": _serialize_coaching_profile(
                _find_coaching_profile(assessment, coaching_profiles)
            ),
        })

    return {
        "schema_version": 1,
        "analysis_type": "baseline_capability_check",
        "is_demo": is_demo,
        "limitations": [
            "Not a draft score or win probability.",
            "Recorded capabilities do not guarantee execution in a matchup.",
            "Strategic review status does not certify capability assessments.",
            "Coaching profiles are role-specific interpretations, not measured winrates.",
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
