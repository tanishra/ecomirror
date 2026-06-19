EMISSION_FACTORS = {
    "transport": {
        # kg CO2 per km
        "petrol_car": 0.192,
        "diesel_car": 0.171,
        "two_wheeler": 0.089,
        "auto_rickshaw": 0.065,
        "ac_bus": 0.058,
        "metro_train": 0.031
    },
    "flights": {
        # kg CO2 per km per passenger (DEFRA 2023, including Radiative Forcing Index x2)
        "domestic": 0.133,   # short-haul with RFI; Delhi->Mumbai (1400km) ~186 kg
        "international": 0.195  # long-haul with RFI; London->NYC (5500km) ~1073 kg
    },
    "diet_annual": {
        # kg CO2eq per year — Poore & Nemecek 2018 / Our World in Data
        "veg_average": 1100,        # plant-based / vegetarian
        "mixed_occasional_meat": 2000,  # average omnivore (low-medium meat)
        "heavy_meat": 3300          # high meat consumption
    },
    "home_energy": {
        # Electricity factor updated to CEA v20/21 (0.71 kg/kWh) reflecting recent renewable grid integration
        "grid_electricity_kwh": 0.71,
        "lpg_cooking_kg": 2.98,
        # Pre-calculated benchmark: 1.5T AC running 8 hours/day for 6 months
        "ac_1_5_ton_annual": 720 
    },
    "shopping_annual": {
        # kg CO2 per year — Berners-Lee "How Bad Are Bananas?" 2020
        "low": 300,    # 1-2 new items/month, mostly second-hand
        "medium": 700, # Regular shopping, some fast fashion
        "high": 1500   # Frequent / fast fashion / online hauls
    },
    "benchmarks": {
        # IEA 2022 per-capita CO2 emissions
        "india_average_annual": 2000,  # 2.0 tons
        "global_average_annual": 4700  # 4.7 tons
    }
}

def calculate_carbon_score(user_annual_total_kg: float) -> int:
    """
    Translates the raw carbon footprint into a 0-100 scale for the Three.js 3D world.
    0   = Perfect utopian environment (Unrealistic, but blue sky)
    30  = Indian Average (2000 kg - Light haze)
    66  = Global Average (4700 kg - Smoggy)
    100 = Extremely high emissions (10000+ kg - Bleak, gray sky)
    """
    max_cap = 10000.0
    score = int((user_annual_total_kg / max_cap) * 100)
    return min(100, max(0, score))
