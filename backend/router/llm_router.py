import os
import time
import asyncio
import logging
from typing import AsyncGenerator, List, Dict, Any
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMRouter")

# Store clients globally to prevent garbage collection and closure of connections
_gemini_client = None
_gemini_key = None
_openai_client = None
_openai_key = None

def get_gemini_client():
    global _gemini_client, _gemini_key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        return None
    
    # Re-initialize only if key changed or client is not created yet
    if _gemini_client is None or gemini_key != _gemini_key:
        try:
            from google import genai
            _gemini_client = genai.Client(api_key=gemini_key)
            _gemini_key = gemini_key
            logger.info("Initialized new Gemini GenAI Client singleton")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            return None
    return _gemini_client

def get_openai_client():
    global _openai_client, _openai_key
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your_openai_api_key_here":
        return None
        
    if _openai_client is None or openai_key != _openai_key:
        try:
            from openai import AsyncOpenAI
            _openai_client = AsyncOpenAI(api_key=openai_key)
            _openai_key = openai_key
            logger.info("Initialized new OpenAI Client singleton")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None
    return _openai_client

async def call_gemini(
    messages: List[Dict[str, str]],
    system_prompt: str,
    stream: bool
) -> Any:
    """Natively asynchronous Gemini call using Client.aio."""
    client = get_gemini_client()
    if not client:
        raise ValueError("Gemini API key not configured")

    from google.genai import types

    # Convert messages to Gemini format
    contents = []
    for m in messages:
        # Ignore empty messages
        if not m.get("content", "").strip():
            continue
        role = "model" if m["role"] == "assistant" else "user"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=m["content"])]
            )
        )

    # If contents is empty (e.g. initial greeting), add a starter user message to trigger response
    if not contents:
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text="Hello")]
            )
        )

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.2,
    )

    if stream:
        return await client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
    else:
        return await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )

async def call_openai(
    messages: List[Dict[str, str]],
    system_prompt: str,
    stream: bool
) -> Any:
    """Natively asynchronous OpenAI call using AsyncOpenAI client."""
    client = get_openai_client()
    if not client:
        raise ValueError("OpenAI API key not configured")

    openai_messages = [{"role": "system", "content": system_prompt}]
    
    # Filter and check messages
    has_valid_messages = False
    for m in messages:
        if m.get("content", "").strip():
            openai_messages.append({"role": m["role"], "content": m["content"]})
            has_valid_messages = True
            
    if not has_valid_messages:
        openai_messages.append({"role": "user", "content": "Hello"})

    if stream:
        return await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            temperature=0.2,
            stream=True
        )
    else:
        return await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            temperature=0.2,
            stream=False
        )

async def generate_response(
    messages: List[Dict[str, str]],
    system_prompt: str
) -> str:
    """Non-streaming generation with transparent fallback."""
    # Try Gemini first with 8 second timeout
    try:
        logger.info("Attempting generation using Gemini 2.5 Flash")
        start_time = time.time()
        response = await asyncio.wait_for(
            call_gemini(messages, system_prompt, stream=False),
            timeout=8.0
        )
        logger.info(f"Gemini success in {time.time() - start_time:.2f}s")
        return response.text
    except Exception as e:
        logger.warning(f"Gemini call failed or timed out: {e}. Falling back to OpenAI gpt-4o-mini.")
        
        # Fallback to OpenAI
        try:
            start_time = time.time()
            response = await call_openai(messages, system_prompt, stream=False)
            logger.info(f"OpenAI fallback success in {time.time() - start_time:.2f}s")
            return response.choices[0].message.content
        except Exception as oe:
            logger.error(f"OpenAI fallback also failed: {oe}")
            raise RuntimeError(f"Both LLM providers failed. Gemini: {e}, OpenAI: {oe}")

async def generate_stream(
    messages: List[Dict[str, str]],
    system_prompt: str
) -> AsyncGenerator[str, None]:
    """Streaming generation yielding text chunks with transparent fallback."""
    use_openai = False
    chunk_count = 0
    
    try:
        logger.info("Attempting streaming using Gemini 2.5 Flash")
        # Initialize connection with a 30 second timeout (thinking models take longer)
        response_stream = await asyncio.wait_for(
            call_gemini(messages, system_prompt, stream=True),
            timeout=30.0
        )
        
        # Iterate over native async generator
        # IMPORTANT: Gemini 2.5 Flash is a "thinking" model. It sends chunks
        # where chunk.text is None (for internal reasoning/thinking tokens)
        # before the actual content arrives. We must skip those.
        async for chunk in response_stream:
            text = getattr(chunk, 'text', None)
            if text:  # Skip None, empty string, or whitespace-only
                chunk_count += 1
                if chunk_count <= 3:
                    logger.info(f"Gemini chunk #{chunk_count}: {repr(text[:80])}")
                yield text
        
        logger.info(f"Gemini streaming completed. Total chunks yielded: {chunk_count}")
        if chunk_count == 0:
            logger.warning("Gemini stream produced 0 text chunks. Falling back.")
            use_openai = True
            
    except Exception as e:
        logger.warning(f"Gemini streaming failed or timed out: {e}. Falling back to OpenAI gpt-4o-mini.")
        use_openai = True

    if use_openai:
        try:
            response_stream = await call_openai(messages, system_prompt, stream=True)
            async for chunk in response_stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as oe:
            logger.error(f"OpenAI streaming fallback failed: {oe}")
            yield f"\n[Error: Connection failed. Both Gemini and OpenAI models are unavailable. {oe}]"
