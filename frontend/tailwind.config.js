/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        petrol: {
          50: '#f0f4f6',
          100: '#d9e3e8',
          200: '#b3c7d1',
          300: '#84a4b4',
          400: '#577f93',
          500: '#3d6577',
          600: '#2f4f5e',
          700: '#284350',
          800: '#22363f',
          900: '#1c2c33',
        },
        lavender: {
          50: '#f6f4fb',
          100: '#ece7f6',
          200: '#daccef',
          300: '#c4ade2',
          400: '#a98bd1',
          500: '#9070bf',
          600: '#7857a3',
          700: '#624785',
          800: '#503b6c',
          900: '#43335a',
        },
        gold: {
          400: '#d8b863',
          500: '#c9a44c',
          600: '#ad8a39',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
