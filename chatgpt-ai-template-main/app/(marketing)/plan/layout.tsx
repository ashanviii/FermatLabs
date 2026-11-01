import React, { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';

const sans = Geist({ subsets: ['latin'], variable: '--font-plan-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-plan-mono', display: 'swap' });

/** Keep the marketing site in its original editorial type system while the product uses Geist. */
export default function PlanLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${sans.variable} ${mono.variable}`}
      style={
        {
          ['--font-sans' as string]: 'var(--font-plan-sans)',
          ['--font-display' as string]: 'var(--font-plan-sans)',
          ['--font-mono' as string]: 'var(--font-plan-mono)',
        } as React.CSSProperties
      }
    >
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
