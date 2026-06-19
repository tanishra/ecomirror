"""
Unit tests for the nudge and analogy fallback generators.
Run: pytest tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from agents.nudge_agent import _generate_fallback_nudges
from agents.context_agent import _generate_fallback_analogies


SAMPLE_CARBON_DATA = {
    "total_co2_kg_per_year": 5000.0,
    "breakdown": {
        "transport": 1401.6,
        "flights": 372.4,
        "diet": 3300.0,
        "energy": 648.0,
        "shopping": 700.0,
    },
    "score": 50,
    "vs_india_average": 2.5,
    "vs_global_average": 1.06,
}

SAMPLE_LIFESTYLE = {
    "transport_km_per_day": 20.0,
    "transport_mode": "petrol_car",
    "flights_per_year": 2,
    "flight_avg_distance_km": 1400.0,
    "diet_type": "nonveg_heavy",
    "ac_hours_per_day": 6.0,
    "other_appliances_kwh": 4.0,
    "shopping_frequency": "medium",
}


class TestNudgeFallback:
    def test_returns_exactly_3_nudges(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        assert len(nudges) == 3

    def test_each_nudge_has_required_keys(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        for n in nudges:
            assert "action" in n
            assert "impact" in n
            assert "effort" in n

    def test_nudges_sorted_by_co2_descending(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        # Diet (3300) should be the top nudge since it's the highest emission
        assert "meat" in nudges[0]["action"].lower() or "diet" in nudges[0]["action"].lower() or "veg" in nudges[0]["action"].lower()

    def test_nudge_references_lifestyle_transport(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        transport_nudge = [n for n in nudges if "petrol" in n["action"].lower() or "commute" in n["action"].lower()]
        assert len(transport_nudge) > 0
        assert "20" in transport_nudge[0]["action"]

    def test_nudge_references_lifestyle_ac_hours(self):
        # Use data where energy is in the top 3 emission categories
        data = {
            "total_co2_kg_per_year": 5000.0,
            "breakdown": {
                "transport": 1401.6,
                "flights": 372.4,
                "diet": 1100.0,
                "energy": 1628.0,
                "shopping": 500.0,
            },
        }
        nudges = _generate_fallback_nudges(data, SAMPLE_LIFESTYLE)
        ac_nudge = [n for n in nudges if "ac" in n["action"].lower()]
        assert len(ac_nudge) > 0
        assert "6" in ac_nudge[0]["action"]

    def test_impact_format_correct(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        for n in nudges:
            assert "Save" in n["impact"]
            assert "kg CO2/year" in n["impact"]

    def test_effort_is_valid_value(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        for n in nudges:
            assert n["effort"] in ["Low", "Medium", "High"]

    def test_works_without_lifestyle(self):
        nudges = _generate_fallback_nudges(SAMPLE_CARBON_DATA)
        assert len(nudges) == 3
        for n in nudges:
            assert "action" in n

    def test_works_with_zero_emissions(self):
        zero_data = {
            "total_co2_kg_per_year": 0,
            "breakdown": {"transport": 0, "flights": 0, "diet": 0, "energy": 0, "shopping": 0},
        }
        nudges = _generate_fallback_nudges(zero_data)
        assert len(nudges) <= 3


class TestAnalogyFallback:
    def test_returns_exactly_3_analogies(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        assert len(analogies) == 3

    def test_analogies_are_strings(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        for a in analogies:
            assert isinstance(a, str)
            assert len(a) > 20

    def test_trees_analogy_present(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        assert any("tree" in a.lower() for a in analogies)

    def test_transport_analogy_when_transport_is_highest(self):
        data = {
            "total_co2_kg_per_year": 3000.0,
            "breakdown": {"transport": 2000.0, "flights": 0, "diet": 500.0, "energy": 300.0, "shopping": 200.0},
        }
        analogies = _generate_fallback_analogies(data)
        assert any("auto-rickshaw" in a.lower() or "transport" in a.lower() for a in analogies)

    def test_energy_analogy_present(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        # Energy is 648 kg, should produce either phone charges or LPG analogy
        assert any("smartphone" in a.lower() or "lpg" in a.lower() or "energy" in a.lower() for a in analogies)

    def test_works_without_lifestyle(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA)
        assert len(analogies) == 3

    def test_references_correct_total(self):
        analogies = _generate_fallback_analogies(SAMPLE_CARBON_DATA, SAMPLE_LIFESTYLE)
        assert any("5000" in a for a in analogies)
