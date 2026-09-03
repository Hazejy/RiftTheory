"""Tests for loading fictional strategic profiles and rejecting invalid data."""

import copy
import json
import tempfile
import unittest
from pathlib import Path

from src.draftos.composition import ChampionRole
from src.draftos.strategy import StrategicColor
from src.draftos.strategy_data import load_strategic_profiles


EXAMPLE_FILE = (
    Path(__file__).resolve().parents[1] / "data/strategic_profiles.example.json"
)


class StrategicDataTests(unittest.TestCase):
    def test_example_profiles_preserve_identity_and_role(self) -> None:
        profiles = load_strategic_profiles(EXAMPLE_FILE)

        self.assertEqual(len(profiles), 2)
        self.assertEqual(profiles[0].champion_name, "Example Control Champion")
        self.assertEqual(profiles[0].role, ChampionRole.MID)
        self.assertEqual(
            profiles[0].identity.main_colors,
            {StrategicColor.BLUE, StrategicColor.GREEN},
        )
        self.assertEqual(profiles[0].identity.off_colors, {StrategicColor.WHITE})
        raw = json.loads(EXAMPLE_FILE.read_text(encoding="utf-8"))
        self.assertEqual(profiles[0].identity.reasoning, raw[0]["identity"]["reasoning"])
        self.assertEqual(
            profiles[0].identity.source_name,
            "fictional_example_not_champion_analysis",
        )
        self.assertEqual(profiles[1].identity.main_colors, {StrategicColor.COLORLESS})
        self.assertEqual(profiles[1].identity.off_colors, set())

    def test_invalid_profile_fields_are_rejected(self) -> None:
        example = json.loads(EXAMPLE_FILE.read_text(encoding="utf-8"))[0]
        cases = [
            ("champion_name", " "),
            ("role", "unknown"),
            ("identity", None),
            ("main_colors", []),
            ("main_colors", ["yellow"]),
            ("main_colors", ["blue", "blue"]),
            ("main_colors", "blue"),
            ("off_colors", ["blue"]),
            ("off_colors", [42]),
            ("reasoning", " "),
            ("source_name", None),
        ]
        for field, value in cases:
            with self.subTest(field=field, value=value):
                invalid = copy.deepcopy(example)
                target = invalid if field in example else invalid["identity"]
                target[field] = value
                with tempfile.TemporaryDirectory() as directory:
                    path = Path(directory) / "profiles.json"
                    path.write_text(json.dumps([example, invalid]), encoding="utf-8")
                    with self.assertRaisesRegex(ValueError, "strategic profile 2:"):
                        load_strategic_profiles(path)

    def test_invalid_structure_and_missing_fields_are_rejected(self) -> None:
        for data in ({}, [None], [{}], [{"identity": {}}]):
            with self.subTest(data=data), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "profiles.json"
                path.write_text(json.dumps(data), encoding="utf-8")
                with self.assertRaises(ValueError):
                    load_strategic_profiles(path)

    def test_malformed_json_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "profiles.json"
            path.write_text("[", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                load_strategic_profiles(path)

    def test_missing_file_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                load_strategic_profiles(Path(directory) / "missing.json")


if __name__ == "__main__":
    unittest.main()
