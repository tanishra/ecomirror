import { getUserFriendlyError, ERROR_MESSAGES } from '../errorMessages';

describe('getUserFriendlyError', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('maps timeout errors to TIMEOUT_ERROR', () => {
    expect(getUserFriendlyError(new Error('Request timeout'))).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
    expect(getUserFriendlyError(new Error('timed out'))).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
    expect(getUserFriendlyError(new Error('AbortError'))).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
  });

  it('maps network errors to NETWORK_ERROR', () => {
    expect(getUserFriendlyError(new Error('Failed to fetch'))).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    expect(getUserFriendlyError(new Error('networkerror'))).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  it('maps server status errors to SERVER_ERROR', () => {
    expect(getUserFriendlyError(new Error('Server returned status 500'))).toBe(ERROR_MESSAGES.SERVER_ERROR);
    expect(getUserFriendlyError(new Error('Internal server error'))).toBe(ERROR_MESSAGES.SERVER_ERROR);
  });

  it('maps calculation errors to CALCULATION_ERROR', () => {
    expect(getUserFriendlyError(new Error('Calculation failed'))).toBe(ERROR_MESSAGES.CALCULATION_ERROR);
    expect(getUserFriendlyError(new Error('calculate error'))).toBe(ERROR_MESSAGES.CALCULATION_ERROR);
  });

  it('maps context errors to CONTEXT_ERROR', () => {
    expect(getUserFriendlyError(new Error('Contextualization failed'))).toBe(ERROR_MESSAGES.CONTEXT_ERROR);
    expect(getUserFriendlyError(new Error('analogy generation error'))).toBe(ERROR_MESSAGES.CONTEXT_ERROR);
    expect(getUserFriendlyError(new Error('nudge creation failed'))).toBe(ERROR_MESSAGES.CONTEXT_ERROR);
  });

  it('maps extraction errors to EXTRACTION_ERROR', () => {
    expect(getUserFriendlyError(new Error('Failed to extract lifestyle data'))).toBe(ERROR_MESSAGES.EXTRACTION_ERROR);
    expect(getUserFriendlyError(new Error('extract error'))).toBe(ERROR_MESSAGES.EXTRACTION_ERROR);
  });

  it('maps LLM errors to LLM_ERROR', () => {
    expect(getUserFriendlyError(new Error('Gemini API error'))).toBe(ERROR_MESSAGES.LLM_ERROR);
    expect(getUserFriendlyError(new Error('OpenAI fallback failed'))).toBe(ERROR_MESSAGES.LLM_ERROR);
    expect(getUserFriendlyError(new Error('AI server unavailable'))).toBe(ERROR_MESSAGES.LLM_ERROR);
    expect(getUserFriendlyError(new Error('assistant is down'))).toBe(ERROR_MESSAGES.LLM_ERROR);
  });

  it('maps clipboard errors to CLIPBOARD_ERROR', () => {
    expect(getUserFriendlyError(new Error('clipboard write failed'))).toBe(ERROR_MESSAGES.CLIPBOARD_ERROR);
  });

  it('maps screenshot errors to SCREENSHOT_ERROR', () => {
    expect(getUserFriendlyError(new Error('screenshot capture failed'))).toBe(ERROR_MESSAGES.SCREENSHOT_ERROR);
    expect(getUserFriendlyError(new Error('canvas not found'))).toBe(ERROR_MESSAGES.SCREENSHOT_ERROR);
  });

  it('falls back to DEFAULT_ERROR for unknown errors', () => {
    expect(getUserFriendlyError(new Error('something weird happened'))).toBe(ERROR_MESSAGES.DEFAULT_ERROR);
  });

  it('handles string errors directly', () => {
    expect(getUserFriendlyError('timeout exceeded')).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
  });

  it('handles null/undefined gracefully', () => {
    expect(getUserFriendlyError(null)).toBe(ERROR_MESSAGES.DEFAULT_ERROR);
    expect(getUserFriendlyError(undefined)).toBe(ERROR_MESSAGES.DEFAULT_ERROR);
  });
});
