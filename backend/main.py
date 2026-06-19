import json
import logging
import asyncio
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sse_starlette.sse import EventSourceResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from agents.extraction_agent import determine_step

# Imports from submodules
from agents.extraction_agent import run_extraction, extract_data_block
from agents.context_agent import generate_analogies
from agents.nudge_agent import generate_nudges
from calculator.carbon_calculator import CarbonCalculator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EcoMirrorBackend")

# Rate limiter — keyed by client IP
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="EcoMirror AI Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow local dev + production frontend origins (configurable via env)
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ecomirror-virid.vercel.app",

]
_env_origins = os.environ.get("CORS_ORIGINS", "")
if _env_origins:
    ALLOWED_ORIGINS = [o.strip() for o in _env_origins.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)

# Pydantic Schemas
MAX_MESSAGE_LENGTH = 2000
MAX_MESSAGES_PER_REQUEST = 20

class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=MAX_MESSAGE_LENGTH)

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., max_length=MAX_MESSAGES_PER_REQUEST)
    step: int = Field(..., ge=1, le=5)

class CarbonInput(BaseModel):
    transport_km_per_day: float = Field(..., ge=0, le=500)
    transport_mode: str = Field(..., pattern="^(petrol_car|diesel_car|two_wheeler|auto_rickshaw|ac_bus|metro_train|walking|bicycle|electric_car|hybrid_car)$")
    flights_per_year: int = Field(..., ge=0, le=100)
    flight_avg_distance_km: float = Field(..., ge=0, le=20000)
    diet_type: str = Field(..., pattern="^(veg|mixed|nonveg_heavy|non-veg|nonveg|non veg|vegetarian)$")
    ac_hours_per_day: float = Field(..., ge=0, le=24)
    other_appliances_kwh: float = Field(..., ge=0, le=100)
    shopping_frequency: str = Field(..., pattern="^(low|medium|high)$")

class CarbonBreakdown(BaseModel):
    transport: float
    flights: float
    diet: float
    energy: float
    shopping: float

class CarbonOutput(BaseModel):
    total_co2_kg_per_year: float
    breakdown: CarbonBreakdown
    score: int
    vs_india_average: float
    vs_global_average: float

class Nudge(BaseModel):
    action: str
    impact: str
    effort: str

class ContextualizeRequest(BaseModel):
    calculation: CarbonOutput
    lifestyle: CarbonInput

class ContextualizeResponse(BaseModel):
    analogies: List[str]
    nudges: List[Nudge]

# API Endpoints
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    """
    Stateful conversational chat endpoint. Streams responses as SSE chunks.
    On step 5 completion, yields a final 'data' event containing the extracted JSON.
    """
    # Convert Pydantic messages to standard dicts for agents
    dict_messages = [{"role": m.role, "content": m.content} for m in body.messages]
    
    async def event_generator():
        full_response_text = ""
        chunk_count = 0
        try:
            async for chunk in run_extraction(dict_messages, body.step):
                # Client disconnected check
                if await request.is_disconnected():
                    logger.info("SSE Client disconnected")
                    break
                
                # Guard: skip empty/None chunks
                if not chunk:
                    continue
                    
                full_response_text += chunk
                chunk_count += 1
                if chunk_count <= 3:
                    logger.info(f"SSE event #{chunk_count}: {repr(chunk[:60])}")
                yield {"event": "message", "data": chunk}
            
            logger.info(f"Stream complete. Total SSE events sent: {chunk_count}")
                 
            # Determine outgoing step dynamically based on updated assistant messages
            new_history = dict_messages + [{"role": "assistant", "content": full_response_text}]
            outgoing_step = determine_step(new_history)
            logger.info(f"Yielding outgoing step SSE event: {outgoing_step}")
            yield {"event": "step", "data": str(outgoing_step)}

            # If the outgoing step is 5, check if the LLM returned the final <data> block
            if outgoing_step == 5:
                clean_text, extracted_data = extract_data_block(full_response_text)
                if extracted_data:
                    yield {"event": "data", "data": json.dumps(extracted_data)}
                else:
                    logger.info("Step 5 active but no data block returned yet (likely clarifying).")
        except Exception as e:
            logger.error(f"Error during chat generation stream: {e}")
            yield {"event": "error", "data": "An error occurred during chat generation. Please try again."}

    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@app.post("/api/calculate", response_model=CarbonOutput)
@limiter.limit("60/minute")
async def calculate(request: Request, body: CarbonInput):
    """Calculates carbon footprint metrics using pure math (no LLM)."""
    try:
        results = CarbonCalculator.calculate(
            transport_km_per_day=body.transport_km_per_day,
            transport_mode=body.transport_mode,
            flights_per_year=body.flights_per_year,
            flight_avg_distance_km=body.flight_avg_distance_km,
            diet_type=body.diet_type,
            ac_hours_per_day=body.ac_hours_per_day,
            other_appliances_kwh=body.other_appliances_kwh,
            shopping_frequency=body.shopping_frequency
        )
        return results
    except Exception as e:
        logger.error(f"Error during carbon calculation: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during carbon calculation. Please try again.")

@app.post("/api/contextualize", response_model=ContextualizeResponse)
@limiter.limit("20/minute")
async def contextualize(request: Request, body: ContextualizeRequest):
    """Generates 3 Indian-themed analogies and 3 nudges based on emissions data and lifestyle."""
    try:
        calc_dict = body.calculation.model_dump()
        lifestyle_dict = body.lifestyle.model_dump()
        
        # Run Context and Nudge agents in parallel with enriched context
        analogies_task = generate_analogies(calc_dict, lifestyle_dict)
        nudges_task = generate_nudges(calc_dict, lifestyle_dict)
        
        analogies, nudges = await asyncio.gather(analogies_task, nudges_task)
        
        return {
            "analogies": analogies,
            "nudges": nudges
        }
    except Exception as e:
        logger.error(f"Error during contextualization: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating insights. Please try again.")

if __name__ == "__main__":
    import uvicorn
    # Start server locally on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)