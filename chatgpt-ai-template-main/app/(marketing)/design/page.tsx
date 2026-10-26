'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

import FermatMark from '@/components/landing/FermatMark';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Badge, PrivateBadge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox, ChipGroup, Field, Input, RadioCards, Select, ToggleChip } from '@/components/ui/field';
import { icons, type IconName } from '@/components/ui/icons';
import { MonthYearSelect } from '@/components/ui/month-year-select';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { PageContainer, Section } from '@/components/ui/section';
import { StatTile } from '@/components/ui/stat-tile';
import { PLAN_STEPS, Stepper } from '@/components/ui/stepper';
import { formatDateRange, formatINR, formatINRCompact, formatMonthYear, plural } from '@/lib/format';
import { cn } from '@/lib/utils';

/* Showcase of every token and primitive. Screens copy from here. Not linked from the product. */

const swatchGroups: { title: string; note: string; swatches: { name: string; className: string; hex: string; dark?: boolean }[] }[] = [
  {
    title: 'Brand',
    note: 'Deep green for primary actions and headings on dark. 500 is the leaf green.',
    swatches: [
      { name: 'brand-50', className: 'bg-brand-50', hex: '#EEF6F1' },
      { name: 'brand-100', className: 'bg-brand-100', hex: '#D7EBDF' },
      { name: 'brand-300', className: 'bg-brand-300', hex: '#82BC9A' },
      { name: 'brand-500', className: 'bg-brand-500', hex: '#3D9163', dark: true },
      { name: 'brand-700', className: 'bg-brand-700', hex: '#235C3F', dark: true },
      { name: 'brand-900', className: 'bg-brand-900', hex: '#153524', dark: true },
    ],
  },
  {
    title: 'Neutrals',
    note: 'Warm greys. Page sits on canvas, content on surface.',
    swatches: [
      { name: 'canvas', className: 'bg-canvas ring-1 ring-inset ring-line', hex: '#F7F6F2' },
      { name: 'surface', className: 'bg-surface ring-1 ring-inset ring-line', hex: '#FFFFFF' },
      { name: 'surface-muted', className: 'bg-surface-muted', hex: '#F2F1EC' },
      { name: 'line', className: 'bg-line', hex: '#E4E2DA' },
      { name: 'ink-muted', className: 'bg-ink-muted', hex: '#5E6862', dark: true },
      { name: 'ink', className: 'bg-ink', hex: '#16201B', dark: true },
    ],
  },
  {
    title: 'Accent and meaning',
    note: 'Warm is the one accent: use it rarely. Each status has DEFAULT, soft, ink and line.',
    swatches: [
      { name: 'warm', className: 'bg-warm', hex: '#F4B740' },
      { name: 'private', className: 'bg-private', hex: '#5B4BC4', dark: true },
      { name: 'success', className: 'bg-success', hex: '#2E7D4F', dark: true },
      { name: 'warning', className: 'bg-warning', hex: '#B26A00', dark: true },
      { name: 'danger', className: 'bg-danger', hex: '#C0392B', dark: true },
      { name: 'info', className: 'bg-info', hex: '#2F6FB3', dark: true },
    ],
  },
];

const typeRows = [
  { cls: 'type-display', name: 'type-display', spec: '34 / 48px · 800', sample: 'Plan a trip everyone can take' },
  { cls: 'type-h1', name: 'type-h1', spec: '26 / 32px · 700', sample: 'Goa long weekend' },
  { cls: 'type-h2', name: 'type-h2', spec: '20 / 22px · 700', sample: 'Choose where to go' },
  { cls: 'type-h3', name: 'type-h3', spec: '17px · 650', sample: 'Day 2 · North Goa beaches' },
  { cls: 'type-lead text-ink-soft', name: 'type-lead', spec: '17px · 400', sample: 'Everyone adds their budget privately. The group only sees what fits.' },
  { cls: 'type-body text-ink-soft', name: 'type-body', spec: '15px · 400', sample: 'Flights from Delhi land at 11:40. Check in, then lunch by the river.' },
  { cls: 'type-small text-ink-muted', name: 'type-small', spec: '13px · 400', sample: 'Prices are estimates. Check before you book.' },
  { cls: 'type-caption text-ink-muted', name: 'type-caption', spec: '12px · 500', sample: 'Updated 2 min ago' },
  { cls: 'type-overline text-brand-600', name: 'type-overline', spec: '11px · 700 · caps', sample: 'Step 3 of 5' },
];

