'use client';

import { useEffect, useState } from 'react';

export default function ComparisonBar({ userTons, vsIndia, vsGlobal }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger width animations on mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const indiaAvg = 2.0;  // IEA 2022
  const globalAvg = 4.7; // IEA 2022

  // Compute maximum for bar percentage scaling (max out at 15 tons to keep layout neat)
  const maxTonsVal = Math.max(userTons, indiaAvg, globalAvg, 6);
  const getWidthPercent = (val) => {
    return `${(val / maxTonsVal) * 100}%`;
  };

  // Determine user bar color based on footprint size
  const getUserBarColor = (val) => {
    if (val <= 2.5) return 'linear-gradient(90deg, #1e8e3e, #34a853)';
    if (val <= 4.7) return 'linear-gradient(90deg, #f29900, #fbbc04)';
    return 'linear-gradient(90deg, #d93025, #ea4335)';
  };

  const bars = [
    { label: 'Your Footprint', value: userTons, color: getUserBarColor(userTons), bold: true },
    { label: 'India Average', value: indiaAvg, color: '#34a853', bold: false },
    { label: 'Global Average', value: globalAvg, color: '#1a73e8', bold: false },
  ];

  return (
    <div
      className="rounded-xl2 p-6 animate-fade-in-up"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-1)' }}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase block mb-5" style={{ color: 'var(--foreground-subtle)' }}>
        CO₂ FOOTPRINT COMPARISON
      </span>

      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold" style={{ color: bar.bold ? 'var(--foreground)' : 'var(--foreground-muted)', fontWeight: bar.bold ? 700 : 500 }}>
                {bar.label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: bar.bold ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                {bar.value.toFixed(2)} T / yr
              </span>
            </div>
            <div className="w-full h-2.5 rounded-pill overflow-hidden" style={{ background: 'var(--surface-variant)' }}>
              <div
                className="h-full rounded-pill transition-all duration-1000 ease-out"
                style={{
                  width: animate ? getWidthPercent(bar.value) : '0%',
                  background: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Comparison multipliers */}
      <div className="grid grid-cols-2 gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {[
          { label: 'vs India Average', value: vsIndia },
          { label: 'vs Global Average', value: vsGlobal },
        ].map((item) => (
          <div
            key={item.label}
            className="text-center p-3 rounded-xl"
            style={{
              background: item.value > 1 ? 'var(--red-surface)' : 'var(--green-surface)',
              border: `1px solid ${item.value > 1 ? 'var(--red-surface)' : 'var(--green-border)'}`,
              opacity: 0.95,
            }}
          >
            <span className="text-[10px] font-bold tracking-wide uppercase block mb-1" style={{ color: 'var(--foreground-subtle)' }}>
              {item.label}
            </span>
            <span className="text-xl font-black" style={{ color: item.value > 1 ? '#d93025' : '#1e8e3e' }}>
              {item.value}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
