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
          DEFAULT: '#16211f',
          muted: '#4b5563',
        },
        paper: '#f7f5ef',
        surface: {
          DEFAULT: '#fffdf8',
          subtle: '#f0eee6',
        },
        line: '#ddd8cc',
        accent: {
          DEFAULT: '#0f766e',
          hover: '#115e59',
        },
        forecast: '#2563eb',
        actual: '#d97706',
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
        card: '0 1px 3px 0 rgba(22, 33, 31, 0.05), 0 1px 2px -1px rgba(22, 33, 31, 0.05)',
      },
    },
  },
  plugins: [],
};
