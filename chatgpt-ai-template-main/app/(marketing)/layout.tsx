import React, { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Box } from '@/lib/chakra';
import './landing.css';

// One family for the whole product (landing + /plan): warm, round, confident at display sizes and readable at 13px.
// Exposed as --font-sans (body) and --font-display (headings) so the two can diverge later without touching screens.
// Variable font (200-800), so in-between weights like 650 render exactly.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Rendered as a Chakra Box: the root ChakraProvider emits Emotion <style> tags during SSR,
// and a plain element as its first child fails hydration.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      className={`landing ${jakarta.variable}`}
      style={{ ['--font-display' as string]: 'var(--font-sans)' } as React.CSSProperties}
    >
      {children}
    </Box>
  );
}
