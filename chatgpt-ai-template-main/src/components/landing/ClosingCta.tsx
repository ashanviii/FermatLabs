import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AsciiArt, asciiArt } from '@/components/ui/ascii';
import { Button } from '@/components/ui/button';
import { icons } from '@/components/ui/icons';
import { sources } from '@/lib/geo';
import FermatMark from './FermatMark';

/** Closing call to action: the one brand-green panel on the page. */
export default function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-white shadow-raised sm:px-12 sm:py-16">
        {/* Decorative: a faint grid and the packed suitcase, no meaning. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <AsciiArt art={asciiArt.suitcase} className="pointer-events-none absolute -right-2 top-8 hidden text-[0.9375rem] text-brand-300/70 lg:block" />

        <div className="relative flex flex-col items-start gap-8">
          <div className="max-w-prose">
            <p className="type-overline m-0 text-brand-200">Free for every group</p>
            <h2 id="cta-title" className="type-h1 m-0 mt-3 text-white">
              Get the whole group <span className="type-accent text-warm-300">on the same trip.</span>
            </h2>
            <p className="type-lead m-0 mt-4 text-brand-100">
              Start a room, share the link and see which trips work for everyone in a few minutes.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-white text-brand-900 hover:bg-brand-50 focus-visible:ring-offset-brand-900">
              <Link href="/plan" prefetch={false}>
                Start a group trip
                <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-full text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 hover:text-white focus-visible:ring-offset-brand-900"
            >
              <Link href="/plan?preview=locked" prefetch={false}>See an example plan</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerLinks = [
  { label: 'Planner', href: '/plan' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

/** Site footer: links, the single estimates disclaimer, copyright. Shared by the landing and legal pages. */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-page px-4 pb-10 pt-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 border-0 border-t border-solid border-line pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-ink no-underline">
            <FermatMark className="h-6 text-brand-900" />
            <span className="type-h3">Fermat</span>
          </Link>
          <p className="type-small m-0 flex gap-2 text-ink-muted">
            <icons.info className="mt-0.5 size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            <span>
              <strong className="font-semibold text-ink-soft">Estimates.</strong> Prices, routes and entry rules change.
              Fermat doesn&apos;t book anything, so check before you pay.
            </span>
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={link.href.startsWith('/plan') ? false : undefined}
              className="type-small rounded font-semibold text-ink-soft no-underline underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="type-caption m-0 text-ink-muted">© {new Date().getFullYear()} Fermat Labs</p>
        {/* Data credits: the holiday data is CC BY 3.0, so its attribution must be shown. */}
        <p className="type-caption m-0 max-w-prose text-ink-muted sm:text-right">
          {sources.holidays.attribution}. {sources.fx.attribution}.
        </p>
      </div>
      {/* Signature: the wordmark in ASCII, scaled to the column width. */}
      <AsciiArt art={asciiArt.wordmark} className="mt-10 text-[3.6vw] leading-[1.05] text-brand-700 lg:text-[2.6rem]" />
    </footer>
  );
}
