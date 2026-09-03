"""Command-line entry point for DraftOS."""

from .composition import (
    ChampionProfile,
    CompositionCapability,
    explain_composition,
)


def main() -> None:
    """Run a small, explainable composition analysis."""
    champions = [
        ChampionProfile(
            name="Example Vanguard",
            capabilities={
                CompositionCapability.ENGAGE,
                CompositionCapability.FRONTLINE,
            },
        )
    ]
    required_capabilities = {
        CompositionCapability.ENGAGE,
        CompositionCapability.FRONTLINE,
        CompositionCapability.WAVE_CLEAR,
    }

    print("Composition analysis:")
    for explanation in explain_composition(champions, required_capabilities):
        print(f"- {explanation}")


if __name__ == "__main__":
    main()
