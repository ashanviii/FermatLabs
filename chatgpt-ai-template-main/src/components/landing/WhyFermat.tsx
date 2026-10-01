'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

type Reason = {
  title: string;
  body: string;
  others: string[];
  fermat: string[];
  card: string;
  panel: string;
  accent: string;
  glow: string;
  grain: string;
  pattern: 'compass' | 'tabs' | 'stamps' | 'network';
};

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Coordinates are rounded so server and client render identical markup.
const polar = (r: number, deg: number, c = 250) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [(c + r * Math.cos(a)).toFixed(1), (c + r * Math.sin(a)).toFixed(1)];
};

const compassTicks = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5;
  const [x1, y1] = polar(232, deg);
  const [x2, y2] = polar(deg % 45 === 0 ? 206 : 220, deg);
  return { x1, y1, x2, y2, major: deg % 45 === 0 };
});

const compassStar = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 === 1 ? 26 : i % 4 === 0 ? 196 : 120;
  return polar(r, i * 22.5).join(',');
}).join(' ');

function Compass() {
  return (
    <svg viewBox="0 0 500 500" className="absolute -bottom-40 -right-28 size-[38rem] opacity-[0.13]">
      <g className="origin-center animate-[spin_120s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
        <circle cx="250" cy="250" r="236" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="250" cy="250" r="160" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
        {compassTicks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth={t.major ? 3 : 1.2} />
        ))}
        <polygon points={compassStar} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        {(['N', 'E', 'S', 'W'] as const).map((l, i) => {
          const [x, y] = polar(176, i * 90);
          return (
            <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="700" fill="currentColor">
              {l}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

const tabSpots = [
  [520, 40, -8], [690, 20, 6], [860, 60, -4], [600, 150, 10], [780, 170, -12], [930, 190, 8],
  [500, 270, 4], [660, 300, -6], [840, 320, 12], [560, 410, -10], [730, 440, 5], [900, 450, -7],
  [380, 430, 9], [980, 330, -3], [450, 130, -5], [1000, 70, 11], [240, 470, -6], [300, 360, 7],
];

function Tabs() {
  return (
    <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-[0.14]">
      {tabSpots.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={1 - i * 0.035}>
          <path d="M0 14 h22 l6 -14 h50 l6 14 h56 a8 8 0 0 1 8 8 v66 a8 8 0 0 1 -8 8 h-132 a8 8 0 0 1 -8 -8 v-66 a8 8 0 0 1 8 -8z" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="-8" y1="30" x2="148" y2="30" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="4" cy="22" r="2.5" fill="currentColor" />
          <circle cx="12" cy="22" r="2.5" fill="currentColor" />
          <rect x="6" y="42" width="90" height="6" rx="3" fill="currentColor" />
          <rect x="6" y="56" width="120" height="5" rx="2.5" fill="currentColor" opacity="0.6" />
          <rect x="6" y="68" width="70" height="5" rx="2.5" fill="currentColor" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

function Stamps() {
  return (
    <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-[0.16]">
      <g fill="none" stroke="currentColor" strokeWidth="3" fontWeight="800" letterSpacing="3">
        <g transform="translate(790 130) rotate(-12)">
          <circle r="86" />
          <circle r="72" strokeDasharray="4 6" strokeWidth="2" />
          <text y="-8" textAnchor="middle" fontSize="30" fill="currentColor" stroke="none">TOKYO</text>
          <text y="24" textAnchor="middle" fontSize="15" fill="currentColor" stroke="none">NRT · 14 MAR</text>
        </g>
        <g transform="translate(560 330) rotate(7)">
          <rect x="-120" y="-52" width="240" height="104" rx="10" />
          <rect x="-108" y="-40" width="216" height="80" rx="6" strokeWidth="1.5" />
          <text y="-6" textAnchor="middle" fontSize="28" fill="currentColor" stroke="none">ARRIVED</text>
          <text y="24" textAnchor="middle" fontSize="15" fill="currentColor" stroke="none">LISBON · LIS</text>
        </g>
        <g transform="translate(880 400) rotate(-18)">
          <ellipse rx="104" ry="64" />
          <ellipse rx="90" ry="50" strokeWidth="1.5" />
          <text y="2" textAnchor="middle" fontSize="30" fill="currentColor" stroke="none">DUBAI</text>
          <text y="28" textAnchor="middle" fontSize="13" fill="currentColor" stroke="none">DXB · ENTRY</text>
        </g>
        <g transform="translate(250 455) rotate(-6)">
          <path d="M0 -58 L50 -29 L50 29 L0 58 L-50 29 L-50 -29 Z" />
          <text y="6" textAnchor="middle" fontSize="18" fill="currentColor" stroke="none">VISA OK</text>
        </g>
        <g transform="translate(980 260) rotate(14)">
          <circle r="54" />
          <text y="7" textAnchor="middle" fontSize="20" fill="currentColor" stroke="none">BALI</text>
        </g>
      </g>
    </svg>
  );
}

const nodes = [
  [560, 90], [700, 60], [840, 110], [960, 70], [620, 220], [780, 240], [920, 230],
  [520, 360], [680, 380], [840, 400], [980, 370], [760, 490], [430, 470], [600, 480],
];
const edges = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 5], [5, 6], [4, 7],
  [4, 8], [5, 8], [5, 9], [6, 9], [6, 10], [7, 8], [8, 9], [9, 10], [8, 11], [9, 11], [7, 12], [8, 13], [12, 13],
];
const checkedNodes = new Set([5, 8, 2]);

function Network() {
  return (
    <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-[0.17]">
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="currentColor" strokeWidth="1.5" strokeDasharray={i % 3 === 0 ? '4 5' : undefined} />
      ))}
      {nodes.map(([x, y], i) =>
        checkedNodes.has(i) ? (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="22" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M-9 0 l6 6 l12 -12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle r="32" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-pulse" />
          </g>
        ) : (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 7 : 10} fill="none" stroke="currentColor" strokeWidth="2.5" />
        ),
      )}
    </svg>
  );
}

const patterns = { compass: Compass, tabs: Tabs, stamps: Stamps, network: Network };

function CardTexture({ glow, grain, pattern }: Pick<Reason, 'glow' | 'grain' | 'pattern'>) {
  const Pattern = patterns[pattern];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className={cn('absolute -right-24 -top-32 size-[28rem] rounded-full blur-3xl', glow)} />
      <Pattern />
      <div className={cn('absolute inset-0', grain)} style={{ backgroundImage: NOISE }} />
    </div>
  );
}

