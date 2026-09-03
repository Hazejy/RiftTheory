"""Tests for the initial DraftOS command-line entry point."""

import io
import unittest
from contextlib import redirect_stdout

from src.draftos.__main__ import main


class MainTests(unittest.TestCase):
    """Verify the smallest executable product foundation."""

    def test_main_prints_readiness_message(self) -> None:
        output = io.StringIO()

        with redirect_stdout(output):
            main()

        self.assertEqual(output.getvalue(), "DraftOS foundation is ready.\n")


if __name__ == "__main__":
    unittest.main()

