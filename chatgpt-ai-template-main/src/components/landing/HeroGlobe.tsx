'use client';

import * as React from 'react';
import { geoCircle, geoDistance, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo';
import type { Feature, MultiLineString } from 'geojson';

import { cn } from '@/lib/utils';

/*
 * Landing hero globe, in the spirit of GitHub's: real country shapes on a soft, glassy sphere that never stops turning.
 *
 * - Steady spin. Several group "flights" are in the air at once: each is a glowing streak with a fading tail that
 *   arcs higher the longer the trip, and lands with a ripple on the surface.
 * - Google Maps-style pins mark the cities; they drop in with a bounce as a city turns into view.
 * - A place card (photo, name, country) springs up from a pin when a flight lands there, and on hover or tap.
 *   While a card is up the spin eases down; hovering a pin pauses it.
 * - iMessage-style bubbles carry a word per city ("budget", "visa timing"...).
 * - Drag to spin; the flick's momentum eases back into the steady turn.
 * - Smoothness: everything is time-based, the sphere shading and the pin/glow sprites are pre-rendered once per
 *   resize, there are no per-frame canvas blurs, and the loop pauses off screen and in background tabs.
 * - Reduce Motion: no spin, no flights in the air, no drops or springs; one route is drawn still. Drag still works.
 *
 * Canvas can't read Tailwind tokens, so the colours below mirror tailwind.config.js (ink, warm) and Google's pin red.
 */

type LonLat = [number, number];
type Point = [number, number];

interface City {
  code: string;
  name: string;
  country: string;
  at: LonLat;
  /** Unsplash photo id for the place card. */
  photo?: string;
  /** Word for the city's message bubble. Keep tags spread out; neighbours with tags overlap. */
  tag?: string;
  /** Which side of the pin the bubble sits on (default right). */
  side?: 'left' | 'right';
}

const CITIES: City[] = [
  { code: 'DEL', name: 'Delhi', country: 'India', at: [77.2, 28.6], photo: '1587474260584-136574528ed5', tag: 'budget', side: 'left' },
  { code: 'BOM', name: 'Mumbai', country: 'India', at: [72.88, 19.08], photo: '1569758267239-d08deb78bb1a', side: 'left' },
  { code: 'BLR', name: 'Bengaluru', country: 'India', at: [77.59, 12.97] },
  { code: 'GOI', name: 'Goa', country: 'India', at: [73.83, 15.5], photo: '1512343879784-a960bf40e7f2' },
  { code: 'KTM', name: 'Kathmandu', country: 'Nepal', at: [85.32, 27.72], photo: '1605640840605-14ac1855827b' },
  { code: 'CMB', name: 'Colombo', country: 'Sri Lanka', at: [79.86, 6.93] },
  { code: 'DPS', name: 'Bali', country: 'Indonesia', at: [115.19, -8.41], photo: '1518548419970-58e3b4079ab2', tag: 'everyone can go' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand', at: [100.5, 13.75], photo: '1563492065599-3520f775eeed', tag: 'nightlife' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore', at: [103.82, 1.35], photo: '1525625293386-3f8f99389edd' },
  { code: 'NRT', name: 'Tokyo', country: 'Japan', at: [139.69, 35.68], photo: '1513407030348-c983a97b98d8', tag: 'food' },
  { code: 'DXB', name: 'Dubai', country: 'United Arab Emirates', at: [55.27, 25.2], photo: '1512453979798-5ea266f8880c', tag: 'long weekend', side: 'left' },
  { code: 'IST', name: 'Istanbul', country: 'Türkiye', at: [28.98, 41.01], photo: '1524231757912-21f4fe3a7200', tag: 'vote' },
  { code: 'CDG', name: 'Paris', country: 'France', at: [2.35, 48.86], photo: '1502602898657-3e91760cbb34', tag: 'passport', side: 'left' },
  { code: 'LIS', name: 'Lisbon', country: 'Portugal', at: [-9.14, 38.72], photo: '1585208798174-6cedd86e019a', side: 'left' },
  { code: 'RAK', name: 'Marrakech', country: 'Morocco', at: [-7.99, 31.63], photo: '1597212618440-806262de4f6b', tag: 'visa timing', side: 'left' },
  { code: 'NBO', name: 'Nairobi', country: 'Kenya', at: [36.82, -1.29], photo: '1481464904474-a575a33b44a0', tag: 'safari' },
  { code: 'CPT', name: 'Cape Town', country: 'South Africa', at: [18.42, -33.92], photo: '1580060839134-75a5edca2e99', tag: 'split costs' },
  { code: 'JFK', name: 'New York', country: 'United States', at: [-74, 40.71], photo: '1496588152823-86ff7695e68f', tag: 'any currency', side: 'left' },
  // The far side of the world, so every part of the turn has something going on.
  { code: 'LAX', name: 'Los Angeles', country: 'United States', at: [-118.24, 34.05], photo: '1580655653885-65763b2597d0', tag: 'road trip' },
  { code: 'MEX', name: 'Mexico City', country: 'Mexico', at: [-99.13, 19.43], photo: '1547686669-9a8cb1a22d91', side: 'left' },
  { code: 'GIG', name: 'Rio de Janeiro', country: 'Brazil', at: [-43.17, -22.91], photo: '1483729558449-99ef09a8c325', tag: 'carnival' },
  { code: 'SYD', name: 'Sydney', country: 'Australia', at: [151.21, -33.87], photo: '1506973035872-a4ec16b8e8d9', tag: 'pledges' },
];

const byCode = Object.fromEntries(CITIES.map((c) => [c.code, c]));

// Example group trips, taken in turn whenever their arc is on the visible side.
const FLIGHTS: [string, string][] = [
  ['DEL', 'DPS'],
  ['BOM', 'LIS'],
  ['BLR', 'IST'],
  ['DEL', 'NRT'],
  ['BOM', 'DXB'],
  ['DEL', 'CDG'],
  ['BLR', 'BKK'],
  ['BOM', 'NBO'],
  ['DEL', 'KTM'],
  ['JFK', 'LIS'],
  ['BOM', 'SIN'],
  ['DEL', 'RAK'],
  ['BLR', 'GOI'],
  ['BOM', 'CPT'],
  ['DEL', 'IST'],
  ['CMB', 'DPS'],
  ['JFK', 'MEX'],
  ['LAX', 'MEX'],
  ['JFK', 'GIG'],
  ['LAX', 'NRT'],
  ['SYD', 'DPS'],
  ['JFK', 'CDG'],
  ['LAX', 'SYD'],
  ['GIG', 'LIS'],
  ['SIN', 'SYD'],
];

// Square thumbnails for the place card (2x its 44px size).
const photoUrl = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=120&h=120&q=75`;

// Motion
const BASE_SPEED = 3; // degrees per second of steady eastward turn (a full turn in two minutes)
const SPIN_EASE = 1.1; // seconds for the spin to ease back to steady after a drag or a pause
const TILT_EASE = 0.9;
const TILT_LIMIT = 55;
const SPAWN_MS = 1300; // a new flight at most this often
const MAX_FLIGHTS = 4;
const TAIL_LAG = 0.45; // the tail follows the head by this share of the trip
const RIPPLE_MS = 1600;
const FEATURE_HOLD = 3800; // how long a landing's place card stays up
const FEATURE_GAP = 1400; // quiet time between landing cards
const TYPING_MS = 650; // how long a bubble shows the typing dots before its text
const OUT_MS = 220;

// Dome mode shows only the top half; tilt so the northern band with most cities sits above the cut.
const TILT = { full: -12, dome: 14 };

const C = {
  sphereHi: '#FCFCFD',
  sphereMid: '#EFEFF2',
  sphereLo: '#D8D8DE',
  land: 'rgba(160, 160, 170, 0.5)',
  border: 'rgba(255, 255, 255, 0.75)',
  rim: 'rgba(19, 19, 22, 0.08)',
  route: '227, 169, 43', // warm, as "r, g, b" so alpha can vary
  glow: '247, 210, 92',
  pin: '#EA4335', // Google Maps pin red
  pinDark: '#B31412',
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
/** Underdamped spring from 0 to 1 (t in seconds): a quick pop with one soft overshoot. */
const spring = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-9 * t) * Math.cos(13 * t));

interface Flight {
  from: string;
  to: string;
  t0: number;
  travel: number; // ms for the head to cross
  lift: number; // arc height as a share of the radius
  interp: (t: number) => LonLat;
  landed: boolean;
}

interface Pop {
  shown: boolean;
  at: number;
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function makeFlight(from: string, to: string, t0: number): Flight {
  const a = byCode[from].at;
  const b = byCode[to].at;
  const dist = geoDistance(a, b);
  return {
    from,
    to,
    t0,
    travel: 1500 + 1100 * (dist / Math.PI),
    lift: 0.05 + 0.24 * (dist / Math.PI),
    interp: geoInterpolate(a, b) as (t: number) => LonLat,
    landed: false,
  };
}

/** Pre-render a sprite once (at device pixel ratio) so drawing it each frame is a cheap drawImage. */
function sprite(w: number, h: number, dpr: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  paint(ctx);
  return c;
}

const PIN_W = 22;
const PIN_H = 30;
const PIN_TIP_Y = 27; // tip inside the sprite (room below for its shadow)
const PIN_HEAD = 16; // head centre above the tip
const CARD_ROOM = 110; // a card opens below its pin when the pin is closer than this to the globe's top edge

export interface HeroGlobeProps {
  className?: string;
  /** Show only the top half (a dome cut at the equator line), with a soft fade at the cut. */
  dome?: boolean;
}

export default function HeroGlobe({ className, dome = false }: HeroGlobeProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const bubbleRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();
  // The place card's content. Only changes when a different city's card opens, so React re-renders rarely.
  const [card, setCard] = React.useState<{ code: string; from: string | null } | null>(null);

  const baseTilt = dome ? TILT.dome : TILT.full;

  // Mutable animation state, kept out of React so the loop never re-renders.
  const state = React.useRef({
    rot: [-80, baseTilt] as LonLat, // projection rotate [lambda, phi]
    spin: -BASE_SPEED, // degrees per second
    dragging: false,
    last: null as null | { x: number; y: number; t: number },
    moved: 0,
    flights: [] as Flight[],
    ripples: [] as { at: LonLat; t0: number }[],
    nextFlight: 0,
    lastSpawn: -1e9,
    land: null as null | Feature,
    borders: null as null | MultiLineString,
    landStart: 0,
    size: 0,
    dpr: 1,
    layers: null as null | { base: HTMLCanvasElement; shade: HTMLCanvasElement; pin: HTMLCanvasElement; glow: HTMLCanvasElement },
    screen: CITIES.map(() => ({ x: 0, y: 0, vis: 0 })),
    pins: CITIES.map((): Pop => ({ shown: false, at: 0 })),
    bubbles: CITIES.map((): Pop => ({ shown: false, at: 0 })),
    hover: null as string | null,
    featured: null as string | null,
    featuredFrom: null as string | null,
    featuredUntil: 0,
    cardCity: null as string | null,
    cardPop: { shown: false, at: 0 } as Pop,
    draw: (_now?: number) => {},
  });

  // Preload the place photos so a card never pops up empty.
  React.useEffect(() => {
    CITIES.forEach((city) => {
      if (city.photo) new Image().src = photoUrl(city.photo);
    });
  }, []);

  // Load the country shapes lazily so the hero paints first.
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]).then(([topo, atlas]) => {
      if (cancelled) return;
      const world: any = (atlas as any).default ?? atlas;
      const s = state.current;
      s.land = topo.feature(world, world.objects.land) as unknown as Feature;
      s.borders = topo.mesh(world, world.objects.countries, (a: unknown, b: unknown) => a !== b) as MultiLineString;
      s.landStart = performance.now();
      s.draw();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Canvas sizing, drawing and the animation loop.
  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = state.current;
    s.rot[1] = baseTilt;
    // Per-city state is sized to CITIES; rebuild it if the list changed (keeps hot reloads from crashing the loop).
    if (s.pins.length !== CITIES.length) {
      s.screen = CITIES.map(() => ({ x: 0, y: 0, vis: 0 }));
      s.pins = CITIES.map((): Pop => ({ shown: false, at: 0 }));
      s.bubbles = CITIES.map((): Pop => ({ shown: false, at: 0 }));
    }

    const projection = geoOrthographic().clipAngle(90).precision(0.5);
    const path = geoPath(projection, ctx);
    const circle = geoCircle();

    const geometry = () => {
      const size = s.size;
      return { size, r: size / 2 - 30, cx: size / 2, cy: size / 2 };
    };

    const buildLayers = () => {
      const { size, r, cx, cy } = geometry();
      const dpr = s.dpr;
      const base = sprite(size, size, dpr, (g) => {
        const grad = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
        grad.addColorStop(0, C.sphereHi);
        grad.addColorStop(0.6, C.sphereMid);
        grad.addColorStop(1, C.sphereLo);
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fillStyle = grad;
        g.fill();
      });
      const shade = sprite(size, size, dpr, (g) => {
        const grad = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r * 1.15);
        grad.addColorStop(0, 'rgba(255,255,255,0.45)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(19,19,22,0.16)');
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = C.rim;
        g.lineWidth = 1;
        g.stroke();
      });
      // Google Maps-style pin: red teardrop, dark centre, soft shadow at the tip.
      const pin = sprite(PIN_W, PIN_H, dpr, (g) => {
        const x = PIN_W / 2;
        const tip = PIN_TIP_Y;
        const hy = tip - PIN_HEAD;
        const R = 7.5;
        g.save();
        g.filter = 'blur(1.2px)';
        g.beginPath();
        g.ellipse(x, tip, 4, 1.6, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(19,19,22,0.28)';
        g.fill();
        g.restore();
        g.beginPath();
        g.moveTo(x, tip);
        g.bezierCurveTo(x - 1.5, tip - 5, x - R, hy + R * 0.7, x - R, hy);
        g.arc(x, hy, R, Math.PI, 0);
        g.bezierCurveTo(x + R, hy + R * 0.7, x + 1.5, tip - 5, x, tip);
        g.closePath();
        g.fillStyle = C.pin;
        g.fill();
        g.strokeStyle = C.pinDark;
        g.lineWidth = 0.8;
        g.stroke();
        g.beginPath();
        g.arc(x, hy, 2.8, 0, Math.PI * 2);
        g.fillStyle = C.pinDark;
        g.fill();
      });
      const glow = sprite(28, 28, dpr, (g) => {
        const grad = g.createRadialGradient(14, 14, 0, 14, 14, 14);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.22, `rgba(${C.glow}, 0.95)`);
        grad.addColorStop(1, `rgba(${C.glow}, 0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, 28, 28);
      });
      s.layers = { base, shade, pin, glow };
    };

    const resize = () => {
      const size = wrap.clientWidth;
      // Not laid out yet (or too small to draw a globe): wait for the next resize.
      if (size < 120) {
        s.size = 0;
        return;
      }
      s.size = size;
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * s.dpr);
      canvas.height = Math.round(size * s.dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      buildLayers();
      s.draw();
    };

    /** A point on a flight's arc, lifted off the surface; null when it's behind the globe. */
    const arcPoint = (f: Flight, t: number, center: LonLat, cx: number, cy: number): Point | null => {
      const ll = f.interp(t);
      if (geoDistance(ll, center) > Math.PI / 2 - 0.01) return null;
      const p = projection(ll);
      if (!p) return null;
      const lift = 1 + f.lift * Math.sin(Math.PI * t);
      return [cx + (p[0] - cx) * lift, cy + (p[1] - cy) * lift];
    };

    /** The streak: brightest and thickest at the head, fading to nothing at the tail. */
    const drawStreak = (f: Flight, tail: number, head: number, center: LonLat, cx: number, cy: number, glowHead: boolean) => {
      if (head - tail <= 0.001) return;
      const steps = 36;
      let prev: Point | null = null;
      ctx.lineCap = 'round';
      for (let k = 0; k <= steps; k++) {
        const t = tail + ((head - tail) * k) / steps;
        const pt = arcPoint(f, t, center, cx, cy);
        if (pt && prev) {
          const frac = k / steps;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(pt[0], pt[1]);
          ctx.strokeStyle = `rgba(${C.route}, ${(0.08 + 0.92 * frac * frac).toFixed(3)})`;
          ctx.lineWidth = 1 + 2.2 * frac;
          ctx.stroke();
        }
        prev = pt;
      }
      if (glowHead && prev && s.layers) ctx.drawImage(s.layers.glow, prev[0] - 14, prev[1] - 14, 28, 28);
    };

    const popValues = (pop: Pop, now: number) => {
      if (reduced) return { scale: 1, alpha: pop.shown ? 1 : 0, t: 1 };
      if (pop.shown) {
        const t = (now - pop.at) / 1000;
        return { scale: spring(t), alpha: clamp01(t / 0.12), t };
      }
      const t = clamp01((now - pop.at) / OUT_MS);
      return { scale: 1 - 0.4 * t * t, alpha: 1 - t, t };
    };
    const setPop = (pop: Pop, want: boolean, now: number) => {
      if (want === pop.shown) return false;
      pop.shown = want;
      pop.at = now;
      return true;
    };

    const draw = (now = performance.now()) => {
      const { size, r, cx, cy } = geometry();
      if (!size || !s.layers) return;
      projection.scale(r).translate([cx, cy]).rotate([s.rot[0], s.rot[1], 0]);
      const center: LonLat = [-s.rot[0], -s.rot[1]];

      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(s.layers.base, 0, 0, size, size);

      if (s.land) {
        ctx.globalAlpha = reduced ? 1 : clamp01((now - s.landStart) / 900);
        ctx.beginPath();
        path(s.land);
        ctx.fillStyle = C.land;
        ctx.fill();
        ctx.beginPath();
        path(s.borders!);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(s.layers.shade, 0, 0, size, size);

      // Landing ripples: a ring that spreads across the surface and fades.
      s.ripples = s.ripples.filter((rp) => now - rp.t0 < RIPPLE_MS);
      for (const rp of s.ripples) {
        const t = (now - rp.t0) / RIPPLE_MS;
        ctx.beginPath();
        path(circle.center(rp.at).radius(0.4 + easeInOutSine(t) * 4.5)());
        ctx.strokeStyle = `rgba(${C.route}, ${(0.7 * (1 - t)).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Flights.
      if (reduced) {
        const f = s.flights[0];
        if (f) drawStreak(f, 0, 1, center, cx, cy, false);
      } else {
        s.flights = s.flights.filter((f) => {
          const u = (now - f.t0) / f.travel;
          const head = easeInOutSine(clamp01(u));
          const tail = easeInOutSine(clamp01(u - TAIL_LAG));
          if (!f.landed && u >= 1) {
            f.landed = true;
            s.ripples.push({ at: byCode[f.to].at, t0: now });
            onLand(f, now);
          }
          if (tail >= 1) return false;
          drawStreak(f, tail, head, center, cx, cy, u < 1);
          return true;
        });
      }

      // Pins: drop in with a bounce as a city turns into view.
      CITIES.forEach((city, i) => {
        const p = projection(city.at);
        const belowCut = dome && p ? smoothstep(cy - 20, cy - 70, p[1]) : 1;
        const vis = p ? smoothstep(Math.PI / 2 - 0.08, Math.PI / 2 - 0.4, geoDistance(city.at, center)) * belowCut : 0;
        s.screen[i] = { x: p ? p[0] : 0, y: p ? p[1] : 0, vis };
        const pop = s.pins[i];
        setPop(pop, vis > 0.3, now);
        const { scale, alpha } = popValues(pop, now);
        const a = alpha * vis;
        if (!p || a <= 0.01) return;
        ctx.globalAlpha = Math.min(1, a);
        if (city.photo) {
          const drop = pop.shown ? (1 - scale) * 22 : 0;
          ctx.drawImage(s.layers!.pin, p[0] - PIN_W / 2, p[1] - PIN_TIP_Y - drop, PIN_W, PIN_H);
        } else {
          // Cities without a place card (trip origins) get a quiet white dot, so pins don't crowd.
          ctx.beginPath();
          ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = 'rgba(19,19,22,0.18)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      placeCard(now);
      placeBubbles(now);
    };

    // A flight landed: feature its destination's place card, if there's a photo and room for it.
    const onLand = (f: Flight, now: number) => {
      const city = byCode[f.to];
      const i = CITIES.indexOf(city);
      if (!city.photo || s.hover || now < s.featuredUntil + FEATURE_GAP) return;
      // Needs a clear view, room above for the card (so it doesn't run under the nav), and, in dome mode, the cut below.
      const { y, vis } = s.screen[i];
      if (vis < 0.7 || y < CARD_ROOM || (dome && y > geometry().cy - 90)) return;
      s.featured = f.to;
      s.featuredFrom = f.from;
      s.featuredUntil = now + FEATURE_HOLD;
    };

    const placeCard = (now: number) => {
      const el = cardRef.current;
      if (!el) return;
      const want = s.hover ?? (now < s.featuredUntil ? s.featured : null);
      const wantIndex = want ? CITIES.findIndex((c) => c.code === want) : -1;
      const visible = wantIndex >= 0 && s.screen[wantIndex].vis > 0.5;
      if (visible && (want !== s.cardCity || !s.cardPop.shown)) {
        s.cardCity = want;
        s.cardPop = { shown: true, at: now };
        // Like Google Maps, a card near the top edge opens below its pin instead. Decided once, as it opens, so it
        // never flips while it's up.
        el.dataset.below = s.screen[wantIndex].y < CARD_ROOM ? 'true' : 'false';
        setCard({ code: want!, from: s.hover ? null : s.featuredFrom });
      } else if (!visible && s.cardPop.shown) {
        setPop(s.cardPop, false, now);
      }
      if (!visible && !s.cardPop.shown && now - s.cardPop.at > OUT_MS) s.cardCity = null;

      const i = s.cardCity ? CITIES.findIndex((c) => c.code === s.cardCity) : -1;
      const { scale, alpha } = popValues(s.cardPop, now);
      if (i < 0 || alpha <= 0.01) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        return;
      }
      const { x, y } = s.screen[i];
      const below = el.dataset.below === 'true';
      const k = (0.6 + 0.4 * scale).toFixed(3);
      el.style.opacity = alpha.toFixed(3);
      el.style.transform = below
        ? `translate3d(${x.toFixed(1)}px, ${(y + 6).toFixed(1)}px, 0) translate(-50%, 0) scale(${k})`
        : `translate3d(${x.toFixed(1)}px, ${(y - PIN_HEAD - 14).toFixed(1)}px, 0) translate(-50%, -100%) scale(${k})`;
    };

    // Message bubbles sit above the pin head; the city with an open card hides its bubble.
    const placeBubbles = (now: number) => {
      CITIES.forEach((city, i) => {
        const el = bubbleRefs.current[i];
        if (!el) return;
        const { x, y, vis } = s.screen[i];
        const pop = s.bubbles[i];
        const covered = s.cardCity === city.code && s.cardPop.shown;
        if (setPop(pop, vis > 0.45 && !covered, now) && pop.shown && !reduced) el.dataset.typing = 'true';
        if (pop.shown && el.dataset.typing === 'true' && now - pop.at > TYPING_MS) el.dataset.typing = 'false';
        const { scale, alpha } = popValues(pop, now);
        if (alpha <= 0.01) {
          if (el.style.opacity !== '0') el.style.opacity = '0';
          return;
        }
        const left = city.side === 'left';
        const bob = reduced ? 0 : Math.sin(now / 1400 + i * 1.7) * 1.5;
        el.style.opacity = alpha.toFixed(3);
        el.style.transform = `translate3d(${(left ? x - 8 : x + 8).toFixed(1)}px, ${(y - PIN_HEAD - 4 + bob).toFixed(1)}px, 0) translate(${left ? '-100%' : '0'}, -100%) scale(${scale.toFixed(3)})`;
      });
    };

    s.draw = draw;

    // Start a new flight whose arc is on the visible side.
    const spawn = (now: number) => {
      const center: LonLat = [-s.rot[0], -s.rot[1]];
      for (let k = 0; k < FLIGHTS.length; k++) {
        const idx = (s.nextFlight + k) % FLIGHTS.length;
        const [from, to] = FLIGHTS[idx];
        if (s.flights.some((f) => f.from === from && f.to === to)) continue;
        const mid = geoInterpolate(byCode[from].at, byCode[to].at)(0.5) as LonLat;
        // The view drifts east, so favour arcs a little east of centre: they stay in view for their whole flight.
        const ahead = geoDistance(mid, [center[0] + 25, center[1]]) < 1.05;
        if (!ahead || (dome && mid[1] < center[1] - 2)) continue;
        s.flights.push(makeFlight(from, to, now));
        s.nextFlight = idx + 1;
        s.lastSpawn = now;
        return;
      }
    };

    if (reduced) s.flights = [makeFlight('DEL', 'DPS', 0)];

    // Loop: steady spin, eased back after drags; slows while a card is open and pauses on hover.
    let raf = 0;
    let running = false;
    let lastT = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
      lastT = now;
      if (!s.dragging) {
        const steady = s.hover ? 0 : s.cardPop.shown ? -BASE_SPEED * 0.35 : -BASE_SPEED;
        s.spin += (steady - s.spin) * (1 - Math.exp(-dt / SPIN_EASE));
        s.rot[0] += s.spin * dt;
        s.rot[1] += (baseTilt - s.rot[1]) * (1 - Math.exp(-dt / TILT_EASE));
      }
      if (now - s.lastSpawn > SPAWN_MS && s.flights.length < MAX_FLIGHTS) spawn(now);
      draw(now);
    };
    const sync = (onScreen: boolean) => {
      const shouldRun = !reduced && onScreen && document.visibilityState === 'visible';
      if (shouldRun && !running) {
        running = true;
        lastT = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync(onScreen);
    });
    io.observe(wrap);
    const onVisibility = () => sync(onScreen);
    document.addEventListener('visibilitychange', onVisibility);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    sync(onScreen);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, dome, baseTilt]);

  /** The visible pin under a point (relative to the globe), if any. */
  const pinAt = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const box = wrap.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const s = state.current;
    let best: string | null = null;
    let bestD = 14;
    for (let i = 0; i < CITIES.length; i++) {
      const p = s.screen[i];
      if (!CITIES[i].photo || p.vis < 0.5) continue;
      const d = Math.hypot(p.x - x, p.y - PIN_HEAD - y);
      if (d < bestD) {
        bestD = d;
        best = CITIES[i].code;
      }
    }
    return best;
  };

  // Drag to spin; hover or tap a pin for its place card.
  const onPointerDown = (e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true;
    s.moved = 0;
    s.last = { x: e.clientX, y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging || !s.last) {
      if (e.pointerType !== 'mouse') return;
      const hit = pinAt(e.clientX, e.clientY);
      if (hit !== s.hover) {
        s.hover = hit;
        if (wrapRef.current) wrapRef.current.style.cursor = hit ? 'pointer' : '';
        if (reduced) s.draw();
      }
      return;
    }
    const now = performance.now();
    const px = e.clientX - s.last.x;
    const py = e.clientY - s.last.y;
    s.moved += Math.abs(px) + Math.abs(py);
    const k = 180 / Math.max(200, s.size);
    const dt = Math.max(0.008, (now - s.last.t) / 1000);
    s.rot = [s.rot[0] + px * k, Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, s.rot[1] - py * k))];
    // Smoothed flick speed, handed to the spin on release.
    s.spin = s.spin * 0.6 + ((px * k) / dt) * 0.4;
    s.last = { x: e.clientX, y: e.clientY, t: now };
    if (reduced) s.draw();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.last = null;
    if (s.moved < 6) {
      // A tap, not a drag: open that pin's card for a while.
      const hit = pinAt(e.clientX, e.clientY);
      if (hit) {
        s.featured = hit;
        s.featuredFrom = null;
        s.featuredUntil = performance.now() + FEATURE_HOLD;
      }
    }
    if (reduced) {
      s.spin = 0;
      s.draw();
    }
  };
  const onPointerLeave = () => {
    const s = state.current;
    s.hover = null;
    if (reduced) s.draw();
  };

  const cardCity = card ? byCode[card.code] : null;

  return (
    <div
      className={cn(
        'relative mx-auto w-full select-none',
        // Dome: show the top half only. Clip just the bottom edge, so cards and bubbles can rise above and to the sides.
        dome ? 'aspect-[2/1] max-w-[46rem] [clip-path:inset(-100vmax_-100vmax_0_-100vmax)]' : 'max-w-[36rem]',
        className,
      )}
    >
      <div
        ref={wrapRef}
        role="img"
        aria-label="A turning globe with example group trips flying between cities like Delhi, Bali, Lisbon and Tokyo."
        className="relative aspect-square cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        {!dome && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[16%] bottom-[1%] h-[9%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(19,19,22,0.16),rgba(19,19,22,0))] blur-md"
          />
        )}
        <canvas ref={canvasRef} className="absolute inset-0" />

        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* iMessage-style bubbles, positioned and popped by the draw loop. */}
          {CITIES.map((city, i) => {
            if (!city.tag) return null;
            const left = city.side === 'left';
            return (
              <span
                key={city.code}
                ref={(node) => {
                  bubbleRefs.current[i] = node;
                }}
                data-typing="false"
                className={cn(
                  'group absolute left-0 top-0 whitespace-nowrap rounded-[1.125rem] bg-surface-strong px-3 py-[0.4375rem] text-[0.8125rem] leading-[1.15] tracking-[-0.01em] text-ink opacity-0 will-change-transform',
                  "[font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text',var(--font-sans),sans-serif]",
                  'shadow-[0_1px_1.5px_rgba(19,19,22,0.08)]',
                  left ? 'origin-bottom-right' : 'origin-bottom-left',
                )}
              >
                <svg viewBox="0 0 12 16" className={cn('absolute bottom-0 h-4 w-3 fill-surface-strong', left ? '-right-[5px] -scale-x-100' : '-left-[5px]')}>
                  <path d="M12 0V16H0.5C4 15 7.5 12 8 6V0Z" />
                </svg>
                <span className="relative hidden items-center gap-[3px] py-[0.3125rem] group-data-[typing=true]:inline-flex">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-[0.3125rem] animate-typing rounded-full bg-ink-muted" style={{ animationDelay: `${d * 160}ms` }} />
                  ))}
                </span>
                <span className="relative group-data-[typing=true]:hidden">{city.tag}</span>
              </span>
            );
          })}

          {/* Place card: a compact map preview (thumbnail + name + details) on a frosted surface, with a pointer to
              the pin. Springs from the pin; opens below it near the top edge. */}
          <div
            ref={cardRef}
            data-below="false"
            className="group absolute left-0 top-0 z-20 flex w-max max-w-[15rem] origin-bottom flex-col items-center opacity-0 will-change-transform data-[below=true]:origin-top [filter:drop-shadow(0_0_0.6px_rgba(19,19,22,0.28))_drop-shadow(0_6px_14px_rgba(19,19,22,0.14))]"
          >
            {cardCity && (
              <>
                <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-1.5 pr-4 text-left">
                  {cardCity.photo && (
                    <img
                      src={photoUrl(cardCity.photo)}
                      alt=""
                      draggable={false}
                      className="size-11 shrink-0 rounded-[0.625rem] bg-surface-strong object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[0.8125rem] font-semibold leading-tight tracking-[-0.01em] text-ink">{cardCity.name}</p>
                    <p className="m-0 mt-0.5 truncate text-[0.6875rem] leading-tight text-ink-muted">
                      {cardCity.country}
                      {cardCity.tag ? ` · ${cardCity.tag}` : ''}
                    </p>
                    {card?.from && (
                      <p className="m-0 mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-1.5 py-px font-mono text-[0.5625rem] font-medium uppercase tracking-[0.08em] text-brand-700">
                        From {byCode[card.from].name}
                      </p>
                    )}
                  </div>
                </div>
                <svg
                  viewBox="0 0 14 7"
                  className="-mt-px block h-[7px] w-3.5 fill-surface group-data-[below=true]:order-first group-data-[below=true]:-mb-px group-data-[below=true]:mt-0 group-data-[below=true]:rotate-180"
                >
                  <path d="M0 0H14L7.9 6.3C7.4 6.8 6.6 6.8 6.1 6.3Z" />
                </svg>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Dome: soften the cut so the globe melts into the page instead of ending on a hard line. */}
      {dome && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-canvas via-canvas/70 to-transparent" />}
    </div>
  );
}
