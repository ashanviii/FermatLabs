import type { Metadata, Viewport } from 'next';
import React, { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import '../src/styles/App.css';

const description =
  'A private group trip planner for friends. Compare budgets, dates, departure cities and passports, vote together and build a shared itinerary.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fermatlabs.org'),
  applicationName: 'Fermat',
  title: {
    default: 'Fermat · Group trip planner for friends',
    template: '%s · Fermat',
  },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en',
    url: '/',
    siteName: 'Fermat',
    title: 'Fermat · Group trip planner for friends',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fermat · Group trip planner for friends',
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f5132',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body id="root">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
