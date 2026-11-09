import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';

import { Badge, PrivateBadge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { icons, type IconComponent } from '@/components/ui/icons';
import { formatMoney } from '@/lib/format';
import ClosingCta, { SiteFooter } from './ClosingCta';
import DitherField from './DitherField';
import HeroGlobe from './HeroGlobe';
import LandingMotion from './LandingMotion';
import { mono } from './mono';
import HeroPreview from './HeroPreview';
import {
  CalendarIllustration,
  ChooseIllustration,
  IllustrationFrame,
  InviteIllustration,
  PlanIllustration,
  PledgeIllustration,
  PrivateDetailsIllustration,
  SettleIllustration,
} from './Illustrations';
import SiteHeader from './SiteHeader';
import VoteResultsPreview from './VoteResultsPreview';

/* ---------------------------------------------------------------------------------------------------------------- */
/* Content                                                                                                            */
/* ---------------------------------------------------------------------------------------------------------------- */

const steps: { icon: IconComponent; title: string; body: string }[] = [
  { icon: icons.invite, title: 'Invite your group', body: 'Start a trip room, choose home, abroad or both, and share the link in your group chat. You choose who gets in.' },
  { icon: icons.private, title: 'Add your details privately', body: 'Your city, budget, passport and visas. Nobody else sees them, not even the organizer.' },
  { icon: icons.vote, title: 'Choose together', body: 'See which trips work for everyone, without seeing anyone’s numbers. Then vote in private.' },
  { icon: icons.plan, title: 'Plan, pledge and pay', body: 'Lock the top pick that fits all of you, see why it won, and get a day-by-day plan with each person’s cost.' },
];

// One animated scene per step, in step order.
const stepArt = [InviteIllustration, PrivateDetailsIllustration, ChooseIllustration, PlanIllustration];

// The three features that get a picture; the rest stay in the list below them.
const highlights: { art: React.ComponentType; title: string; body: string }[] = [
  {
    art: PledgeIllustration,
    title: 'Private pledges',
    body: `“I’m in if at least five of us go and my share stays under ${formatMoney(40000, 'INR', { compact: true })}.” The group sees only how many are in.`,
  },
  {
    art: CalendarIllustration,
    title: 'Long-weekend finder',
    body: 'Find dates that wrap around weekends and your country’s public holidays, so everyone uses fewer days off.',
  },
  {
    art: SettleIllustration,
    title: 'Free settle-up',
    body: 'Log shared costs and get the fewest payments to square up, with UPI, PayPal, Venmo or Revolut links.',
  },
];

const features: { icon: IconComponent; title: string; body: string }[] = [
  {
    icon: icons.vote,
    title: 'See exactly why it won',
    body: 'After the lock, everyone sees the votes for each option and why a more popular one couldn’t win, like “1 budget short”. Never who voted for what.',
  },
  {
    icon: icons.destination,
    title: 'Home or abroad',
    body: 'Decide up front whether the group wants a domestic trip, an international one or either. The list only shows what you asked for.',
  },
  {
    icon: icons.visa,
    title: 'Visas for every passport',
    body: 'Each person picks their own passport. Fermat checks entry rules and how early to apply, and tells only them.',
  },
  {
    icon: icons.meal,
    title: 'Silent preferences',
    body: 'Vegetarian, no alcohol, skipping the trek. The plan works around it and nobody knows whose it was.',
  },
  {
    icon: icons.route,
    title: 'Multi-city routes',
    body: 'Bangkok to Phuket, or Kochi to Munnar to Alleppey. Each route is planned and priced as one trip, from each person’s own city.',
  },
  {
    icon: icons.share,
    title: 'Share cards',
    body: 'Send the locked plan to the group chat as a clean image, ready for the countdown.',
  },
];

const youSee: { icon: IconComponent; label: string; value: string }[] = [
  { icon: icons.departure, label: 'Leaving from', value: 'Delhi' },
  { icon: icons.budget, label: 'Budget', value: formatMoney(45000, 'INR') },
  { icon: icons.passport, label: 'Passport', value: 'India, to Mar 2027' },
  { icon: icons.visa, label: 'Visas', value: 'Schengen' },
  { icon: icons.meal, label: 'Food', value: 'Vegetarian' },
  { icon: icons.pledge, label: 'Pledge', value: 'In if 5+ go' },
];

const promises: { icon: IconComponent; text: string }[] = [
  { icon: icons.passport, text: 'No passport numbers or ID uploads' },
  { icon: icons.money, text: 'Fermat never touches your money' },
  { icon: ShieldCheck, text: 'Ask us to delete your data any time' },
];

const globalFacts: { icon: IconComponent; title: string; body: string }[] = [
  {
    icon: icons.money,
    title: 'Your home country, your currency',
    body: `Pick where the group is based and every price shows in your money: ${formatMoney(32000, 'INR')} in Delhi, ${formatMoney(1240, 'USD')} in New York.`,
  },
  {
    icon: icons.departure,
    title: 'Everyone leaves from their own city',
    body: 'Delhi, Mumbai and Bengaluru, or New York, London and Singapore. Fares are estimated per person.',
  },
  {
    icon: icons.calendar,
    title: 'Local holiday calendars',
    body: 'The long-weekend finder knows Diwali from Independence Day, and Thanksgiving from Labor Day.',
  },
  {
    icon: icons.link,
    title: 'Pay links friends already use',
    body: 'UPI in India, plus PayPal, Venmo, Revolut and Monzo for everyone else.',
  },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Does Fermat book flights or hotels?',
    a: 'No. Fermat helps your group decide and plan. Prices are estimates to compare options fairly, so check the real price before you book.',
  },
  {
    q: 'Who can see my budget?',
    a: 'Only you. The group sees anonymous summaries like “2 budgets short”, never names or numbers. Once a plan is locked, everyone sees each person’s share of the cost, which can hint at a rough range.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, for the whole group. There is no card to add, and settling up happens in your own UPI, PayPal, Venmo or Revolut app.',
  },
  {
    q: 'Does it work outside India?',
    a: 'Yes. Pick your group’s home country when you start. Prices show in your currency, friends can leave from different cities and hold different passports, and you choose a trip at home, abroad or either.',
  },
  {
    q: 'How is the winner picked?',
    a: 'Everyone votes in private. When the organizer locks the trip, Fermat picks the option with the most votes that works for everyone. Then the whole group sees the vote count for each option and why any of them couldn’t win, never who voted for what.',
  },
  {
    q: 'Does everyone need an account?',
    a: 'The organizer signs in with Google or email. Friends with the invite link can join as a guest, no account needed, and the organizer approves who gets in.',
  },
  {
    q: 'What if no trip works for everyone?',
    a: 'You’ll see why, for example a budget gap or visa timing, so the group can try shorter dates or a closer place without anyone being singled out.',
  },
];

