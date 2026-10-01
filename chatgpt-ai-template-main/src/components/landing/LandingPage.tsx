'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Car,
  Check,
  Compass,
  Hotel,
  MessageSquare,
  Plane,
  Search,
  Stamp,
  UtensilsCrossed,
  Wand2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ChatDemo from './ChatDemo';
import ClosingCta from './ClosingCta';
import FermatMark from './FermatMark';
import TrustedBy from './TrustedBy';
import WhyFermat from './WhyFermat';

const destinations = [
  'Tokyo',
  'Lisbon',
  'Dubai',
  'Bali',
  'Paris',
  'New York',
  'Istanbul',
  'Singapore',
  'Cape Town',
  'Reykjavík',
  'Seoul',
  'Marrakech',
];

const checklist = [
  { label: 'Passport, 6+ months validity', done: true },
  { label: 'Recent photographs', done: true },
  { label: 'Bank statements', done: true },
  { label: 'Flight itinerary', done: false },
];

const smallFeatures = [
  {
    icon: Hotel,
    title: 'Hotel matching',
    description: 'Stays shortlisted for your style, neighbourhood and budget.',
    tile: 'bg-[#EEF6F0] text-[#1F5A3F]',
  },
  {
    icon: UtensilsCrossed,
    title: 'Dining discovery',
    description: 'Local favourites, picked for what you actually like to eat.',
    tile: 'bg-[#E4F4EA] text-[#1F5A3F]',
  },
  {
    icon: Car,
    title: 'Car rentals',
    description: 'Transparent comparisons with no surprise fees at the counter.',
    tile: 'bg-[#E4F4EA] text-[#1F5A3F]',
  },
];

const tickerStars = ['text-[#5DBB84]', 'text-[#F8E6A0]', 'text-[#5DBB84]', 'text-[#F8E6A0]'];
const stepColors = ['text-[#5DBB84]', 'text-[#5DBB84]', 'text-[#F8E6A0]'];
const roleColors = ['bg-[#E4F4EA] text-[#285F43]', 'bg-[#EEF6F0] text-[#1F5A3F]', 'bg-[#E4F4EA] text-[#1F5A3F]'];

const itinerary = [
  { day: 'Day 1', plan: 'Land, check in, ramen in Shinjuku' },
  { day: 'Day 2', plan: 'Asakusa temples, Sumida river walk' },
  { day: 'Day 3', plan: 'Day trip to Hakone, onsen evening' },
];

const steps = [
  { icon: MessageSquare, title: 'Ask anything', description: 'Describe your trip the way you would to a friend.' },
  { icon: Search, title: 'Fermat researches', description: 'Specialised agents find and verify the best options.' },
  { icon: Wand2, title: 'Get a plan', description: 'Clear recommendations with the next steps laid out.' },
];

const stats = [
  { value: '10+', label: 'Countries' },
  { value: '100+', label: 'Travel agents' },
  { value: '1k+', label: 'Travellers' },
  { value: '90%', label: 'Accuracy' },
];

const founders = [
  {
    name: 'Srijan',
    role: 'CEO',
    description: 'HEC Paris · Ex PE, MIT, American Express',
    fun: 'Plans the company like a trip: three tabs of research, one clear decision, and always a backup route.',
    image: '/img/founders/srijan.jpg',
  },
  {
    name: 'Shubham',
    role: 'CTO',
    description: 'Microsoft AI · Ex Oracle, HSBC, BITS Pilani',
    fun: "Teaches the agents to think so you don't have to. Measures every itinerary in milliseconds.",
    image: '/img/founders/shubham.jpg',
  },
];

// Founder photos are 316×371 with a caption baked in from y=287; show the 230px square at (43, 25) so the face is centered.
const photoCrop: React.CSSProperties = { width: '137.39%', left: '-18.7%', top: '-10.87%' };

