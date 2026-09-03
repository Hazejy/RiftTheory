"""Load role-specific strategic profiles from JSON."""

import json
from pathlib import Path

from .composition import ChampionRole
from .strategy import (
    ChampionStrategicProfile,
    ReviewStatus,
    StrategicColor,
    StrategicIdentity,
)


def _required_text(data: dict, field: str) -> str:
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value


def _color_set(data: dict, field: str) -> set[StrategicColor]:
    values = data.get(field)
    if not isinstance(values, list) or not all(
        isinstance(value, str) for value in values
    ):
        raise ValueError(f"{field} must be a list of color strings")
    colors = {StrategicColor(value) for value in values}
    if len(colors) != len(values):
        raise ValueError(f"{field} must not contain duplicate colors")
    return colors


def load_strategic_profiles(file_path: Path) -> list[ChampionStrategicProfile]:
    """Load profiles, rejecting invalid data without returning partial results."""
    profile_data = json.loads(file_path.read_text(encoding="utf-8"))
    if not isinstance(profile_data, list):
        raise ValueError("strategic profiles must be a JSON array")

    profiles = []
    for index, profile in enumerate(profile_data):
        try:
            if not isinstance(profile, dict):
                raise ValueError("profile must be a JSON object")
            identity = profile.get("identity")
            if not isinstance(identity, dict):
                raise ValueError("identity must be a JSON object")
            for field in ("patch", "review_status", "source_url"):
                if field not in profile:
                    raise ValueError(f"{field} is required (use null for unknown metadata)")
            profiles.append(
                ChampionStrategicProfile(
                    champion_name=_required_text(profile, "champion_name"),
                    role=ChampionRole(_required_text(profile, "role")),
                    patch=profile["patch"],
                    review_status=ReviewStatus(_required_text(profile, "review_status")),
                    source_url=profile["source_url"],
                    identity=StrategicIdentity(
                        main_colors=_color_set(identity, "main_colors"),
                        off_colors=_color_set(identity, "off_colors"),
                        reasoning=_required_text(identity, "reasoning"),
                        source_name=_required_text(identity, "source_name"),
                    ),
                )
            )
        except ValueError as error:
            raise ValueError(f"strategic profile {index + 1}: {error}") from error
    return profiles
