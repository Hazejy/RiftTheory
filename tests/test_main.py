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
            "- wave clear: provided by Anivia.\n",
        )


if __name__ == "__main__":
    unittest.main()
