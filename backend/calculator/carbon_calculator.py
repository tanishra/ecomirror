from calculator.emission_factors import EMISSION_FACTORS, calculate_carbon_score

class CarbonCalculator:
    @staticmethod
    def calculate(
        transport_km_per_day: float,
        transport_mode: str,
        flights_per_year: int,
        flight_avg_distance_km: float,
        diet_type: str,
        ac_hours_per_day: float,
        other_appliances_kwh: float,
        shopping_frequency: str
    ) -> dict:
        # 1. Transport Calculation
        # Clean transport mode input
        mode = transport_mode.lower().replace(" ", "_")
        factors = EMISSION_FACTORS["transport"]
        # Fallback to general factors or default (petrol_car) if mode not found
        factor = factors.get(mode, factors.get("petrol_car"))
        transport_co2 = transport_km_per_day * 365.0 * factor

        # 2. Flights Calculation
        # If flight average distance is <= 2000 km, we classify it as domestic, otherwise international
        flight_type = "domestic" if flight_avg_distance_km <= 2000.0 else "international"
        flight_factor = EMISSION_FACTORS["flights"].get(flight_type, 0.1)
        flights_co2 = flights_per_year * flight_avg_distance_km * flight_factor

        # 3. Diet Calculation
        diet = diet_type.lower().replace("-", "").replace("_", "").replace(" ", "")
        if "nonveg" in diet or "nonvegheavy" in diet or "heavy" in diet:
            diet_key = "heavy_meat"
        elif "veg" in diet:
            diet_key = "veg_average"
        else:
            diet_key = "mixed_occasional_meat"
        
        diet_co2 = EMISSION_FACTORS["diet_annual"].get(diet_key, 700.0)

        # 4. Home Energy Calculation
        # AC formula: linear scale based on 720 kg benchmark for 8 hours/day
        ac_factor = EMISSION_FACTORS["home_energy"]["ac_1_5_ton_annual"]
        ac_co2 = (ac_hours_per_day / 8.0) * ac_factor if ac_hours_per_day > 0 else 0.0

        # Other appliances (assumed daily kWh)
        grid_factor = EMISSION_FACTORS["home_energy"]["grid_electricity_kwh"]
        appliances_co2 = other_appliances_kwh * 365.0 * grid_factor
        energy_co2 = ac_co2 + appliances_co2

        # 5. Shopping Calculation
        shop_freq = shopping_frequency.lower()
        if shop_freq not in ["low", "medium", "high"]:
            shop_freq = "medium"
        shopping_co2 = EMISSION_FACTORS["shopping_annual"].get(shop_freq, 500.0)

        # Total
        total_co2 = transport_co2 + flights_co2 + diet_co2 + energy_co2 + shopping_co2
        score = calculate_carbon_score(total_co2)

        # Averages comparisons
        india_avg = EMISSION_FACTORS["benchmarks"]["india_average_annual"]
        global_avg = EMISSION_FACTORS["benchmarks"]["global_average_annual"]

        return {
            "total_co2_kg_per_year": round(total_co2, 2),
            "breakdown": {
                "transport": round(transport_co2, 2),
                "flights": round(flights_co2, 2),
                "diet": round(diet_co2, 2),
                "energy": round(energy_co2, 2),
                "shopping": round(shopping_co2, 2)
            },
            "score": score,
            "vs_india_average": round(total_co2 / india_avg, 2),
            "vs_global_average": round(total_co2 / global_avg, 2)
        }
