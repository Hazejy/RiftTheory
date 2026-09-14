"""Tests for the initial DraftOS command-line entry point."""

import io
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

from src.draftos.__main__ import main


class MainTests(unittest.TestCase):
    """Verify the executable composition analysis."""

    def test_main_prints_composition_analysis(self) -> None:
        output = io.StringIO()

        with redirect_stdout(output):
            main([])

        text = output.getvalue()
        self.assertIn("Demo selection: Malphite:top, Anivia:mid\n", text)
        self.assertIn("Baseline capability check (not a draft score):\n", text)
        self.assertIn("- wave clear: provided by Anivia.\n", text)
        self.assertIn("Champion profiles (curated interpretations; see review status):\n", text)
        self.assertIn("Malphite (top):\n", text)
        self.assertIn("Anivia (mid):\n", text)
        self.assertIn("  Review status: provisional\n", text)
        self.assertIn("Coaching context (role-specific; provisional where marked):\n", text)


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
        text = output.getvalue()
        self.assertTrue(
            text.startswith(
                "Available local profiles (not a complete champion or role catalog):\n"
            )
        )
        self.assertIn("- Anivia:mid\n", text)
        self.assertIn("- Malphite:top\n", text)
        self.assertNotIn("Baseline capability check", text)
        self.assertNotIn("Champion profiles", text)

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

    def test_json_output_is_a_single_document_with_selected_champion(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--champion", "Anivia:mid", "--format", "json"])
        report = json.loads(output.getvalue())
        self.assertEqual(report["schema_version"], 1)
        self.assertFalse(report["is_demo"])
        self.assertEqual([item["champion_name"] for item in report["champions"]], ["Anivia"])
        strategy = report["champions"][0]["strategy"]
        self.assertEqual(strategy["review_status"], "provisional")
        self.assertIsNone(strategy["patch"])
        self.assertEqual(
            [item["capability"] for item in report["capability_assessments"] if item["is_missing"]],
            ["engage", "frontline"],
        )

    def test_default_json_marks_demo_and_missing_strategy(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--format", "json"])
        report = json.loads(output.getvalue())
        self.assertTrue(report["is_demo"])
        self.assertIsNone(report["champions"][0]["strategy"])

    def test_json_errors_do_not_pollute_stdout(self) -> None:
        for args in (
            ["--format", "json", "--examples"],
            ["--format", "json", "--list-champions"],
            ["--format", "json", "--champion", "Unknown:mid"],
            ["--format", "xml"],
        ):
            with self.subTest(args=args):
                output, errors = io.StringIO(), io.StringIO()
                with redirect_stdout(output), redirect_stderr(errors):
                    with self.assertRaises(SystemExit) as raised:
                        main(args)
                self.assertEqual(raised.exception.code, 2)
                self.assertEqual(output.getvalue(), "")
                self.assertIn("error:", errors.getvalue())

    def test_strategy_data_failure_occurs_before_any_output(self) -> None:
        for format_name in ("text", "json"):
            with self.subTest(format=format_name):
                output, errors = io.StringIO(), io.StringIO()
                with patch("src.draftos.__main__.load_strategic_profiles", side_effect=ValueError("invalid data")):
                    with redirect_stdout(output), redirect_stderr(errors):
                        with self.assertRaises(SystemExit) as raised:
                            main(["--format", format_name])
                self.assertEqual(raised.exception.code, 2)
                self.assertEqual(output.getvalue(), "")
                self.assertIn("cannot load strategic assessments", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
