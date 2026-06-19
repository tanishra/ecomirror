'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';

export default function ScoreCard({ score, totalCo2Kg }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: score,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayScore(Math.floor(obj.val));
      }
    });
  }, [score]);

  // Determine feedback details based on score
  const getScoreDetails = (val) => {
    if (val <= 33) {
      return {
        label: 'Low Impact',
        accentHex: '#1e8e3e',
        surfaceHex: '#e6f4ea',
        borderHex: '#ceead6',
        desc: 'Your emissions are within sustainable parameters. Keep up the clean lifestyle!',
      };
    } else if (val <= 66) {
      return {
        label: 'Moderate Impact',
        accentHex: '#f29900',
        surfaceHex: '#fef7e0',
        borderHex: '#fde68a',
        desc: 'Your emissions are around the global average. There is solid room to optimize.',
      };
    } else {
      return {
        label: 'High Impact',
        accentHex: '#d93025',
        surfaceHex: '#fce8e6',
        borderHex: '#f4bbb8',
        desc: 'Your emissions are heavy. Urgent behavioral adjustments are recommended.',
      };
    }
  };

  const details = getScoreDetails(score);
  const tonsCo2 = (totalCo2Kg / 1000).toFixed(2);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div
      className="rounded-xl2 p-6 relative overflow-hidden flex flex-col items-center text-center animate-fade-in-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--foreground-subtle)' }}>
        CARBON PROFILE SCORE
      </span>

      {/* SVG Circular Progress Ring */}
      <div
        className="relative w-36 h-36 my-2 flex items-center justify-center"
        role="img"
        aria-label={`Carbon score: ${score} out of 100. ${details.label}.`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-variant)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={details.accentHex}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="flex flex-col items-center justify-center relative z-10">
          <span className="text-5xl font-black tracking-tighter" style={{ color: details.accentHex }}>
            {displayScore}
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
            OF 100
          </span>
        </div>
      </div>

      {/* Label Badge */}
      <div
        className="px-4 py-1.5 rounded-pill text-xs font-bold uppercase tracking-wider mb-4"
        style={{ background: details.surfaceHex, color: details.accentHex, border: `1px solid ${details.borderHex}` }}
      >
        {details.label}
      </div>

      {/* CO2 Tonnage */}
      <div className="w-full pt-4 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-baseline justify-center gap-1.5 mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>Annual Footprint:</span>
          <span className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{tonsCo2}</span>
          <span className="text-sm font-semibold" style={{ color: details.accentHex }}>Tons CO₂</span>
        </div>
        <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--foreground-subtle)' }}>
          {details.desc}
        </p>
      </div>
    </div>
  );
}
