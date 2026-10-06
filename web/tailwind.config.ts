import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: '#0A5CFF', success: '#00C48C', warning: '#FFB020', error: '#F04438' },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-manrope)', 'sans-serif'],
      },
      borderRadius: { card: '12px' },
      boxShadow: { card: '0 4px 24px -8px rgb(15 23 42 / .12), 0 1px 3px rgb(15 23 42 / .04)' },
    },
  },
  plugins: [],
} satisfies Config;
