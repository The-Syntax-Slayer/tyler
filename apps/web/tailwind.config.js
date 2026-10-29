/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light, professional enterprise palette. Elevation comes from
        // hairline borders + restrained shadows, not colour steps.
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          faint: '#94a3b8',
        },
        paper: '#f8fafc',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f1f5f9',
          raised: '#ffffff',
        },
        line: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1',
        },
        // Single restrained accent: deep professional blue.
        accent: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          dim: '#eff6ff',
        },
        volt: '#0f766e',
        forecast: '#2563eb',
        actual: {
          DEFAULT: '#d97706',
          chart: '#b45309',
        },
        residual: {
          pos: '#e11d48',
          neg: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '10px',
        control: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04)',
        glow: '0 1px 2px rgba(29, 78, 216, 0.25)',
        panel: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease-out both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
