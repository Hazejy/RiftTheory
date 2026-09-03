"""Verify the report contract independently of CLI text formatting."""

import json
import unittest

from src.draftos.champion_analysis import analyze_champions
from src.draftos.composition import (
    ChampionProfile, ChampionRole, CompositionCapability, KnowledgeSource,
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
            analyze_composition([champion], set(CompositionCapability)),
            is_demo=False,
        )
        self.assertEqual(json.loads(json.dumps(report)), report)
        entry = report["champions"][0]
        self.assertEqual(entry["capabilities"], ["engage", "wave_clear"])
        self.assertEqual(entry["capability_source"], "manually_curated")
        self.assertEqual(entry["strategy"], {
            "main_colors": ["blue", "white"], "off_colors": ["green"],
            "reasoning": strategy.identity.reasoning, "source_name": "test source",
            "source_url": None, "patch": None, "review_status": "unreviewed",
        })
        self.assertEqual(report["capability_assessments"], [
            {"capability": "engage", "providers": ["Example"], "is_missing": False},
            {"capability": "frontline", "providers": [], "is_missing": True},
            {"capability": "wave_clear", "providers": ["Example"], "is_missing": False},
        ])

    def test_colorless_is_not_serialized_as_missing_strategy(self) -> None:
        champion = ChampionProfile("Example", ChampionRole.TOP, set(), KnowledgeSource.MANUALLY_CURATED)
        strategy = ChampionStrategicProfile(
            champion.name, champion.role,
            StrategicIdentity({StrategicColor.COLORLESS}, set(), "Test theme.", "test"),
        )
        with_strategy = build_report(analyze_champions([champion], [strategy]), [], is_demo=False)
        without_strategy = build_report(analyze_champions([champion], []), [], is_demo=False)
        self.assertEqual(with_strategy["champions"][0]["strategy"]["main_colors"], ["colorless"])
        self.assertIsNone(without_strategy["champions"][0]["strategy"])


if __name__ == "__main__":
    unittest.main()