const reasons: Reason[] = [
  {
    title: 'A specialist, not a generalist.',
    body: 'ChatGPT and Claude are brilliant at everything. Fermat is built for one thing: getting you from idea to boarding pass, with agents tuned for visas, fares, stays and routes.',
    others: ['Broad answers on any topic', 'You decide what to double-check'],
    fermat: ['Agents built only for travel', 'Knows what a trip actually needs'],
    card: 'bg-[#141611] text-white',
    panel: 'bg-white/[0.06] ring-white/10',
    accent: 'bg-[#5DBB84] text-[#141611]',
    glow: 'bg-[#5DBB84]/25',
    grain: 'opacity-[0.14] mix-blend-screen',
    pattern: 'compass',
  },
  {
    title: 'A plan, not twenty tabs.',
    body: 'Search hands you links and leaves the stitching to you. Fermat connects your visa checklist, flights, stays and itinerary in one place, so a date change updates the whole trip.',
    others: ['Links spread across dozens of sites', 'Copy-paste between tabs'],
    fermat: ['One connected trip plan', 'Change once, everything follows'],
    card: 'bg-[#D7EEDF] text-[#141611]',
    panel: 'bg-[#141611]/[0.06] ring-[#141611]/10',
    accent: 'bg-[#141611] text-[#5DBB84]',
    glow: 'bg-white/70',
    grain: 'opacity-[0.22] mix-blend-multiply',
    pattern: 'tabs',
  },
  {
    title: 'It remembers your trip.',
    body: 'Passport, budget, dates and the window seat you always want carry through every answer. No re-explaining yourself every time you open a new chat.',
    others: ['A fresh start every conversation', 'Repeat your details each time'],
    fermat: ['Your context carries through', 'Answers fit your passport and budget'],
    card: 'bg-[linear-gradient(150deg,#13392A_0%,#1F5A3F_100%)] text-white',
    panel: 'bg-white/[0.08] ring-white/15',
    accent: 'bg-[#F8E6A0] text-[#141611]',
    glow: 'bg-[#F8E6A0]/20',
    grain: 'opacity-[0.14] mix-blend-screen',
    pattern: 'stamps',
  },
  {
    title: 'Checked before it answers.',
    body: 'Multiple agents cross-check requirements and prices before replying, and every answer ends with a next step you can actually take.',
    others: ['One-shot answers', 'Stops at information'],
    fermat: ['Cross-checked by multiple agents', 'Ends with an action, not a link'],
    card: 'bg-[#F8E6A0] text-[#141611]',
    panel: 'bg-white/50 ring-[#141611]/10',
    accent: 'bg-[#141611] text-[#F8E6A0]',
    glow: 'bg-white/70',
    grain: 'opacity-[0.22] mix-blend-multiply',
    pattern: 'network',
  },
];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function ReasonCard({ reason, index }: { reason: Reason; index: number }) {
  return (
    <div
      className={cn(
        'relative isolate flex h-full flex-col overflow-hidden rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(20,22,17,0.45)] md:p-10 md:[@media(max-height:760px)]:p-7',
        reason.card,
      )}
    >
      <CardTexture glow={reason.glow} grain={reason.grain} pattern={reason.pattern} />
      <div className="relative flex items-center justify-between text-sm font-medium opacity-70">
        <span>({String(index + 1).padStart(2, '0')})</span>
        <span>Why Fermat</span>
      </div>
      <div className="relative mt-6 grid flex-1 gap-6 md:mt-8 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-10 md:[@media(max-height:760px)]:mt-4">
        <div>
          <h3 className="text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl md:[@media(max-height:760px)]:text-4xl">{reason.title}</h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed opacity-75 md:text-base">{reason.body}</p>
        </div>
        <div className={cn('space-y-4 rounded-2xl p-4 ring-1 backdrop-blur-sm md:p-5', reason.panel)}>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider opacity-55">Search &amp; general chatbots</p>
            <ul className="space-y-1.5 text-sm opacity-65">
              {reason.others.map((o) => (
                <li key={o} className="flex items-center gap-2">
                  <Minus className="size-3.5 shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="h-px bg-current opacity-10" />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider">Fermat</p>
            <ul className="space-y-2 text-sm font-medium">
              {reason.fermat.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', reason.accent)}>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhyFermat() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stacked, setStacked] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStacked(false);
      return;
    }

    let raf = 0;
    const last = reasons.length - 1;

    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const raw = clamp(-rect.top / scrollable, 0, 1) * last;
      // Hold each card briefly before the next one takes over.
      const base = Math.floor(raw);
      const frac = raw - base;
      const progress = base + smoothstep(clamp((frac - 0.12) / 0.76, 0, 1));

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const depth = i - progress;
        if (depth >= 0) {
          const d = Math.min(depth, 3);
          card.style.transform = `translateY(${d * 22}px) scale(${1 - d * 0.05})`;
          card.style.opacity = depth > 3 ? '0' : '1';
        } else {
          const t = Math.min(-depth, 1);
          card.style.transform = `translateY(${-t * 110}%) rotateX(${t * 38}deg) scale(${1 - t * 0.08})`;
          card.style.opacity = String(1 - smoothstep(clamp((t - 0.45) / 0.55, 0, 1)));
        }
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!stacked) {
    return (
      <div className="container flex flex-col gap-4">
        {reasons.map((r, i) => (
          <ReasonCard key={r.title} reason={r} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      style={{
        height: `${100 + (reasons.length - 1) * 75}vh`,
        // The sticky stage centers the deck below the nav, leaving empty space above it before pinning.
        // Pull the stage up by that offset so the deck sits right under the heading; once pinned, only cards show.
        marginTop: 'calc(-4rem - (100vh - 4rem - min(520px, 70vh)) / 2)',
        // Same centering leaves equal empty space below the deck once it unpins.
        marginBottom: 'calc((100vh - 4rem - min(520px, 70vh)) / -2)',
      }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden pt-16 [perspective:1400px]">
        <div className="container">
          <div className="relative mx-auto h-[min(520px,70vh)] max-w-5xl">
            {reasons.map((r, i) => (
              <div
                key={r.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute inset-0 origin-bottom will-change-transform"
                style={{ zIndex: reasons.length - i }}
              >
                <ReasonCard reason={r} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
