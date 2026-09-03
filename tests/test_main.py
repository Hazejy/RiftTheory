"""Tests for the initial DraftOS command-line entry point."""

import io
import unittest
from contextlib import redirect_stdout

from src.draftos.__main__ import main


class MainTests(unittest.TestCase):
    """Verify the executable composition analysis."""

    def test_main_prints_composition_analysis(self) -> None:
        output = io.StringIO()

        with redirect_stdout(output):
            main()

        self.assertEqual(
            output.getvalue(),
            "Composition analysis:\n"
            "- engage: provided by Malphite.\n"
            "- frontline: provided by Malphite.\n"
            "- wave clear: provided by Anivia.\n"
            "\n"
            "Role share example (fictional data):\n"
            "- top: 80.0% (800 games)\n"
            "- jungle: 15.0% (150 games)\n"
            "- mid: 5.0% (50 games)\n"
            "\n"
            "Strategic profiles (curated interpretations; see review status):\n"
            "Anivia (mid):\n"
            "  Main colors: blue\n"
            "  Off colors: white\n"
            "  Reasoning: AI-assisted interpretation: Blue reflects space control "
            "and denial through stun, wall and persistent area damage. White is "
            "a conditional defensive/peel interpretation, not universal draft "
            "flexibility. Wave clear does not guarantee safe access against "
            "long-range pressure; positioning, mana and allied setup must be "
            "assessed. No win probability is inferred.\n"
            "  Source: DraftOS AI-assisted synthesis; evidence and limits: "
            "research/anivia-mid-profile.md\n"
            "  Patch: unknown\n"
            "  Review status: provisional\n"
            "  Source URL: https://www.leagueoflegends.com/en-us/champions/anivia/\n",
        )


if __name__ == "__main__":
    unittest.main()
