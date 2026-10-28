'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * Animated ASCII pieces. Every one of them:
 * - draws a finished still frame on the server and on first paint (no empty box, no layout shift),
 * - animates only while on screen and while the tab is visible,
 * - shows that still frame and never moves under prefers-reduced-motion,
 * - is decorative (aria-hidden) unless given a `label`.
 */

/** Calls `draw(tick)` about `fps` times a second while the element is visible and motion is allowed. */
function useAsciiLoop(ref: React.RefObject<HTMLElement | null>, draw: (tick: number) => void, fps = 24) {
  const drawRef = React.useRef(draw);
  drawRef.current = draw;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let raf = 0;
    let last = 0;
    let onScreen = false;
    const interval = 1000 / fps;

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (time - last < interval) return;
      last = time;
      frame += 1;
      drawRef.current(frame);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (onScreen && document.visibilityState === 'visible') raf = requestAnimationFrame(loop);
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref, fps]);
}

const a11y = (label?: string) => (label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const });

/* ---------------------------------------------------------------------------------------------------------------- */
/* Route drawing (trip locked)                                                                                        */
/* ---------------------------------------------------------------------------------------------------------------- */

export interface AsciiRouteProps {
  from: string;
  to: string;
  /** Dots between the two ends. */
  length?: number;
  label?: string;
  className?: string;
}

/**
 * A flight path drawing itself from `from` to `to`, then holding before it loops:
 *   DEL o . . . . . . . . =>  GOA
 */
export function AsciiRoute({ from, to, length = 22, label, className }: AsciiRouteProps) {
  const total = length + 14; // draw, then hold the finished line for a beat
  const line = (n: number) => {
    const drawn = Math.min(n, length);
    const path = Array.from({ length }, (_, i) => (i < drawn ? (i === drawn - 1 && drawn < length ? '>' : '.') : ' ')).join(' ');
    const done = drawn >= length;
    return `${from} o ${path} ${done ? '=> ' : '   '}${done ? to : to.replace(/./g, ' ')}`;
  };
  const ref = React.useRef<HTMLPreElement>(null);
  useAsciiLoop(ref, (tick) => {
    if (ref.current) ref.current.textContent = line(tick % total);
  }, 10);

  return (
    <pre ref={ref} className={cn('ascii', className)} suppressHydrationWarning {...a11y(label)}>
      {line(length)}
    </pre>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */
/* Spinner                                                                                                            */
/* ---------------------------------------------------------------------------------------------------------------- */

const SPIN = ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]'];

/** Text spinner for loading screens. Pair it with a visible status message. */
export function AsciiSpinner({ className }: { className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  useAsciiLoop(ref, (tick) => {
    if (ref.current) ref.current.textContent = SPIN[tick % SPIN.length];
  }, 8);
  return (
    <span ref={ref} aria-hidden className={cn('ascii inline-block', className)} suppressHydrationWarning>
      {SPIN[3]}
    </span>
  );
}
