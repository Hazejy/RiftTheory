"""Strategic vocabulary for MTG-inspired draft identities."""

from dataclasses import dataclass
from enum import Enum

from .composition import ChampionRole


class StrategicColor(Enum):
    """An MTG-inspired strategic identity used in draft reasoning."""

    WHITE = "white"
    BLUE = "blue"
    BLACK = "black"
    RED = "red"
    GREEN = "green"
    COLORLESS = "colorless"


@dataclass
class StrategicIdentity:
    """A reasoned MTG-inspired strategic identity."""

    main_colors: set[StrategicColor]
    off_colors: set[StrategicColor]
    reasoning: str
    source_name: str

    def __post_init__(self) -> None:
        """Require an identity, an explanation, and a source."""
        if not self.main_colors:
            raise ValueError("at least one main strategic color is required")
        if self.main_colors & self.off_colors:
            raise ValueError("a strategic color cannot be both main and off color")
        if not self.reasoning.strip():
            raise ValueError("strategic identity reasoning is required")
        if not self.source_name.strip():
            raise ValueError("strategic identity source is required")


@dataclass
class ChampionStrategicProfile:
    """A champion's strategic identity in a specific role."""

    champion_name: str
    role: ChampionRole
    identity: StrategicIdentity
