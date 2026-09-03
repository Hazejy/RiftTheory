"""Tests for statistical role observations."""

import unittest

from src.draftos.composition import ChampionRole
from src.draftos.flex import (
    RoleObservation,
    calculate_role_shares,
    explain_role_shares,
)


class RoleObservationTests(unittest.TestCase):
    """Verify the data context required for role observations."""

    def test_observation_keeps_its_full_context(self) -> None:
        observation = RoleObservation(
            champion_name="Example Champion",
            role=ChampionRole.JUNGLE,
            patch="example_patch",
            region="global",
            rank_bracket="example_rank",
            queue="ranked_solo",
            games=1_000,
            source_name="example_source",
        )

        self.assertEqual(observation.champion_name, "Example Champion")
        self.assertEqual(observation.role, ChampionRole.JUNGLE)
        self.assertEqual(observation.games, 1_000)
        self.assertEqual(observation.patch, "example_patch")
        self.assertEqual(observation.region, "global")
        self.assertEqual(observation.rank_bracket, "example_rank")
        self.assertEqual(observation.queue, "ranked_solo")
        self.assertEqual(observation.source_name, "example_source")

    def test_observation_rejects_empty_sample(self) -> None:
        with self.assertRaisesRegex(ValueError, "games must be greater than zero"):
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.JUNGLE,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=0,
                source_name="example_source",
            )


class RoleShareTests(unittest.TestCase):
    """Verify descriptive role shares based on observed game counts."""

    def test_role_shares_are_calculated_from_sample_sizes(self) -> None:
        observations = [
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.TOP,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=800,
                source_name="example_source",
            ),
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.JUNGLE,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=150,
                source_name="example_source",
            ),
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.MID,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=50,
                source_name="example_source",
            ),
        ]

        role_shares = calculate_role_shares(observations)

        self.assertEqual(
            role_shares,
            {
                ChampionRole.TOP: 0.8,
                ChampionRole.JUNGLE: 0.15,
                ChampionRole.MID: 0.05,
            },
        )

    def test_different_patches_cannot_be_mixed(self) -> None:
        observations = [
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.TOP,
                patch="patch_a",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=800,
                source_name="example_source",
            ),
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.JUNGLE,
                patch="patch_b",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=200,
                source_name="example_source",
            ),
        ]

        with self.assertRaisesRegex(
            ValueError,
            "observations must share one data context",
        ):
            calculate_role_shares(observations)

    def test_duplicate_roles_are_rejected(self) -> None:
        observations = [
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.TOP,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=800,
                source_name="example_source",
            ),
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.TOP,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=200,
                source_name="example_source",
            ),
        ]

        with self.assertRaisesRegex(
            ValueError,
            "observations must contain unique roles",
        ):
            calculate_role_shares(observations)

    def test_role_share_explanation_includes_games(self) -> None:
        observations = [
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.TOP,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=800,
                source_name="example_source",
            ),
            RoleObservation(
                champion_name="Example Champion",
                role=ChampionRole.JUNGLE,
                patch="example_patch",
                region="global",
                rank_bracket="example_rank",
                queue="ranked_solo",
                games=200,
                source_name="example_source",
            ),
        ]

        explanations = explain_role_shares(observations)

        self.assertEqual(
            explanations,
            [
                "top: 80.0% (800 games)",
                "jungle: 20.0% (200 games)",
            ],
        )


if __name__ == "__main__":
    unittest.main()
