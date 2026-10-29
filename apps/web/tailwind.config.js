/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
        },
        paper: '#f8fafc',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f1f5f9',
        },
        line: '#cbd5e1',
        accent: {
          DEFAULT: '#0f766e',
          hover: '#115e59',
        },
        forecast: '#1d4ed8',
        actual: {
          DEFAULT: '#b45309',
          chart: '#d97706',
        },
        residual: {
          pos: '#b91c1c',
          neg: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
        control: '6px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
