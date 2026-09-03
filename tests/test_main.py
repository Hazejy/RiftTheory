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
            "Strategic profile examples (fictional data):\n"
            "Example Control Champion (mid):\n"
            "  Main colors: blue, green\n"
            "  Off colors: white\n"
            "  Reasoning: Fictional format example: control and allied power "
            "timings define the main plan. A supportive build offers a flexible "
            "alternative; it is not assumed to be active in every draft.\n"
            "  Source: fictional_example_not_champion_analysis\n"
            "  Patch: unknown\n"
            "  Review status: unreviewed\n"
            "  Source URL: not provided\n"
            "Example Theme Champion (support):\n"
            "  Main colors: colorless\n"
            "  Off colors: none\n"
            "  Reasoning: Fictional format example: a dedicated theme requires "
            "the composition to be built around it. Colorless does not mean "
            "an unknown classification.\n"
            "  Source: fictional_example_not_champion_analysis\n"
            "  Patch: unknown\n"
            "  Review status: unreviewed\n"
            "  Source URL: not provided\n",
        )


if __name__ == "__main__":
    unittest.main()
