"""Verify the report contract independently of CLI text formatting."""

import json
import unittest

from src.draftos.champion_analysis import analyze_champions
from src.draftos.composition import (
<<<<<<< Updated upstream
    BASELINE_CAPABILITIES, ChampionProfile, ChampionRole, CompositionCapability, KnowledgeSource,
=======
    AssessmentMethod,
    ChampionProfile,
    ChampionRole,
    CoachingProfile,
    CompositionCapability,
    DamageFocus,
    KnowledgeSource,
    PowerCurve,
    ResourceDemand,
    ReviewStatus,
>>>>>>> Stashed changes
    analyze_composition,
)
from src.draftos.report import build_report
from src.draftos.strategy import ChampionStrategicProfile, StrategicColor, StrategicIdentity


class ReportTests(unittest.TestCase):
    def test_report_preserves_metadata_and_sorts_sets(self) -> None:
        champion = ChampionProfile(
            "Example", ChampionRole.MID,
            {CompositionCapability.WAVE_CLEAR, CompositionCapability.ENGAGE},
            KnowledgeSource.MANUALLY_CURATED,
        )
        strategy = ChampionStrategicProfile(
            champion.name, champion.role,
            StrategicIdentity(
                {StrategicColor.WHITE, StrategicColor.BLUE}, {StrategicColor.GREEN},
                "Fictional reasoning with Unicode: contrôle.", "test source",
            ),
        )
        report = build_report(
            analyze_champions([champion], [strategy]),
<<<<<<< Updated upstream
            analyze_composition([champion], set(BASELINE_CAPABILITIES)),
=======
            analyze_composition(
                [champion],
                {
                    CompositionCapability.ENGAGE,
                    CompositionCapability.FRONTLINE,
                    CompositionCapability.WAVE_CLEAR,
                },
            ),
>>>>>>> Stashed changes
            is_demo=False,
        )
        self.assertEqual(json.loads(json.dumps(report)), report)
        entry = report["champions"][0]
        self.assertEqual(entry["capabilities"], ["engage", "wave_clear"])
        self.assertEqual(entry["capability_source"], "manually_curated")
        self.assertIsNone(entry["coaching"])
        self.assertEqual(
            entry["strategy"],
            {
                "main_colors": ["blue", "white"],
                "off_colors": ["green"],
                "reasoning": strategy.identity.reasoning,
                "source_name": "test source",
                "source_url": None,
                "patch": None,
                "review_status": "unreviewed",
            },
        )
        self.assertEqual(
            report["capability_assessments"],
            [
                {"capability": "engage", "providers": ["Example"], "is_missing": False},
                {"capability": "frontline", "providers": [], "is_missing": True},
                {
                    "capability": "wave_clear",
                    "providers": ["Example"],
                    "is_missing": False,
                },
            ],
        )

    def test_colorless_is_not_serialized_as_missing_strategy(self) -> None:
        champion = ChampionProfile(
            "Example",
            ChampionRole.TOP,
            set(),
            KnowledgeSource.MANUALLY_CURATED,
        )
        strategy = ChampionStrategicProfile(
            champion.name, champion.role,
            StrategicIdentity({StrategicColor.COLORLESS}, set(), "Test theme.", "test"),
        )
        with_strategy = build_report(
            analyze_champions([champion], [strategy]),
            [],
            is_demo=False,
        )
        without_strategy = build_report(
            analyze_champions([champion], []),
            [],
            is_demo=False,
        )
        self.assertEqual(
            with_strategy["champions"][0]["strategy"]["main_colors"],
            ["colorless"],
        )
        self.assertIsNone(without_strategy["champions"][0]["strategy"])

    def test_report_serializes_matching_coaching_profile(self) -> None:
        champion = ChampionProfile(
            "Example",
            ChampionRole.JUNGLE,
            {CompositionCapability.ENGAGE},
            KnowledgeSource.MANUALLY_CURATED,
        )
        coaching_profile = CoachingProfile(
            champion_name="Example",
            role=ChampionRole.JUNGLE,
            damage_focus=DamageFocus.PHYSICAL,
            power_curve=PowerCurve.EARLY_MID,
            resource_demand=ResourceDemand.MEDIUM,
            execution_demand=3,
            spike_notes=["Level 6"],
            reasoning="Direct access profile.",
            patch="unknown",
            assessment_method=AssessmentMethod.MANUAL,
            confidence=0.7,
            review_status=ReviewStatus.PROVISIONAL,
            source_name="test source",
        )

        report = build_report(
            analyze_champions([champion], []),
            analyze_composition([champion], {CompositionCapability.ENGAGE}),
            is_demo=False,
            coaching_profiles=[coaching_profile],
        )

        self.assertEqual(
            report["champions"][0]["coaching"],
            {
                "damage_focus": "physical",
                "power_curve": "early_mid",
                "resource_demand": "medium",
                "execution_demand": 3,
                "spike_notes": ["Level 6"],
                "reasoning": "Direct access profile.",
                "patch": "unknown",
                "assessment_method": "manual",
                "confidence": 0.7,
                "review_status": "provisional",
                "source_name": "test source",
            },
        )


if __name__ == "__main__":
    unittest.main()
