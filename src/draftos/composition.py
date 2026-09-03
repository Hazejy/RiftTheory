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


@dataclass
class CapabilityAssessment:
    """Structured coverage result for one required capability."""

    capability: CompositionCapability
    providers: list[str]

    @property
    def is_missing(self) -> bool:
        """Return whether no champion provides the capability."""
        return not self.providers


def analyze_composition(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> list[CapabilityAssessment]:
    """Build a structured assessment for every required capability."""
    assessments: list[CapabilityAssessment] = []

    for capability in sorted(required_capabilities, key=lambda item: item.value):
        providers = [
            champion.name
            for champion in champions
            if capability in champion.capabilities
        ]
        assessments.append(
            CapabilityAssessment(
                capability=capability,
                providers=providers,
            )
        )

    return assessments


def find_composition_debt(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> set[CompositionCapability]:
    """Return the required capabilities not provided by the champions."""
    assessments = analyze_composition(champions, required_capabilities)

    return {
        assessment.capability
        for assessment in assessments
        if assessment.is_missing
    }


def explain_composition(
    champions: list[ChampionProfile],
    required_capabilities: set[CompositionCapability],
) -> list[str]:
    """Explain who provides each required capability and what is missing."""
    explanations: list[str] = []
    assessments = analyze_composition(champions, required_capabilities)

    for assessment in assessments:
        readable_name = assessment.capability.value.replace("_", " ")

        if assessment.providers:
            provider_names = ", ".join(assessment.providers)
            explanations.append(f"{readable_name}: provided by {provider_names}.")
        else:
            explanations.append(f"{readable_name}: missing.")

    return explanations
