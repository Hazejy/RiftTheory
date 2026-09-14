"""Tests for role-safe joins and explicit missing strategic knowledge."""

import unittest
from pathlib import Path

from src.draftos.champion_analysis import analyze_champions, explain_champion_assessment
from src.draftos.champion_data import load_champion_profiles
from src.draftos.composition import ChampionProfile, ChampionRole
from src.draftos.strategy import ChampionStrategicProfile
from src.draftos.strategy_data import load_strategic_profiles


class ChampionAnalysisTests(unittest.TestCase):
    def setUp(self) -> None:
        data = Path(__file__).resolve().parents[1] / "data"
        self.champions = load_champion_profiles(data / "champion_profiles.json")
        self.strategies = load_strategic_profiles(data / "strategic_profiles.json")

    def test_matching_preserves_order_and_source_objects(self) -> None:
        selected_champions = [
            next(
                champion
                for champion in self.champions
                if champion.name == "Malphite" and champion.role is ChampionRole.TOP
            ),
            next(
                champion
                for champion in self.champions
                if champion.name == "Anivia" and champion.role is ChampionRole.MID
            ),
        ]
        anivia_strategy = next(
            strategy for strategy in self.strategies if strategy.champion_name == "Anivia"
        )

        results = analyze_champions(selected_champions, self.strategies)

        self.assertEqual(len(results), 2)
        self.assertIs(results[0].champion, selected_champions[0])
        self.assertIsNone(results[0].strategy)
        self.assertIs(results[1].champion, selected_champions[1])
        self.assertIs(results[1].strategy, anivia_strategy)
        lines = explain_champion_assessment(results[1])
        self.assertTrue(
            any(line.startswith("  Capabilities:") and "wave clear" in line for line in lines)
        )
        self.assertIn("  Main colors: blue", lines)
        self.assertIn("  Review status: provisional", lines)

    def test_same_champion_in_another_role_does_not_match(self) -> None:
        anivia = next(
            champion
            for champion in self.champions
            if champion.name == "Anivia" and champion.role is ChampionRole.MID
        )
        support = ChampionProfile(
            name=anivia.name,
            role=ChampionRole.SUPPORT,
            capabilities=anivia.capabilities,
            source=anivia.source,
        )

        result = analyze_champions([support], self.strategies)[0]

        self.assertIsNone(result.strategy)
        self.assertIn(
            "  Strategic identity: not yet assessed",
            explain_champion_assessment(result),
        )

    def test_missing_strategy_does_not_generate_color_labels(self) -> None:
        malphite = next(
            champion
            for champion in self.champions
            if champion.name == "Malphite" and champion.role is ChampionRole.TOP
        )
        result = analyze_champions([malphite], self.strategies)[0]

        lines = explain_champion_assessment(result)
        self.assertEqual(lines[0], "Malphite (top):")
        self.assertIn("  Capability source: manually_curated", lines)
        self.assertIn("  Strategic identity: not yet assessed", lines)
        self.assertFalse(any("Main colors:" in line for line in lines))

    def test_different_patch_for_same_key_is_ambiguous(self) -> None:
        original = self.strategies[0]
        alternative = ChampionStrategicProfile(
            champion_name=original.champion_name,
            role=original.role,
            identity=original.identity,
            patch="test-patch",
        )
        with self.assertRaisesRegex(ValueError, "ambiguous strategic profiles"):
            analyze_champions(self.champions, [original, alternative])

    def test_empty_strategy_collection_leaves_all_unassessed(self) -> None:
        results = analyze_champions(self.champions, [])
        self.assertTrue(all(result.strategy is None for result in results))

    def test_empty_champion_selection_returns_no_results(self) -> None:
        self.assertEqual(analyze_champions([], self.strategies), [])


if __name__ == "__main__":
    unittest.main()
