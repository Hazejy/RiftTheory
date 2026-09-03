"""HTTP contract and regression tests for the local application."""

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.draftos.__main__ import main
from src.draftos.web import create_app


class WebTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(create_app())
        self.addCleanup(self.client.close)

    def test_catalog_is_explicitly_incomplete(self) -> None:
        response = self.client.get("/api/champions")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["is_complete_catalog"])
        self.assertEqual(
            [(item["champion_name"], item["role"]) for item in body["profiles"]],
            [("Anivia", "mid"), ("Malphite", "top")],
        )

    def test_http_report_matches_cli_report(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            main(["--champion", "Anivia:mid", "--format", "json"])
        response = self.client.post("/api/analyze", json={"picks": ["Anivia:mid"]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), json.loads(output.getvalue()))

    def test_missing_strategy_remains_null(self) -> None:
        response = self.client.post("/api/analyze", json={"picks": ["Malphite:top"]})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["champions"][0]["strategy"])

    def test_invalid_requests_are_rejected(self) -> None:
        for body in (
            {}, {"picks": []}, {"picks": [1]}, {"picks": ["Unknown:mid"]},
            {"picks": ["Anivia:support"]}, {"picks": ["Anivia:mid", "Anivia:mid"]},
            {"picks": ["Anivia:mid"] * 6}, {"picks": ["Anivia:mid"], "path": "other.json"},
        ):
            with self.subTest(body=body):
                response = self.client.post("/api/analyze", json=body)
                self.assertEqual(response.status_code, 422)
                self.assertNotIn("champions", response.json())

    def test_unavailable_data_does_not_expose_local_paths(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with TestClient(create_app(data_directory=Path(directory))) as client:
                response = client.get("/api/champions")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Local champion data is unavailable or invalid.")

    def test_invalid_strategic_data_is_reported(self) -> None:
        with patch("src.draftos.web.load_strategic_profiles", side_effect=ValueError("private path")):
            response = self.client.post("/api/analyze", json={"picks": ["Anivia:mid"]})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private path", response.text)

    def test_unknown_host_is_rejected(self) -> None:
        response = self.client.get("/api/champions", headers={"Host": "untrusted.example"})
        self.assertEqual(response.status_code, 400)

    def test_missing_frontend_has_actionable_message(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with TestClient(create_app(static_directory=Path(directory) / "missing")) as client:
                response = client.get("/")
        self.assertEqual(response.status_code, 503)
        self.assertIn("Build the frontend", response.json()["detail"])

    def test_static_site_does_not_replace_api_or_expose_parent_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            static = root / "dist"
            static.mkdir()
            (static / "index.html").write_text("<h1>DraftOS</h1>", encoding="utf-8")
            (root / "private.txt").write_text("not public", encoding="utf-8")
            with TestClient(create_app(static_directory=static)) as client:
                self.assertEqual(client.get("/").status_code, 200)
                self.assertEqual(client.get("/api/champions").status_code, 200)
                self.assertEqual(client.get("/api/unknown").status_code, 404)
                self.assertEqual(client.get("/%2e%2e/private.txt").status_code, 404)


if __name__ == "__main__":
    unittest.main()
