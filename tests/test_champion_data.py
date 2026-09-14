"""Tests for loading manually curated champion and coaching profiles."""

import unittest
from pathlib import Path

from src.draftos.champion_data import load_champion_profiles
from src.draftos.coaching_data import (
    count_coaching_profiles_by_role,
    find_missing_coaching_profiles,
    load_coaching_profiles,
)
from src.draftos.composition import (
    ChampionRole,
    CompositionCapability,
    DamageFocus,
    KnowledgeSource,
    PowerCurve,
    ResourceDemand,
    ReviewStatus,
)


class ChampionDataTests(unittest.TestCase):
    """Verify the prototype League of Legends champion data."""

    def test_profiles_are_loaded_from_json(self) -> None:
        data_file = Path("data/champion_profiles.json")

        champions = load_champion_profiles(data_file)

        self.assertGreaterEqual(len(champions), 170)
        anivia = [champion for champion in champions if champion.name == "Anivia"]
        self.assertEqual(
            {champion.role for champion in anivia},
            {ChampionRole.MID, ChampionRole.TOP},
        )
        braum = next(champion for champion in champions if champion.name == "Braum")
        self.assertEqual(
            braum.capabilities,
            {
                CompositionCapability.DISENGAGE,
                CompositionCapability.PEEL,
                CompositionCapability.FRONTLINE,
                CompositionCapability.ANTI_DIVE,
            },
        )
        brand = [champion for champion in champions if champion.name == "Brand"]
        self.assertIn(ChampionRole.BOT, {champion.role for champion in brand})
        hwei = next(champion for champion in champions if champion.name == "Hwei")
        self.assertIn(CompositionCapability.WAVE_CLEAR, hwei.capabilities)
        self.assertIn(CompositionCapability.ZONE_CONTROL, hwei.capabilities)
        self.assertTrue(
            all(
                champion.source is KnowledgeSource.MANUALLY_CURATED
                for champion in champions
            )
        )

    def test_coaching_profiles_are_loaded_from_json(self) -> None:
        data_file = Path("data/coaching_profiles.json")

        profiles = load_coaching_profiles(data_file)

        self.assertGreaterEqual(len(profiles), 10)
        self.assertEqual(
            len(profiles),
            len({(profile.champion_name, profile.role) for profile in profiles}),
        )
        self.assertTrue(all(1 <= profile.execution_demand <= 5 for profile in profiles))
        self.assertTrue(all(0 <= profile.confidence <= 1 for profile in profiles))
        self.assertTrue(all(profile.spike_notes for profile in profiles))
        self.assertTrue(
            all(
                profile.review_status is ReviewStatus.PROVISIONAL
                for profile in profiles
            )
        )

        vi = next(
            profile
            for profile in profiles
            if profile.champion_name == "Vi" and profile.role is ChampionRole.JUNGLE
        )
        self.assertEqual(vi.power_curve, PowerCurve.EARLY_MID)
        self.assertEqual(vi.damage_focus, DamageFocus.PHYSICAL)
        self.assertEqual(vi.execution_demand, 3)

        aphelios = next(
            profile for profile in profiles if profile.champion_name == "Aphelios"
        )
        self.assertEqual(aphelios.role, ChampionRole.BOT)
        self.assertEqual(aphelios.resource_demand, ResourceDemand.HIGH)
        self.assertEqual(aphelios.power_curve, PowerCurve.LATE)

        xerath_support = next(
            profile
            for profile in profiles
            if profile.champion_name == "Xerath" and profile.role is ChampionRole.SUPPORT
        )
        self.assertEqual(xerath_support.damage_focus, DamageFocus.MAGIC)
        self.assertEqual(xerath_support.resource_demand, ResourceDemand.MEDIUM)

    def test_coaching_profile_coverage_helpers(self) -> None:
        champion_profiles = load_champion_profiles(Path("data/champion_profiles.json"))
        coaching_profiles = load_coaching_profiles(Path("data/coaching_profiles.json"))

        missing_profiles = find_missing_coaching_profiles(
            champion_profiles,
            coaching_profiles,
        )
        missing_keys = {
            (profile.name, profile.role)
            for profile in missing_profiles
        }
        role_counts = count_coaching_profiles_by_role(coaching_profiles)

        self.assertGreater(len(missing_profiles), 100)
        self.assertNotIn(("Vi", ChampionRole.JUNGLE), missing_keys)
        self.assertIn(("Anivia", ChampionRole.MID), missing_keys)
        self.assertNotIn(("Ashe", ChampionRole.BOT), missing_keys)
        self.assertNotIn(("Jinx", ChampionRole.BOT), missing_keys)
        self.assertNotIn(("Varus", ChampionRole.BOT), missing_keys)
        self.assertGreaterEqual(role_counts[ChampionRole.BOT], 20)
        self.assertEqual(role_counts[ChampionRole.SUPPORT], 3)


if __name__ == "__main__":
    unittest.main()
