import "./globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport = {
  themeColor: '#1e8e3e',
};

export const metadata = {
  title: "EcoMirror — AI Carbon Footprint Awareness Platform",
  description: "See what your lifestyle does to the planet. Answer 5 conversational questions and explore your impact in a real-time interactive 3D world.",
  openGraph: {
    title: "EcoMirror — AI Carbon Footprint Platform",
    description: "A conversational AI carbon footprint explorer. Discover your impact in a live 3D biosphere.",
    type: "website",
    url: "https://ecomirror.vercel.app",
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={inter.variable}>
      <body className={`antialiased min-h-screen ${inter.className}`} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
          style={{ background: '#1e8e3e', color: '#fff' }}
        >
          Skip to main content
        </a>
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fef3c7', borderBottom: '2px solid #f59e0b' }}>
            <strong>JavaScript is required</strong> to run EcoMirror. Please enable JavaScript in your browser settings.
          </div>
        </noscript>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
