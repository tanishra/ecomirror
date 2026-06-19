const isDev = process.env.NODE_ENV === 'development';

const ERROR_MESSAGES = {
  NETWORK_ERROR: "We couldn't reach the server. Please check your internet connection and try again.",
  SERVER_ERROR: "Our servers are having trouble right now. Please try again in a moment.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  CALCULATION_ERROR: "We couldn't calculate your carbon footprint. Please try the chat again.",
  CONTEXT_ERROR: "We couldn't generate your personalized insights. Please try again.",
  LLM_ERROR: "The AI assistant is unavailable right now. Please try again shortly.",
  EXTRACTION_ERROR: "We couldn't extract your lifestyle data from the conversation. Please try again.",
  CLIPBOARD_ERROR: "We couldn't copy to your clipboard. The image has been downloaded instead.",
  SCREENSHOT_ERROR: "We couldn't capture the 3D world. Please make sure the biosphere is loaded.",
  DEFAULT_ERROR: "Something went wrong. Please try again.",
};

export function getUserFriendlyError(rawError) {
  if (isDev) console.error('[EcoMirror] Raw error:', rawError);

  const msg = typeof rawError === 'string' ? rawError : (rawError?.message || String(rawError));
  const lower = msg.toLowerCase();

  if (lower.includes('timeout') || lower.includes('abort') || lower.includes('timed out')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (lower.includes('llm') || lower.includes('gemini') || lower.includes('openai') || lower.includes('ai server') || lower.includes('assistant')) {
    return ERROR_MESSAGES.LLM_ERROR;
  }
  if (lower.includes('status 500') || lower.includes('internal server error')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
  if (lower.includes('calculate') || lower.includes('calculation')) {
    return ERROR_MESSAGES.CALCULATION_ERROR;
  }
  if (lower.includes('context') || lower.includes('analogy') || lower.includes('nudge') || lower.includes('insight')) {
    return ERROR_MESSAGES.CONTEXT_ERROR;
  }
  if (lower.includes('extract') || lower.includes('lifestyle data')) {
    return ERROR_MESSAGES.EXTRACTION_ERROR;
  }
  if (lower.includes('clipboard')) {
    return ERROR_MESSAGES.CLIPBOARD_ERROR;
  }
  if (lower.includes('screenshot') || lower.includes('canvas') || lower.includes('capture')) {
    return ERROR_MESSAGES.SCREENSHOT_ERROR;
  }

  return ERROR_MESSAGES.DEFAULT_ERROR;
}

export { ERROR_MESSAGES };
