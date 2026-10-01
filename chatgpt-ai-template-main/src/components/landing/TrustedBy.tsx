'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import FermatMark from './FermatMark';

type TestimonialCard = {
  kind: 'testimonial';
  quote: string;
  author: string;
  role: string;
  theme: 'light' | 'dark' | 'pastel';
};
type StatCard = { kind: 'stat' };
type InviteCard = { kind: 'invite' };
type CardData = TestimonialCard | StatCard | InviteCard;

const cards: CardData[] = [
  {
    kind: 'testimonial',
    quote: 'Fermat saved me hours of research. Got my Dubai visa sorted in minutes.',
    author: 'Nikhil Issar',
    role: 'USA',
    theme: 'light',
  },
  {
    kind: 'testimonial',
    quote: 'The flight recommendations are incredibly smart. Found $400 in savings.',
    author: 'Jaya Aggarwal',
    role: 'Germany',
    theme: 'dark',
  },
  { kind: 'stat' },
  {
    kind: 'testimonial',
    quote: 'Finally, an AI that actually understands travel. This is the future.',
    author: 'Zainab',
    role: 'France',
    theme: 'pastel',
  },
  { kind: 'invite' },
];

// Resting pose for each card in the fan.
const poses = [
  { r: -7, y: 28 },
  { r: 3, y: 0 },
  { r: -2, y: 18 },
  { r: 5, y: 4 },
  { r: -4, y: 30 },
];

const themes = {
  light: 'bg-[#FCF3D2] text-foreground',
  dark: 'bg-[#141611] text-white',
  pastel: 'bg-[#E4F4EA] text-[#141611]',
};

function CardBody({ card }: { card: CardData }) {
  if (card.kind === 'stat') {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl bg-[#D7EEDF] p-6 text-[#141611]">
        <FermatMark className="h-9" />
        <div>
          <p className="text-6xl font-semibold tracking-tight">1k+</p>
          <p className="mt-2 text-sm font-medium opacity-70">travellers already planning their trips with Fermat</p>
        </div>
      </div>
    );
  }

  if (card.kind === 'invite') {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl bg-[#13392A] p-6 text-[#EEF6F0]">
        <FermatMark className="h-9 text-[#5DBB84]" />
        <div>
          <p className="text-2xl font-semibold leading-tight">Your trip could be the next story.</p>
          <Link
            href="/landing"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#5DBB84] px-4 py-2 text-sm font-semibold text-[#141611] transition-transform hover:translate-x-0.5"
          >
            Start planning <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const dark = card.theme === 'dark';
  return (
    <div className={cn('flex h-full flex-col rounded-3xl p-6', themes[card.theme])}>
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, k) => (
            <Star
              key={k}
              className={cn('size-3.5', dark ? 'fill-[#5DBB84] text-[#5DBB84]' : 'fill-[#141611] text-[#141611]')}
            />
          ))}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            dark ? 'bg-white/10' : 'bg-[#141611]/[0.07]',
          )}
        >
          <BadgeCheck className="size-3" /> Traveller
        </span>
      </div>
      <p className="mt-6 flex-1 text-lg leading-snug">&ldquo;{card.quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full text-sm font-semibold',
            dark ? 'bg-[#5DBB84] text-[#141611]' : 'bg-[#141611] text-[#5DBB84]',
          )}
        >
          {card.author[0]}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{card.author}</p>
          <p className="text-xs opacity-60">{card.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function TrustedBy() {
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
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="overflow-hidden bg-secondary/50 py-16 md:py-24">
      <div className="container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            <span
              className={cn(
                'block transition-all duration-700 ease-out',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              Trusted by
            </span>
            <span
              className={cn(
                'block text-muted-foreground transition-all delay-150 duration-700 ease-out',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              1,000+ travellers
            </span>
          </h2>
          <p
            className={cn(
              'max-w-xs text-muted-foreground transition-all delay-300 duration-700 ease-out',
              visible ? 'opacity-100' : 'opacity-0',
            )}
          >
            Real trips, real savings. Here&rsquo;s what people say after planning with Fermat.
          </p>
        </div>

        <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-10 pt-6 [scrollbar-width:none] lg:mx-0 lg:mt-16 lg:justify-center lg:gap-0 lg:overflow-visible lg:px-0">
          {cards.map((card, i) => {
            const pose = poses[i];
            return (
              <div
                key={i}
                className="relative w-[250px] shrink-0 snap-center transition-[transform,opacity] duration-1000 ease-[cubic-bezier(0.2,0.9,0.25,1.08)] hover:z-50 lg:-ml-10 lg:w-[230px] lg:first:ml-0 xl:w-[250px]"
                style={{
                  zIndex: i + 1,
                  transitionDelay: visible ? `${300 + i * 120}ms` : '0ms',
                  transform: visible
                    ? `translateY(${pose.y}px)`
                    : `translate(${55 + i * 6}vw, 45vh) rotate(${25 + i * 8}deg)`,
                  opacity: visible ? 1 : 0,
                }}
              >
                <div
                  className="h-[340px] shadow-[0_24px_50px_-24px_rgba(20,22,17,0.45)] transition-transform duration-300 ease-out [transform:rotate(var(--r))] hover:[transform:translateY(-12px)_rotate(0deg)]"
                  style={{ '--r': `${pose.r}deg`, borderRadius: '1.5rem' } as React.CSSProperties}
                >
                  <CardBody card={card} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
