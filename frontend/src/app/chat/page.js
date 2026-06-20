'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import AppHeader from '@/components/ui/AppHeader';
import { sendChatMessage, calculateFootprint, contextualizeFootprint, cancelChatStream } from '@/lib/api';
import { getUserFriendlyError } from '@/lib/errorMessages';

const isDev = process.env.NODE_ENV === 'development';
const logError = (...args) => { if (isDev) console.error(...args); };

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const messagesRef = useRef([]);
  const stepRef = useRef(1);
  const extractedDataRef = useRef(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    const initiateChat = async () => {
      setIsLoading(true);
      setError(null);

      const initialAssistantMessage = { role: 'assistant', content: '' };
      setMessages([initialAssistantMessage]);

      await sendChatMessage(
        [],
        1,
        (chunk) => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIndex = next.length - 1;
            next[lastIndex] = {
              ...next[lastIndex],
              content: next[lastIndex].content + chunk
            };
            return next;
          });
        },
        (s) => setStep(s),
        (extractedData) => {
          extractedDataRef.current = extractedData;
        },
        (err) => {
          setError(getUserFriendlyError(err));
          setIsLoading(false);
        }
      );

      setIsLoading(false);
    };

    initiateChat();

    return () => {
      cancelChatStream();
      initiatedRef.current = false;
    };
  }, []);

  const processCarbonProfile = useCallback(async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const extracted = extractedDataRef.current;
      if (!extracted) {
        throw new Error("We couldn't extract your carbon data from the conversation. Please try again.");
      }

      const calcResult = await calculateFootprint(extracted);
      const contextResult = await contextualizeFootprint(calcResult, extracted);

      const finalResultPackage = {
        input: extracted,
        calculation: calcResult,
        context: contextResult,
        timestamp: Date.now()
      };

      localStorage.setItem('ecomirror_results', JSON.stringify(finalResultPackage));

      router.push('/results');
    } catch (err) {
      logError(err);
      setError(getUserFriendlyError(err));
      setIsCalculating(false);
    }
  }, [router]);

  const handleSendMessage = useCallback(async (userText) => {
    if (isLoading || isCalculating) return;

    setError(null);
    setIsLoading(true);

    const userMsg = { role: 'user', content: userText };
    const assistantMsgPlaceholder = { role: 'assistant', content: '' };
    const historyBeforeResponse = [...messagesRef.current, userMsg];
    setMessages([...historyBeforeResponse, assistantMsgPlaceholder]);

    const currentStep = stepRef.current;
    let hasDataReceived = false;

    await sendChatMessage(
      historyBeforeResponse,
      currentStep,
      (chunk) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const lastIndex = next.length - 1;
          next[lastIndex] = {
            ...next[lastIndex],
            content: next[lastIndex].content + chunk
          };
          return next;
        });
      },
      (s) => setStep(s),
      (extractedData) => {
        extractedDataRef.current = extractedData;
        hasDataReceived = true;
      },
      (err) => {
        setError(getUserFriendlyError(err));
        setIsLoading(false);
      }
    );

    setIsLoading(false);

    if (hasDataReceived) {
      await processCarbonProfile();
    }
  }, [isLoading, isCalculating, processCarbonProfile]);

  return (
    <main className="relative h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <AppHeader>
        {/* Step Progress (Material linear) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className="transition-all duration-300"
                style={{
                  width: s === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '100px',
                  background: s < step ? '#34a853' : s === step ? '#1e8e3e' : 'var(--surface-variant)',
                }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            {step}/5
          </span>
        </div>
      </AppHeader>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 md:px-6 py-5 min-h-0">
        {isCalculating ? (
          <div
            className="flex flex-col items-center justify-center text-center p-8 rounded-xl2 max-w-md w-full animate-fade-in-up"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-2)',
            }}
            role="status"
            aria-live="polite"
            aria-label="Calculating your carbon footprint"
          >
            <div className="relative w-16 h-16 mb-5">
              <div
                className="absolute inset-0 rounded-full border-4"
                style={{ borderColor: 'var(--green-surface)' }}
              />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: '#1e8e3e', borderTopColor: 'transparent' }}
              />
              <svg
                className="absolute inset-0 m-auto w-6 h-6"
                style={{ color: '#1e8e3e' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Calculating your world...</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              Analysing your environmental profile, running IPCC carbon formulas, and rendering your virtual biosphere.
            </p>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {/* Mini Footer */}
      <footer className="w-full text-center py-2.5 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span className="text-[11px] font-medium" style={{ color: 'var(--foreground-subtle)' }}>
          Data processed securely · Not stored · Powered by Gemini AI
        </span>
      </footer>
    </main>
  );
}
