"""Tests for loading manually curated champion profiles."""

import unittest
from pathlib import Path

from src.draftos.champion_data import load_champion_profiles
from src.draftos.composition import (
    ChampionRole,
    CompositionCapability,
    KnowledgeSource,
)


class ChampionDataTests(unittest.TestCase):
    """Verify the prototype League of Legends champion data."""

    def test_profiles_are_loaded_from_json(self) -> None:
        data_file = Path("data/champion_profiles.json")

        champions = load_champion_profiles(data_file)

        self.assertGreaterEqual(len(champions), 100)
        anivia = [champion for champion in champions if champion.name == "Anivia"]
        self.assertEqual(
            {champion.role for champion in anivia},
            {ChampionRole.MID, ChampionRole.TOP},
        )
        braum = next(champion for champion in champions if champion.name == "Braum")
        self.assertEqual(
            braum.capabilities,
            {CompositionCapability.DISENGAGE},
        )
        brand = [champion for champion in champions if champion.name == "Brand"]
        self.assertIn(ChampionRole.BOT, {champion.role for champion in brand})
        self.assertTrue(
            all(
                champion.source is KnowledgeSource.MANUALLY_CURATED
                for champion in champions
            )
        )


if __name__ == "__main__":
    unittest.main()
