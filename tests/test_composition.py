"""Tests for the team composition domain vocabulary."""

import unittest

from src.draftos.composition import (
    ChampionProfile,
    CompositionCapability,
    find_composition_debt,
)


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


class CompositionDebtTests(unittest.TestCase):
    """Verify composition debt calculations."""

    def test_missing_capability_is_returned_as_debt(self) -> None:
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

        debt = find_composition_debt(champions, required_capabilities)

        self.assertEqual(debt, {CompositionCapability.WAVE_CLEAR})

    def test_complete_composition_has_no_debt(self) -> None:
        champions = [
            ChampionProfile(
                name="Example Vanguard",
                capabilities={
                    CompositionCapability.ENGAGE,
                    CompositionCapability.FRONTLINE,
                },
            ),
            ChampionProfile(
                name="Example Mage",
                capabilities={CompositionCapability.WAVE_CLEAR},
            ),
        ]
        required_capabilities = {
            CompositionCapability.ENGAGE,
            CompositionCapability.FRONTLINE,
            CompositionCapability.WAVE_CLEAR,
        }

        debt = find_composition_debt(champions, required_capabilities)

        self.assertEqual(debt, set())


if __name__ == "__main__":
    unittest.main()
