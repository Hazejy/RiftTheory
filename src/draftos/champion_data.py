"""Load manually curated champion profiles from JSON."""

import json
from pathlib import Path

from .composition import (
    ChampionProfile,
    ChampionRole,
    CompositionCapability,
    KnowledgeSource,
)


def load_champion_profiles(file_path: Path) -> list[ChampionProfile]:
    """Load champion profiles from a JSON file."""
    profile_data = json.loads(file_path.read_text(encoding="utf-8"))
    role_aliases = {
        "adc": "bot",
        "botlane": "bot",
        "midlane": "mid",
        "toplane": "top",
    }
    champions: list[ChampionProfile] = []

    for index, profile in enumerate(profile_data):
        if not isinstance(profile, dict):
            raise ValueError(f"Champion profile {index} must be an object")
        name = str(profile.get("name", "")).strip()
        if not name:
            raise ValueError(f"Champion profile {index} has no name")

        raw_roles = profile.get("role", profile.get("Role"))
        roles = raw_roles if isinstance(raw_roles, list) else [raw_roles]
        raw_capabilities = profile.get("capabilities", [])
        capabilities = (
            raw_capabilities
            if isinstance(raw_capabilities, list)
            else [raw_capabilities]
        )
        parsed_capabilities = {
            CompositionCapability(str(capability).strip().lower())
            for capability in capabilities
            if str(capability).strip()
        }
        source = KnowledgeSource(profile.get("source", "manually_curated"))

        for raw_role in roles:
            normalized_role = str(raw_role).strip().lower()
            normalized_role = role_aliases.get(normalized_role, normalized_role)
            champions.append(
                ChampionProfile(
                    name=name,
                    role=ChampionRole(normalized_role),
                    capabilities=set(parsed_capabilities),
                    source=source,
                )
            )

    return champions
