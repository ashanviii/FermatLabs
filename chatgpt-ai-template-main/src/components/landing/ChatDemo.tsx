'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Hotel, Loader2, Plane, Stamp, UtensilsCrossed, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import FermatMark from './FermatMark';

type Scenario = {
  prompt: string;
  steps: string[];
  reply: string;
  chips: { icon: LucideIcon; label: string }[];
};

const scenarios: Scenario[] = [
  {
    prompt: 'Flying Delhi to Tokyo in March. Do I need a visa?',
    steps: ['Checking visa rules for Indian passports', 'Comparing flights DEL → NRT', 'Shortlisting stays near Shinjuku'],
    reply: "Yes, you'll need a Japan eVisa. I've drafted your document checklist and found 3 direct flights for your dates.",
    chips: [
      { icon: Stamp, label: 'Visa checklist' },
      { icon: Plane, label: '3 direct flights' },
      { icon: Hotel, label: 'Stays in Shinjuku' },
    ],
  },
  {
    prompt: 'Weekend in Lisbon from Paris, under €600?',
    steps: ['Scanning fares CDG → LIS', 'Matching hotels to your budget', 'Finding places locals eat'],
    reply: 'Done. Return flights plus two nights in Alfama come to about €540, and I saved three tascas locals swear by.',
    chips: [
      { icon: Plane, label: 'Fri → Sun' },
      { icon: Hotel, label: 'Alfama · 2 nights' },
      { icon: UtensilsCrossed, label: '3 restaurants' },
    ],
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ChatDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [pressing, setPressing] = useState(false);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState(-1);
  const [words, setWords] = useState(0);
  const [showChips, setShowChips] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (async () => {
      let i = 0;
      while (alive) {
        const s = scenarios[i];
        setIndex(i);
        setTyped('');
        setSent(false);
        setStep(-1);
        setWords(0);
        setShowChips(false);
        setFading(false);

        if (reduceMotion) {
          setSent(true);
          setStep(s.steps.length);
          setWords(s.reply.split(' ').length);
          setShowChips(true);
          return;
        }

        await sleep(600);
        for (let c = 1; c <= s.prompt.length && alive; c++) {
          setTyped(s.prompt.slice(0, c));
          await sleep(30 + Math.random() * 45);
        }
        await sleep(400);
        setPressing(true);
        await sleep(160);
        setPressing(false);
        setTyped('');
        setSent(true);
        await sleep(500);

        for (let k = 0; k <= s.steps.length && alive; k++) {
          setStep(k);
          await sleep(k === s.steps.length ? 300 : 900);
        }

        const total = s.reply.split(' ').length;
        for (let w = 1; w <= total && alive; w++) {
          setWords(w);
          await sleep(45 + Math.random() * 40);
        }
        await sleep(200);
        setShowChips(true);

        await sleep(4500);
        setFading(true);
        await sleep(450);
        i = (i + 1) % scenarios.length;
      }
    })();

    return () => {
      alive = false;
    };
  }, [inView]);

  const s = scenarios[index];
  const replyWords = s.reply.split(' ');
  const thinking = sent && step >= 0 && words === 0;
  const streaming = words > 0 && words < replyWords.length;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-xl text-left">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/20 blur-3xl" />

      <div className="overflow-hidden rounded-3xl border bg-card shadow-[0_1px_0_hsl(0_0%_100%)_inset,0_30px_80px_-30px_hsl(160_40%_20%/0.35)]">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <FermatMark className="h-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Fermat</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#4AA872]" />
                {thinking ? 'Researching…' : streaming ? 'Typing…' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {scenarios.map((_, k) => (
              <span
                key={k}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  k === index ? 'w-6 bg-[#4AA872]' : 'w-1.5 bg-border',
                )}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(
            'flex h-[340px] flex-col justify-end gap-4 overflow-hidden px-5 pb-5 pt-4 text-sm transition-opacity duration-500 sm:h-[236px]',
            fading && 'opacity-0',
          )}
        >
          {sent && (
            <div className="ml-auto max-w-[85%] animate-in fade-in slide-in-from-bottom-3 zoom-in-95 rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-background duration-300">
              {s.prompt}
            </div>
          )}

          {sent && step >= 0 && (
            <div className="flex animate-in fade-in slide-in-from-bottom-2 items-start gap-2.5 duration-300">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <FermatMark className="h-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-2.5">
                {words === 0 ? (
                  <ul className="space-y-1.5">
                    {s.steps.slice(0, Math.min(step + 1, s.steps.length)).map((label, k) => {
                      const done = k < step;
                      return (
                        <li key={label} className="flex animate-in fade-in slide-in-from-left-1 items-center gap-2 duration-300">
                          {done ? (
                            <span className="grid size-4 place-items-center rounded-full bg-foreground text-primary">
                              <Check className="size-2.5" strokeWidth={3} />
                            </span>
                          ) : (
                            <Loader2 className="size-4 animate-spin text-[#3D9163]" />
                          )}
                          <span
                            className={cn(
                              done
                                ? 'text-muted-foreground'
                                : 'animate-shimmer bg-[linear-gradient(90deg,hsl(var(--muted-foreground))_0%,hsl(var(--foreground))_50%,hsl(var(--muted-foreground))_100%)] bg-[length:200%_100%] bg-clip-text text-transparent',
                            )}
                          >
                            {label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="flex animate-in fade-in items-center gap-1.5 text-xs text-muted-foreground duration-300">
                    <Check className="size-3.5 text-[#3D9163]" />
                    Researched with {s.steps.length} agents
                  </p>
                )}

                {words > 0 && (
                  <div className="rounded-2xl rounded-tl-md border bg-background px-4 py-2.5 leading-relaxed">
                    {replyWords.slice(0, words).join(' ')}
                    {streaming && (
                      <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-[#3D9163]" />
                    )}
                  </div>
                )}

                {showChips && (
                  <div className="flex flex-wrap gap-2">
                    {s.chips.map(({ icon: Icon, label }, k) => (
                      <span
                        key={label}
                        style={{ animationDelay: `${k * 90}ms` }}
                        className="inline-flex animate-in fade-in zoom-in-90 slide-in-from-bottom-1 items-center gap-1.5 rounded-full border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground duration-300 fill-mode-both"
                      >
                        <Icon className="size-3.5 text-[#2F7650]" />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-center gap-2 rounded-full border bg-background py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 truncate text-sm">
              {typed ? (
                <>
                  {typed}
                  <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground" />
                </>
              ) : (
                <span className="text-muted-foreground">Ask Fermat anything about your trip…</span>
              )}
            </span>
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full transition-all duration-150',
                typed ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
                pressing && 'scale-90',
              )}
            >
              <ArrowUp className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
