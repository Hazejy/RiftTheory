"""Strategic vocabulary for MTG-inspired draft identities."""

from enum import Enum


class StrategicColor(Enum):
    """An MTG-inspired strategic identity used in draft reasoning."""

    WHITE = "white"
    BLUE = "blue"
    BLACK = "black"
    RED = "red"
    GREEN = "green"