/* ---------------------------------------------------------------------------------------------------------------- */
/* Pieces                                                                                                             */
/* ---------------------------------------------------------------------------------------------------------------- */

function IconTile({ icon: Icon, tone = 'brand' }: { icon: IconComponent; tone?: 'brand' | 'inverse' }) {
  return (
    <span
      className={
        tone === 'inverse'
          ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white'
          : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ink shadow-card'
      }
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function SectionHeading({ id, eyebrow, title, lead, center }: { id: string; eyebrow: string; title: React.ReactNode; lead?: string; center?: boolean }) {
  return (
    <div data-reveal className={center ? 'mx-auto max-w-prose text-center' : 'max-w-prose'}>
      <p className="type-overline m-0 text-ink-muted">{eyebrow}</p>
      <h2 id={id} className="type-h1 m-0 mt-3">
        {title}
      </h2>
      {lead && <p className="type-lead m-0 mt-3 text-ink-soft">{lead}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* Page                                                                                                               */
/* ---------------------------------------------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    // overflow-x-clip (not hidden) keeps the sticky header working while slide-ins are offset off screen.
    <LandingMotion className="flex min-h-screen flex-col overflow-x-clip bg-canvas font-sans text-ink">
      <a
        href="#main"
        className="type-small sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <SiteHeader links={[
        { label: 'How it works', href: '#how' },
        { label: 'Features', href: '#features' },
        { label: 'Results', href: '#results' },
        { label: 'Privacy', href: '#privacy' },
        { label: 'FAQ', href: '#faq' },
      ]} />

      {/* Pulled up under the sticky nav (4rem tall) so the hero grid runs behind the frosted bar. */}
      <main id="main" className="-mt-16 flex flex-col gap-20 sm:gap-28">
        {/* Hero: the globe as a dome (top half) centred above centred copy, all on the faint grid. */}
        <section data-hero-section aria-labelledby="hero-title" className="relative isolate">
          <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
          {/* A soft blue glow behind the globe, so the first screen has some colour. */}
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(ellipse_60%_55%_at_50%_10%,rgba(63,94,173,0.12),transparent_70%)]" />
          {/* Dithered hills rolling along the bottom of the hero, fading out toward the centre. */}
          <DitherField
            pattern="horizon"
            rgb={[63, 94, 173]}
            alpha={0.16}
            cell={4}
            speed={0.8}
            intensity={0.8}
            className="absolute inset-x-0 bottom-0 -z-10 !h-80 [mask-image:radial-gradient(ellipse_55%_60%_at_50%_70%,black_25%,transparent_75%)]"
          />
          <div className="mx-auto flex w-full max-w-page flex-col items-center px-4 pb-4 pt-24 text-center sm:px-6 sm:pt-28 lg:px-8">
            {/* Flex column so the globe keeps its 2:1 dome box, as it had as a direct child of the column above. */}
            <div data-hero="globe" className="flex w-full flex-col items-center">
              <HeroGlobe dome />
            </div>
            <div className="relative -mt-4 flex flex-col items-center sm:-mt-8">
              <div data-hero="item" className="frost-frame rounded-full p-1.5">
                <p className="type-small m-0 inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full bg-surface px-3.5 py-1.5 font-medium text-ink-soft shadow-card">
                  Private group planning for 2 to 20 friends.
                  <span className="font-semibold text-ink">Budgets stay private.</span>
                </p>
              </div>
              <h1 data-hero="item" id="hero-title" className="type-display m-0 mt-6 max-w-[16ch] text-balance">
                One plan everyone can <span className="type-accent whitespace-nowrap">actually join.</span>
              </h1>
              <p data-hero="item" className="type-lead m-0 mt-6 max-w-prose text-ink-soft">
                Everyone adds their budget, city and passport in private. Fermat shows which trips, at home or abroad, work
                for all of you. Then you vote, lock it in and get the plan.
              </p>
              <div data-hero="item" className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-5">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/plan" prefetch={false}>
                    Start a group trip
                    <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
                  </Link>
                </Button>
                <a
                  href="#how"
                  className="type-body inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 font-semibold text-ink no-underline hover:text-ink-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35"
                >
                  See how it works
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </a>
              </div>
              <p data-hero="item" className="type-small m-0 mt-4 text-ink-muted">Free for the whole group. No card, any country, any currency.</p>
            </div>
          </div>
        </section>

        {/* Live example: what the group sees on the Choose step. */}
        <section aria-labelledby="example-title" className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <div data-reveal className="grid items-center gap-10 rounded-3xl bg-surface-muted p-6 ring-1 ring-inset ring-line-subtle sm:p-10 lg:grid-cols-[0.8fr_1fr] lg:gap-16 lg:p-12">
            <div>
              <p className="type-overline m-0 text-ink-muted">Live example / choose step</p>
              <h2 id="example-title" className="type-h1 m-0 mt-3">
                The group sees the answer. <span className="type-accent">Not the numbers.</span>
              </h2>
              <p className="type-body m-0 mt-4 text-ink-soft">
                Each place shows whether it works for everyone. Only you see whether it fits your own budget.
              </p>
              <ul className="m-0 mt-6 flex list-none flex-col gap-2.5 p-0">
                {[
                  { icon: icons.private, text: 'Budgets stay private' },
                  { icon: icons.money, text: 'Any country, any currency' },
                  { icon: icons.whatsapp, text: 'Share on WhatsApp' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="type-small flex items-center gap-2 font-medium text-ink-soft">
                    <Icon className="size-4 text-ink-soft" strokeWidth={2} aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div data-slide="right" className="mx-auto w-full max-w-md lg:max-w-none">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* How it works: one hand-drawn ASCII piece per step. */}
        <section id="how" aria-labelledby="how-title" className="mx-auto w-full max-w-page scroll-mt-24 px-4 sm:px-6 lg:px-8">
          <SectionHeading id="how-title" eyebrow="How it works" title={<>From group chat to a plan <span className="type-accent">in four steps.</span></>} />
          <ol data-stagger className="m-0 mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Art = stepArt[index];
              return (
              <li key={step.title} className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition-[box-shadow,transform] duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-raised">
                <IllustrationFrame className="border-0 border-b border-solid border-line-subtle">
                  <Art />
                </IllustrationFrame>
                <div className="min-w-0 p-5 sm:p-6">
                  <p className="type-overline m-0 text-ink-muted">Step 0{index + 1}</p>
                  <h3 className="type-h3 m-0 mt-2">{step.title}</h3>
                  <p className="type-small m-0 mt-2 text-ink-soft">{step.body}</p>
                </div>
              </li>
              );
            })}
          </ol>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="mx-auto w-full max-w-page scroll-mt-24 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="features-title"
            eyebrow="Built for real groups"
            title={<>The awkward parts, <span className="type-accent">handled.</span></>}
            lead="Money, dates and dietary needs are where group trips fall apart. Fermat keeps them private and fair."
          />
          <ul data-stagger className="m-0 mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
            {highlights.map(({ art: Art, title, body }) => (
              <li key={title} className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition-[box-shadow,transform] duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-raised">
                <IllustrationFrame className="h-52 border-0 border-b border-solid border-line-subtle">
                  <Art />
                </IllustrationFrame>
                <div className="min-w-0 p-5 sm:p-6">
                  <h3 className="type-h3 m-0">{title}</h3>
                  <p className="type-small m-0 mt-2 text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul data-stagger className="m-0 mt-12 grid list-none gap-x-10 gap-y-9 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <IconTile icon={feature.icon} />
                <div className="min-w-0">
                  <h3 className="type-h3 m-0">{feature.title}</h3>
                  <p className="type-body m-0 mt-1 text-ink-soft">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Vote results */}
        <section id="results" aria-labelledby="results-title" className="mx-auto w-full max-w-page scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <SectionHeading
                id="results-title"
                eyebrow="Fair results"
                title={<>See exactly <span className="type-accent">why it won.</span></>}
                lead="The winner is the most-voted trip that works for everyone. When it’s locked, the group sees how the votes fell and why a more popular pick missed out."
              />
              <ul data-stagger className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
                {[
                  { icon: icons.vote, text: 'Vote counts for every option, with no names attached' },
                  { icon: icons.info, text: 'Plain reasons a pick couldn’t win: budget, visa timing, passport or trip length' },
                  { icon: icons.private, text: 'Only you see which option you voted for' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="type-body flex items-start gap-3 text-ink-soft">
                    <Icon className="mt-0.5 size-5 shrink-0 text-ink-soft" strokeWidth={1.75} aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div data-slide="right" className="mx-auto w-full max-w-md lg:max-w-none">
              <VoteResultsPreview />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" aria-labelledby="privacy-title" className="mx-auto w-full max-w-page scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="privacy-title"
            eyebrow="Privacy"
            title={<>Your budget <span className="type-accent">stays yours.</span></>}
            lead="Fermat checks every option against everyone’s details, then shows the group only the answer."
          />
          <div data-stagger className="mt-10 grid gap-4 lg:grid-cols-2">
            <Card variant="private" className={`p-5 sm:p-6 ${mono.privatePanel}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="type-h3 m-0">What you enter</h3>
                <PrivateBadge size="sm" className={mono.solid} />
              </div>
              <dl className="m-0 mt-4 flex flex-col gap-2">
                {youSee.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5">
                    <dt className="type-small flex items-center gap-2 text-ink-soft">
                      <Icon className="size-4 text-ink-muted" strokeWidth={1.75} aria-hidden />
                      {label}
                    </dt>
                    <dd className="type-small type-num m-0 font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="type-h3 m-0">What your group sees</h3>
                <Badge size="sm" icon={icons.members}>
                  Everyone
                </Badge>
              </div>
              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                {[
                  { name: 'Goa', pill: <StatusPill status="ok" size="sm" className={mono.okPill}>Everyone can go</StatusPill> },
                  { name: 'Bali', pill: <StatusPill status="warning" icon={icons.budget} size="sm" className={mono.pill}>2 budgets short</StatusPill> },
                  { name: 'Paris', pill: <StatusPill status="warning" icon={icons.visa} size="sm" className={mono.pill}>Visa timing</StatusPill> },
                  { name: 'Manali', pill: <StatusPill status="blocked" icon={icons.duration} size="sm" className={mono.pill}>Trip too short</StatusPill> },
                ].map((row) => (
                  <li key={row.name} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5">
                    <span className="type-small flex items-center gap-2 font-semibold text-ink">
                      <icons.destination className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
                      {row.name}
                    </span>
                    {row.pill}
                  </li>
                ))}
                <li className="type-small flex items-center gap-2 px-3 pt-1 text-ink-muted">
                  <icons.members className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
                  No names. No numbers. Votes stay hidden until the trip is locked.
                </li>
              </ul>
            </Card>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <ul className="m-0 flex list-none flex-col gap-3 p-0 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text} className="type-small flex items-center gap-2 font-medium text-ink-soft">
                  <Icon className="size-4 text-ink-soft" strokeWidth={1.75} aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
            <Link
              href="/privacy"
              className="type-small inline-flex items-center gap-1 self-start rounded font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Read the privacy policy
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </section>

        {/* Any country, India first */}
        <section id="anywhere" aria-labelledby="anywhere-title" className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <div data-reveal className="relative isolate grid gap-10 overflow-hidden rounded-3xl bg-surface-muted p-6 ring-1 ring-inset ring-line-subtle sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-12">
            <DitherField
              pattern="waves"
              rgb={[63, 94, 173]}
              alpha={0.16}
              cell={4}
              speed={0.6}
              className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_90%_at_0%_100%,black_20%,transparent_75%)]"
            />
            <div>
              <p className="type-overline m-0 text-ink-muted">Any home country</p>
              <h2 id="anywhere-title" className="type-h1 m-0 mt-2">
                Built for anywhere, launching in India
              </h2>
              <p className="type-lead m-0 mt-3 text-ink-soft">
                Fermat works for a group of friends in Delhi or in Denver. We’re starting in India, with Indian cities,
                holidays and UPI built in from day one.
              </p>
            </div>
            <ul data-stagger className="m-0 grid list-none gap-x-8 gap-y-6 p-0 sm:grid-cols-2">
              {globalFacts.map((fact) => (
                <li key={fact.title} className="flex gap-4 sm:flex-col sm:gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ink shadow-card">
                    <fact.icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <h3 className="type-h3 m-0">{fact.title}</h3>
                    <p className="type-small m-0 mt-1 text-ink-soft">{fact.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="mx-auto w-full max-w-content scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <SectionHeading id="faq-title" eyebrow="FAQ" title={<>Questions groups <span className="type-accent">ask.</span></>} center />
          <Card data-reveal className="mt-10 overflow-hidden">
            {faqs.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className={
                  index === 0
                    ? 'group'
                    : 'group border-0 border-t border-solid border-line-subtle'
                }
              >
                <summary className="type-body flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:px-6 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="size-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </summary>
                <p className="type-body m-0 px-5 pb-5 text-ink-soft sm:px-6">{item.a}</p>
              </details>
            ))}
          </Card>
        </section>

        <ClosingCta />
      </main>

      <SiteFooter />
    </LandingMotion>
  );
}
