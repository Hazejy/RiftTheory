"""Tests for loading fictional strategic profiles and rejecting invalid data."""

import copy
import json
import tempfile
import unittest
from pathlib import Path

from src.draftos.composition import ChampionRole
from src.draftos.strategy import ReviewStatus, StrategicColor, explain_strategic_profile
from src.draftos.strategy_data import load_strategic_profiles


EXAMPLE_FILE = (
    Path(__file__).resolve().parents[1] / "data/strategic_profiles.example.json"
)


class StrategicDataTests(unittest.TestCase):
    def test_real_champion_data_is_separate_and_provisional(self) -> None:
        profiles = load_strategic_profiles(EXAMPLE_FILE.with_name("strategic_profiles.json"))

        self.assertEqual(len(profiles), 1)
        anivia = profiles[0]
        self.assertEqual(anivia.champion_name, "Anivia")
        self.assertIs(anivia.role, ChampionRole.MID)
        self.assertEqual(anivia.identity.main_colors, {StrategicColor.BLUE})
        self.assertEqual(anivia.identity.off_colors, {StrategicColor.WHITE})
        self.assertIs(anivia.review_status, ReviewStatus.PROVISIONAL)
        self.assertIsNone(anivia.patch)
        self.assertEqual(
            anivia.source_url,
            "https://www.leagueoflegends.com/en-us/champions/anivia/",
        )
        self.assertIn("AI-assisted", anivia.identity.reasoning)
        self.assertIn("research/anivia-mid-profile.md", anivia.identity.source_name)

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
        self.assertIsNone(profiles[0].patch)
        self.assertIsNone(profiles[0].source_url)
        self.assertIs(profiles[0].review_status, ReviewStatus.UNREVIEWED)

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
            ("patch", " "),
            ("patch", 123),
            ("review_status", "approved"),
            ("review_status", "reviewed"),
            ("source_url", ""),
            ("source_url", 123),
            ("source_url", "javascript:alert(1)"),
            ("source_url", "https:///missing-host"),
            ("source_url", "https://example.com/a b"),
            ("source_url", "https://user:password@example.com"),
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

    def test_metadata_is_preserved_for_every_review_state(self) -> None:
        example = json.loads(EXAMPLE_FILE.read_text(encoding="utf-8"))[0]
        for status in ReviewStatus:
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                example.update(
                    patch="test-patch",
                    review_status=status.value,
                    source_url="https://example.com/fictional-review",
                )
                path = Path(directory) / "profiles.json"
                path.write_text(json.dumps([example]), encoding="utf-8")

                profile = load_strategic_profiles(path)[0]

                self.assertEqual(profile.patch, "test-patch")
                self.assertIs(profile.review_status, status)
                self.assertEqual(profile.source_url, example["source_url"])
                self.assertEqual(
                    explain_strategic_profile(profile)[-3:],
                    [
                        "  Patch: test-patch",
                        f"  Review status: {status.value}",
                        "  Source URL: https://example.com/fictional-review",
                    ],
                )

    def test_missing_metadata_keys_are_rejected(self) -> None:
        example = json.loads(EXAMPLE_FILE.read_text(encoding="utf-8"))[0]
        for field in ("patch", "review_status", "source_url"):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                invalid = copy.deepcopy(example)
                del invalid[field]
                path = Path(directory) / "profiles.json"
                path.write_text(json.dumps([invalid]), encoding="utf-8")
                with self.assertRaisesRegex(ValueError, f"{field} is required"):
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
