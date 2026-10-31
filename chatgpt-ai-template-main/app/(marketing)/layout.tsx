import React, { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { Box } from '@/lib/chakra';
import './landing.css';

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Rendered as a Chakra Box: the root ChakraProvider emits Emotion <style> tags during SSR,
// and a plain element as its first child fails hydration.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      className={`landing ${sans.variable} ${mono.variable}`}
      style={
        {
          ['--font-display' as string]: 'var(--font-sans)',
        } as React.CSSProperties
      }
    >
      {children}
    </Box>
  );
}
