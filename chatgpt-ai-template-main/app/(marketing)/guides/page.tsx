import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, LockKeyhole, UsersRound } from 'lucide-react';

import SiteHeader from '@/components/landing/SiteHeader';
import { Button } from '@/components/ui/button';
import { guides } from '@/lib/guides';

const description =
  'Practical guides for planning group trips across different dates, budgets, departure cities and preferences.';

export const metadata: Metadata = {
  title: 'Group trip planning guides',
  description,
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Group trip planning guides · Fermat',
    description,
    url: '/guides',
  },
};

const principles = [
  {
    icon: LockKeyhole,
    title: 'Private by default',
    copy: 'Personal budgets and constraints do not need to become group-chat content.',
  },
  {
    icon: UsersRound,
    title: 'Fair to the whole group',
    copy: 'Filter for feasibility before asking people to vote on destinations.',
  },
  {
    icon: BookOpen,
    title: 'Useful before booking',
    copy: 'Turn a vague “we should travel” into a decision, commitments and owned tasks.',
  },
];

export default function GuidesPage() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Fermat group trip planning guides',
    description,
    url: 'https://www.fermatlabs.org/guides',
    hasPart: guides.map((guide) => ({
      '@type': 'Article',
      headline: guide.title,
      url: `https://www.fermatlabs.org/guides/${guide.slug}`,
    })),
  };

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-0 border-b border-solid border-line-subtle bg-canvas">
          <div
            className="bg-grid pointer-events-none absolute inset-0 -z-10"
            aria-hidden
          />
          <div className="mx-auto grid w-full max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <p className="type-overline m-0 text-brand-700">
                Fermat field guide
              </p>
              <h1 className="type-display mb-0 mt-4">
                Group trips are easier when the decisions are{' '}
                <span className="type-accent">structured.</span>
              </h1>
              <p className="type-lead mb-0 mt-6 max-w-2xl text-ink-soft">
                Clear, practical playbooks for coordinating dates, private
                budgets, destinations, votes and the work that comes after
                “we’re in.”
              </p>
            </div>
            <aside
              className="rounded-3xl bg-surface p-6 shadow-raised sm:p-7"
              aria-label="Start planning"
            >
              <p className="type-overline m-0 text-brand-700">
                Skip the spreadsheet
              </p>
              <h2 className="type-h2 mb-0 mt-3">
                Use the workflow, not just the advice.
              </h2>
              <p className="type-body mb-0 mt-3 text-ink-soft">
                Start a private room, invite one friend and find the trips your
                group can actually take.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 w-full rounded-full sm:w-auto"
              >
                <Link href="/plan" prefetch={false}>
                  Start a trip <ArrowRight aria-hidden />
                </Link>
              </Button>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-page px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="rounded-2xl bg-surface p-5 shadow-card"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" strokeWidth={2} aria-hidden />
                </span>
                <h2 className="type-h3 mb-0 mt-4">{title}</h2>
                <p className="type-small mb-0 mt-2 text-ink-soft">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-page px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="type-overline m-0 text-brand-700">
              Browse all guides
            </p>
            <h2 className="type-h1 mb-0 mt-3">
              Start with the decision blocking your group.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {guides.map((guide, index) => (
              <article
                key={guide.slug}
                className="group flex min-h-64 flex-col rounded-3xl bg-surface p-6 shadow-card transition-shadow hover:shadow-raised sm:p-7"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="type-overline text-brand-700">
                    {guide.eyebrow}
                  </span>
                  <span className="type-caption text-ink-muted">
                    {guide.readingTime}
                  </span>
                </div>
                <h3 className="type-h2 mb-0 mt-5">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-ink no-underline outline-none after:absolute focus-visible:underline"
                  >
                    {guide.title}
                  </Link>
                </h3>
                <p className="type-body mb-0 mt-3 flex-1 text-ink-soft">
                  {guide.description}
                </p>
                <div className="mt-7 inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-brand-700">
                  Read guide
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </div>
                <span className="sr-only">
                  Guide {index + 1} of {guides.length}
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
    </>
  );
}
