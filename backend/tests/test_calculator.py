"""
Unit tests for the EcoMirror carbon calculator.
Run: pytest tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from calculator.carbon_calculator import CarbonCalculator
from calculator.emission_factors import EMISSION_FACTORS, calculate_carbon_score


# ── Emission factor sanity checks ──────────────────────────────────────────────

class TestEmissionFactors:
    def test_petrol_car_factor_range(self):
        """Petrol car should be 0.15–0.25 kg CO2/km (real-world range)."""
        f = EMISSION_FACTORS["transport"]["petrol_car"]
        assert 0.15 <= f <= 0.25

    def test_metro_lower_than_car(self):
        """Metro should emit less than petrol car per km."""
        assert EMISSION_FACTORS["transport"]["metro_train"] < EMISSION_FACTORS["transport"]["petrol_car"]

    def test_domestic_flight_with_rfi(self):
        """Domestic flight factor should be >= 0.10 kg/km/pax (includes RFI)."""
        assert EMISSION_FACTORS["flights"]["domestic"] >= 0.10

    def test_india_benchmark_updated(self):
        """India average should be ~2000 kg (IEA 2022)."""
        assert EMISSION_FACTORS["benchmarks"]["india_average_annual"] == 2000

    def test_global_benchmark_updated(self):
        """Global average should be ~4700 kg (IEA 2022)."""
        assert EMISSION_FACTORS["benchmarks"]["global_average_annual"] == 4700

    def test_veg_diet_realistic(self):
        """Veg diet should be >= 800 kg/year (real-world: ~1100 kg)."""
        assert EMISSION_FACTORS["diet_annual"]["veg_average"] >= 800

    def test_heavy_meat_higher_than_veg(self):
        """Heavy meat diet must have higher footprint than veg."""
        assert (
            EMISSION_FACTORS["diet_annual"]["heavy_meat"]
            > EMISSION_FACTORS["diet_annual"]["veg_average"]
        )


# ── Score function ──────────────────────────────────────────────────────────────

class TestCalculateCarbonScore:
    def test_zero_emissions_scores_zero(self):
        assert calculate_carbon_score(0) == 0

    def test_score_capped_at_100(self):
        assert calculate_carbon_score(999_999) == 100

    def test_score_non_negative(self):
        assert calculate_carbon_score(0) >= 0

    def test_india_average_scores_moderate(self):
        """Indian avg (2000 kg) should score around 20 on 0–100 scale."""
        score = calculate_carbon_score(2000)
        assert 15 <= score <= 30

    def test_global_average_scores_mid(self):
        """Global avg (4700 kg) should score around 47."""
        score = calculate_carbon_score(4700)
        assert 40 <= score <= 55

    def test_us_average_scores_high(self):
        """US avg (~14900 kg) should score high (>= 80)."""
        score = calculate_carbon_score(14900)
        assert score >= 80

    def test_score_increases_monotonically(self):
        """Higher emissions must always produce equal or higher score."""
        scores = [calculate_carbon_score(kg) for kg in [0, 1000, 3000, 6000, 10000]]
        assert scores == sorted(scores)


# ── Full calculator integration ────────────────────────────────────────────────

def _calc(**kwargs):
    defaults = dict(
        transport_km_per_day=10.0,
        transport_mode="metro_train",
        flights_per_year=0,
        flight_avg_distance_km=0.0,
        diet_type="veg",
        ac_hours_per_day=0.0,
        other_appliances_kwh=2.0,
        shopping_frequency="low",
    )
    defaults.update(kwargs)
    return CarbonCalculator.calculate(**defaults)


class TestCarbonCalculatorIntegration:
    def test_output_has_required_keys(self):
        result = _calc()
        for key in ["total_co2_kg_per_year", "breakdown", "score", "vs_india_average", "vs_global_average"]:
            assert key in result

    def test_breakdown_keys_present(self):
        result = _calc()
        for key in ["transport", "flights", "diet", "energy", "shopping"]:
            assert key in result["breakdown"]

    def test_total_equals_sum_of_breakdown(self):
        result = _calc()
        total = result["total_co2_kg_per_year"]
        breakdown_sum = sum(result["breakdown"].values())
        assert abs(total - breakdown_sum) < 0.1

    def test_veg_diet_lower_than_heavy_meat(self):
        veg = _calc(diet_type="veg")
        meat = _calc(diet_type="nonveg_heavy")
        assert veg["breakdown"]["diet"] < meat["breakdown"]["diet"]

    def test_more_transport_means_more_co2(self):
        low = _calc(transport_km_per_day=5.0, transport_mode="petrol_car")
        high = _calc(transport_km_per_day=80.0, transport_mode="petrol_car")
        assert high["breakdown"]["transport"] > low["breakdown"]["transport"]

    def test_flights_zero_means_zero_flight_co2(self):
        result = _calc(flights_per_year=0, flight_avg_distance_km=0.0)
        assert result["breakdown"]["flights"] == 0.0

    def test_domestic_vs_international_flight(self):
        domestic = _calc(flights_per_year=2, flight_avg_distance_km=1400.0)
        intl = _calc(flights_per_year=2, flight_avg_distance_km=8000.0)
        assert intl["breakdown"]["flights"] > domestic["breakdown"]["flights"]

    def test_ac_hours_scales_energy(self):
        no_ac = _calc(ac_hours_per_day=0.0)
        heavy_ac = _calc(ac_hours_per_day=8.0)
        assert heavy_ac["breakdown"]["energy"] > no_ac["breakdown"]["energy"]

    def test_vs_india_average_reflects_ratio(self):
        result = _calc(
            transport_km_per_day=0,
            flights_per_year=0,
            diet_type="veg",
            ac_hours_per_day=0,
            other_appliances_kwh=0,
            shopping_frequency="low",
        )
        india_avg = EMISSION_FACTORS["benchmarks"]["india_average_annual"]
        expected_ratio = round(result["total_co2_kg_per_year"] / india_avg, 2)
        assert abs(result["vs_india_average"] - expected_ratio) < 0.05

    def test_score_within_bounds(self):
        result = _calc(
            transport_km_per_day=100.0,
            transport_mode="petrol_car",
            flights_per_year=20,
            flight_avg_distance_km=8000.0,
            diet_type="nonveg_heavy",
            ac_hours_per_day=12.0,
            other_appliances_kwh=10.0,
            shopping_frequency="high",
        )
        assert 0 <= result["score"] <= 100

    def test_unknown_transport_mode_falls_back_to_petrol_car(self):
        result = _calc(transport_mode="unicycle")
        petrol = _calc(transport_mode="petrol_car")
        assert result["breakdown"]["transport"] == petrol["breakdown"]["transport"]

    def test_unknown_shopping_frequency_falls_back_to_medium(self):
        result = _calc(shopping_frequency="ultra_heavy")
        medium = _calc(shopping_frequency="medium")
        assert result["breakdown"]["shopping"] == medium["breakdown"]["shopping"]


# ── Diet classification edge cases ─────────────────────────────────────────────

class TestDietClassification:
    def test_veg_classified_as_veg(self):
        result = _calc(diet_type="veg")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["veg_average"]

    def test_nonveg_heavy_classified_as_heavy_meat(self):
        result = _calc(diet_type="nonveg_heavy")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["heavy_meat"]

    def test_nonveg_classified_as_heavy_meat(self):
        result = _calc(diet_type="nonveg")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["heavy_meat"]

    def test_non_veg_with_space_classified_as_heavy_meat(self):
        result = _calc(diet_type="non veg")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["heavy_meat"]

    def test_non_veg_with_hyphen_classified_as_heavy_meat(self):
        result = _calc(diet_type="non-veg")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["heavy_meat"]

    def test_none_not_misclassified_as_heavy_meat(self):
        """Bug fix: 'none' should NOT be classified as heavy_meat."""
        result = _calc(diet_type="none")
        assert result["breakdown"]["diet"] != EMISSION_FACTORS["diet_annual"]["heavy_meat"]

    def test_mixed_classified_as_mixed(self):
        result = _calc(diet_type="mixed")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["mixed_occasional_meat"]

    def test_heavy_classified_as_heavy_meat(self):
        result = _calc(diet_type="heavy")
        assert result["breakdown"]["diet"] == EMISSION_FACTORS["diet_annual"]["heavy_meat"]


# ── Pydantic validation tests ──────────────────────────────────────────────────

class TestPydanticValidation:
    def test_negative_transport_rejected(self):
        from main import CarbonInput
        with pytest.raises(Exception):
            CarbonInput(
                transport_km_per_day=-10.0,
                transport_mode="petrol_car",
                flights_per_year=0,
                flight_avg_distance_km=0.0,
                diet_type="veg",
                ac_hours_per_day=0.0,
                other_appliances_kwh=2.0,
                shopping_frequency="low",
            )

    def test_negative_flights_rejected(self):
        from main import CarbonInput
        with pytest.raises(Exception):
            CarbonInput(
                transport_km_per_day=10.0,
                transport_mode="petrol_car",
                flights_per_year=-5,
                flight_avg_distance_km=0.0,
                diet_type="veg",
                ac_hours_per_day=0.0,
                other_appliances_kwh=2.0,
                shopping_frequency="low",
            )

    def test_excessive_ac_hours_rejected(self):
        from main import CarbonInput
        with pytest.raises(Exception):
            CarbonInput(
                transport_km_per_day=10.0,
                transport_mode="petrol_car",
                flights_per_year=0,
                flight_avg_distance_km=0.0,
                diet_type="veg",
                ac_hours_per_day=25.0,
                other_appliances_kwh=2.0,
                shopping_frequency="low",
            )

    def test_valid_input_accepted(self):
        from main import CarbonInput
        inp = CarbonInput(
            transport_km_per_day=20.0,
            transport_mode="petrol_car",
            flights_per_year=2,
            flight_avg_distance_km=1400.0,
            diet_type="nonveg_heavy",
            ac_hours_per_day=6.0,
            other_appliances_kwh=4.0,
            shopping_frequency="medium",
        )
        assert inp.transport_km_per_day == 20.0
