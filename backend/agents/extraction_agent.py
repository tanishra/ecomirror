import json
import re
import logging
from typing import AsyncGenerator, Tuple, Dict, Any, List
from router.llm_router import generate_stream, generate_response

logger = logging.getLogger("ExtractionAgent")

SYSTEM_PROMPT = """You are a friendly carbon footprint advisor. Ask the user about their lifestyle one topic at a time. Extract specific numbers from their answers. Be conversational and empathetic, never clinical.

You must follow the exact order of questions below, one at a time:
Q1: "How do you usually commute to work or college? Tell me about your daily travel."
Q2: "How often do you fly? Any trips in the last 12 months?"
Q3: "What does your diet look like — mostly veg, non-veg, or mixed?"
Q4: "Tell me about your home energy — AC, geysers, how many hours daily?"
Q5: "How often do you shop for new clothes or electronics?"

Rules for conversation:
- Keep your responses short and friendly.
- Do not repeat questions or jump ahead.
- If the user provides vague answers, gently ask for clarification (e.g. "About how many kilometers is that?").
- Once you are on the final step (Step 5, after they answer the shopping question), thank them warmly, mention that you're ready to compute their carbon footprint, and then output the extracted values as a JSON block wrapped in <data></data> tags.

JSON Schema to output inside <data></data>:
{
  "transport_km_per_day": float,
  "transport_mode": "petrol_car" | "diesel_car" | "two_wheeler" | "auto_rickshaw" | "ac_bus" | "metro_train",
  "flights_per_year": int,
  "flight_avg_distance_km": float,
  "diet_type": "veg" | "mixed" | "nonveg_heavy",
  "ac_hours_per_day": float,
  "other_appliances_kwh": float,
  "shopping_frequency": "low" | "medium" | "high"
}

Fill all fields. If the user didn't mention details for some fields (e.g., flight distance or other appliances), use reasonable averages:
- Average domestic flight: 1400 km
- Average international flight: 6000 km
- Default transport mode: "two_wheeler" or "metro_train" if transit, or "petrol_car"
- Average other appliances kwh: 4.0 kwh/day (if they have normal appliances), or 2.0 kwh/day (low), or 8.0 kwh/day (high, multiple geysers/appliances)
- For diet_type: "veg" mapping to mostly veg, "mixed" to mixed/occasional meat, "nonveg_heavy" to heavy meat.
- For shopping_frequency: "low" (rarely/thrift), "medium" (monthly/regular), "high" (frequent/weekly).

Example of final output format:
"That's all the info I need! Thank you. I am calculating your world now...
<data>
{
  "transport_km_per_day": 15.0,
  "transport_mode": "petrol_car",
  "flights_per_year": 2,
  "flight_avg_distance_km": 1400.0,
  "diet_type": "veg",
  "ac_hours_per_day": 4.0,
  "other_appliances_kwh": 5.0,
  "shopping_frequency": "medium"
}
</data>"
"""

def determine_step(messages: List[Dict[str, str]]) -> int:
    """Dynamically determines the current question step (1-5) from assistant messages."""
    assistant_texts = [m["content"] for m in messages if m["role"] == "assistant"]
    
    if not assistant_texts:
        return 1
        
    has_q5 = False
    has_q4 = False
    has_q3 = False
    has_q2 = False
    
    for text in assistant_texts:
        text_lower = text.lower()
        if any(w in text_lower for w in ["shop", "clothes", "electronics", "shopping"]):
            has_q5 = True
        if any(w in text_lower for w in ["geyser", "home energy", "appliances", "electricity"]) or re.search(r'\bac\b', text_lower):
            has_q4 = True
        if any(w in text_lower for w in ["diet", "veg", "non-veg", "mixed", "vegetarian", "meat"]):
            has_q3 = True
        if any(w in text_lower for w in ["fly", "flight", "trip", "12 months", "flying"]):
            has_q2 = True
            
    if has_q5:
        return 5
    if has_q4:
        return 4
    if has_q3:
        return 3
    if has_q2:
        return 2
    return 1

def extract_data_block(text: str) -> Tuple[str, Dict[str, Any] | None]:
    """Extracts the JSON from <data>...</data> tags in the text if present."""
    match = re.search(r"<data>(.*?)</data>", text, re.DOTALL)
    if not match:
        return text, None
    
    json_str = match.group(1).strip()
    clean_text = text.replace(match.group(0), "").strip()
    
    try:
        data = json.loads(json_str)
        # Validate keys
        required_keys = [
            "transport_km_per_day", "transport_mode", "flights_per_year",
            "flight_avg_distance_km", "diet_type", "ac_hours_per_day",
            "other_appliances_kwh", "shopping_frequency"
        ]
        for k in required_keys:
            if k not in data:
                logger.warning(f"Extracted JSON missing key: {k}")
        return clean_text, data
    except Exception as e:
        logger.error(f"Failed to parse extracted JSON: {e}. Raw JSON str: {json_str}")
        return clean_text, None

async def run_extraction(
    messages: List[Dict[str, str]],
    step: int
) -> AsyncGenerator[str, None]:
    """Runs the extraction agent in streaming mode."""
    # Dynamically determine the actual step from history to guide LLM prompt
    actual_step = determine_step(messages)
    logger.info(f"Incoming chat request: client_step={step}, actual_step={actual_step}")

    # Append instructions to guide the current step
    step_instruction = f"\n\n[System note: Current step is {actual_step}/5. "
    if actual_step < 5:
        step_instruction += f"Make sure to transition or ask the question for step {actual_step}.]"
    else:
        step_instruction += "This is the final step. Process the user response, thank them, and produce the final <data> JSON block.]"
    
    # We create a temporary list of messages including the step instruction for the LLM
    llm_messages = list(messages)
    if llm_messages:
        llm_messages[-1] = {
            "role": llm_messages[-1]["role"],
            "content": llm_messages[-1]["content"] + step_instruction
        }
        
    async for chunk in generate_stream(llm_messages, SYSTEM_PROMPT):
        yield chunk
