import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SiteFooter } from './ClosingCta';
import SiteHeader from './SiteHeader';
import { icons } from '@/components/ui/icons';
import { LEGAL } from '@/lib/legal';

/** One titled block of a legal page. Body text is plain paragraphs; <b> lead-ins are emphasised. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-0 border-t border-solid border-line-subtle pt-8 first:border-t-0 first:pt-0">
      <h2 className="type-h2 m-0">{title}</h2>
      <div className="type-body mt-3 flex flex-col gap-3 text-ink-soft [&_b]:font-semibold [&_b]:text-ink [&_p]:m-0">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Link
          href="/"
          className="type-small inline-flex items-center gap-1.5 rounded font-semibold text-brand-700 no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
          Back to Fermat
        </Link>
        <article className="mt-6">
          <header>
            <h1 className="type-h1 m-0">{title}</h1>
            <p className="type-small m-0 mt-2 flex items-center gap-1.5 text-ink-muted">
              <icons.calendar className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
              Last updated {LEGAL.lastUpdated}
            </p>
            <p className="type-lead m-0 mt-6 max-w-prose text-ink-soft">{intro}</p>
          </header>
          <div className="mt-8 flex flex-col gap-8 rounded-3xl bg-surface p-5 shadow-card sm:p-10">{children}</div>
          <p className="type-small m-0 mt-6 flex items-center gap-2 text-ink-muted">
            <icons.info className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            <span>
              Questions? Email{' '}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                {LEGAL.contactEmail}
              </a>
              .
            </span>
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
