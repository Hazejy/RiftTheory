"""Tests for loading statistical role observations."""

import unittest
from pathlib import Path

from src.draftos.composition import ChampionRole
from src.draftos.flex_data import load_role_observations


class FlexDataTests(unittest.TestCase):
    """Verify the source-neutral role observation format."""

    def test_role_observations_are_loaded_from_json(self) -> None:
        data_file = Path("data/role_observations.example.json")

        observations = load_role_observations(data_file)

        self.assertEqual(len(observations), 3)
        self.assertEqual(observations[0].role, ChampionRole.TOP)
        self.assertEqual(observations[0].games, 800)
        self.assertEqual(observations[1].role, ChampionRole.JUNGLE)
        self.assertEqual(observations[1].games, 150)
        self.assertEqual(observations[2].role, ChampionRole.MID)
        self.assertEqual(observations[2].games, 50)


if __name__ == "__main__":
    unittest.main()

