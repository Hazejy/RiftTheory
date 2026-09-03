"""Tests for the team composition domain vocabulary."""

import unittest

from src.draftos.composition import CompositionCapability


class CompositionCapabilityTests(unittest.TestCase):
    """Verify the allowed composition capabilities."""

    def test_capabilities_have_stable_values(self) -> None:
        self.assertEqual(CompositionCapability.ENGAGE.value, "engage")
        self.assertEqual(CompositionCapability.FRONTLINE.value, "frontline")
        self.assertEqual(CompositionCapability.WAVE_CLEAR.value, "wave_clear")

    def test_unknown_capability_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            CompositionCapability("mobility")


if __name__ == "__main__":
    unittest.main()

