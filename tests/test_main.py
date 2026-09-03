"""Tests for the initial DraftOS command-line entry point."""

import io
import unittest
from contextlib import redirect_stderr, redirect_stdout

from src.draftos.__main__ import main


class MainTests(unittest.TestCase):
    """Verify the executable composition analysis."""

    def test_main_prints_composition_analysis(self) -> None:
        output = io.StringIO()

        with redirect_stdout(output):
            main([])

        self.assertEqual(
            output.getvalue(),
            "Demo selection: Malphite:top, Anivia:mid\n"
            "Baseline capability check (not a draft score):\n"
            "- engage: provided by Malphite.\n"
            "- frontline: provided by Malphite.\n"
            "- wave clear: provided by Anivia.\n"
            "\n"
            "Champion profiles (curated interpretations; see review status):\n"
            "Malphite (top):\n"
            "  Capabilities: engage, frontline\n"
            "  Capability source: manually_curated\n"
            "  Strategic identity: not yet assessed\n"
            "Anivia (mid):\n"
            "  Capabilities: wave clear\n"
            "  Capability source: manually_curated\n"
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


    def test_single_pick_reports_missing_capabilities(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--champion", "Anivia:mid"])
        text = output.getvalue()
        self.assertIn("- engage: missing.", text)
        self.assertIn("- frontline: missing.", text)
        self.assertIn("- wave clear: provided by Anivia.", text)
        self.assertNotIn("Malphite", text)
        self.assertNotIn("fictional", text)

    def test_examples_require_explicit_flag(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--examples"])
        self.assertIn("Role share example (fictional data):", output.getvalue())
        self.assertIn("- top: 80.0% (800 games)", output.getvalue())

    def test_catalog_listing_does_not_run_analysis(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--list-champions"])
        self.assertEqual(output.getvalue(),
            "Available local profiles (not a complete champion or role catalog):\n"
            "- Anivia:mid\n- Malphite:top\n")

    def test_invalid_selection_exits_cleanly_without_partial_output(self) -> None:
        for args in (
            ["--champion", "Anivia:support"],
            ["--champion", "Anivia:mid", "--champion", "Anivia:mid"],
            ["--champion", "Anivia"],
            ["--list-champions", "--examples"],
        ):
            with self.subTest(args=args):
                output, errors = io.StringIO(), io.StringIO()
                with redirect_stdout(output), redirect_stderr(errors):
                    with self.assertRaises(SystemExit) as raised:
                        main(args)
                self.assertEqual(raised.exception.code, 2)
                self.assertEqual(output.getvalue(), "")
                self.assertIn("error:", errors.getvalue())

    def test_help_exits_successfully(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output), self.assertRaises(SystemExit) as raised:
            main(["--help"])
        self.assertEqual(raised.exception.code, 0)
        self.assertIn("--champion", output.getvalue())


if __name__ == "__main__":
    unittest.main()
