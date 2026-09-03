"""Resolve a fixed-role champion selection against the local catalog."""

from .composition import ChampionProfile


def select_champions(
    picks: list[str], catalog: list[ChampionProfile]
) -> list[ChampionProfile]:
    """Resolve Name:role picks, rejecting unknown or conflicting assignments.

    This selects known profiles; it does not infer viable flex roles.
    """
    if not 1 <= len(picks) <= 5:
        raise ValueError("select between one and five champions")

    profiles = {}
    for profile in catalog:
        key = (profile.name.strip().casefold(), profile.role.value)
        if key in profiles:
            raise ValueError(f"ambiguous catalog profile: {profile.name}:{profile.role.value}")
        profiles[key] = profile

    selected = []
    names = set()
    roles = set()
    for pick in picks:
        parts = pick.split(":")
        if len(parts) != 2 or not all(part.strip() for part in parts):
            raise ValueError(f"invalid pick {pick!r}; use Name:role, e.g. Anivia:mid")
        name, role = (part.strip().casefold() for part in parts)
        if (name, role) not in profiles:
            raise ValueError(
                f"no local profile for {pick!r}; use --list-champions to see available roles"
            )
        if name in names:
            raise ValueError(f"champion selected more than once: {parts[0].strip()}")
        if role in roles:
            raise ValueError(f"role assigned more than once: {role}")
        names.add(name)
        roles.add(role)
        selected.append(profiles[(name, role)])
    return selected
