'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '@/lib/format';
import { tripCurrency } from './currency';
import type { FeatureProps } from './types';

type Variant = 'countdown' | 'wrapped';

const DAY = 86400000;
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const daysBetween = (fromIso: string, toIso: string) => Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY);
const routeText = (stops: any[] = []) => (stops.length > 1 ? stops.map((s) => `${s.name} ${s.nights}N`).join(' → ') : '');
const VARIANTS: { value: Variant; label: string; hint: string }[] = [
  { value: 'countdown', label: 'Countdown', hint: 'Destination, dates and days to go.' },
  { value: 'wrapped', label: 'Wrapped', hint: 'How fast you decided and the average cost per person.' },
];

// Everything on the card comes from the shared plan. No budgets or private inputs.
function cardFacts(trip: any, today: string) {
  const plan = trip.activePlan; const people = plan.memberTotals?.length || 0;
  const currency: string = plan.currency || tripCurrency(trip);
  return {
    dest: plan.destinationName || trip.name || 'Our trip',
    route: routeText(plan.stops),
    people,
    daysToGo: Math.max(0, daysBetween(today, plan.startDate)),
    start: formatDate(plan.startDate),
    end: formatDate(plan.endDate),
    perPerson: people ? formatMoney(Math.round(plan.groupTotal / people), currency) : '',
    currency,
    decisionDays: trip.features?.shareCards?.decisionDays ?? null,
    finished: today > plan.endDate,
  };
}

function imageUrl(facts: ReturnType<typeof cardFacts>, variant: Variant) {
  const params = new URLSearchParams({ kind: variant, dest: facts.dest, people: String(facts.people) });
  if (facts.route) params.set('route', facts.route);
  if (variant === 'countdown') { params.set('daysToGo', String(facts.daysToGo)); params.set('start', facts.start); params.set('end', facts.end); }
  else { if (facts.perPerson) { params.set('perPerson', facts.perPerson); params.set('currency', facts.currency); } if (facts.decisionDays) params.set('decisionDays', String(facts.decisionDays)); }
  return `/api/trip-card?${params}`;
}

function shareText(facts: ReturnType<typeof cardFacts>, variant: Variant, origin: string) {
  const decided = facts.decisionDays ? ` We decided in ${facts.decisionDays} day${facts.decisionDays === 1 ? '' : 's'}.` : '';
  const lead = variant === 'wrapped'
    ? `${facts.people} of us went to ${facts.dest}.${decided} Planned together on Fermat.`
    : facts.daysToGo === 0 ? `We leave for ${facts.dest} today!` : `${facts.dest} in ${facts.daysToGo} day${facts.daysToGo === 1 ? '' : 's'}! ${facts.people} of us planned it on Fermat.`;
  return `${lead} Plan your own trip free: ${origin}`;
}

function download(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = href; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function ShareCards({ trip }: FeatureProps) {
  const [today, setToday] = useState(''); const [origin, setOrigin] = useState('');
  useEffect(() => { setToday(localToday()); setOrigin(window.location.origin); }, []);
  const facts = useMemo(() => cardFacts(trip, today || trip.activePlan.startDate), [trip, today]);
  const [choice, setChoice] = useState<Variant | null>(null);
  const variant: Variant = choice || (facts.finished ? 'wrapped' : 'countdown');
  const src = imageUrl(facts, variant); const text = shareText(facts, variant, origin);
  const fileName = `fermat-${variant}-${facts.dest.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  const [loaded, setLoaded] = useState(false); const [busy, setBusy] = useState(false); const [status, setStatus] = useState('');
  useEffect(() => setLoaded(false), [src]);

  const fetchImage = async () => { const res = await fetch(src); if (!res.ok) throw new Error('image'); return res.blob(); };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setStatus('');
    try { await action(); }
    catch (error) { if ((error as Error)?.name !== 'AbortError') setStatus('Could not make the image. Please try again.'); }
    finally { setBusy(false); }
  };
  const shareImage = () => run(async () => {
    const blob = await fetchImage(); const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    download(blob, fileName); setStatus('Sharing is not supported here, so we downloaded the image.');
  });
  const saveImage = () => run(async () => { download(await fetchImage(), fileName); setStatus('Image downloaded.'); });

  return (
    <Card>
      <CardHeader
        icon={icons.share}
        title="Share your trip"
        description="Budgets never appear on the card."
        action={
          <div role="group" aria-label="Card style" className="inline-flex rounded-full bg-surface-muted p-1">
            {VARIANTS.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={variant === v.value}
                onClick={() => setChoice(v.value)}
                className={cn(
                  'h-8 cursor-pointer rounded-full border-0 px-3.5 font-sans text-[0.8125rem] font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
                  variant === v.value ? 'bg-surface text-ink shadow-card' : 'bg-transparent text-ink-muted hover:text-ink',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="grid gap-4">
        <div className={cn('relative overflow-hidden rounded-2xl bg-brand-900 shadow-raised', !loaded && 'animate-pulse')} style={{ aspectRatio: '1200 / 630' }}>
          <img
            src={src}
            alt={`${variant === 'wrapped' ? 'Fermat Wrapped' : 'Countdown'} card for ${facts.dest}`}
            width={1200}
            height={630}
            className={cn('block h-full w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
            onLoad={() => setLoaded(true)}
          />
        </div>
        <p className="type-small m-0 text-ink-muted" aria-live="polite">{status || VARIANTS.find((v) => v.value === variant)?.hint}</p>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button asChild variant="whatsapp">
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
              <icons.whatsapp strokeWidth={2} aria-hidden />
              Share on WhatsApp
            </a>
          </Button>
          <Button variant="outline" icon={icons.share} loading={busy} onClick={shareImage}>Share image</Button>
          <Button variant="ghost" icon={Download} disabled={busy} onClick={saveImage}>Download</Button>
        </div>
      </CardBody>
    </Card>
  );
}
