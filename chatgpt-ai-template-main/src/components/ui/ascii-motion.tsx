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
/* Background field                                                                                                   */
/* ---------------------------------------------------------------------------------------------------------------- */

// Light to dense. Starts with a space so the quietest parts of the field stay empty.
const RAMP = ' .,:-=+*';

export interface AsciiFieldProps {
  /** Glyph colour, including its opacity. Keep it faint: this sits behind text. */
  color?: string;
  /** Row height in CSS pixels; columns are a little narrower so the grid reads as square. */
  cell?: number;
  fps?: number;
  className?: string;
}

/**
 * A full-bleed field of ASCII characters whose density drifts like slow interfering waves.
 * Decorative. Place it absolutely behind content and shape it with a mask-image.
 *
 *   <AsciiField className="absolute inset-0 -z-10 [mask-image:radial-gradient(...)]" />
 */
export function AsciiField({ color = 'rgba(255, 255, 255, 0.16)', cell = 14, fps = 10, className }: AsciiFieldProps) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const grid = React.useRef({ cols: 0, rows: 0, cw: 0, ch: 0, font: '' });

  const draw = React.useCallback(
    (tick: number) => {
      const canvas = ref.current;
      const ctx = canvas?.getContext('2d');
      const { cols, rows, cw, ch, font } = grid.current;
      if (!canvas || !ctx || !cols) return;
      const t = tick / fps;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / (cols * cw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      for (let y = 0; y < rows; y++) {
        const v = y / rows;
        for (let x = 0; x < cols; x++) {
          const u = x / cols;
          const a = Math.sin(u * 6 + t * 0.5) * Math.cos(v * 4 - t * 0.35);
          const b = Math.sin((u - v) * 5 + t * 0.7);
          const level = 0.5 + 0.34 * a + 0.2 * b;
          const glyph = RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(level * RAMP.length)))];
          if (glyph !== ' ') ctx.fillText(glyph, x * cw, y * ch);
        }
      }
    },
    [color, fps],
  );

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(cell * 0.72);
      const cols = Math.ceil(rect.width / cw);
      const rows = Math.ceil(rect.height / cell);
      canvas.width = Math.ceil(cols * cw * dpr);
      canvas.height = Math.ceil(rows * cell * dpr);
      grid.current = { cols, rows, cw, ch: cell, font: `${Math.round(cell * 0.85)}px ${getComputedStyle(canvas).fontFamily}` };
      draw(0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [cell, draw]);

  useAsciiLoop(ref, draw, fps);

  // The canvas buffer is sized to whole cells, so it can run a few pixels past the box; object-cover crops that edge.
  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none block size-full object-cover object-left-top font-mono', className)} />;
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
