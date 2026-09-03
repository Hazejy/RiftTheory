"""Load manually curated champion profiles from JSON."""

import json
from pathlib import Path

from .composition import ChampionProfile, CompositionCapability


def load_champion_profiles(file_path: Path) -> list[ChampionProfile]:
    """Load champion profiles from a JSON file."""
    profile_data = json.loads(file_path.read_text(encoding="utf-8"))

    return [
        ChampionProfile(
            name=profile["name"],
            capabilities={
                CompositionCapability(capability)
                for capability in profile["capabilities"]
            },
        )
        for profile in profile_data
    ]

