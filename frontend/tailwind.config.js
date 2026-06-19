/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Google Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        google: {
          green: '#1e8e3e',
          'green-light': '#34a853',
          'green-surface': '#e6f4ea',
          'green-border': '#ceead6',
          blue: '#1a73e8',
          'blue-surface': '#e8f0fe',
          red: '#d93025',
          'red-surface': '#fce8e6',
          amber: '#f29900',
          'amber-surface': '#fef7e0',
          gray: '#5f6368',
          'gray-light': '#9aa0a6',
          'gray-border': '#e8eaed',
          'gray-bg': '#f1f3f4',
          ink: '#202124',
        },
      },
      boxShadow: {
        'md1': '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'md2': '0 1px 2px 0 rgba(60,64,67,0.30), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'md3': '0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px rgba(60,64,67,0.30)',
        'md4': '0 6px 10px 4px rgba(60,64,67,0.15), 0 2px 3px rgba(60,64,67,0.30)',
      },
      borderRadius: {
        'xl2': '16px',
        'xl3': '24px',
        'pill': '100px',
      },
    },
  },
  plugins: [],
};
