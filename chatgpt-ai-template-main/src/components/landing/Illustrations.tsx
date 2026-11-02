'use client';

import React, { useEffect, useRef, useState } from 'react';

import { icons } from '@/components/ui/icons';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Face } from './Face';
import FermatMark from './FermatMark';

/**
 * Small animated scenes for the landing bento cards, drawn from what Fermat actually does. Neutral greys only; the
 * one colour is the success tick, because "works for everyone" is a status. Keyframes live in landing.css (il-*),
 * loops pause while the card is off screen, and Reduce Motion shows each scene at rest.
 */

/* ---------------------------------------------------------------------------------------------------------------- */
/* Frame                                                                                                              */
/* ---------------------------------------------------------------------------------------------------------------- */

export function IllustrationFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      data-il-paused={!visible}
      className={cn(
        'relative flex h-48 items-center justify-center overflow-hidden bg-surface-muted',
        // Faint dot grid, fading out at the edges.
        'before:pointer-events-none before:absolute before:inset-0 before:[background-image:radial-gradient(theme(colors.line.DEFAULT)_1px,transparent_1px)] before:[background-size:14px_14px] before:[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]',
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

const Tick = () => (
  <span className="flex size-4 items-center justify-center rounded-full bg-success text-white">
    <icons.check className="size-2.5" strokeWidth={3.5} />
  </span>
);

/* ---------------------------------------------------------------------------------------------------------------- */
/* How it works                                                                                                      */
/* ---------------------------------------------------------------------------------------------------------------- */

const orbiters = [
  { name: 'Asha', angle: 0 },
  { name: 'Rohan', angle: 90 },
  { name: 'Meera', angle: 180 },
  { name: 'Kabir', angle: 270 },
];

/** Step 1: friends orbit the trip room while someone new joins. */
export function InviteIllustration() {
  return (
    <div className="relative flex size-40 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-dashed border-line-strong" />
      <span className="absolute inset-7 rounded-full border border-solid border-line-subtle" />
      <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-ink text-white shadow-raised">
        <FermatMark className="h-5" />
      </span>
      <div className="il-orbit absolute inset-0">
        {orbiters.map(({ name, angle }) => (
          <div key={name} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg) translateY(-5rem) rotate(${-angle}deg)` }}>
            <div className="il-counter -ml-[1.125rem] -mt-[1.125rem]">
              <Face name={name} className="ring-2 ring-surface" />
            </div>
          </div>
        ))}
      </div>
      <span className="absolute -right-12 top-1 z-20">
        <span className="il-join block whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-[0.6875rem] font-semibold text-ink shadow-raised">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-success align-middle" />
          Kabir joined
        </span>
      </span>
    </div>
  );
}

/** Step 2: the budget shows to you, then blurs away for everyone else. */
export function PrivateDetailsIllustration() {
  const rows = [
    { icon: icons.departure, label: 'From', value: 'Delhi', secret: false },
    { icon: icons.budget, label: 'Budget', value: formatMoney(45000, 'INR'), secret: true },
    { icon: icons.passport, label: 'Passport', value: 'India', secret: true },
  ];
  return (
    <div className="w-60 rounded-2xl bg-surface p-3 shadow-raised">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[0.75rem] font-semibold text-ink">Your details</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[0.625rem] font-semibold text-ink-soft">
          <icons.private className="size-3" strokeWidth={2} />
          Only you
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map(({ icon: Icon, label, value, secret }) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-2.5 py-2">
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-ink-muted">
              <Icon className="size-3.5" strokeWidth={1.75} />
              {label}
            </span>
            {secret ? (
              <span className="relative text-[0.75rem] font-semibold text-ink">
                <span className="il-reveal type-num inline-block">{value}</span>
                <span className="il-hide absolute inset-0 flex items-center justify-end tracking-[0.2em] text-ink-faint opacity-0">••••••</span>
              </span>
            ) : (
              <span className="text-[0.75rem] font-semibold text-ink">
                {value}
                <span className="il-blink ml-px inline-block h-3 w-px translate-y-0.5 bg-ink" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 3: anonymous fit for each place, then the votes fill in. */
export function ChooseIllustration() {
  const places = [
    { name: 'Lisbon', fits: true, width: '80%' },
    { name: 'Tokyo', fits: false, width: '62%', note: '1 budget short' },
    { name: 'Goa', fits: true, width: '38%' },
  ];
  return (
    <div className="flex w-60 flex-col gap-1.5">
      {places.map((place, i) => (
        <div key={place.name} className={cn('rounded-xl bg-surface px-3 py-2 shadow-card', i === 0 && 'shadow-raised')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.75rem] font-semibold text-ink">{place.name}</span>
            {place.fits ? (
              <span className="flex items-center gap-1 text-[0.625rem] font-medium text-ink-soft">
                <Tick /> Everyone
              </span>
            ) : (
              <span className="text-[0.625rem] font-medium text-ink-muted">{place.note}</span>
            )}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-strong">
            <div
              className={cn('il-bar h-full rounded-full', place.fits ? 'bg-ink' : 'bg-line-strong')}
              style={{ width: place.width, animationDelay: `${i * 0.25}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Step 4: the locked plan writes itself, one day at a time. */
export function PlanIllustration() {
  const days = [
    { day: 'Day 1', title: 'Fly in, Alfama walk', cost: formatMoney(9200, 'INR', { compact: true }) },
    { day: 'Day 2', title: 'Sintra day trip', cost: formatMoney(3400, 'INR', { compact: true }) },
    { day: 'Day 3', title: 'Beach at Cascais', cost: formatMoney(1800, 'INR', { compact: true }) },
  ];
  return (
    <div className="w-60 rounded-2xl bg-surface p-3 shadow-raised">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[0.75rem] font-semibold text-ink">Lisbon · 5 days</span>
        <span className="text-[0.625rem] font-medium text-ink-muted">Your share</span>
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {days.map((d, i) => (
          <li key={d.day} className="il-step relative flex items-center gap-2.5 py-1.5" style={{ animationDelay: `${i * 0.45}s` }}>
            <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.5625rem] font-bold text-white">{i + 1}</span>
            {i < days.length - 1 && <span className="absolute left-2.5 top-1/2 h-full w-px bg-line" />}
            <span className="min-w-0 flex-1">
              <span className="block text-[0.625rem] font-medium uppercase tracking-[0.06em] text-ink-muted">{d.day}</span>
              <span className="block truncate text-[0.75rem] font-semibold text-ink">{d.title}</span>
            </span>
            <span className="type-num text-[0.6875rem] font-semibold text-ink-soft">{d.cost}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* Feature bento                                                                                                      */
/* ---------------------------------------------------------------------------------------------------------------- */

/** Private pledges: seats fill in, the group only sees the count. */
export function PledgeIllustration() {
  const seats = ['Aanya', 'Rohan', 'Meera', 'Kabir', 'Sam', 'Alex'];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {seats.map((s, i) => (
          i < 4 ? (
            <span key={s} className="il-join" style={{ animationDelay: `${i * 0.3}s`, animationDuration: '6s' }}>
              <Face name={s} className="ring-2 ring-surface" />
            </span>
          ) : (
            <span key={s} className="flex size-9 items-center justify-center rounded-full border border-dashed border-line-strong text-[0.75rem] font-semibold text-ink-faint">
              ?
            </span>
          )
        ))}
      </div>
      <span className="rounded-full bg-surface px-3 py-1 text-[0.75rem] font-semibold text-ink shadow-card">
        4 of 6 are in <span className="font-normal text-ink-muted">· needs 5</span>
      </span>
    </div>
  );
}

/** Long-weekend finder: the holiday pulls the weekend into a short trip. */
export function CalendarIllustration() {
  // A week strip: Thu .. Wed. Fri is the holiday, Thu is the one day off you take.
  const days = [
    { d: 'Thu', n: 24, kind: 'leave' },
    { d: 'Fri', n: 25, kind: 'holiday' },
    { d: 'Sat', n: 26, kind: 'weekend' },
    { d: 'Sun', n: 27, kind: 'weekend' },
    { d: 'Mon', n: 28, kind: 'work' },
  ] as const;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5 rounded-2xl bg-surface p-2 shadow-raised">
        {days.map((day) => (
          <span
            key={day.n}
            className={cn(
              'flex w-10 flex-col items-center rounded-xl py-1.5',
              day.kind === 'work' ? 'text-ink-faint' : 'bg-surface-muted text-ink',
              day.kind === 'holiday' && 'il-pulse bg-ink text-white',
            )}
          >
            <span className="text-[0.5625rem] font-medium uppercase tracking-[0.06em] opacity-70">{day.d}</span>
            <span className="type-num text-[0.875rem] font-semibold">{day.n}</span>
          </span>
        ))}
      </div>
      <span className="rounded-full bg-surface px-3 py-1 text-[0.75rem] font-semibold text-ink shadow-card">
        4 days away <span className="font-normal text-ink-muted">· 1 day off</span>
      </span>
    </div>
  );
}

/** Settle-up: the fewest payments, each one ticking off. */
export function SettleIllustration() {
  const payments = [
    { from: 'Rohan', to: 'Asha', amount: 1200 },
    { from: 'Meera', to: 'Asha', amount: 850 },
    { from: 'Kabir', to: 'Rohan', amount: 400 },
  ];
  return (
    <div className="flex w-60 flex-col gap-1.5">
      {payments.map((p, i) => (
        <div key={p.from} className="flex items-center gap-2 rounded-xl bg-surface px-2.5 py-2 shadow-card">
          <Face name={p.from} className="size-6 text-[0.625rem] shadow-none" />
          <span className="min-w-0 flex-1 truncate text-[0.6875rem] text-ink-soft">
            <span className="font-semibold text-ink">{p.from}</span> → {p.to}
          </span>
          <span className="type-num text-[0.6875rem] font-semibold text-ink">{formatMoney(p.amount, 'INR')}</span>
          <span className="il-join" style={{ animationDelay: `${0.4 + i * 0.5}s`, animationDuration: '5.4s' }}>
            <Tick />
          </span>
        </div>
      ))}
    </div>
  );
}
