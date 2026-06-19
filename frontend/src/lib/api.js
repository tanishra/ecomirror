import { getUserFriendlyError } from './errorMessages';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const isDev = process.env.NODE_ENV === 'development';
const log = (...args) => { if (isDev) console.log(...args); };
const logError = (...args) => { if (isDev) console.error(...args); };

let _chatAbortController = null;

export function cancelChatStream() {
  if (_chatAbortController) {
    _chatAbortController.abort();
    _chatAbortController = null;
  }
}

/**
 * Sends messages to the chat endpoint and streams the response via SSE.
 * 
 * @param {Array} messages Conversation history
 * @param {number} step Current question step (1-5)
 * @param {Function} onChunk Callback for text chunks
 * @param {Function} onStep Callback for dynamic step updates (1-5)
 * @param {Function} onData Callback for final extracted data object (fired on step 5)
 * @param {Function} onError Callback for errors
 */
export async function sendChatMessage(messages, step, onChunk, onStep, onData, onError) {
  _chatAbortController = new AbortController();
  const timeoutId = setTimeout(() => _chatAbortController.abort(), 60000);

  try {
    log('[EcoMirror] Sending chat request, step:', step, 'messages:', messages.length);
    
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ messages, step }),
      signal: _chatAbortController.signal,
    });

    log('[EcoMirror] Response status:', response.status, 'type:', response.headers.get('content-type'));

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalChunks = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        log('[EcoMirror] Stream done. Total chunks processed:', totalChunks);
        break;
      }

      const rawText = decoder.decode(value, { stream: true });
      // CRITICAL: sse-starlette v3+ sends CRLF (\r\n) line endings.
      // Normalize to LF (\n) before parsing so our split works correctly.
      buffer += rawText.replace(/\r\n/g, '\n');
      
      // SSE events are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep trailing partial event in buffer

      for (const part of parts) {
        if (!part.trim()) continue;

        let event = 'message';
        let dataLines = [];
        
        const lines = part.split('\n');
        for (const line of lines) {
          // SSE spec: fields can have optional space after colon
          if (line.startsWith('event:')) {
            event = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.substring(5));
          }
          // Ignore comment lines (starting with ':') and other fields
        }
        
        const data = dataLines.join('\n').trim();
        
        // Skip empty data, literal "None", or whitespace-only
        if (!data || data === 'None' || data === 'null') {
          continue;
        }

        if (event === 'message') {
          totalChunks++;
          if (totalChunks <= 5) {
            log(`[EcoMirror] Chunk #${totalChunks}:`, JSON.stringify(data).substring(0, 100));
          }
          onChunk(data);
        } else if (event === 'step') {
          log('[EcoMirror] Received step event:', data);
          if (onStep) onStep(parseInt(data, 10));
        } else if (event === 'data') {
          log('[EcoMirror] Received extracted data event');
          try {
            const parsed = JSON.parse(data);
            onData(parsed);
          } catch (e) {
            logError('[EcoMirror] Error parsing SSE data event payload:', e);
          }
        } else if (event === 'error') {
          logError('[EcoMirror] Server error event:', data);
          onError(getUserFriendlyError(data));
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      log('[EcoMirror] SSE stream aborted (timeout or user navigated away)');
      return;
    }
    logError('[EcoMirror] SSE connection error:', error);
    onError(getUserFriendlyError(error));
  } finally {
    clearTimeout(timeoutId);
    _chatAbortController = null;
  }
}

/**
 * Calls the deterministic carbon calculator API.
 */
export async function calculateFootprint(data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Calculation failed');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls the contextualize API for Indian analogies and behavioral nudges.
 * Sends both calculation results and lifestyle inputs for personalized insights.
 */
export async function contextualizeFootprint(results, lifestyle) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/contextualize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ calculation: results, lifestyle }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Contextualization failed');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