const floatingCards = [
  { icon: Plane, title: 'Fares tracked', sub: 'DEL → NRT', className: '-left-56 top-6', delay: '0s', tile: 'bg-[#141611] text-[#5DBB84]' },
  { icon: Stamp, title: 'Checklist ready', sub: '4 of 4 documents', className: '-right-56 top-28', delay: '-2s', tile: 'bg-[#5DBB84] text-foreground' },
  { icon: Hotel, title: 'Stays shortlisted', sub: 'Shinjuku · 3 options', className: '-left-48 bottom-10', delay: '-4s', tile: 'bg-[#F8E6A0] text-[#141611]' },
];

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'group/rv translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
      <span className="mb-4 inline-block rounded-full bg-primary/70 px-3 py-1 text-xs font-semibold text-primary-foreground">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </Reveal>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
        scrolled ? 'border-border bg-background/75 backdrop-blur-lg' : 'border-transparent bg-transparent',
      )}
    >
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <FermatMark className="h-7" />
          Fermat
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {[
            ['Features', '#features'],
            ['Why Fermat', '#why'],
            ['How it works', '#how-it-works'],
            ['Team', '#team'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-foreground">
              {label}
            </a>
          ))}
        </div>
        <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
          <Link href="/landing">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[75%] bg-gradient-to-b from-[#5DBB84]/15 via-[#5DBB84]/[0.06] to-transparent" />
        <div className="absolute -left-32 top-24 size-[28rem] animate-drift rounded-full bg-[#5DBB84]/25 blur-3xl" />
        <div
          className="absolute -right-24 top-64 size-[24rem] animate-drift rounded-full bg-[#5DBB84]/20 blur-3xl"
          style={{ animationDelay: '-9s' }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-72 animate-drift rounded-full bg-[#F8E6A0]/45 blur-3xl"
          style={{ animationDelay: '-5s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="container relative text-center">
        <div className="animate-fade-up">
          <Badge variant="outline" className="border-foreground/10 bg-background/80 backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4AA872] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#3D9163]" />
            </span>
            Powered by GPT-5.2
          </Badge>
        </div>

        <h1
          className="mx-auto mt-7 max-w-3xl animate-fade-up text-4xl font-semibold tracking-tight sm:text-5xl md:text-7xl"
          style={{ animationDelay: '100ms' }}
        >
          Travel{' '}
          <span className="relative isolate inline-block">
            smarter
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 -z-10 h-4 origin-left animate-grow-x rounded-full bg-[#F8E6A0] md:bottom-2 md:h-5"
            />
          </span>
          , with one conversation.
        </h1>

        <p
          className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-muted-foreground"
          style={{ animationDelay: '200ms' }}
        >
          Your AI companion for visas, flights, hotels and experiences. Plan the whole journey in one place.
        </p>

        <div
          className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '300ms' }}
        >
          <Button asChild size="lg" className="group bg-foreground text-background hover:bg-foreground/90">
            <Link href="/landing">
              Start free
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <div className="relative mx-auto mt-14 max-w-xl animate-fade-up" style={{ animationDelay: '450ms' }}>
          {floatingCards.map(({ icon: Icon, title, sub, className, delay, tile }) => (
            <div
              key={title}
              aria-hidden
              className={cn(
                'absolute z-10 hidden w-48 animate-float items-center gap-3 rounded-2xl border bg-card/90 p-3 text-left shadow-[0_18px_40px_-20px_hsl(160_40%_20%/0.35)] backdrop-blur xl:flex',
                className,
              )}
              style={{ animationDelay: delay }}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tile)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{sub}</span>
              </span>
            </div>
          ))}
          <ChatDemo />
        </div>
      </div>
    </section>
  );
}

function DestinationTicker() {
  const items = [...destinations, ...destinations];
  return (
    <div className="overflow-hidden border-y border-foreground bg-foreground py-4 text-background">
      <div className="flex w-max animate-marquee items-center">
        {items.map((d, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 text-sm font-medium tracking-wide md:text-base">
            {d}
            <span className={tickerStars[i % tickerStars.length]}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-20 pb-16 pt-16 md:pb-20 md:pt-24">
      <div className="container">
        <SectionHeading
          eyebrow="Everything you need"
          title="One platform for your entire journey"
          description="From paperwork to the perfect dinner spot, Fermat handles the details."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <Card className="relative h-full overflow-hidden border-transparent bg-foreground p-7 text-background">
              <div
                aria-hidden
                className="absolute -right-16 -top-16 size-64 rounded-full bg-[#5DBB84]/20 blur-3xl"
              />
              <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#5DBB84] text-foreground">
                    <Stamp className="size-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">Visa intelligence</h3>
                  <p className="mt-2 leading-relaxed text-background/65">
                    Requirements for 195+ countries, checked against your passport in seconds, with a document
                    checklist built for you.
                  </p>
                </div>
                <div className="rounded-2xl bg-background/[0.06] p-4 ring-1 ring-background/10">
                  <div className="mb-3 flex items-center justify-between text-xs text-background/60">
                    <span>Japan eVisa</span>
                    <span>3 of 4 ready</span>
                  </div>
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-background/10">
                    <div className="h-full w-0 rounded-full bg-[#5DBB84] transition-[width] delay-300 duration-1000 ease-out group-data-[visible=true]/rv:w-3/4" />
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded-full',
                            item.done ? 'bg-[#5DBB84] text-foreground' : 'border border-background/30',
                          )}
                        >
                          {item.done && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className={item.done ? '' : 'text-background/50'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="relative flex h-full flex-col overflow-hidden border-transparent bg-[linear-gradient(160deg,#EEF6F0_0%,#E4F4EA_100%)] p-7 text-foreground">
              <div aria-hidden className="absolute -bottom-20 -right-10 size-56 rounded-full bg-white/60 blur-2xl" />
              <span className="relative grid size-11 place-items-center rounded-xl bg-[#13392A] text-white">
                <Plane className="size-5" />
              </span>
              <h3 className="relative mt-5 text-xl font-semibold">Smart flights</h3>
              <p className="relative mt-2 leading-relaxed text-foreground/65">
                Compare 500+ airlines and surface the routes and fares worth booking.
              </p>
              <div className="relative mt-auto pt-8">
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span>DEL</span>
                  <span className="relative h-px flex-1 border-t-2 border-dashed border-[#13392A]/30">
                    <Plane className="absolute -top-2.5 size-4 animate-fly" />
                  </span>
                  <span>NRT</span>
                </div>
              </div>
            </Card>
          </Reveal>

          {smallFeatures.map(({ icon: Icon, title, description, tile }, i) => (
            <Reveal key={title} delay={i * 80}>
              <Card className="group h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#5DBB84] hover:shadow-[0_16px_40px_-20px_hsl(160_40%_25%/0.3)]">
                <span
                  className={cn(
                    'grid size-11 place-items-center rounded-xl transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110',
                    tile,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </Card>
            </Reveal>
          ))}

          <Reveal className="md:col-span-3">
            <Card className="grid gap-6 border-transparent bg-[#FCF3D2] p-7 md:grid-cols-[1fr_2fr] md:items-center">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-foreground text-[#5DBB84]">
                  <Compass className="size-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">Tour planning</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Day-by-day itineraries that adapt as your plans change.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {itinerary.map((d, i) => (
                  <div
                    key={d.day}
                    style={{ transitionDelay: `${200 + i * 150}ms` }}
                    className="translate-y-3 rounded-2xl bg-card p-4 opacity-0 shadow-sm transition-all duration-500 group-data-[visible=true]/rv:translate-y-0 group-data-[visible=true]/rv:opacity-100"
                  >
                    <span className="inline-block rounded-full bg-[#E9C46A] px-2.5 py-0.5 text-xs font-semibold text-[#3D2F08]">
                      {d.day}
                    </span>
                    <p className="mt-2.5 text-sm">{d.plan}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section id="why" className="scroll-mt-16">
      <div className="container">
        <SectionHeading
          eyebrow="Why Fermat"
          title="Not another chatbot. A travel specialist."
          description="What you get here that a search bar or a general AI assistant won't give you."
        />
      </div>
      <WhyFermat />
    </section>
  );
}

function Stats() {
  return (
    <section className="container">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-[#13392A] px-6 py-12 text-white md:px-12">
          <div aria-hidden className="absolute -left-16 -top-24 size-72 rounded-full bg-[#5DBB84]/25 blur-3xl" />
          <FermatMark className="pointer-events-none absolute -bottom-10 -right-6 h-56 text-[#F8E6A0]/[0.08]" />
          <dl className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="md:border-l md:border-white/10 md:pl-6 md:first:border-l-0 md:first:pl-0">
                <dd className="text-4xl font-semibold tracking-tight text-[#F8E6A0] md:text-5xl">{s.value}</dd>
                <dt className="mt-1 text-sm font-medium text-white/60">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 md:py-24">
      <div className="container">
        <SectionHeading eyebrow="Simple process" title="How Fermat works" />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 120}>
              <Card className="group relative h-full overflow-hidden p-7 transition-all duration-300 hover:border-[#5DBB84]">
                <span className="absolute -right-2 -top-6 text-[7rem] font-bold leading-none text-secondary transition-colors duration-300 group-hover:text-primary/60">
                  {i + 1}
                </span>
                <span className={cn('relative grid size-12 place-items-center rounded-full bg-foreground', stepColors[i])}>
                  <Icon className="size-5" />
                </span>
                <h3 className="relative mt-6 text-lg font-semibold">{title}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground">{description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="scroll-mt-20 py-16 md:py-24">
      <div className="container">
        <SectionHeading eyebrow="Meet the team" title="The minds behind Fermat" />
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {founders.map((f, i) => (
            <Reveal key={f.name} delay={i * 100}>
              <Card className="group h-full p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#5DBB84] hover:shadow-[0_12px_30px_-18px_hsl(160_40%_20%/0.35)]">
                <div className="flex items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all duration-300 group-hover:ring-2 group-hover:ring-[#5DBB84]">
                    <img
                      src={f.image}
                      alt={f.name}
                      style={photoCrop}
                      className="absolute h-auto max-w-none grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.name}</h3>
                    <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', roleColors[i])}>
                      {f.role}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-xs font-medium text-muted-foreground">{f.description}</p>
                <p className="mt-2 text-sm leading-relaxed">{f.fun}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <DestinationTicker />
        <Features />
        <Why />
        {/* Stats band hidden for now; re-enable by restoring <Stats /> here. */}
        <HowItWorks />
        <TrustedBy />
        <Team />
      </main>
      <ClosingCta />
    </>
  );
}
