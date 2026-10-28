import React, { ReactNode } from 'react';
import { Instrument_Serif, JetBrains_Mono, Manrope } from 'next/font/google';
import { Box } from '@/lib/chakra';
import './landing.css';

// Three families, each with one job:
// - Manrope: everything you read (body and headings), exposed as --font-sans / --font-display.
// - Instrument Serif italic: the one accent phrase in a headline (`type-accent`), e.g. "Taken care of."
// - JetBrains Mono: ASCII art and the small caps labels (`type-overline`), as --font-mono.
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

// Rendered as a Chakra Box: the root ChakraProvider emits Emotion <style> tags during SSR,
// and a plain element as its first child fails hydration.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      className={`landing ${manrope.variable} ${serif.variable} ${mono.variable}`}
      style={{ ['--font-display' as string]: 'var(--font-sans)' } as React.CSSProperties}
    >
      {children}
    </Box>
  );
}
