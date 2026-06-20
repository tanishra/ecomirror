import Hero from '@/components/landing/Hero';
import StatRow from '@/components/landing/StatRow';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* ── Navigation ── */}
      <header
        className="w-full sticky top-0 z-50"
        style={{
          background: 'var(--nav-bg, rgba(255,255,255,0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle, #e8eaed)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="EcoMirror Home">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md1 group-hover:shadow-md2 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #1e8e3e 0%, #34a853 100%)' }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Eco<span style={{ color: '#1e8e3e' }}>Mirror</span>
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* GitHub Icon */}
            <a
              href="https://github.com/tanishra/ecomirror"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View EcoMirror source on GitHub"
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--surface-variant)',
                border: '1px solid var(--border-subtle, #e8eaed)',
                color: 'var(--foreground)',
              }}
              title="View on GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <Hero />

      {/* ── Stats Section ── */}
      <StatRow />

      {/* ── Footer ── */}
      <footer
        className="w-full py-6 text-center text-xs font-medium"
        style={{ borderTop: '1px solid var(--border-subtle, #e8eaed)', color: 'var(--foreground-subtle)', background: 'var(--surface)' }}
      >
        © {new Date().getFullYear()} EcoMirror AI &nbsp;·&nbsp; Built for Planetary Awareness &nbsp;·&nbsp; PromptWars 2026
      </footer>
    </main>
  );
}
