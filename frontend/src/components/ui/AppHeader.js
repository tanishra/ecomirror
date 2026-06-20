'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import EcoMirrorLogo, { EcoMirrorBrand } from './EcoMirrorLogo';

export default function AppHeader({ children, transparent = false }) {
  const router = useRouter();

  const headerStyle = transparent ? {
    background: 'transparent',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  } : {
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-1)',
  };

  return (
    <header
      className="w-full sticky top-0 z-30 flex-shrink-0"
      style={headerStyle}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push('/')}
          role="link"
          aria-label="EcoMirror Home"
        >
          <EcoMirrorLogo size="default" />
          <EcoMirrorBrand />
        </div>
        <div className="flex items-center gap-2">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
