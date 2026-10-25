/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

/*
 * Fermat design tokens. See src/components/ui/DESIGN.md for when to use what.
 * Rule: screens never hardcode hex. Use these names (bg-brand-900, text-ink-muted, bg-private-soft ...).
 * The legacy shadcn names (primary, muted, accent, card, background, foreground, border) still resolve to the
 * CSS variables in app/(marketing)/landing.css so older markup keeps working; new code should use the semantic names.
 */
const brand = {
  50: '#EEF6F1',
  100: '#D7EBDF',
  200: '#B0D6C0',
  300: '#82BC9A',
  400: '#5AA67A',
  500: '#3D9163',
  600: '#2E7650',
  700: '#235C3F',
  800: '#1A4530',
  900: '#153524',
  950: '#0C2116',
  DEFAULT: '#153524',
};

// The ONE warm accent (marigold). Use sparingly: highlights, the selected/"your pick" state, hero moments.
const warm = {
  50: '#FFF7E8',
  100: '#FDEBC8',
  200: '#FAD58E',
  300: '#F7C566',
  400: '#F4B740',
  500: '#E89A1A',
  600: '#C77A0A',
  700: '#9A5B0B',
  800: '#6E410C',
  DEFAULT: '#F4B740',
};

const tone = (DEFAULT, soft, ink, line) => ({ DEFAULT, soft, ink, line });

const INK = '#16201B';
const displayFont = "var(--font-display), var(--font-sans), ui-sans-serif, system-ui, sans-serif";

const typeScale = () => ({
  '.type-display': {
    fontFamily: displayFont,
    fontSize: '2.125rem',
    lineHeight: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '3rem', lineHeight: '3.25rem' },
  },
  '.type-h1': {
    fontFamily: displayFont,
    fontSize: '1.625rem',
    lineHeight: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.025em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '2rem', lineHeight: '2.5rem' },
  },
  '.type-h2': {
    fontFamily: displayFont,
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '1.375rem', lineHeight: '1.875rem' },
  },
  '.type-h3': {
    fontFamily: displayFont,
    fontSize: '1.0625rem',
    lineHeight: '1.5rem',
    fontWeight: '650',
    letterSpacing: '-0.01em',
    color: INK,
  },
  '.type-lead': { fontSize: '1.0625rem', lineHeight: '1.65rem', fontWeight: '400' },
  '.type-body': { fontSize: '0.9375rem', lineHeight: '1.5rem', fontWeight: '400' },
  '.type-small': { fontSize: '0.8125rem', lineHeight: '1.25rem', fontWeight: '400' },
  '.type-caption': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '500' },
  '.type-overline': {
    fontSize: '0.6875rem',
    lineHeight: '1rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  '.type-num': { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' },
});

module.exports = {
  content: [
    './app/(marketing)/**/*.{ts,tsx}',
    './src/components/landing/**/*.{ts,tsx}',
    './src/components/group-trip/**/*.{ts,tsx}',
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
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* ---- Fermat semantic tokens (use these) ---- */
        brand,
        warm,
        ink: {
          DEFAULT: '#16201B', // headings, primary text
          soft: '#3A4540', // body copy on light surfaces
          muted: '#5E6862', // helper text, labels (5.3:1 on canvas)
          faint: '#8A938D', // icons, placeholders, disabled only (NOT for text that must be read)
          inverse: '#FFFFFF',
        },
        canvas: '#F7F6F2', // page background
        surface: {
          DEFAULT: '#FFFFFF', // cards, inputs
          muted: '#F2F1EC', // sunken wells, table stripes, inactive chips
          strong: '#E9E7E0', // pressed / skeleton
        },
        line: {
          DEFAULT: '#E4E2DA', // hairlines, input borders
          subtle: '#EEEDE7', // dividers inside cards
          strong: '#CFCCC2', // hover borders
        },
        success: tone('#2E7D4F', '#E7F4EC', '#1D5C38', '#BFE0CB'),
        warning: tone('#B26A00', '#FDF3E1', '#7A4A00', '#F2D59F'),
        danger: tone('#C0392B', '#FCEBE9', '#8E2A20', '#F3C4BE'),
        info: tone('#2F6FB3', '#EAF2FB', '#1F4F85', '#C5DAF1'),
        private: tone('#5B4BC4', '#F1EFFC', '#3F3399', '#D9D3F5'),
        whatsapp: { DEFAULT: '#25D366', hover: '#1FBF5B', ink: '#06301A' },

        /* ---- Legacy shadcn tokens (CSS variables in landing.css). Keep for old markup. ---- */
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
        // Standard Tailwind radii carry the system: xl = inputs/buttons-in-cards, 2xl = cards, 3xl = hero panels.
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 32, 27, 0.04), 0 2px 8px rgba(22, 32, 27, 0.05)',
        raised: '0 2px 4px rgba(22, 32, 27, 0.04), 0 10px 28px rgba(22, 32, 27, 0.09)',
        pop: '0 16px 48px rgba(22, 32, 27, 0.16)',
        inset: 'inset 0 0 0 1px rgba(22, 32, 27, 0.06)',
      },
      maxWidth: {
        page: '72rem', // 1152px: outer page width
        content: '48rem', // single-column reading/form width
        prose: '38rem', // paragraphs
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
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
        'fade-in': 'fade-in 0.3s ease-out both',
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
  plugins: [
    require('tailwindcss-animate'),
    // Type scale as component classes (type-h1, type-body ...). Not text-* names on purpose: tailwind-merge would
    // treat a custom `text-h1` as a colour and drop it when combined with `text-ink`.
    plugin(({ addComponents }) => addComponents(typeScale())),
  ],
};
