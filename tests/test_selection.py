"""Tests for explicit local champion and role selections."""

import unittest

from src.draftos.composition import ChampionProfile, ChampionRole, KnowledgeSource
from src.draftos.selection import select_champions


class SelectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.catalog = [
            ChampionProfile("Example A", ChampionRole.MID, set(), KnowledgeSource.MANUALLY_CURATED),
            ChampionProfile("Example A", ChampionRole.TOP, set(), KnowledgeSource.MANUALLY_CURATED),
            ChampionProfile("Example B", ChampionRole.MID, set(), KnowledgeSource.MANUALLY_CURATED),
            ChampionProfile("Example C", ChampionRole.SUPPORT, set(), KnowledgeSource.MANUALLY_CURATED),
        ]

    def test_selection_normalizes_input_and_preserves_order(self) -> None:
        result = select_champions([" example c : SUPPORT ", "EXAMPLE A:mid"], self.catalog)
        self.assertEqual(result, [self.catalog[3], self.catalog[0]])
        self.assertIs(result[0], self.catalog[3])

    def test_conflicting_or_unknown_picks_are_rejected(self) -> None:
        cases = [
            (["Example A:mid", "Example A:top"], "champion selected more than once"),
            (["Example A:mid", "Example B:mid"], "role assigned more than once"),
            (["Example A:jungle"], "no local profile"),
            (["Unknown:mid"], "no local profile"),
            (["Example A"], "invalid pick"),
            (["Example A:mid:extra"], "invalid pick"),
            ([":mid"], "invalid pick"),
            (["Example A:"], "invalid pick"),
            ([], "between one and five"),
            (["Example A:mid"] * 6, "between one and five"),
        ]
        for picks, message in cases:
            with self.subTest(picks=picks), self.assertRaisesRegex(ValueError, message):
                select_champions(picks, self.catalog)

    def test_five_unique_role_assignments_are_accepted(self) -> None:
        catalog = [
            ChampionProfile(f"Example {role.value}", role, set(), KnowledgeSource.MANUALLY_CURATED)
            for role in ChampionRole
        ]
        picks = [f"{profile.name}:{profile.role.value}" for profile in catalog]
        self.assertEqual(select_champions(picks, catalog), catalog)

    def test_ambiguous_catalog_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "ambiguous catalog profile"):
            select_champions(["Example A:mid"], [self.catalog[0], self.catalog[0]])


if __name__ == "__main__":
    unittest.main()
