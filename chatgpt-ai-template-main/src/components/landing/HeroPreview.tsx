'use client';

import React from 'react';

import { AvatarStack } from '@/components/ui/avatar';
import { Badge, PrivateBadge, StatusPill } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { icons, type IconComponent } from '@/components/ui/icons';
import { formatApproxMoney, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

type OtherOption = { name: string; line: string; status: 'warning' | 'blocked'; icon: IconComponent; label: string };

type Example = {
  key: string;
  city: string;
  occasion: string;
  scope: string;
  friends: string[];
  currency: string;
  budget: number;
  pick: { name: string; line: string; tags: string[]; share: number };
  others: OtherOption[];
  summary: string;
};

/**
 * Two example groups, one per launch story: an Indian group choosing anywhere and an American group going abroad.
 * Amounts are illustrative and always go through formatMoney so each group reads in its own currency.
 */
const examples: Example[] = [
  {
    key: 'delhi',
    city: 'Delhi',
    occasion: 'Diwali long weekend',
    scope: 'Home or abroad',
    friends: ['Aanya', 'Rohan', 'Meera', 'Kabir', 'Isha', 'Dev'],
    currency: 'INR',
    budget: 45000,
    pick: { name: 'Goa', line: 'India · from Delhi · 4 nights', tags: ['Beach', 'Food', 'Nightlife'], share: 32000 },
    others: [
      { name: 'Bali', line: 'Indonesia · 5 nights', status: 'warning', icon: icons.budget, label: '2 budgets short' },
      { name: 'Dubai', line: 'United Arab Emirates · 4 nights', status: 'warning', icon: icons.visa, label: 'Visa timing' },
    ],
    summary: 'Goa works for all six friends and fits your budget; Bali is two budgets short; Dubai has a visa timing issue.',
  },
  {
    key: 'new-york',
    city: 'New York',
    occasion: 'Thanksgiving week',
    scope: 'Abroad',
    friends: ['Alex', 'Sam', 'Jordan', 'Priya', 'Maya', 'Leo'],
    currency: 'USD',
    budget: 1800,
    pick: { name: 'Lisbon', line: 'Portugal · from New York · 5 nights', tags: ['Food', 'Old town', 'Beach'], share: 1240 },
    others: [
      { name: 'Cancún', line: 'Mexico · 4 nights', status: 'warning', icon: icons.budget, label: '1 budget short' },
      { name: 'Tokyo', line: 'Japan · 6 nights', status: 'blocked', icon: icons.duration, label: 'Trip too short' },
    ],
    summary: 'Lisbon works for all six friends and fits your budget; Cancún is one budget short; Tokyo needs a longer trip.',
  },
];

/**
 * A picture of the Choose step, built from the real primitives so the landing page looks like the product.
 * The only control is the example switch; the card itself is hidden from screen readers and summarised in the caption.
 */
export default function HeroPreview({ className }: { className?: string }) {
  const [active, setActive] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const example = examples[active];

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (active + (event.key === 'ArrowRight' ? 1 : examples.length - 1)) % examples.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <figure className={cn('relative m-0 flex flex-col gap-3 lg:pb-14', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="type-caption m-0 text-ink-muted">Example group</p>
        <div role="tablist" aria-label="Example group" className="inline-flex rounded-full bg-surface-strong p-1">
          {examples.map((item, index) => {
            const selected = index === active;
            return (
              <button
                key={item.key}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`hero-tab-${item.key}`}
                aria-selected={selected}
                aria-controls="hero-example"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  'type-small m-0 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3.5 font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  selected ? 'bg-surface text-ink shadow-card' : 'bg-transparent text-ink-muted hover:text-ink',
                )}
              >
                <icons.departure className="size-4" strokeWidth={1.75} aria-hidden />
                Friends in {item.city}
              </button>
            );
          })}
        </div>
      </div>

      <div id="hero-example" role="tabpanel" aria-labelledby={`hero-tab-${example.key}`} className="relative">
        <p className="sr-only">Example of the Choose step for a group of friends in {example.city}: {example.summary}</p>

        {/* Private budget tile: hangs off the bottom corner on larger screens, clear of the card's text. */}
        <Card
          variant="raised"
          aria-hidden
          className="absolute -bottom-14 -left-8 z-10 hidden rotate-[-2deg] items-center gap-3 py-3 pl-3 pr-4 lg:flex xl:-left-14"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-private-soft text-private-ink ring-1 ring-inset ring-private-line">
            <icons.budget className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="type-caption m-0 text-ink-muted">Your budget</p>
            <p className="type-h3 type-num m-0 text-private-ink">{formatMoney(example.budget, example.currency)}</p>
          </div>
          <PrivateBadge size="sm" className="ml-2" />
        </Card>

        <Card variant="raised" aria-hidden className="relative rounded-3xl p-3 sm:p-4">
          {/* Room header */}
          <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1 sm:px-3">
            <div className="min-w-0">
              <p className="type-overline m-0 text-brand-600">
                {example.occasion} · {example.scope}
              </p>
              <p className="type-h3 m-0 mt-0.5 text-[0.9375rem] sm:text-[1.0625rem]">Where should we go?</p>
            </div>
            <AvatarStack names={example.friends} max={3} size="md" />
          </div>

          {/* Featured destination, selected */}
          <div className="rounded-2xl bg-surface shadow-card ring-2 ring-brand-700">
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-h3 m-0">{example.pick.name}</p>
                  <p className="type-small m-0 mt-0.5 flex items-start gap-1.5 text-ink-muted">
                    <icons.destination className="mt-[0.2em] size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
                    {example.pick.line}
                  </p>
                </div>
                <Badge tone="warm" size="sm" icon={icons.check}>
                  Your pick
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {example.pick.tags.map((tag) => (
                  <Badge key={tag} size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <StatusPill status="ok" className="self-start">
                Everyone can go
              </StatusPill>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-private-soft px-3 py-2.5 text-private-ink">
                <span className="type-small flex items-center gap-2 font-semibold">
                  <icons.private className="size-4" strokeWidth={1.75} aria-hidden />
                  Fits your budget
                </span>
                <span className="type-small type-num font-bold">{formatApproxMoney(example.pick.share, example.currency)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-0 border-t border-solid border-line-subtle px-4 py-3 sm:px-5">
              <span className="type-caption text-ink-muted">4 of 6 voted</span>
              <span className="type-small inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 px-3 font-semibold text-brand-800">
                <icons.check className="size-4" strokeWidth={2} aria-hidden />
                Voted
              </span>
            </div>
          </div>

          {/* Other options, compact */}
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {example.others.map((row) => (
              <li key={row.name} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-muted px-4 py-3">
                <div className="min-w-0">
                  <p className="type-body m-0 font-semibold text-ink">{row.name}</p>
                  <p className="type-caption m-0 text-ink-muted">{row.line}</p>
                </div>
                <StatusPill status={row.status} icon={row.icon} size="sm">
                  {row.label}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </figure>
  );
}
