import json
import re
import logging
from typing import List, Dict, Any
from router.llm_router import generate_response

logger = logging.getLogger("NudgeAgent")

SYSTEM_PROMPT = """You are an environmental behavioral scientist. Given a user's carbon footprint breakdown by category AND their specific lifestyle details, suggest exactly 3 realistic, specific, and actionable behavioral changes tailored to their actual habits.

Rules for response:
- Each nudge must have:
  - `action`: Specific and personalized to their lifestyle (e.g., "Switch your 20km petrol car commute to the Metro 3 days a week" instead of "Use public transport"). Reference their actual habits, numbers, and choices.
  - `impact`: Estimated CO2 saving based on their breakdown data (e.g. "Save 320 kg CO2/year"). Keep the string format exactly as "Save X kg CO2/year" or "Save X tons CO2/year".
  - `effort`: "Low", "Medium", or "High".
- Rank the 3 nudges by their impact-to-effort ratio (highest impact for lowest effort at the top).
- Target the user's HIGHEST emission categories first — that's where the biggest savings are.
- Output EXACTLY a JSON array of objects. Do not include markdown code block formatting like ```json or any other text wrapper. Just output the raw JSON array.

Example Output format:
[
  {
    "action": "Switch your 20km daily petrol car commute to the Metro 3 days a week",
    "impact": "Save 420 kg CO2/year",
    "effort": "Low"
  },
  {
    "action": "Reduce your AC from 6 hours to 4 hours daily and use ceiling fans",
    "impact": "Save 180 kg CO2/year",
    "effort": "Low"
  },
  {
    "action": "Replace your heavy non-veg diet with vegetarian meals 3 days a week",
    "impact": "Save 470 kg CO2/year",
    "effort": "Medium"
  }
]
"""

async def generate_nudges(carbon_data: dict, lifestyle: dict = None) -> List[Dict[str, Any]]:
    """Generates 3 prioritized nudges based on carbon calculator output and lifestyle details."""
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
    Suggest personalized nudges for the following carbon footprint results:{lifestyle_context}
    - Total CO2: {carbon_data.get('total_co2_kg_per_year')} kg CO2 per year
    - Transport emissions: {breakdown.get('transport')} kg CO2/year
    - Flight emissions: {breakdown.get('flights')} kg CO2/year
    - Diet emissions: {breakdown.get('diet')} kg CO2/year
    - Home Energy emissions: {breakdown.get('energy')} kg CO2/year
    - Shopping emissions: {breakdown.get('shopping')} kg CO2/year
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
            
        nudges = json.loads(clean_text)
        if isinstance(nudges, list) and len(nudges) >= 3:
            return nudges[:3]
        else:
            logger.warning(f"Unexpected JSON format from Nudge Agent: {response_text}")
            raise ValueError("Invalid format")
    except Exception as e:
        logger.error(f"Failed to generate nudges: {e}")
        return _generate_fallback_nudges(carbon_data, lifestyle)


def _generate_fallback_nudges(carbon_data: dict, lifestyle: dict = None) -> List[Dict[str, Any]]:
    """Rule-based fallback: generates targeted nudges from the top 3 emission categories."""
    breakdown = carbon_data.get('breakdown', {})
    
    # Build list of (category, co2, nudge_template) and sort by CO2 descending
    candidates = []
    
    transport_co2 = breakdown.get('transport', 0)
    if transport_co2 > 0:
        mode = (lifestyle or {}).get('transport_mode', 'petrol car').replace('_', ' ')
        km = (lifestyle or {}).get('transport_km_per_day', 15)
        candidates.append({
            'co2': transport_co2,
            'action': f"Switch your {km} km/day {mode} commute to metro or bus 3 days a week",
            'impact': f"Save {int(transport_co2 * 0.4)} kg CO2/year",
            'effort': 'Low'
        })
    
    diet_co2 = breakdown.get('diet', 0)
    if diet_co2 > 0:
        diet_type = (lifestyle or {}).get('diet_type', 'mixed')
        if 'heavy' in diet_type.lower() or 'non' in diet_type.lower():
            candidates.append({
                'co2': diet_co2,
                'action': "Replace 3 heavy meat meals per week with vegetarian alternatives",
                'impact': f"Save {int(diet_co2 * 0.25)} kg CO2/year",
                'effort': 'Medium'
            })
        else:
            candidates.append({
                'co2': diet_co2,
                'action': "Reduce dairy consumption and add more plant-based meals",
                'impact': f"Save {int(diet_co2 * 0.15)} kg CO2/year",
                'effort': 'Medium'
            })
    
    energy_co2 = breakdown.get('energy', 0)
    if energy_co2 > 0:
        ac_hours = (lifestyle or {}).get('ac_hours_per_day', 4)
        candidates.append({
            'co2': energy_co2,
            'action': f"Reduce AC from {ac_hours} hours to {max(2, ac_hours - 2)} hours daily and use ceiling fans",
            'impact': f"Save {int(energy_co2 * 0.25)} kg CO2/year",
            'effort': 'Low'
        })
    
    flights_co2 = breakdown.get('flights', 0)
    if flights_co2 > 0:
        candidates.append({
            'co2': flights_co2,
            'action': "Replace one domestic flight with a train journey next year",
            'impact': f"Save {int(flights_co2 * 0.3)} kg CO2/year",
            'effort': 'Medium'
        })
    
    shopping_co2 = breakdown.get('shopping', 0)
    if shopping_co2 > 0:
        candidates.append({
            'co2': shopping_co2,
            'action': "Reduce new clothing purchases by 50% and explore secondhand options",
            'impact': f"Save {int(shopping_co2 * 0.4)} kg CO2/year",
            'effort': 'Medium'
        })
    
    # Sort by CO2 descending, take top 3
    candidates.sort(key=lambda x: x['co2'], reverse=True)
    return candidates[:3]