const iconLabels: Record<IconName, string> = {
  private: 'Private',
  budget: 'Budget',
  passport: 'Passport',
  visa: 'Visa',
  departure: 'Departure',
  arrival: 'Arrival',
  invite: 'Invite',
  members: 'Members',
  organizer: 'Organizer',
  vote: 'Vote',
  plan: 'Plan',
  destination: 'Destination',
  route: 'Route',
  calendar: 'Calendar',
  duration: 'Duration',
  pending: 'Waiting',
  flight: 'Flight',
  roadTransfer: 'Road transfer',
  stay: 'Stay',
  activity: 'Activity',
  meal: 'Meal',
  freeTime: 'Free time',
  money: 'Money',
  pledge: 'Pledge',
  share: 'Share',
  whatsapp: 'WhatsApp',
  copy: 'Copy',
  link: 'Link',
  tasks: 'Tasks',
  nudge: 'Nudge',
  success: 'Success',
  warning: 'Warning',
  danger: 'Blocked',
  info: 'Info',
  check: 'Check',
};

const toc = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['buttons', 'Buttons'],
  ['status', 'Badges & status'],
  ['cards', 'Cards'],
  ['forms', 'Forms'],
  ['feedback', 'Notices'],
  ['data', 'Stats & progress'],
  ['people', 'People'],
  ['stepper', 'Stepper'],
  ['icons', 'Icons'],
  ['patterns', 'Patterns'],
] as const;

function Demo({ label, className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl bg-surface p-5 shadow-card sm:p-6', className)}>
      {label && <p className="type-overline m-0 mb-4 text-ink-muted">{label}</p>}
      {children}
    </div>
  );
}

