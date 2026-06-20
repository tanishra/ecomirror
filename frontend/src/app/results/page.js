'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import AppHeader from '@/components/ui/AppHeader';
import ScoreCard from '@/components/results/ScoreCard';
import ComparisonBar from '@/components/results/ComparisonBar';
import AnalogyCard from '@/components/results/AnalogyCard';
import NudgeCard from '@/components/results/NudgeCard';
import ShareButton from '@/components/results/ShareButton';
import { useEffect, useState } from 'react';

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('ecomirror_results');
    if (!saved) {
      router.push('/chat');
      return;
    }
    try {
      setData(JSON.parse(saved));
    } catch (e) {
      router.push('/chat');
    }
  }, [router]);

  const handleRestart = useCallback(() => {
    localStorage.removeItem('ecomirror_results');
    router.push('/');
  }, [router]);

  // Skeleton loading state
  if (!mounted || !data) {
    return (
      <main className="w-full min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Header skeleton */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 24px' }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="skeleton h-8 w-32 rounded-xl" />
            <div className="skeleton h-7 w-20 rounded-pill" />
          </div>
        </div>
        {/* Content skeletons */}
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5" role="status" aria-live="polite" aria-label="Loading results">
          <div className="skeleton h-24 w-full rounded-xl2" />
          <div className="skeleton h-56 w-full rounded-xl2" />
          <div className="skeleton h-40 w-full rounded-xl2" />
          <div className="skeleton h-52 w-full rounded-xl2" />
          <div className="skeleton h-52 w-full rounded-xl2" />
        </div>
      </main>
    );
  }

  const { calculation, context } = data;
  const score = calculation.score;
  const totalCo2 = calculation.total_co2_kg_per_year;
  const analogies = context.analogies;
  const nudges = context.nudges;

  const topAction = nudges && nudges[0] ? nudges[0].action : "Optimizing daily commuting habits";

  return (
    <main className="w-full min-h-screen overflow-y-auto" style={{ background: 'var(--background)' }}>

      {/* Sticky Header */}
      <AppHeader>
        <button
          onClick={handleRestart}
          className="text-xs font-semibold px-4 py-1.5 rounded-pill transition-all duration-200"
          style={{ background: 'var(--surface-variant)', color: 'var(--foreground-muted)', border: '1px solid var(--border-subtle)' }}
        >
          Start Over
        </button>
      </AppHeader>

      {/* Centered Container */}
      <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* 3D Biosphere Promo Card */}
        <div
          className="relative overflow-hidden rounded-xl2 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{
            background: 'linear-gradient(135deg, var(--green-surface, #e6f4ea) 0%, var(--blue-surface, #e8f0fe) 100%)',
            border: '1px solid var(--green-border, #ceead6)',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          <div className="space-y-1.5 max-w-md">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#1e8e3e' }}>
              VIRTUAL BIOSPHERE ACTIVE
            </span>
            <h2 className="text-base md:text-lg font-extrabold" style={{ color: 'var(--foreground)' }}>
              Explore your footprint in 3D
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              Step inside an interactive 3D biosphere that visually degrades based on your score. Drag to rotate, zoom, and simulate different lifestyles.
            </p>
          </div>
          <button
            onClick={() => router.push('/results/biosphere')}
            className="group w-full md:w-auto whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 btn-hover-dark"
            style={{ background: '#1e8e3e', color: '#fff', boxShadow: '0 1px 3px rgba(30,142,62,0.3)' }}
          >
            Enter 3D Biosphere
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Score Card */}
        <ScoreCard score={score} totalCo2Kg={totalCo2} />

        {/* Comparison Bar */}
        <ComparisonBar
          userTons={totalCo2 / 1000}
          vsIndia={calculation.vs_india_average}
          vsGlobal={calculation.vs_global_average}
        />

        {/* Relatable Analogies */}
        <AnalogyCard analogies={analogies} />

        {/* Action Nudges */}
        <NudgeCard nudges={nudges} />

        {/* Share & Recalculate */}
        <ShareButton score={score} totalCo2Kg={totalCo2} firstNudgeAction={topAction} breakdown={calculation.breakdown} />

        {/* Footer */}
        <footer className="w-full text-center py-6 text-xs" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--foreground-subtle)' }}>
          Data stored locally in your browser · EcoMirror AI · PromptWars 2026
        </footer>
      </div>
    </main>
  );
}
