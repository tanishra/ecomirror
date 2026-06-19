'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full flex flex-col items-center justify-center text-center px-5 py-20 md:py-28 overflow-hidden flex-1">
      {/* Subtle background gradient blobs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(52,168,83,0.10) 0%, transparent 100%)',
          zIndex: 0,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 100% 100%, rgba(26,115,232,0.07) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto">
        {/* Platform Badge */}
        <div
          className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-pill text-sm font-semibold animate-fade-in-up"
          style={{
            background: '#e6f4ea',
            color: '#1e8e3e',
            border: '1px solid #ceead6',
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34a853' }} />
          AI Carbon Footprint Platform
        </div>

        {/* Main Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6 animate-fade-in-up"
          style={{ color: 'var(--foreground)', animationDelay: '0.05s' }}
        >
          See what your lifestyle
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #1e8e3e 0%, #1a73e8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            does to the planet
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10 animate-fade-in-up"
          style={{ color: 'var(--foreground-muted)', animationDelay: '0.1s' }}
        >
          Answer 5 conversational questions about your daily habits. No forms, no dropdowns — just talk. Discover your carbon score and watch a live 3D world react to your choices.
        </p>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <Link
            href="/chat"
            className="btn-primary group"
            style={{ fontSize: '15px' }}
          >
            Discover Your Carbon Footprint
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            href="/results/biosphere"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-pill text-sm font-semibold transition-all duration-200 hover:shadow-md1"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle, #e8eaed)',
              color: 'var(--foreground-muted)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Explore 3D Biosphere
          </Link>
        </div>

        {/* Trust micro-indicators */}
        <div
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-10 text-xs font-medium animate-fade-in-up"
          style={{ color: 'var(--foreground-subtle)', animationDelay: '0.2s' }}
        >
          {['Gemini 2.5 Flash', 'IPCC AR6 Carbon Math', 'Real-time 3D Biosphere', 'No account needed'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