function DestinationCardExample({ selected, onVote }: { selected: boolean; onVote: () => void }) {
  return (
    <Card variant={selected ? 'raised' : 'default'} className={cn('overflow-hidden', selected && 'ring-2 ring-brand-700')}>
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0">
          <h3 className="type-h3 m-0">Goa</h3>
          <p className="type-small m-0 mt-0.5 flex items-center gap-1.5 text-ink-muted">
            <icons.route className="size-3.5" strokeWidth={2} aria-hidden /> India · Delhi → Goa · 4 nights
          </p>
        </div>
        {selected && (
          <Badge tone="warm" icon={icons.check}>
            Your pick
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 px-5">
        <Badge size="sm">Beach</Badge>
        <Badge size="sm">Nightlife</Badge>
        <Badge size="sm">No visa</Badge>
      </div>
      <div className="mt-4 grid gap-2 px-5">
        <StatusPill status="warning" icon={icons.budget} size="lg" className="justify-self-start">
          2 budgets short
        </StatusPill>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-private-soft px-3 py-2.5">
          <span className="type-small flex items-center gap-1.5 font-semibold text-private-ink">
            <icons.private className="size-3.5" strokeWidth={2} aria-hidden /> Fits your budget
          </span>
          <span className="type-small type-num font-bold text-private-ink">~{formatINR(38500)}</span>
        </div>
      </div>
      <CardFooter className="mt-4">
        <span className="type-caption text-ink-muted">3 of 6 voted</span>
        <Button size="sm" variant={selected ? 'secondary' : 'primary'} icon={selected ? icons.check : icons.vote} onClick={onVote}>
          {selected ? 'Voted' : 'Vote'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function DesignSystemPage() {
  const [city, setCity] = useState('Delhi');
  const [budget, setBudget] = useState('45000');
  const [expiry, setExpiry] = useState('2031-');
  const [length, setLength] = useState<'weekend' | 'week'>('weekend');
  const [prefs, setPrefs] = useState<string[]>(['beach']);
  const [adult, setAdult] = useState(true);
  const [dates, setDates] = useState(false);
  const [step, setStep] = useState(2);
  const [voted, setVoted] = useState(true);
  const [loading, setLoading] = useState(false);

  // ?only=forms,cards renders just those sections (handy for screenshots of long pages).
  const [only, setOnly] = useState<string[] | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('only');
    setOnly(value ? value.split(',') : null);
  }, []);
  const vis = (id: string) => (only && !only.includes(id) ? 'hidden' : undefined);

  const togglePref = (value: string) => setPrefs((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans text-ink">
      <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
        <PageContainer className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FermatMark className="h-6 text-brand-900" />
            <span className="type-h3">Fermat</span>
            <Badge tone="outline" size="sm">
              Design system
            </Badge>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href="/plan?preview=collecting">Open /plan preview</a>
          </Button>
        </PageContainer>
      </header>

      <PageContainer className="pt-8 sm:pt-12">
        <div className={cn('max-w-content', only && 'hidden')}>
          <p className="type-overline m-0 text-brand-600">Fermat UI · v1</p>
          <h1 className="type-display m-0 mt-2">Clear, warm, and private by default.</h1>
          <p className="type-lead m-0 mt-4 max-w-prose text-ink-soft">
            Tokens and building blocks for every Fermat screen. One primary action per step, real icons, short words, and a single look for anything only you can see.
          </p>
        </div>

        <nav aria-label="Sections" className={only ? 'hidden' : '-mx-4 mt-8 overflow-x-auto px-4 lg:mx-0 lg:px-0'}>
          <ul className="m-0 flex list-none gap-2 p-0">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="type-small inline-flex h-9 items-center whitespace-nowrap rounded-full bg-surface px-3.5 font-semibold text-ink-soft no-underline shadow-card hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 flex flex-col gap-16 sm:gap-20">
          {/* ------------------------------------------------------------------ Colour */}
          <Section className={vis('colour')} id="colour" eyebrow="Tokens" title="Colour" description="Use the names, never hex. bg-brand-900, text-ink-muted, bg-private-soft.">
            <div className="grid gap-4 lg:grid-cols-3">
              {swatchGroups.map((group) => (
                <Demo key={group.title}>
                  <h3 className="type-h3 m-0">{group.title}</h3>
                  <p className="type-small m-0 mt-1 text-ink-muted">{group.note}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {group.swatches.map((s) => (
                      <div key={s.name} className="min-w-0">
                        <div className={cn('h-14 rounded-xl', s.className)} />
                        <p className="type-caption m-0 mt-1.5 truncate font-semibold text-ink">{s.name}</p>
                        <p className="type-caption m-0 font-normal text-ink-muted">{s.hex}</p>
                      </div>
                    ))}
                  </div>
                </Demo>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Demo label="Radius">
                <div className="flex items-end gap-3">
                  {[
                    ['rounded-xl', 'Inputs'],
                    ['rounded-2xl', 'Cards'],
                    ['rounded-3xl', 'Hero'],
                    ['rounded-full', 'Pills'],
                  ].map(([r, l]) => (
                    <div key={r} className="flex flex-col items-center gap-1.5">
                      <div className={cn('h-14 w-16 bg-brand-100', r)} />
                      <span className="type-caption text-ink-muted">{l}</span>
                    </div>
                  ))}
                </div>
              </Demo>
              <Demo label="Shadow" className="sm:col-span-2">
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-canvas p-4">
                  {['shadow-card', 'shadow-raised', 'shadow-pop'].map((s) => (
                    <div key={s} className={cn('flex h-16 items-center justify-center rounded-2xl bg-surface', s)}>
                      <span className="type-caption text-ink-muted">{s}</span>
                    </div>
                  ))}
                </div>
              </Demo>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ Type */}
          <Section className={vis('type')} id="type" eyebrow="Tokens" title="Type" description="Plus Jakarta Sans for everything. Sizes are classes: type-h1, type-body, type-small.">
            <Demo className="divide-y divide-line-subtle p-0 sm:p-0">
              {typeRows.map((row) => (
                <div key={row.name} className="grid gap-1 border-0 border-solid border-line-subtle px-5 py-4 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-6 sm:px-6 [&:not(:first-child)]:border-t">
                  <div>
                    <p className="type-small m-0 font-semibold text-ink">{row.name}</p>
                    <p className="type-caption m-0 font-normal text-ink-muted">{row.spec}</p>
                  </div>
                  <p className={cn('m-0 min-w-0', row.cls)}>{row.sample}</p>
                </div>
              ))}
            </Demo>
          </Section>

          {/* ------------------------------------------------------------------ Buttons */}
          <Section className={vis('buttons')} id="buttons" eyebrow="Primitives" title="Buttons" description="One primary per step. Icons go before the label; arrows after.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Demo label="Variants">
                <div className="flex flex-wrap gap-3">
                  <Button icon={icons.vote}>Open voting</Button>
                  <Button variant="secondary">Save draft</Button>
                  <Button variant="outline" iconRight={ChevronRight}>
                    See plan
                  </Button>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="danger">Remove member</Button>
                  <Button variant="whatsapp" icon={icons.whatsapp}>
                    Share on WhatsApp
                  </Button>
                  <Button variant="link">Read the terms</Button>
                </div>
              </Demo>
              <Demo label="Sizes and states">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" icon={Plus}>
                    Small
                  </Button>
                  <Button>Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" variant="outline" aria-label="Copy invite link" icon={icons.copy} />
                  <Button disabled>Disabled</Button>
                  <Button
                    loading={loading}
                    variant="outline"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1500);
                    }}
                  >
                    {loading ? 'Saving' : 'Click to load'}
                  </Button>
                </div>
                <div className="mt-5">
                  <Button block size="lg" iconRight={ChevronRight}>
                    Lock and make the plan
                  </Button>
                </div>
              </Demo>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ Status */}
          <Section className={vis('status')} id="status" eyebrow="Primitives" title="Badges & status" description="Status is always an icon and words. Colour only backs it up.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Demo label="Group status (anonymous)">
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="ok">Everyone can go</StatusPill>
                  <StatusPill status="warning" icon={icons.budget}>
                    2 budgets short
                  </StatusPill>
                  <StatusPill status="warning" icon={icons.visa}>
                    Visa timing
                  </StatusPill>
                  <StatusPill status="blocked" icon={icons.duration}>
                    Trip too short
                  </StatusPill>
                  <StatusPill status="pending">Waiting on 2</StatusPill>
                  <StatusPill status="info">Voting open</StatusPill>
                  <StatusPill status="done">Paid</StatusPill>
                </div>
              </Demo>
              <Demo label="Private (only the viewer)">
                <div className="flex flex-wrap gap-2">
                  <PrivateBadge />
                  <Badge tone="private">Fits ~{formatINRCompact(42000)}</Badge>
                  <Badge tone="private" icon={icons.budget}>
                    Short {formatINRCompact(6500)}
                  </Badge>
                  <Badge tone="private" icon={icons.passport}>
                    Blocked by your passport
                  </Badge>
                </div>
              </Demo>
              <Demo label="Tags and labels" className="lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm">Beach</Badge>
                  <Badge>Mountains</Badge>
                  <Badge size="lg">Food</Badge>
                  <Badge tone="brand" icon={icons.route}>
                    2 stops
                  </Badge>
                  <Badge tone="warm" icon={icons.check}>
                    Your pick
                  </Badge>
                  <Badge tone="solid" icon={icons.organizer}>
                    Organizer
                  </Badge>
                  <Badge tone="outline">Draft</Badge>
                  <Badge variant="outline">legacy variant</Badge>
                </div>
              </Demo>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ Cards */}
          <Section className={vis('cards')} id="cards" eyebrow="Primitives" title="Cards" description="Raised white, no border. Use for what the step is about, not every block.">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader icon={icons.plan} title="Your plan" description="5 days · Goa" action={<Button size="sm" variant="outline">Share</Button>} />
                <CardBody>
                  <p className="type-body m-0 text-ink-soft">Card + CardHeader (icon, title, description, action) + CardBody.</p>
                </CardBody>
              </Card>
              <Card variant="private">
                <CardHeader icon={icons.budget} iconTone="private" title="Your budget" action={<PrivateBadge size="sm" />} />
                <CardBody>
                  <p className="type-num m-0 font-display text-3xl font-bold tracking-tight text-private-ink">{formatINR(45000)}</p>
                  <p className="type-small m-0 mt-1 text-private-ink/80">The group only sees whether a trip fits.</p>
                </CardBody>
              </Card>
              <Card variant="brand" className="p-6">
                <p className="type-overline m-0 text-brand-200">Locked</p>
                <p className="m-0 mt-2 font-display text-2xl font-bold tracking-tight">Goa, {formatDateRange('2026-12-24', '2026-12-28')}</p>
                <p className="type-small m-0 mt-1 text-white/75">variant=&quot;brand&quot; for hero moments. One per page.</p>
              </Card>
              <Card variant="flat" className="p-5">
                <p className="type-small m-0 font-semibold">variant=&quot;flat&quot;</p>
                <p className="type-small m-0 mt-1 text-ink-muted">Hairline ring, no shadow. For items inside another surface.</p>
              </Card>
              <Card variant="sunken" className="p-5">
                <p className="type-small m-0 font-semibold">variant=&quot;sunken&quot;</p>
                <p className="type-small m-0 mt-1 text-ink-muted">Grey well. Secondary groups, empty slots.</p>
              </Card>
              <Card interactive tabIndex={0} className="p-5">
                <p className="type-small m-0 font-semibold">interactive</p>
                <p className="type-small m-0 mt-1 text-ink-muted">Lifts on hover. Use for whole-card choices.</p>
              </Card>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ Forms */}
          <Section className={vis('forms')} id="forms" eyebrow="Primitives" title="Forms" description="Every control has a visible label. One hint line, or an error.">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Card>
                <CardHeader icon={icons.private} iconTone="private" title="Your details" description="Saved for you. The group never sees these." action={<PrivateBadge size="sm" />} />
                <CardBody className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Flying from">
                      <Select value={city} onChange={(e) => setCity(e.target.value)}>
                        {['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Your budget" hint="Per person, all in" error={Number(budget) < 1 ? 'Enter an amount' : undefined}>
                      <Input type="number" inputMode="numeric" min={1} leading="₹" value={budget} onChange={(e) => setBudget(e.target.value)} />
                    </Field>
                  </div>
                  <div className="grid gap-2.5">
                    <Field label="Passport expires" hint={expiry === 'none' ? 'India-only trips will still show.' : formatMonthYear(expiry) || 'Pick month and year'}>
                      <MonthYearSelect value={expiry} onChange={setExpiry} />
                    </Field>
                    <Checkbox label="I don't have a passport yet" checked={expiry === 'none'} onChange={(e) => setExpiry(e.target.checked ? 'none' : '')} />
                    <p className="type-caption m-0 font-normal text-ink-muted">
                      value: <code className="rounded bg-surface-muted px-1 py-0.5">{JSON.stringify(expiry)}</code>
                    </p>
                  </div>
                  <ChipGroup label="You'd enjoy">
                    {[
                      ['beach', 'Beach'],
                      ['mountains', 'Mountains'],
                      ['food', 'Food'],
                      ['nightlife', 'Nightlife'],
                      ['culture', 'Culture'],
                    ].map(([v, l]) => (
                      <ToggleChip key={v} selected={prefs.includes(v)} onSelectedChange={() => togglePref(v)}>
                        {l}
                      </ToggleChip>
                    ))}
                  </ChipGroup>
                  <div className="grid gap-2">
                    <Checkbox variant="tile" label="I'm 18 or older" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                    <Checkbox variant="tile" label="These dates work for me" description="24–28 Dec" checked={dates} onChange={(e) => setDates(e.target.checked)} />
                  </div>
                </CardBody>
                <CardFooter>
                  <span className="type-caption flex items-center gap-1.5 text-ink-muted">
                    <icons.private className="size-3.5" strokeWidth={2} aria-hidden /> Only you see this
                  </span>
                  <Button>Save my details</Button>
                </CardFooter>
              </Card>
              <div className="grid content-start gap-4">
                <Demo label="RadioCards">
                  <RadioCards
                    legend="Trip length"
                    name="length"
                    value={length}
                    onChange={setLength}
                    options={[
                      { value: 'weekend', label: 'Long weekend', description: '3 nights', icon: icons.calendar },
                      { value: 'week', label: 'Full week', description: '6 nights', icon: icons.duration },
                    ]}
                  />
                </Demo>
                <Demo label="States">
                  <div className="grid gap-4">
                    <Field label="Trip name" hint="Friends will see this">
                      <Input placeholder="Goa, December" />
                    </Field>
                    <Field label="Amount" error="That's more than the plan total">
                      <Input leading="₹" defaultValue="90000" />
                    </Field>
                    <Field label="Disabled">
                      <Input disabled defaultValue="Can't edit after lock" />
                    </Field>
                  </div>
                </Demo>
              </div>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ Notices */}
          <Section className={vis('feedback')} id="feedback" eyebrow="Primitives" title="Notices" description="At most one per section. Short title, one sentence.">
            <div className="grid gap-3 lg:grid-cols-2">
              <Notice tone="info" title="Voting is open">Pick one place. Nobody sees your vote.</Notice>
              <Notice tone="success" title="Plan locked">Goa it is. Everyone can go.</Notice>
              <Notice tone="warning" title="2 budgets short" action={<Button size="sm" variant="outline">See options</Button>}>
                Try a shorter trip.
              </Notice>
              <Notice tone="danger" title="You're offline">Changes will save when you're back.</Notice>
              <Notice tone="private" title="Only you see this">Your budget and passport stay on your side.</Notice>
              <Notice tone="neutral">Waiting for the organizer to open voting.</Notice>
            </div>
            <Notice variant="inline" tone="neutral" title="Estimates.">
              Prices and entry rules change. Check before you book.
            </Notice>
          </Section>

          {/* ------------------------------------------------------------------ Data */}
          <Section className={vis('data')} id="data" eyebrow="Primitives" title="Stats & progress" description="Big number, short label. Two per row on mobile, four on desktop.">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile icon={icons.money} label="Per person" value={formatINRCompact(41800)} hint="incl. 10% buffer" />
              <StatTile icon={icons.calendar} label="Dates" value="24–28 Dec" hint="4 nights" />
              <StatTile icon={icons.members} label="Going" value="6" hint={plural(1, 'pledge', 'pledges') + ' pending'} />
              <StatTile tone="private" label="Your share" value={formatINR(39200)} hint="Only you see this" />
            </div>
            <Demo label="Progress">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="type-small mb-2 flex justify-between">
                    <span className="font-semibold">Votes in</span>
                    <span className="text-ink-muted">4 of 6</span>
                  </div>
                  <Progress label="Votes in" value={4} max={6} />
                </div>
                <div>
                  <div className="type-small mb-2 flex justify-between">
                    <span className="font-semibold">Collected</span>
                    <span className="text-ink-muted">{formatINRCompact(120000)} of {formatINRCompact(250000)}</span>
                  </div>
                  <Progress label="Collected" value={120000} max={250000} tone="warm" size="md" />
                </div>
              </div>
            </Demo>
          </Section>

          {/* ------------------------------------------------------------------ People */}
          <Section className={vis('people')} id="people" eyebrow="Primitives" title="People" description="Initials from the nickname; colour is stable per name.">
            <Demo>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Avatar name="Asha" size="xs" />
                  <Avatar name="Ravi Kumar" size="sm" />
                  <Avatar name="Meera" size="md" status="ready" />
                  <Avatar name="Kabir" size="lg" status="pending" />
                </div>
                <AvatarStack names={['Asha', 'Ravi Kumar', 'Meera', 'Kabir', 'Zoya', 'Dev', 'Tara']} max={4} />
                <AvatarStack names={['Asha', 'Ravi Kumar', 'Meera']} size="md" />
              </div>
            </Demo>
          </Section>

          {/* ------------------------------------------------------------------ Stepper */}
          <Section
            className={vis('stepper')}
            id="stepper"
            eyebrow="Primitives"
            title="Stepper"
            description="The /plan shell shows where the group is. Compact on mobile."
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  Back
                </Button>
                <Button size="sm" disabled={step === PLAN_STEPS.length - 1} onClick={() => setStep((s) => Math.min(PLAN_STEPS.length - 1, s + 1))}>
                  Next
                </Button>
              </div>
            }
          >
            <Demo>
              <Stepper current={step} onStepClick={(_, i) => setStep(i)} />
            </Demo>
          </Section>

          {/* ------------------------------------------------------------------ Icons */}
          <Section className={vis('icons')} id="icons" eyebrow="Tokens" title="Icons" description="One icon per idea, from @/components/ui/icons. 16px inline, 20px in headers, 1.75 stroke.">
            <Demo>
              <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-5 lg:grid-cols-7">
                {(Object.keys(icons) as IconName[]).map((name) => {
                  const Icon = icons[name];
                  return (
                    <div key={name} className="flex min-w-0 flex-col items-center gap-2 text-center">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted text-ink">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="type-caption block truncate text-ink">{iconLabels[name]}</span>
                        <span className="block truncate font-mono text-[0.625rem] text-ink-muted">icons.{name}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Demo>
          </Section>

          {/* ------------------------------------------------------------------ Patterns */}
          <Section className={vis('patterns')} id="patterns" eyebrow="Patterns" title="Putting it together" description="Reference for the Choose step and empty states.">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DestinationCardExample selected={voted} onVote={() => setVoted((v) => !v)} />
              <Card className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                  <div>
                    <h3 className="type-h3 m-0">Bali</h3>
                    <p className="type-small m-0 mt-0.5 flex items-center gap-1.5 text-ink-muted">
                      <icons.flight className="size-3.5" strokeWidth={2} aria-hidden /> Indonesia · 5 nights
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 px-5">
                  <Badge size="sm">Beach</Badge>
                  <Badge size="sm">Visa on arrival</Badge>
                </div>
                <div className="mt-4 grid gap-2 px-5 pb-5">
                  <StatusPill status="ok" size="lg" className="justify-self-start">
                    Everyone can go
                  </StatusPill>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-private-soft px-3 py-2.5">
                    <span className="type-small flex items-center gap-1.5 font-semibold text-private-ink">
                      <icons.passport className="size-3.5" strokeWidth={2} aria-hidden /> Blocked by your passport
                    </span>
                    <icons.private className="size-3.5 text-private" strokeWidth={2} aria-label="Only you see this" />
                  </div>
                </div>
              </Card>
              <EmptyState
                icon={icons.tasks}
                title="No tasks yet"
                description="Add one, like booking the airport cab."
                action={
                  <Button size="sm" variant="outline" icon={Plus}>
                    Add a task
                  </Button>
                }
              />
            </div>
          </Section>
        </div>

        <footer className="mt-20 border-0 border-t border-solid border-line pt-6">
          <p className="type-small m-0 text-ink-muted">Docs: src/components/ui/DESIGN.md · Helpers: src/lib/format.ts</p>
        </footer>
      </PageContainer>
    </div>
  );
}
