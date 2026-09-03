"""Load statistical role observations from JSON."""

import json
from pathlib import Path

from .composition import ChampionRole
from .flex import RoleObservation


def load_role_observations(file_path: Path) -> list[RoleObservation]:
    """Load role observations while preserving their data context."""
    observation_data = json.loads(file_path.read_text(encoding="utf-8"))

    return [
        RoleObservation(
            champion_name=observation["champion_name"],
            role=ChampionRole(observation["role"]),
            patch=observation["patch"],
            region=observation["region"],
            rank_bracket=observation["rank_bracket"],
            queue=observation["queue"],
            games=observation["games"],
            source_name=observation["source_name"],
        )
        for observation in observation_data
    ]

