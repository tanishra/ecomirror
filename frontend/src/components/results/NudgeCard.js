'use client';

import React from 'react';

const NudgeCard = React.memo(function NudgeCard({ nudges }) {
  const getNudgeIcon = (action) => {
    const lower = action.toLowerCase();
    if (lower.includes('transit') || lower.includes('carpool') || lower.includes('metro') || lower.includes('bus') || lower.includes('commute')) return '🚌';
    if (lower.includes('ac') || lower.includes('temp') || lower.includes('heating') || lower.includes('cooling') || lower.includes('fan')) return '❄️';
    if (lower.includes('meat') || lower.includes('vegetarian') || lower.includes('diet') || lower.includes('veg')) return '🥗';
    if (lower.includes('shop') || lower.includes('buy') || lower.includes('apparels') || lower.includes('clothing') || lower.includes('clothes')) return '👕';
    if (lower.includes('flight') || lower.includes('fly') || lower.includes('travel')) return '✈️';
    return '💡';
  };

  const getEffortStyle = (effort) => {
    const eff = effort.toLowerCase();
    if (eff === 'low') return { background: 'var(--green-surface)', color: '#1e8e3e', border: '1px solid var(--green-border)' };
    if (eff === 'medium') return { background: 'var(--amber-surface)', color: '#f29900', border: '1px solid rgba(242,153,0,0.3)' };
    return { background: 'var(--red-surface)', color: '#d93025', border: '1px solid rgba(217,48,37,0.3)' };
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      <h3 className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--foreground-subtle)' }}>
        RECOMMENDED ACTION NUDGES
      </h3>

      <div className="space-y-3">
        {nudges.map((nudge, index) => {
          const icon = getNudgeIcon(nudge.action);
          return (
            <div
              key={index}
              className="rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'var(--blue-surface)', border: '1px solid rgba(26,115,232,0.2)' }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                    {nudge.action}
                  </h4>
                  <p className="text-xs font-semibold mt-1.5 flex items-center gap-1" style={{ color: '#1e8e3e' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {nudge.impact}
                  </p>
                </div>
              </div>
              <div
                className="px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={getEffortStyle(nudge.effort)}
              >
                {nudge.effort}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default NudgeCard;
