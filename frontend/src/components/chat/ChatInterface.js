'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  error
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  }, [input, isLoading, onSendMessage]);

  return (
    <div
      className="flex flex-col w-full max-w-3xl mx-auto overflow-hidden flex-1 min-h-0 rounded-xl2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-3)',
      }}
    >
      {/* Chat Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e8e3e, #34a853)' }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>EcoMirror Advisor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34a853' }} />
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Conversational Carbon Audit</p>
            </div>
          </div>
        </div>
        <span
          className="hidden sm:block text-xs font-semibold px-3 py-1 rounded-pill"
          style={{ background: 'var(--green-surface)', color: '#1e8e3e', border: '1px solid var(--green-border)' }}
        >
          Powered by Gemini
        </span>
      </div>

      {/* Message Area */}
      <div
        className="flex-1 overflow-y-auto px-5 py-5"
        style={{ background: 'var(--background)' }}
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        aria-relevant="additions"
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="flex justify-center mb-4">
            <div
              className="text-xs px-4 py-3 rounded-xl max-w-md text-center"
              style={{ background: 'var(--red-surface)', border: '1px solid var(--red-border)', color: '#d93025' }}
            >
              <span className="font-bold">Error: </span>{error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 flex items-center gap-3"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? 'AI is thinking...' : 'Type your answer...'}
          className="flex-1 rounded-pill px-5 py-3 text-sm focus:outline-none transition-all duration-200 input-focus-ring"
          aria-label="Type your answer"
          autoComplete="off"
          style={{
            background: 'var(--surface-variant)',
            border: '1px solid transparent',
            color: 'var(--foreground)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
          aria-label="Send message"
          style={{
            background: (!input.trim() || isLoading) ? 'var(--surface-variant)' : '#1e8e3e',
            color: (!input.trim() || isLoading) ? 'var(--foreground-subtle)' : '#fff',
            cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
            boxShadow: (!input.trim() || isLoading) ? 'none' : '0 1px 2px rgba(60,64,67,0.3)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
