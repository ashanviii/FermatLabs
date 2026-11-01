import type { Metadata, Viewport } from 'next';
import React, { ReactNode } from 'react';
import '../src/styles/App.css';

const description =
  'Plan a group trip everyone can actually take. Compare private budgets, departure cities and passport constraints, vote together and build the itinerary.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fermatlabs.org'),
  applicationName: 'Fermat',
  title: {
    default: 'Fermat · Group trips, sorted',
    template: '%s · Fermat',
  },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en',
    url: '/',
    siteName: 'Fermat',
    title: 'Fermat · Group trips, sorted',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fermat · Group trips, sorted',
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
      </body>
    </html>
  );
}
