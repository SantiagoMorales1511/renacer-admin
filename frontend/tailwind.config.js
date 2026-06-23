/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        petrol: {
          50: '#effafb',
          100: '#d8f0f3',
          200: '#b0e0e8',
          300: '#7dc8d5',
          400: '#4aabb9',
          500: '#2f929f',
          600: '#257882',
          700: '#236670',
          800: '#22545c',
          900: '#21464d',
        },
        gold: {
          400: '#e0bc5a',
          500: '#d4a843',
          600: '#b88f35',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      borderRadius: {
        card: '14px',
        panel: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
        elevated: '0 2px 8px rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card-dark': '0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(74, 171, 185, 0.04)',
        'elevated-dark': '0 4px 12px rgba(0, 0, 0, 0.45), 0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(74, 171, 185, 0.06)',
      },
    },
  },
  plugins: [],
};
