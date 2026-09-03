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
