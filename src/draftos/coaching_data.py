"""Load role-specific coaching profiles from JSON."""

import json
from pathlib import Path

from .composition import (
    AssessmentMethod,
    ChampionProfile,
    ChampionRole,
    CoachingProfile,
    DamageFocus,
    PowerCurve,
    ResourceDemand,
    ReviewStatus,
)


ROLE_ALIASES = {
    "adc": "bot",
    "botlane": "bot",
    "midlane": "mid",
    "toplane": "top",
}


def _normalize_role(raw_role: object, profile_index: int) -> ChampionRole:
    role = str(raw_role or "").strip().lower()
    role = ROLE_ALIASES.get(role, role)
    if not role:
        raise ValueError(f"Coaching profile {profile_index} has no role")
    return ChampionRole(role)


def _require_text(profile: dict[str, object], key: str, profile_index: int) -> str:
    value = str(profile.get(key, "")).strip()
    if not value:
        raise ValueError(f"Coaching profile {profile_index} has no {key}")
    return value


def _require_confidence(profile: dict[str, object], profile_index: int) -> float:
    value = float(profile.get("confidence", -1))
    if value < 0 or value > 1:
        raise ValueError(
            f"Coaching profile {profile_index} confidence must be between 0 and 1"
        )
    return value


def _require_execution_demand(
    profile: dict[str, object],
    profile_index: int,
) -> int:
    value = int(profile.get("execution_demand", 0))
    if value < 1 or value > 5:
        raise ValueError(
            f"Coaching profile {profile_index} execution_demand must be 1-5"
        )
    return value


def _require_spike_notes(
    profile: dict[str, object],
    profile_index: int,
) -> list[str]:
    raw_notes = profile.get("spike_notes", [])
    if not isinstance(raw_notes, list):
        raise ValueError(f"Coaching profile {profile_index} spike_notes must be a list")

    notes = [str(note).strip() for note in raw_notes if str(note).strip()]
    if not notes:
        raise ValueError(f"Coaching profile {profile_index} needs spike_notes")
    return notes


def load_coaching_profiles(file_path: Path) -> list[CoachingProfile]:
    """Load role-specific coaching profiles from a JSON file."""
    profile_data = json.loads(file_path.read_text(encoding="utf-8"))
    if not isinstance(profile_data, list):
        raise ValueError("Coaching profile file must contain a list")

    seen_profiles: set[tuple[str, ChampionRole]] = set()
    coaching_profiles: list[CoachingProfile] = []

    for index, profile in enumerate(profile_data):
        if not isinstance(profile, dict):
            raise ValueError(f"Coaching profile {index} must be an object")

        champion_name = _require_text(profile, "champion_name", index)
        role = _normalize_role(profile.get("role"), index)
        lookup_key = (champion_name.lower(), role)
        if lookup_key in seen_profiles:
            raise ValueError(
                f"Duplicate coaching profile for {champion_name} {role.value}"
            )
        seen_profiles.add(lookup_key)

        coaching_profiles.append(
            CoachingProfile(
                champion_name=champion_name,
                role=role,
                damage_focus=DamageFocus(profile.get("damage_focus")),
                power_curve=PowerCurve(profile.get("power_curve")),
                resource_demand=ResourceDemand(profile.get("resource_demand")),
                execution_demand=_require_execution_demand(profile, index),
                spike_notes=_require_spike_notes(profile, index),
                reasoning=_require_text(profile, "reasoning", index),
                patch=_require_text(profile, "patch", index),
                assessment_method=AssessmentMethod(profile.get("assessment_method")),
                confidence=_require_confidence(profile, index),
                review_status=ReviewStatus(profile.get("review_status")),
                source_name=_require_text(profile, "source_name", index),
            )
        )

    return coaching_profiles


def find_missing_coaching_profiles(
    champion_profiles: list[ChampionProfile],
    coaching_profiles: list[CoachingProfile],
) -> list[ChampionProfile]:
    """Return champion-role profiles that do not have coaching context yet."""
    covered_profiles = {
        (profile.champion_name.lower(), profile.role) for profile in coaching_profiles
    }

    return [
        champion
        for champion in sorted(
            champion_profiles,
            key=lambda profile: (profile.role.value, profile.name.lower()),
        )
        if (champion.name.lower(), champion.role) not in covered_profiles
    ]


def count_coaching_profiles_by_role(
    coaching_profiles: list[CoachingProfile],
) -> dict[ChampionRole, int]:
    """Count available coaching profiles per role."""
    counts = {role: 0 for role in ChampionRole}
    for profile in coaching_profiles:
        counts[profile.role] += 1
    return counts
