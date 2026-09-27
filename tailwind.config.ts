import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#eefbff',
          100: '#d7f3ff',
          200: '#b3e9ff',
          300: '#7ddaff',
          400: '#3fc2ff',
          500: '#12a3f0',
          600: '#0682cc',
          700: '#0768a3',
          800: '#0b5786',
          900: '#0f4a70',
          950: '#082e49',
        },
        sunset: {
          50: '#fff6ed',
          100: '#ffead4',
          200: '#ffd1a9',
          300: '#ffb072',
          400: '#ff8539',
          500: '#fd6414',
          600: '#ee480a',
          700: '#c5340a',
          800: '#9c2b10',
          900: '#7e2610',
          950: '#440f06',
        },
        champagne: {
          50: '#fdfaf0',
          100: '#faf1d8',
          200: '#f4e1ab',
          300: '#eccb75',
          400: '#e4b247',
          500: '#d99a2b',
          600: '#c07d20',
          700: '#9f611d',
          800: '#814d1e',
          900: '#6b401c',
        },
        midnight: {
          800: '#0b1d33',
          900: '#071426',
          950: '#040c19',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #0f4a70 0%, #12a3f0 45%, #7ddaff 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #440f06 0%, #ee480a 50%, #ffb072 100%)',
        'champagne-gradient': 'linear-gradient(135deg, #6b401c 0%, #d99a2b 55%, #f4e1ab 100%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(18, 163, 240, 0.45)',
        card: '0 8px 30px -12px rgba(4, 12, 25, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
