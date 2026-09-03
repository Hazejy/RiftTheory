"""Tests for readable strategic profile descriptions."""

import unittest

from src.draftos.composition import ChampionRole
from src.draftos.strategy import (
    ChampionStrategicProfile,
    StrategicColor,
    StrategicIdentity,
    explain_strategic_profile,
)


class StrategicExplanationTests(unittest.TestCase):
    def test_colors_are_sorted_and_reasoning_and_source_preserved(self) -> None:
        profile = ChampionStrategicProfile(
            champion_name="Example Champion",
            role=ChampionRole.MID,
            identity=StrategicIdentity(
                main_colors={StrategicColor.GREEN, StrategicColor.BLUE},
                off_colors={StrategicColor.WHITE, StrategicColor.BLACK},
                reasoning="An alternative plan requires a different build.",
                source_name="fictional_example",
            ),
        )

        self.assertEqual(
            explain_strategic_profile(profile),
            [
                "Example Champion (mid):",
                "  Main colors: blue, green",
                "  Off colors: black, white",
                "  Reasoning: An alternative plan requires a different build.",
                "  Source: fictional_example",
            ],
        )

    def test_colorless_is_distinct_from_no_off_colors(self) -> None:
        profile = ChampionStrategicProfile(
            champion_name="Example Theme Champion",
            role=ChampionRole.SUPPORT,
            identity=StrategicIdentity(
                main_colors={StrategicColor.COLORLESS},
                off_colors=set(),
                reasoning="Fictional dedicated theme.",
                source_name="fictional_example",
            ),
        )

        lines = explain_strategic_profile(profile)

        self.assertEqual(lines[1], "  Main colors: colorless")
        self.assertEqual(lines[2], "  Off colors: none")


if __name__ == "__main__":
    unittest.main()
