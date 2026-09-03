"""Strategic vocabulary for MTG-inspired draft identities."""

from dataclasses import dataclass
from enum import Enum
from urllib.parse import urlsplit

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


class ReviewStatus(Enum):
    """Manually recorded review state, not a measure of predictive accuracy."""

    UNREVIEWED = "unreviewed"
    PROVISIONAL = "provisional"
    REVIEWED = "reviewed"
    OUTDATED = "outdated"


@dataclass
class ChampionStrategicProfile:
    """A champion's strategic identity in a specific role."""

    champion_name: str
    role: ChampionRole
    identity: StrategicIdentity
    patch: str | None = None
    review_status: ReviewStatus = ReviewStatus.UNREVIEWED
    source_url: str | None = None

    def __post_init__(self) -> None:
        """Keep unknown metadata explicit and reject misleading review states."""
        if self.patch is not None and (
            not isinstance(self.patch, str) or not self.patch.strip()
        ):
            raise ValueError("patch must be a non-empty string or null")
        if not isinstance(self.review_status, ReviewStatus):
            raise ValueError("review_status must be a ReviewStatus")
        if self.review_status is ReviewStatus.REVIEWED and self.patch is None:
            raise ValueError("a reviewed profile requires a patch")
        if self.source_url is not None:
            if not isinstance(self.source_url, str):
                raise ValueError("source_url must be an HTTP(S) URL or null")
            url = urlsplit(self.source_url)
            if (
                url.scheme not in {"http", "https"}
                or not url.hostname
                or any(character.isspace() for character in self.source_url)
                or url.username is not None
                or url.password is not None
            ):
                raise ValueError("source_url must be an HTTP(S) URL or null")


def explain_strategic_profile(profile: ChampionStrategicProfile) -> list[str]:
    """Describe the recorded identity without inferring a draft recommendation."""
    identity = profile.identity
    main_colors = ", ".join(sorted(color.value for color in identity.main_colors))
    off_colors = ", ".join(sorted(color.value for color in identity.off_colors))
    return [
        f"{profile.champion_name} ({profile.role.value}):",
        f"  Main colors: {main_colors}",
        f"  Off colors: {off_colors or 'none'}",
        f"  Reasoning: {identity.reasoning}",
        f"  Source: {identity.source_name}",
        f"  Patch: {profile.patch or 'unknown'}",
        f"  Review status: {profile.review_status.value}",
        f"  Source URL: {profile.source_url or 'not provided'}",
    ]
