"""Statistical observations used for future flex-pick analysis."""

from dataclasses import dataclass

from .composition import ChampionRole


@dataclass
class RoleObservation:
    """A champion role observed within a specific data context."""

    champion_name: str
    role: ChampionRole
    patch: str
    region: str
    rank_bracket: str
    queue: str
    games: int
    source_name: str

    def __post_init__(self) -> None:
        """Reject observations without a usable sample size."""
        if self.games <= 0:
            raise ValueError("games must be greater than zero")


def calculate_role_shares(
    observations: list[RoleObservation],
) -> dict[ChampionRole, float]:
    """Calculate observed role shares for one champion and data context."""
    if not observations:
        return {}

    first_observation = observations[0]
    expected_context = (
        first_observation.patch,
        first_observation.region,
        first_observation.rank_bracket,
        first_observation.queue,
        first_observation.source_name,
    )

    for observation in observations:
        observation_context = (
            observation.patch,
            observation.region,
            observation.rank_bracket,
            observation.queue,
            observation.source_name,
        )

        if observation.champion_name != first_observation.champion_name:
            raise ValueError("observations must describe one champion")
        if observation_context != expected_context:
            raise ValueError("observations must share one data context")

    roles = [observation.role for observation in observations]
    if len(roles) != len(set(roles)):
        raise ValueError("observations must contain unique roles")

    total_games = sum(observation.games for observation in observations)

    return {
        observation.role: observation.games / total_games
        for observation in observations
    }


def explain_role_shares(observations: list[RoleObservation]) -> list[str]:
    """Explain observed role shares with their sample sizes."""
    role_shares = calculate_role_shares(observations)
    games_by_role = {
        observation.role: observation.games
        for observation in observations
    }

    sorted_roles = sorted(
        role_shares,
        key=lambda role: role_shares[role],
        reverse=True,
    )

    return [
        f"{role.value}: {role_shares[role]:.1%} "
        f"({games_by_role[role]:,} games)"
        for role in sorted_roles
    ]
