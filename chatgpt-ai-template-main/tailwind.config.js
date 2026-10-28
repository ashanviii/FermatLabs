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

const INK = '#131316';
const displayFont = "var(--font-display), var(--font-sans), ui-sans-serif, system-ui, sans-serif";
const serifFont = "var(--font-serif), ui-serif, Georgia, serif";
const monoFont = "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

/*
 * Type scale. Editorial and calm: medium-weight headlines set tight, an italic serif for the one accent phrase,
 * and small monospaced caps for labels. All sizes are rem, so text follows the browser's text-size setting.
 */
const typeScale = () => ({
  '.type-display': {
    fontFamily: displayFont,
    fontSize: '2.375rem',
    lineHeight: '2.625rem',
    fontWeight: '500',
    letterSpacing: '-0.04em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '4rem', lineHeight: '4.125rem', letterSpacing: '-0.045em' },
  },
  '.type-h1': {
    fontFamily: displayFont,
    fontSize: '1.875rem',
    lineHeight: '2.25rem',
    fontWeight: '500',
    letterSpacing: '-0.035em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '2.625rem', lineHeight: '2.875rem', letterSpacing: '-0.04em' },
  },
  '.type-h2': {
    fontFamily: displayFont,
    fontSize: '1.375rem',
    lineHeight: '1.75rem',
    fontWeight: '600',
    letterSpacing: '-0.03em',
    color: INK,
    '@media (min-width: 768px)': { fontSize: '1.625rem', lineHeight: '2rem' },
  },
  '.type-h3': {
    fontFamily: displayFont,
    fontSize: '1.0625rem',
    lineHeight: '1.5rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: INK,
  },
  '.type-lead': { fontSize: '1.1875rem', lineHeight: '1.875rem', fontWeight: '400', letterSpacing: '-0.015em' },
  '.type-body': { fontSize: '1rem', lineHeight: '1.625rem', fontWeight: '400', letterSpacing: '-0.01em' },
  '.type-small': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400', letterSpacing: '-0.005em' },
  '.type-caption': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '500' },
  // Small monospaced caps: "THIS WEEK", "STEP 3 OF 5".
  '.type-overline': {
    fontFamily: monoFont,
    fontSize: '0.6875rem',
    lineHeight: '1rem',
    fontWeight: '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  // The one italic serif phrase in a headline: <span className="type-accent">actually take.</span>
  '.type-accent': {
    fontFamily: serifFont,
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: '-0.01em',
    fontSize: '1.08em',
    color: '#2E7650',
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
        // Set in app/(marketing)/layout.tsx: Manrope (sans/display), Instrument Serif (accent), JetBrains Mono (mono).
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        /* ---- Fermat semantic tokens (use these) ---- */
        brand,
        warm,
        // Cool, near-neutral greys on a white canvas. Fermat green is the only accent.
        ink: {
          DEFAULT: '#131316', // headings, primary text
          soft: '#3F3F46', // body copy on light surfaces
          muted: '#6B6B76', // helper text, labels (5.2:1 on white, 4.9:1 on surface-muted)
          faint: '#A1A1AA', // icons, placeholders, disabled only (NOT for text that must be read)
          inverse: '#FFFFFF',
        },
        canvas: '#FAFAF8', // page background: a soft off-white, so white cards lift off it (sections can sit on .bg-grid)
        surface: {
          DEFAULT: '#FFFFFF', // cards, inputs
          muted: '#F3F3F0', // alternate section bands, sunken wells, inactive chips
          strong: '#EDEDF0', // pressed / skeleton / tracks
        },
        // Translucent grey fills: grey buttons, chips and segmented tracks on any surface.
        fill: {
          DEFAULT: 'rgba(19, 19, 22, 0.06)',
          strong: 'rgba(19, 19, 22, 0.1)',
          subtle: 'rgba(19, 19, 22, 0.04)',
        },
        line: {
          DEFAULT: '#DCDCE3', // card borders, input borders
          subtle: '#EFEFF2', // dividers inside cards
          strong: '#CFCFD6', // hover borders
        },
        // Apple's accessible system colours (the dark variants that pass 4.5:1 as text).
        success: tone('#248A3D', '#E8F5EC', '#1A6B2F', '#B9E0C4'),
        warning: tone('#B25000', '#FFF2E5', '#7F3A00', '#F6CFA8'),
        danger: tone('#D70015', '#FFEBEC', '#A1000F', '#FFC2C6'),
        info: tone('#0066CC', '#E8F2FC', '#004C99', '#BCD8F5'),
        private: tone('#5856D6', '#EEEEFC', '#3634A3', '#D5D4F6'), // system indigo
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
      // Cards sit on a white canvas, so each shadow starts with a 1px hairline ring (the card's border),
      // then a soft, low shadow. Things that float (hover, menus, the nav pill) get a wider one.
      boxShadow: {
        card: '0 0 0 1px #DCDCE3, 0 1px 2px rgba(19, 19, 22, 0.04)',
        raised: '0 0 0 1px #DCDCE3, 0 14px 36px -14px rgba(19, 19, 22, 0.16)',
        pop: '0 0 0 1px #DCDCE3, 0 24px 60px -18px rgba(19, 19, 22, 0.24)',
        inset: 'inset 0 0 0 1px #DCDCE3',
      },
      // The curve iOS uses for sheets and springy UI: quick start, long gentle settle.
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
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
        // iMessage typing indicator: each dot lifts and brightens in turn.
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '30%': { transform: 'translateY(-2px)', opacity: '1' },
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
        typing: 'typing 1s ease-in-out infinite',
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
