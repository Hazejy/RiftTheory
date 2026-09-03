"""Domain vocabulary for team composition analysis."""

from enum import Enum


class CompositionCapability(Enum):
    """A capability that a team composition may provide."""

    ENGAGE = "engage"
    FRONTLINE = "frontline"
    WAVE_CLEAR = "wave_clear"

