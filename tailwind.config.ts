import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Brand palette — derived from the logo (emerald + gold + deep forest ink)
        brand: {
          50: '#ecfdf5',
          100: '#d1faE5',
          200: '#a7f3cf',
          300: '#6ee7b3',
          400: '#34d399',
          500: '#10b981',
          600: '#0e7c5a', // primary emerald
          700: '#0a6248',
          800: '#074a37',
          900: '#06402b', // deep forest
          950: '#032018',
        },
        gold: {
          50: '#fdf8ec',
          100: '#faedc9',
          200: '#f4da94',
          300: '#edc35f',
          400: '#e7c97a',
          500: '#c9a24b', // primary gold
          600: '#b1853a',
          700: '#8c6530',
          800: '#73512d',
          900: '#614429',
        },
        ink: {
          DEFAULT: '#0a1410',
          soft: '#13211b',
          muted: '#46544c',
        },
        sand: {
          DEFAULT: '#f6f3ea',
          soft: '#fbf9f3',
        },
        // Semantic tokens (driven by CSS variables so the admin theme editor can override)
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        // The Bengali face sits in every stack so Bangla glyphs on the English
        // version (names in Bangla, ৳) render in Noto Sans Bengali too.
        sans: ['var(--font-sans)', 'var(--font-bengali)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-bengali)', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(6, 64, 43, 0.08), 0 8px 24px -8px rgba(6, 64, 43, 0.12)',
        glow: '0 0 0 1px rgba(201, 162, 75, 0.25), 0 12px 40px -12px rgba(14, 124, 90, 0.45)',
        gold: '0 10px 30px -10px rgba(201, 162, 75, 0.55)',
        emerald: '0 18px 50px -18px rgba(14, 124, 90, 0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #06402b 0%, #0e7c5a 45%, #c9a24b 110%)',
        'gold-gradient': 'linear-gradient(135deg, #e7c97a 0%, #c9a24b 50%, #8c6530 100%)',
        'mesh-emerald':
          'radial-gradient(60% 60% at 15% 20%, rgba(14,124,90,0.30) 0%, rgba(14,124,90,0) 60%), radial-gradient(50% 50% at 85% 15%, rgba(201,162,75,0.22) 0%, rgba(201,162,75,0) 55%), radial-gradient(60% 60% at 75% 85%, rgba(6,64,43,0.30) 0%, rgba(6,64,43,0) 60%)',
        'shimmer': 'linear-gradient(110deg, transparent 30%, rgba(231,201,122,0.55) 50%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-30px) translateX(12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 11s ease-in-out infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        marquee: 'marquee 32s linear infinite',
        'gradient-pan': 'gradient-pan 9s ease infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        blink: 'blink 1.05s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
