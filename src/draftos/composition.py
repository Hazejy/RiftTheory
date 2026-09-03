"""Domain vocabulary for team composition analysis."""

from dataclasses import dataclass
from enum import Enum


class CompositionCapability(Enum):
    """A capability that a team composition may provide."""

    ENGAGE = "engage"
    FRONTLINE = "frontline"
    WAVE_CLEAR = "wave_clear"


class ChampionRole(Enum):
    """A playable League of Legends role."""

    TOP = "top"
    JUNGLE = "jungle"
    MID = "mid"
    BOT = "bot"
    SUPPORT = "support"


class KnowledgeSource(Enum):
    """The origin of a champion profile assessment."""

    MANUALLY_CURATED = "manually_curated"


@dataclass
class ChampionProfile:
    """A champion and the composition capabilities they provide."""

    name: str
    role: ChampionRole
    capabilities: set[CompositionCapability]
    source: KnowledgeSource


def find_composition_debt(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> set[CompositionCapability]:
    """Return the required capabilities not provided by the champions."""
    provided_capabilities: set[CompositionCapability] = set()

    for champion in champions:
        provided_capabilities.update(champion.capabilities)

    return required_capabilities - provided_capabilities


def explain_composition(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> list[str]:
    """Explain who provides each required capability and what is missing."""
    explanations: list[str] = []

    for capability in sorted(required_capabilities, key=lambda item: item.value):
        providers = [
            champion.name
            for champion in champions
            if capability in champion.capabilities
        ]
        readable_name = capability.value.replace("_", " ")

        if providers:
            provider_names = ", ".join(providers)
            explanations.append(f"{readable_name}: provided by {provider_names}.")
        else:
            explanations.append(f"{readable_name}: missing.")

    return explanations
