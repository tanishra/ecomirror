import json
import re
import logging
from typing import List
from router.llm_router import generate_response

logger = logging.getLogger("ContextAgent")

SYSTEM_PROMPT = """You are an environmental communicator. Given raw CO2 numbers AND the user's specific lifestyle details, translate them into relatable Indian analogies. Never just say '340 kg CO2'. Say what that equals in trees cut, km driven by a standard auto-rickshaw/car, months of electricity in an average Indian household, or plastic water bottles.

Rules for response:
- Keep the tone warm, friendly, and educational — never guilt-tripping or accusatory.
- Focus on standard Indian items/contexts (e.g. driving an auto-rickshaw, AC hours, typical tree planting, LPG cylinders).
- Reference the user's specific lifestyle where possible (e.g., 'Your 20km daily petrol car commute is equivalent to...' instead of generic statements).
- Output EXACTLY a JSON array containing 3 string analogies. Do not include markdown code block formatting like ```json or other text wrapper. Just output the raw JSON array.

Example Output format:
[
  "Your 20km daily petrol car commute is equivalent to driving a CNG auto-rickshaw 4,500 km, or from Mumbai to Delhi and back twice!",
  "The CO2 from your 2 domestic flights is equal to charging 150,000 smartphones, or about 8 years of charging for your whole family.",
  "To offset your annual diet emissions from your heavy non-veg diet, you would need to plant and nurture 12 mature Neem trees for 10 years."
]
"""

async def generate_analogies(carbon_data: dict, lifestyle: dict = None) -> List[str]:
    """Generates 3 Indian-themed analogies based on carbon calculator output and lifestyle details."""
    breakdown = carbon_data.get('breakdown', {})
    
    # Build lifestyle context string for the LLM
    lifestyle_context = ""
    if lifestyle:
        mode = lifestyle.get('transport_mode', 'unknown').replace('_', ' ')
        lifestyle_context = f"""
    User's specific lifestyle details:
    - Commute: {lifestyle.get('transport_km_per_day', 'unknown')} km/day by {mode}
    - Flights: {lifestyle.get('flights_per_year', 'unknown')} flights/year, avg {lifestyle.get('flight_avg_distance_km', 'unknown')} km each
    - Diet: {lifestyle.get('diet_type', 'unknown')}
    - AC usage: {lifestyle.get('ac_hours_per_day', 'unknown')} hours/day
    - Other appliances: {lifestyle.get('other_appliances_kwh', 'unknown')} kWh/day
    - Shopping frequency: {lifestyle.get('shopping_frequency', 'unknown')}
    """
    
    prompt = f"""
    Please generate analogies for the following carbon footprint results:{lifestyle_context}
    - Total CO2: {carbon_data.get('total_co2_kg_per_year')} kg CO2 per year
    - Transport emissions: {breakdown.get('transport')} kg CO2/year
    - Flight emissions: {breakdown.get('flights')} kg CO2/year
    - Diet emissions: {breakdown.get('diet')} kg CO2/year
    - Home Energy emissions: {breakdown.get('energy')} kg CO2/year
    - Shopping emissions: {breakdown.get('shopping')} kg CO2/year
    - India average benchmark: 2000 kg CO2/year
    - Global average benchmark: 4700 kg CO2/year
    """
    
    try:
        response_text = await generate_response(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT
        )
        
        # Clean response text in case LLM wrapped it in markdown code blocks
        clean_text = response_text.strip()
        match = re.search(r"\[.*\]", clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)
            
        analogies = json.loads(clean_text)
        if isinstance(analogies, list) and len(analogies) >= 3:
            return analogies[:3]
        else:
            logger.warning(f"Unexpected JSON format from Context Agent: {response_text}")
            return _generate_fallback_analogies(carbon_data, lifestyle)
    except Exception as e:
        logger.error(f"Failed to generate analogies: {e}")
        return _generate_fallback_analogies(carbon_data, lifestyle)


def _generate_fallback_analogies(carbon_data: dict, lifestyle: dict = None) -> List[str]:
    """Rule-based fallback: generates analogies from actual breakdown using conversion factors."""
    total = carbon_data.get('total_co2_kg_per_year', 2000)
    breakdown = carbon_data.get('breakdown', {})
    
    # Conversion factors
    TREES_PER_KG = 1 / 22  # 22 kg CO2 absorbed per tree per year
    AUTO_RICKSHAW_KM_PER_KG = 1 / 0.065  # 0.065 kg CO2 per km
    PHONE_CHARGES_PER_KG = 1 / 0.0047  # 0.0047 kg CO2 per phone charge
    LPG_CYLINDERS_PER_KG = 1 / 14.2  # 14.2 kg CO2 per LPG cylinder (14.2 kg cylinder)
    
    analogies = []
    
    # Analogy 1: Trees (always relevant)
    trees = int(total * TREES_PER_KG)
    analogies.append(
        f"To offset your annual carbon footprint of {int(total)} kg CO2, you would need to plant and nurture {trees} mature trees for an entire year."
    )
    
    # Analogy 2: Based on highest emission category
    transport_co2 = breakdown.get('transport', 0)
    energy_co2 = breakdown.get('energy', 0)
    diet_co2 = breakdown.get('diet', 0)
    flights_co2 = breakdown.get('flights', 0)
    
    if transport_co2 >= energy_co2 and transport_co2 >= diet_co2 and transport_co2 >= flights_co2:
        auto_km = int(transport_co2 * AUTO_RICKSHAW_KM_PER_KG)
        analogies.append(
            f"Your annual transport emissions equal driving a CNG auto-rickshaw for {auto_km:,} km — that's like going from Mumbai to Delhi and back {auto_km // 2800} times!"
        )
    elif energy_co2 > 0:
        phone_charges = int(energy_co2 * PHONE_CHARGES_PER_KG)
        analogies.append(
            f"The CO2 from your home energy use is equivalent to charging {phone_charges:,} smartphones — enough to charge every phone in a small village for a year."
        )
    elif flights_co2 > 0:
        phone_charges = int(flights_co2 * PHONE_CHARGES_PER_KG)
        analogies.append(
            f"Your flight emissions equal the electricity used to charge {phone_charges:,} smartphones — that's years of charging for your entire family."
    )
    else:
        auto_km = int(total * AUTO_RICKSHAW_KM_PER_KG)
        analogies.append(
            f"Your total emissions are equivalent to driving a petrol car for {auto_km:,} km — that's like circling India's coastline {auto_km // 7500} times."
        )
    
    # Analogy 3: LPG cylinders from energy
    if energy_co2 > 0:
        cylinders = int(energy_co2 * LPG_CYLINDERS_PER_KG)
        analogies.append(
            f"Your home energy footprint matches the CO2 from burning {cylinders} LPG cylinders — enough to cook meals for a family for {cylinders // 12} months."
        )
    else:
        analogies.append(
            f"Your annual footprint is {round(total / 2000, 1)}x the Indian average and {round(total / 4700, 1)}x the global average per person."
        )
    
    return analogies[:3]
