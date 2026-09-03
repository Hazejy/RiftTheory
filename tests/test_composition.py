"""Tests for the team composition domain vocabulary."""

import unittest

from src.draftos.composition import (
    CapabilityAssessment,
    ChampionProfile,
    ChampionRole,
    CompositionCapability,
    KnowledgeSource,
    analyze_composition,
    explain_composition,
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
            role=ChampionRole.TOP,
            capabilities={
                CompositionCapability.ENGAGE,
                CompositionCapability.FRONTLINE,
            },
            source=KnowledgeSource.MANUALLY_CURATED,
        )

        self.assertEqual(champion.name, "Example Vanguard")
        self.assertEqual(champion.role, ChampionRole.TOP)
        self.assertEqual(champion.source, KnowledgeSource.MANUALLY_CURATED)
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
                role=ChampionRole.TOP,
                capabilities={
                    CompositionCapability.ENGAGE,
                    CompositionCapability.FRONTLINE,
                },
                source=KnowledgeSource.MANUALLY_CURATED,
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
                role=ChampionRole.TOP,
                capabilities={
                    CompositionCapability.ENGAGE,
                    CompositionCapability.FRONTLINE,
                },
                source=KnowledgeSource.MANUALLY_CURATED,
            ),
            ChampionProfile(
                name="Example Mage",
                role=ChampionRole.MID,
                capabilities={CompositionCapability.WAVE_CLEAR},
                source=KnowledgeSource.MANUALLY_CURATED,
            ),
        ]
        required_capabilities = {
            CompositionCapability.ENGAGE,
            CompositionCapability.FRONTLINE,
            CompositionCapability.WAVE_CLEAR,
        }

        debt = find_composition_debt(champions, required_capabilities)

        self.assertEqual(debt, set())


class CompositionAnalysisTests(unittest.TestCase):
    """Verify structured composition analysis results."""

    def test_analysis_marks_covered_and_missing_capabilities(self) -> None:
        champions = [
            ChampionProfile(
                name="Example Vanguard",
                role=ChampionRole.TOP,
                capabilities={CompositionCapability.ENGAGE},
                source=KnowledgeSource.MANUALLY_CURATED,
            )
        ]
        required_capabilities = {
            CompositionCapability.ENGAGE,
            CompositionCapability.WAVE_CLEAR,
        }

        assessments = analyze_composition(champions, required_capabilities)

        self.assertEqual(
            assessments,
            [
                CapabilityAssessment(
                    capability=CompositionCapability.ENGAGE,
                    providers=["Example Vanguard"],
                ),
                CapabilityAssessment(
                    capability=CompositionCapability.WAVE_CLEAR,
                    providers=[],
                ),
            ],
        )
        self.assertFalse(assessments[0].is_missing)
        self.assertTrue(assessments[1].is_missing)


class CompositionExplanationTests(unittest.TestCase):
    """Verify human-readable composition explanations."""

    def test_explanation_names_providers_and_missing_capabilities(self) -> None:
        champions = [
            ChampionProfile(
                name="Example Vanguard",
                role=ChampionRole.TOP,
                capabilities={
                    CompositionCapability.ENGAGE,
                    CompositionCapability.FRONTLINE,
                },
                source=KnowledgeSource.MANUALLY_CURATED,
            )
        ]
        required_capabilities = {
            CompositionCapability.ENGAGE,
            CompositionCapability.FRONTLINE,
            CompositionCapability.WAVE_CLEAR,
        }

        explanations = explain_composition(champions, required_capabilities)

        self.assertEqual(
            explanations,
            [
                "engage: provided by Example Vanguard.",
                "frontline: provided by Example Vanguard.",
                "wave clear: missing.",
            ],
        )


if __name__ == "__main__":
    unittest.main()
