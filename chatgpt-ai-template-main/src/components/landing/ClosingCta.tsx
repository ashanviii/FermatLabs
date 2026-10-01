'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Plane } from 'lucide-react';

import { cn } from '@/lib/utils';
import FermatMark from './FermatMark';

// Each sticker drops in with a small overshoot, then rests at its own tilt.
function Sticker({
  children,
  rotate,
  delay,
  visible,
  className,
}: {
  children: React.ReactNode;
  rotate: number;
  delay: number;
  visible: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        className,
      )}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible
          ? `rotate(${rotate}deg) scale(1)`
          : `translateY(24px) rotate(${rotate - 18}deg) scale(0.4)`,
      }}
    >
      <span className="inline-flex transition-transform duration-300 hover:-rotate-6 hover:scale-105">{children}</span>
    </span>
  );
}

const pill =
  'rounded-full border-[2.5px] border-[#0B1F17] px-4 py-1 text-3xl font-semibold leading-tight tracking-tight sm:px-5 sm:text-5xl';
const circle = 'grid size-12 place-items-center rounded-full border-[2.5px] border-[#0B1F17] sm:size-14';

// Rounded so server and browser produce identical markup (raw trig floats differ slightly).
const starburstPoints = Array.from({ length: 24 }, (_, i) => {
  const r = i % 2 === 0 ? 48 : 38;
  const a = (Math.PI * i) / 12 - Math.PI / 2;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

function Starburst({ className }: { className?: string }) {
  const d = starburstPoints;
  return (
    <span className={cn('relative grid size-16 place-items-center sm:size-20', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin-slow" aria-hidden>
        <polygon points={d} fill="#F8E6A0" stroke="#0B1F17" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <FermatMark className="relative h-7 text-[#0B1F17] sm:h-8" />
    </span>
  );
}

export default function ClosingCta() {
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
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="container pb-6 md:pb-10">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[2rem] bg-[#DCF2E3] px-6 py-12 text-[#0B1F17] md:px-12 md:py-16"
      >
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-[#F8E6A0]/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#5DBB84]/20 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-3" aria-label="Your next trip is one chat away">
            <div className="flex items-center gap-3">
              <Sticker visible={visible} delay={0} rotate={-8}>
                <span className={circle}>
                  <Plane className="size-5 sm:size-6" />
                </span>
              </Sticker>
              <Sticker visible={visible} delay={120} rotate={-4}>
                <span className={pill}>Your</span>
              </Sticker>
            </div>
            <div className="flex items-center gap-3 pl-6 sm:pl-12">
              <Sticker visible={visible} delay={240} rotate={3}>
                <span className={pill}>next trip</span>
              </Sticker>
              <Sticker visible={visible} delay={360} rotate={0}>
                <span className={cn(circle, 'bg-white/50')}>
                  <Compass className="size-5 sm:size-6" />
                </span>
              </Sticker>
            </div>
            <div className="flex items-center gap-3 pl-24 sm:pl-44">
              <Sticker visible={visible} delay={480} rotate={-6}>
                <span className={pill}>is</span>
              </Sticker>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Sticker visible={visible} delay={600} rotate={-2}>
                <span className={cn(pill, 'bg-[#0B1F17] text-[#DCF2E3]')}>one chat away</span>
              </Sticker>
              <Sticker visible={visible} delay={760} rotate={10}>
                <Starburst />
              </Sticker>
            </div>
          </div>

          <div
            className={cn(
              'transition-all delay-300 duration-700 ease-out lg:pl-6',
              visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
            )}
          >
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Feeling inspired to plan your next trip?
            </h2>
            <p className="mt-3 max-w-sm text-[#0B1F17]/70">
              Tell Fermat where you want to go and get visas, flights and stays sorted in one conversation.
            </p>
            <Link
              href="/"
              className="group mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#141611] px-7 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(20,22,17,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#2A2D27]"
            >
              Start planning
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <nav className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
              {['Support', 'Privacy', 'Terms', 'FAQ'].map((item) => (
                <span key={item} className="cursor-pointer underline-offset-4 transition-colors hover:underline">
                  {item}
                </span>
              ))}
            </nav>
          </div>
        </div>

        <div className="relative mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#0B1F17]/15 pt-6 text-sm sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-base font-semibold">
            <FermatMark className="h-6" />
            Fermat
          </span>
          <span className="text-[#0B1F17]/60">© {new Date().getFullYear()} Fermat AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
