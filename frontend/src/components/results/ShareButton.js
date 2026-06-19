'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { buildShareText } from '@/lib/shareText';

export default function ShareButton({ score, totalCo2Kg, firstNudgeAction, breakdown }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [snapStatus, setSnapStatus] = useState(null);

  const shareText = buildShareText({ score, totalCo2Kg, firstNudgeAction, breakdown });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share text to clipboard:', err);
    }

    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWithSnap = async () => {
    setSnapStatus('redirecting');
    setTimeout(() => router.push('/results/biosphere'), 800);
  };

  const handleRecalculate = () => {
    localStorage.removeItem('ecomirror_results');
    router.push('/chat');
  };

  const snapLabel = snapStatus === 'redirecting' ? 'Opening 3D world...' : 'Share with 3D Snap';

  return (
    <div className="flex flex-col gap-3 w-full pt-2 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* LinkedIn Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97]"
          style={{ background: '#0a66c2', color: '#fff', boxShadow: '0 1px 3px rgba(10,102,194,0.35)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#004182'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#0a66c2'}
        >
          <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          <span>{copied ? 'Copied! Opening LinkedIn...' : 'Share on LinkedIn'}</span>
        </button>

        {/* Recalculate Button */}
        <button
          onClick={handleRecalculate}
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97]"
          style={{
            background: 'var(--surface-variant)',
            color: 'var(--foreground-muted)',
            border: '1px solid var(--border-subtle)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--foreground)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-variant)'; e.currentTarget.style.color = 'var(--foreground-muted)'; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.235" />
          </svg>
          <span>Recalculate</span>
        </button>
      </div>

      {/* Share with 3D Snap Button */}
      <button
        onClick={handleShareWithSnap}
        disabled={snapStatus === 'redirecting'}
        className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #1e8e3e, #34a853)',
          color: '#fff',
          boxShadow: '0 1px 3px rgba(30,142,62,0.25)',
          opacity: snapStatus === 'redirecting' ? 0.7 : 1,
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{snapLabel}</span>
      </button>
    </div>
  );
}
