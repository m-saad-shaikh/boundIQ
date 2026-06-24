/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space': {
          950: '#020208',
          900: '#050510',
          800: '#0d0d2b',
          700: '#131340',
          600: '#1a1a5e',
        },
        'neon': {
          pink:   '#ff2d78',
          purple: '#8b5cf6',
          cyan:   '#06b6d4',
          gold:   '#f59e0b',
          green:  '#10b981',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
