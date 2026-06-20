'use client';

import React from 'react';

const StatRow = React.memo(function StatRow() {
  const stats = [
    {
      label: "Average Indian",
      sublabel: "per capita / year",
      value: "2.0 Tons",
      unit: "CO₂",
      description: "Low emissions driven by localized transit, plant-heavy diet, and smaller living spaces. Source: IEA 2022.",
      accentColor: '#1e8e3e',
      surfaceColor: '#e6f4ea',
      borderColor: '#ceead6',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
        </svg>
      ),
    },
    {
      label: "Global Average",
      sublabel: "IPCC 1.5°C target: 2.5T by 2030",
      value: "4.7 Tons",
      unit: "CO₂",
      description: "The global baseline (IEA 2022). The IPCC AR6 report says we must reach ~2.5T CO₂eq per person by 2030 to limit warming to 1.5°C.",
      accentColor: '#1a73e8',
      surfaceColor: '#e8f0fe',
      borderColor: '#c5d9fb',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx={12} cy={12} r={10} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
        </svg>
      ),
    },
    {
      label: "US Average",
      sublabel: "highest major economy",
      value: "14.9 Tons",
      unit: "CO₂",
      description: "Driven by heavy car dependency, large homes, and high air travel frequency. Source: IEA 2022.",
      accentColor: '#d93025',
      surfaceColor: '#fce8e6',
      borderColor: '#f4bbb8',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L4.25 16.04A2 2 0 005.07 19z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-5 sm:px-8 pb-16 md:pb-24">
      {/* Section header */}
      <div className="text-center mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--foreground-subtle)' }}>
          Global Carbon Context
        </h2>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Per capita CO₂ emissions — annual comparison
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative rounded-xl2 p-6 flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle, #e8eaed)',
              boxShadow: 'var(--shadow-1)',
              borderLeft: `4px solid ${stat.accentColor}`,
            }}
          >
            {/* Subtle surface tint on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl2"
              style={{ background: stat.surfaceColor, mixBlendMode: 'multiply' }}
            />

            {/* Icon + Label Row */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: stat.accentColor }}>
                  {stat.label}
                </span>
                <span className="block text-[10px] font-medium mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
                  {stat.sublabel}
                </span>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.surfaceColor, color: stat.accentColor, border: `1px solid ${stat.borderColor}` }}
              >
                {stat.icon}
              </div>
            </div>

            {/* Big value */}
            <div className="relative z-10">
              <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
                {stat.value}
              </span>
              <span className="text-sm font-semibold ml-1.5" style={{ color: stat.accentColor }}>
                {stat.unit}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed relative z-10" style={{ color: 'var(--foreground-muted)' }}>
              {stat.description}
            </p>

            {/* Accent bottom bar */}
            <div
              className="stat-accent-bar"
              style={{ background: stat.accentColor }}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

export default StatRow;
