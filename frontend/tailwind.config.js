/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#090a0f',
          900: '#12141c',
          850: '#1a1d27',
          800: '#232734',
          700: '#353a4c',
          600: '#4e556e',
          500: '#717b9b',
          400: '#9aa3be',
          300: '#c5cbe0',
          200: '#e2e6f2',
          100: '#f1f3f9',
        },
        manometer: {
          optimal: '#10b981',   // Presión estabilizada >= 230 bar
          warning: '#f59e0b',   // Caída de presión en progreso
          critical: '#ef4444',  // Subpresión < 230 bar o Sobrepresión > 250 bar
          info: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
