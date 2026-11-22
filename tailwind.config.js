/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F3EC',
          100: '#D0E7D9',
          200: '#A7D2B8',
          300: '#78B892',
          400: '#469C6A',
          500: '#26814B',
          600: '#1B6B3A',
          700: '#16572F',
          800: '#124D29',
          900: '#0D3A1F',
          950: '#062111',
          green: '#1B6B3A',
          'green-dark': '#124D29',
          'green-tint': '#E8F3EC',
          yellow: '#F2B705',
          'yellow-tint': '#FFF6D6',
        },
        navy: {
          800: '#0B1E13',
          900: '#07150D',
          950: '#040B07',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Tamil', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Anek Tamil', 'system-ui', 'sans-serif'],
        tamil: ['Anek Tamil', 'Noto Sans Tamil', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
