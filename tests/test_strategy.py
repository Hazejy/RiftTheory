"""Tests for MTG-inspired strategic vocabulary."""

import unittest

from src.draftos.composition import ChampionRole
from src.draftos.strategy import (
    ChampionStrategicProfile,
    StrategicColor,
    StrategicIdentity,
)


class StrategicColorTests(unittest.TestCase):
    """Verify the allowed strategic color identities."""

    def test_strategic_colors_have_stable_values(self) -> None:
        self.assertEqual(StrategicColor.WHITE.value, "white")
        self.assertEqual(StrategicColor.BLUE.value, "blue")
        self.assertEqual(StrategicColor.BLACK.value, "black")
        self.assertEqual(StrategicColor.RED.value, "red")
        self.assertEqual(StrategicColor.GREEN.value, "green")
        self.assertEqual(StrategicColor.COLORLESS.value, "colorless")

    def test_unknown_strategic_color_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            StrategicColor("yellow")


class StrategicIdentityTests(unittest.TestCase):
    """Verify that strategic identities remain explainable."""

    def test_identity_can_contain_main_and_off_colors(self) -> None:
        identity = StrategicIdentity(
            main_colors={StrategicColor.BLUE},
            off_colors={StrategicColor.WHITE},
            reasoning="Example reasoning for a flexible control identity.",
            source_name="example_source",
        )

        self.assertEqual(identity.main_colors, {StrategicColor.BLUE})
        self.assertEqual(identity.off_colors, {StrategicColor.WHITE})
        self.assertEqual(
            identity.reasoning,
            "Example reasoning for a flexible control identity.",
        )
        self.assertEqual(identity.source_name, "example_source")

    def test_identity_without_reasoning_is_rejected(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "strategic identity reasoning is required",
        ):
            StrategicIdentity(
                main_colors={StrategicColor.BLUE},
                off_colors=set(),
                reasoning=" ",
                source_name="example_source",
            )

    def test_identity_without_main_color_is_rejected(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "at least one main strategic color is required",
        ):
            StrategicIdentity(
                main_colors=set(),
                off_colors={StrategicColor.WHITE},
                reasoning="Example reasoning.",
                source_name="example_source",
            )

    def test_color_cannot_be_both_main_and_off_color(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "a strategic color cannot be both main and off color",
        ):
            StrategicIdentity(
                main_colors={StrategicColor.BLUE},
                off_colors={StrategicColor.BLUE},
                reasoning="Example reasoning.",
                source_name="example_source",
            )


class ChampionStrategicProfileTests(unittest.TestCase):
    """Verify role-specific champion strategy profiles."""

    def test_identity_is_attached_to_champion_and_role(self) -> None:
        identity = StrategicIdentity(
            main_colors={StrategicColor.BLUE},
            off_colors={StrategicColor.WHITE},
            reasoning="Example reasoning for a flexible control identity.",
            source_name="example_source",
        )

        profile = ChampionStrategicProfile(
            champion_name="Example Champion",
            role=ChampionRole.MID,
            identity=identity,
        )

        self.assertEqual(profile.champion_name, "Example Champion")
        self.assertEqual(profile.role, ChampionRole.MID)
        self.assertEqual(profile.identity, identity)


if __name__ == "__main__":
    unittest.main()
