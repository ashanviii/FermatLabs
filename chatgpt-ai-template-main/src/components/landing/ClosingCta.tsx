import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { icons } from '@/components/ui/icons';
import { sources } from '@/lib/geo';
import DitherField from './DitherField';
import FermatMark from './FermatMark';

/** Closing call to action: a white panel with a soft blue dither drifting behind the copy. */
export default function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
      <div data-cta className="relative overflow-hidden rounded-3xl bg-surface px-6 py-12 text-ink shadow-raised ring-1 ring-line sm:px-12 sm:py-16">
        {/* Decorative: two dithered glows drifting behind the copy. No meaning. */}
        <DitherField
          pattern="orbs"
          rgb={[63, 94, 173]}
          alpha={0.16}
          cell={4}
          speed={0.7}
          className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_5%,black_55%)]"
        />

        <div className="relative flex flex-col items-start gap-8">
          <div className="max-w-prose">
            <p className="type-overline m-0 text-brand-700">Free for every group</p>
            <h2 id="cta-title" className="type-h1 m-0 mt-3">
              Get the whole group <span className="type-accent">on the same trip.</span>
            </h2>
            <p className="type-lead m-0 mt-4 text-ink-soft">
              Start a room, share the link and see which trips work for everyone in a few minutes.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/plan" prefetch={false}>
                Start a group trip
                <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-surface">
              <Link href="/plan?preview=locked" prefetch={false}>See an example plan</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how' },
      { label: 'Features', href: '/#features' },
      { label: 'Fair results', href: '/#results' },
      { label: 'Planner', href: '/plan' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Example plan', href: '/plan?preview=locked' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Any home country', href: '/#anywhere' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const footerLink =
  'type-small rounded text-ink-muted no-underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

/**
 * Site footer: the page dithers down into a pale blue section (a wavy 1-bit edge that fills to a solid tint), with the
 * brand, link columns and credits in ink, and a huge faint wordmark cut off by the bottom edge.
 * Shared by the landing and legal pages.
 */
export function SiteFooter() {
  return (
    <footer className="relative isolate mt-8 w-full overflow-hidden pt-64 text-ink">
      {/* Decorative: a band where the page dithers into a pale denim tint, then the same tint, solid, under the content.
          The solid layer uses the dither's colour and alpha, so the two meet without a seam. */}
      <DitherField pattern="fade" rgb={[63, 94, 173]} alpha={0.09} cell={3} speed={0.6} className="absolute inset-x-0 top-0 -z-10 !h-56" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 top-56 -z-10 bg-[rgba(63,94,173,0.09)]" />

      <div className="mx-auto box-border w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-sm flex-col gap-5">
            <Link href="/" className="inline-flex items-center gap-2 self-start rounded text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
              <FermatMark className="h-6 text-brand-600" />
              <span className="type-h3">Fermat</span>
            </Link>
            <p className="type-small m-0 text-ink-soft">
              Group trip planning where budgets stay private. Everyone adds their details, Fermat shows the trips that
              work for all of you.
            </p>
            <p className="type-caption m-0 flex gap-2 text-ink-muted">
              <icons.info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>
                <strong className="font-semibold text-ink">Estimates.</strong> Prices, routes and entry rules change.
                Fermat doesn&apos;t book anything, so check before you pay.
              </span>
            </p>
            <p className="type-small m-0 mt-2 text-ink-soft">© {new Date().getFullYear()} Fermat Labs. All rights reserved.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-16">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="type-small m-0 font-semibold text-ink">{column.title}</p>
                <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} prefetch={link.href.startsWith('/plan') ? false : undefined} className={footerLink}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Data credits: the holiday data is CC BY 3.0, so its attribution must be shown. */}
        <p className="type-caption m-0 mt-12 max-w-prose text-ink-muted">
          {sources.holidays.attribution}. {sources.fx.attribution}.
        </p>

        {/* Signature: the wordmark, huge and faint, cut off by the bottom edge. */}
        <p
          aria-hidden
          className="pointer-events-none m-0 mt-6 h-[0.62em] select-none overflow-hidden whitespace-nowrap text-center text-[26vw] font-semibold leading-[0.9] tracking-[-0.06em] text-brand-600/[0.08] lg:text-[17rem]"
        >
          Fermat
        </p>
      </div>
    </footer>
  );
}
