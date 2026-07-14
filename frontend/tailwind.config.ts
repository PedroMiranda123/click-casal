import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: '#1B2A38',
        blue: '#2E6FA3',
        coral: '#C9613D',
        gold: '#C99A3B',
      },
      backdropBlur: {
        glass: '22px',
      },
    },
  },
  plugins: [],
} satisfies Config;
