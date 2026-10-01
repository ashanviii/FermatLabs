/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/(marketing)/**/*.{ts,tsx}',
    './src/components/landing/**/*.{ts,tsx}',
    './src/components/auth/**/*.{ts,tsx}',
    './src/components/ui/**/*.{ts,tsx}',
  ],
  // Chakra's CSSReset already normalizes the page; Tailwind's preflight would restyle the dashboard.
  corePlugins: { preflight: false },
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1120px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(24px, -18px) scale(1.06)' },
        },
        'grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fly: {
          '0%': { left: '0%', opacity: '0' },
          '15%, 85%': { opacity: '1' },
          '100%': { left: 'calc(100% - 1rem)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'grow-x': 'grow-x 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both',
        drift: 'drift 18s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        fly: 'fly 3.2s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
