"""Domain vocabulary for team composition analysis."""

from dataclasses import dataclass
from enum import Enum


class CompositionCapability(Enum):
    """A capability that a team composition may provide."""

    ENGAGE = "engage"
    FRONTLINE = "frontline"
    WAVE_CLEAR = "wave_clear"


@dataclass
class ChampionProfile:
    """A champion and the composition capabilities they provide."""

    name: str
    capabilities: set[CompositionCapability]


def find_composition_debt(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> set[CompositionCapability]:
    """Return the required capabilities not provided by the champions."""
    provided_capabilities: set[CompositionCapability] = set()

    for champion in champions:
        provided_capabilities.update(champion.capabilities)

    return required_capabilities - provided_capabilities
