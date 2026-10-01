import React, { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Box } from '@/lib/chakra';
import './landing.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Rendered as a Chakra Box: the root ChakraProvider emits Emotion <style> tags during SSR,
// and a plain element as its first child fails hydration.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <Box className={`landing ${inter.variable}`}>{children}</Box>;
}
