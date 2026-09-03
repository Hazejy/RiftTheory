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

    return [
        ChampionProfile(
            name=profile["name"],
            role=ChampionRole(profile["role"]),
            capabilities={
                CompositionCapability(capability)
                for capability in profile["capabilities"]
            },
            source=KnowledgeSource(profile["source"]),
        )
        for profile in profile_data
    ]
