"""Tests for loading manually curated champion profiles."""

import unittest
from pathlib import Path

from src.draftos.champion_data import load_champion_profiles
from src.draftos.composition import CompositionCapability


class ChampionDataTests(unittest.TestCase):
    """Verify the prototype League of Legends champion data."""

    def test_profiles_are_loaded_from_json(self) -> None:
        data_file = Path("data/champion_profiles.json")

        champions = load_champion_profiles(data_file)

        self.assertEqual(
            [champion.name for champion in champions],
            ["Malphite", "Anivia"],
        )
        self.assertEqual(
            champions[0].capabilities,
            {
                CompositionCapability.ENGAGE,
                CompositionCapability.FRONTLINE,
            },
        )
        self.assertEqual(
            champions[1].capabilities,
            {CompositionCapability.WAVE_CLEAR},
        )


if __name__ == "__main__":
    unittest.main()

