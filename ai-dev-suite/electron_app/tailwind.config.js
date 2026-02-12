/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'spin-once': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'spin-once': 'spin-once 0.4s ease-out',
      },
      colors: {
        whynot: {
          bg: '#030406',
          surface: '#0a0c10',
          border: '#1a1d23',
          accent: '#ff3b30',
          body: '#d1d5db',
          muted: '#6b7280',
          link: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
