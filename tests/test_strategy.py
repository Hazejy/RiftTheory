"""Tests for MTG-inspired strategic vocabulary."""

import unittest

from src.draftos.strategy import StrategicColor, StrategicIdentity


class StrategicColorTests(unittest.TestCase):
    """Verify the allowed strategic color identities."""

    def test_strategic_colors_have_stable_values(self) -> None:
        self.assertEqual(StrategicColor.WHITE.value, "white")
        self.assertEqual(StrategicColor.BLUE.value, "blue")
        self.assertEqual(StrategicColor.BLACK.value, "black")
        self.assertEqual(StrategicColor.RED.value, "red")
        self.assertEqual(StrategicColor.GREEN.value, "green")

    def test_unknown_strategic_color_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            StrategicColor("yellow")


class StrategicIdentityTests(unittest.TestCase):
    """Verify that strategic identities remain explainable."""

    def test_identity_can_contain_multiple_colors(self) -> None:
        identity = StrategicIdentity(
            colors={StrategicColor.BLUE, StrategicColor.WHITE},
            reasoning="Example reasoning for a flexible control identity.",
            source_name="example_source",
        )

        self.assertEqual(
            identity.colors,
            {StrategicColor.BLUE, StrategicColor.WHITE},
        )
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
                colors={StrategicColor.BLUE},
                reasoning=" ",
                source_name="example_source",
            )


if __name__ == "__main__":
    unittest.main()
