import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import FermatMark from './FermatMark';

export type HeaderLink = { label: string; href: string };

const defaultLinks: HeaderLink[] = [
  { label: 'How it works', href: '/#how' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

/** Full-width frosted nav bar: logo, a few links (md+), one primary action. Used by the landing and legal pages. */
export default function SiteHeader({
  links = defaultLinks,
}: {
  links?: HeaderLink[];
}) {
  return (
    <header className="material-bar sticky top-0 z-30 border-0 border-b border-solid border-line-subtle">
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg text-ink no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35"
        >
          <FermatMark className="h-6 text-brand-600" />
          <span className="type-h3 text-brand-900">Fermat</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-[0.875rem] font-medium tracking-[-0.01em] text-ink-soft no-underline transition-colors hover:bg-fill-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/plan">Start a trip</Link>
        </Button>
      </div>
    </header>
  );
}
