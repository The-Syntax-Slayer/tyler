/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Off-white text on deep navy-black surfaces. Elevation comes from
        // surface steps + hairline borders, not shadows.
        ink: {
          DEFAULT: '#e6edf7',
          muted: '#93a3bd',
          faint: '#5d6e8c',
        },
        paper: '#070b16',
        surface: {
          DEFAULT: '#0c1322',
          subtle: '#101a2f',
          raised: '#152238',
        },
        line: {
          DEFAULT: '#1d2a44',
          strong: '#2c3d61',
        },
        // Single electric accent. Saturated colour is reserved for meaning:
        // forecast / actual / residual only.
        accent: {
          DEFAULT: '#22d3ee',
          hover: '#67e8f9',
          dim: 'rgba(34, 211, 238, 0.12)',
        },
        volt: '#a3e635',
        forecast: '#38bdf8',
        actual: {
          DEFAULT: '#fbbf24',
          chart: '#f59e0b',
        },
        residual: {
          pos: '#fb7185',
          neg: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        control: '8px',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(45, 62, 99, 0.35), 0 12px 32px -16px rgba(0, 0, 0, 0.7)',
        glow: '0 0 24px -6px rgba(34, 211, 238, 0.45)',
        panel: 'inset 0 1px 0 0 rgba(230, 237, 247, 0.05)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(163, 230, 53, 0.55)' },
          '50%': { opacity: '0.75', boxShadow: '0 0 0 5px rgba(163, 230, 53, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
