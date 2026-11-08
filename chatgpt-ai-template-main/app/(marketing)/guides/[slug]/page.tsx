import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

import SiteHeader from '@/components/landing/SiteHeader';
import { Button } from '@/components/ui/button';
import { getGuide, guides } from '@/lib/guides';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: 'article',
      title: `${guide.title} · Fermat`,
      description: guide.description,
      url: `/guides/${guide.slug}`,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.title} · Fermat`,
      description: guide.description,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const relatedGuides = guides
    .filter((candidate) => candidate.slug !== guide.slug)
    .slice(0, 3);
  const canonicalUrl = `https://www.fermatlabs.org/guides/${guide.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Organization',
      name: 'Fermat',
      url: 'https://www.fermatlabs.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fermat',
      url: 'https://www.fermatlabs.org',
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.fermatlabs.org/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://www.fermatlabs.org/guides',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main>
        <article>
          <header className="relative isolate overflow-hidden border-0 border-b border-solid border-line-subtle">
            <div
              className="bg-grid pointer-events-none absolute inset-0 -z-10"
              aria-hidden
            />
            <div className="mx-auto w-full max-w-content px-4 py-14 sm:px-6 sm:py-20">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-md text-[0.875rem] font-semibold text-brand-700 no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35"
              >
                <ArrowLeft className="size-4" aria-hidden /> All guides
              </Link>
              <p className="type-overline mb-0 mt-10 text-brand-700">
                {guide.eyebrow}
              </p>
              <h1 className="type-h1 mb-0 mt-4">{guide.title}</h1>
              <p className="type-lead mb-0 mt-5 text-ink-soft">
                {guide.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] font-medium text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4" aria-hidden />
                  {guide.readingTime}
                </span>
                <span>
                  Updated{' '}
                  {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString(
                    'en',
                    {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    },
                  )}
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-page gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:px-8">
            <div className="min-w-0 max-w-content">
              <section
                className="rounded-3xl bg-brand-50 p-6 shadow-inset sm:p-7"
                aria-labelledby="takeaways-heading"
              >
                <div className="flex items-center gap-2 text-brand-700">
                  <ShieldCheck className="size-5" aria-hidden />
                  <h2
                    id="takeaways-heading"
                    className="type-h3 m-0 text-brand-900"
                  >
                    What matters most
                  </h2>
                </div>
                <ul className="mb-0 mt-5 grid list-none gap-3 p-0">
                  {guide.takeaways.map((takeaway) => (
                    <li
                      key={takeaway}
                      className="type-body flex gap-3 text-ink-soft"
                    >
                      <Check
                        className="mt-1 size-4 shrink-0 text-brand-700"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-12 space-y-12">
                {guide.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="type-h2 m-0">{section.heading}</h2>
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="type-body m-0 text-ink-soft"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className="mb-0 mt-5 space-y-3 pl-5 text-ink-soft marker:text-brand-600">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="type-body pl-1">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              <section
                className="mt-14 border-0 border-t border-solid border-line-subtle pt-12"
                aria-labelledby="faq-heading"
              >
                <p className="type-overline m-0 text-brand-700">
                  Common questions
                </p>
                <h2 id="faq-heading" className="type-h1 mb-0 mt-3">
                  Frequently asked questions
                </h2>
                <div className="mt-8 divide-y divide-line-subtle">
                  {guide.faqs.map((faq) => (
                    <div key={faq.question} className="py-6 first:pt-0">
                      <h3 className="type-h3 m-0">{faq.question}</h3>
                      <p className="type-body mb-0 mt-3 text-ink-soft">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl bg-surface p-6 shadow-raised">
                <p className="type-overline m-0 text-brand-700">
                  Try it with your group
                </p>
                <h2 className="type-h2 mb-0 mt-3">
                  From eight opinions to one feasible trip.
                </h2>
                <p className="type-small mb-0 mt-3 text-ink-soft">
                  Dates, budgets and preferences stay private. The group sees
                  choices that work together.
                </p>
                <Button asChild className="mt-6 w-full rounded-full">
                  <Link href="/plan" prefetch={false}>
                    Start a trip <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <p className="type-caption mb-0 mt-3 text-center text-ink-muted">
                  Free to start · No card required
                </p>
              </div>
            </aside>
          </div>
        </article>

        <section className="border-0 border-t border-solid border-line-subtle bg-surface-muted">
          <div className="mx-auto w-full max-w-page px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="type-h2 m-0">Continue planning</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={`/guides/${related.slug}`}
                  className="group rounded-2xl bg-surface p-5 text-ink no-underline shadow-card transition-shadow hover:shadow-raised focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35"
                >
                  <span className="type-overline text-brand-700">
                    {related.eyebrow}
                  </span>
                  <span className="type-h3 mt-3 block">{related.title}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-semibold text-brand-700">
                    Read next{' '}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      {[articleSchema, faqSchema, breadcrumbSchema].map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
