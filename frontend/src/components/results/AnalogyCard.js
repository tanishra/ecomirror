'use client';

import React from 'react';

const AnalogyCard = React.memo(function AnalogyCard({ analogies }) {
  const getAnalogyIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('tree') || lower.includes('offset')) return '🌳';
    if (lower.includes('car') || lower.includes('auto') || lower.includes('km') || lower.includes('drive')) return '🚗';
    if (lower.includes('electricity') || lower.includes('charge') || lower.includes('power') || lower.includes('phone') || lower.includes('appliances')) return '⚡';
    if (lower.includes('flight') || lower.includes('fly') || lower.includes('plane')) return '✈️';
    if (lower.includes('shop') || lower.includes('clothes') || lower.includes('fashion') || lower.includes('buy')) return '🛍️';
    if (lower.includes('bottle') || lower.includes('plastic') || lower.includes('water')) return '🥤';
    return '🌍';
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      <h3 className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--foreground-subtle)' }}>
        RELATABLE ENVIRONMENTAL IMPACTS
      </h3>

      <div className="space-y-3">
        {analogies.map((analogy, index) => {
          const icon = getAnalogyIcon(analogy);
          return (
            <div
              key={index}
              className="rounded-xl flex items-start gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <div
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'var(--green-surface)', border: '1px solid var(--green-border)' }}
              >
                {icon}
              </div>
              <div className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--foreground)' }}>
                {analogy}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AnalogyCard;
