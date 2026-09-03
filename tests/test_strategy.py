"""Tests for MTG-inspired strategic vocabulary."""

import unittest

from src.draftos.strategy import StrategicColor


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


if __name__ == "__main__":
    unittest.main()

