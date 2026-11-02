'use client';

import React, { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Animated 1-bit dither: a slow, smooth field run through an 8x8 ordered (Bayer) matrix and drawn at low resolution,
 * so each lit cell is a crisp square. Decorative only. Draws at ~30fps, pauses off screen and in background tabs,
 * and shows a single still frame under Reduce Motion.
 *
 *   <DitherField pattern="waves" rgb={[19, 19, 22]} alpha={0.22} className="absolute inset-0 -z-10" />
 */

// Classic 8x8 Bayer matrix, normalised to 0..1 thresholds.
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51,
  19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

export type DitherPattern = 'waves' | 'orbs' | 'horizon';

/** Brightness 0..1 at cell (x, y), time t (seconds). w/h are the grid size in cells. */
function sample(pattern: DitherPattern, x: number, y: number, w: number, h: number, t: number) {
  const u = x / w;
  const v = y / h;
  if (pattern === 'orbs') {
    // Two soft blobs drifting around each other.
    const ax = 0.3 + 0.12 * Math.sin(t * 0.5);
    const ay = 0.45 + 0.18 * Math.cos(t * 0.4);
    const bx = 0.72 + 0.1 * Math.cos(t * 0.35);
    const by = 0.55 + 0.2 * Math.sin(t * 0.45);
    const aspect = w / h;
    const da = Math.hypot((u - ax) * aspect, v - ay);
    const db = Math.hypot((u - bx) * aspect, v - by);
    return Math.min(1, Math.exp(-da * da * 6) + 0.85 * Math.exp(-db * db * 8));
  }
  if (pattern === 'horizon') {
    // Rolling hills that get denser toward the bottom edge.
    const hill = 0.62 + 0.06 * Math.sin(u * 9 + t * 0.6) + 0.04 * Math.sin(u * 23 - t * 0.9);
    const ramp = Math.max(0, (v - hill + 0.25) / 0.45);
    return Math.min(1, ramp * ramp);
  }
  // waves: interfering sine bands.
  const a = Math.sin(u * 7 + t * 0.7) * Math.cos(v * 5 - t * 0.5);
  const b = Math.sin((u + v) * 6 - t * 0.9);
  return 0.5 + 0.32 * a + 0.18 * b;
}

export interface DitherFieldProps {
  pattern?: DitherPattern;
  /** Dot colour. */
  rgb?: [number, number, number];
  /** Dot opacity, 0..1. */
  alpha?: number;
  /** Size of one dither cell in CSS pixels. */
  cell?: number;
  /** Scales the field before thresholding: lower = sparser. */
  intensity?: number;
  /** Time multiplier. */
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function DitherField({ pattern = 'waves', rgb = [19, 19, 22], alpha = 0.2, cell = 3, intensity = 1, speed = 1, className, style }: DitherFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [r, g, b] = rgb;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let image: ImageData | null = null;
    let frame = 0;
    let last = 0;
    let visible = true;
    const start = performance.now();
    const a = Math.round(alpha * 255);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.ceil(rect.width / cell));
      h = Math.max(1, Math.ceil(rect.height / cell));
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
    };

    const draw = (now: number) => {
      if (!image) return;
      const t = ((now - start) / 1000) * speed;
      const data = image.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const on = sample(pattern, x, y, w, h, t) * intensity > BAYER[(y & 7) * 8 + (x & 7)];
          const i = (y * w + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = on ? a : 0;
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 33) return;
      last = now;
      draw(now);
    };

    resize();
    draw(start);
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: '100px' });
    io.observe(canvas);
    if (!still) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, [pattern, r, g, b, alpha, cell, intensity, speed]);

  return <canvas ref={canvasRef} aria-hidden className={cn('pointer-events-none block h-full w-full [image-rendering:pixelated]', className)} style={style} />;
}
