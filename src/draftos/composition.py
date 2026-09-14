"""Domain vocabulary for team composition analysis."""

from dataclasses import dataclass
from enum import Enum


class CompositionCapability(Enum):
    """A capability that a team composition may provide."""

    ENGAGE = "engage"
    DISENGAGE = "disengage"
    PICK = "pick"
    POKE = "poke"
    FRONTLINE = "frontline"
    WAVE_CLEAR = "wave_clear"
    PEEL = "peel"
    DIVE = "dive"
    ANTI_DIVE = "anti_dive"
    ZONE_CONTROL = "zone_control"
    SIEGE = "siege"
    SIDE_LANE_PRESSURE = "side_lane_pressure"
    GLOBAL_PRESSURE = "global_pressure"
    OBJECTIVE_CONTROL = "objective_control"
    SUSTAIN = "sustain"


BASELINE_CAPABILITIES = frozenset({
    CompositionCapability.ENGAGE,
    CompositionCapability.FRONTLINE,
    CompositionCapability.WAVE_CLEAR,
})


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


class DamageFocus(Enum):
    """The primary damage or value profile for a champion role."""

    PHYSICAL = "physical"
    MAGIC = "magic"
    MIXED = "mixed"
    UTILITY = "utility"
    BUILD_DEPENDENT = "build_dependent"


class PowerCurve(Enum):
    """When a champion role most naturally wants the game to matter."""

    EARLY = "early"
    EARLY_MID = "early_mid"
    MID = "mid"
    MID_LATE = "mid_late"
    LATE = "late"
    TIMING_DEPENDENT = "timing_dependent"


class ResourceDemand(Enum):
    """How much draft and economy support a champion role asks for."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AssessmentMethod(Enum):
    """How a coaching profile was produced."""

    MANUAL = "manual"
    EDITORIAL = "editorial"
    OBSERVED = "observed"
    HYBRID = "hybrid"


class ReviewStatus(Enum):
    """Review confidence state for coaching data."""

    PROVISIONAL = "provisional"
    REVIEWED = "reviewed"
    DEPRECATED = "deprecated"


@dataclass
class ChampionProfile:
    """A champion and the composition capabilities they provide."""

    name: str
    role: ChampionRole
    capabilities: set[CompositionCapability]
    source: KnowledgeSource


@dataclass
class CoachingProfile:
    """Role-specific draft coaching context for one champion."""

    champion_name: str
    role: ChampionRole
    damage_focus: DamageFocus
    power_curve: PowerCurve
    resource_demand: ResourceDemand
    execution_demand: int
    spike_notes: list[str]
    reasoning: str
    patch: str
    assessment_method: AssessmentMethod
    confidence: float
    review_status: ReviewStatus
    source_name: str


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
