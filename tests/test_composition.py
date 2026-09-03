"""Tests for the team composition domain vocabulary."""

import unittest

from src.draftos.composition import ChampionProfile, CompositionCapability


class CompositionCapabilityTests(unittest.TestCase):
    """Verify the allowed composition capabilities."""

    def test_capabilities_have_stable_values(self) -> None:
        self.assertEqual(CompositionCapability.ENGAGE.value, "engage")
        self.assertEqual(CompositionCapability.FRONTLINE.value, "frontline")
        self.assertEqual(CompositionCapability.WAVE_CLEAR.value, "wave_clear")

    def test_unknown_capability_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            CompositionCapability("mobility")


class ChampionProfileTests(unittest.TestCase):
    """Verify that champions can provide composition capabilities."""

    def test_champion_can_provide_multiple_capabilities(self) -> None:
        champion = ChampionProfile(
            name="Example Vanguard",
            capabilities={
                CompositionCapability.ENGAGE,
                CompositionCapability.FRONTLINE,
            },
        )

        self.assertEqual(champion.name, "Example Vanguard")
        self.assertEqual(
            champion.capabilities,
            {
                CompositionCapability.ENGAGE,
                CompositionCapability.FRONTLINE,
            },
        )


if __name__ == "__main__":
    unittest.main()
