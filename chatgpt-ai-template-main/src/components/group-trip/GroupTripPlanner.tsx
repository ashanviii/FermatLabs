'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Info,
  LockKeyhole,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react';

import FermatMark from '@/components/landing/FermatMark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  buildReadinessRows,
  createDefaultDraft,
  getDestination,
  loadTripDraft,
  recommendDestinations,
  resetTripDraft,
  saveTripDraft,
} from '@/lib/groupTrip';

const stages = [
  { id: 'basics', label: 'Trip basics' },
  { id: 'travellers', label: 'Your group' },
  { id: 'compare', label: 'Compare' },
  { id: 'readiness', label: 'Get ready' },
];

const departureCities = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

const statusStyles: Record<string, string> = {
  ready: 'border-[#83CCA1] bg-[#E9F8EF] text-[#235E3C]',
  action: 'border-[#E8C55F] bg-[#FFF8D9] text-[#725A10]',
  unknown: 'border-[#C9CDD2] bg-[#F5F6F7] text-[#555C63]',
};

const statusLabels: Record<string, string> = {
  ready: 'Ready',
  action: 'Action needed',
  unknown: 'Unknown',
};

type FieldErrors = Record<string, string>;

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', statusStyles[status])}>
      {status === 'ready' ? <Check className="size-3" /> : status === 'action' ? <AlertCircle className="size-3" /> : <CircleHelp className="size-3" />}
      {statusLabels[status]}
    </span>
  );
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">
      {children}
      {hint && <span className="ml-1 font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function textInputClass(hasError = false) {
  return cn(
    'h-12 w-full rounded-xl border bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-[#5DBB84]/35',
    hasError ? 'border-red-500' : 'border-border focus:border-[#5DBB84]',
  );
}

export default function GroupTripPlanner() {
  const [draft, setDraft] = useState<any>(() => createDefaultDraft());
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const restored = loadTripDraft(window.localStorage, setStorageWarning);
    setDraft(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      const saved = saveTripDraft(window.localStorage, draft, setStorageWarning);
      if (saved) setStorageWarning('');
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [draft, hydrated]);

  const recommendations = useMemo(() => recommendDestinations(draft), [draft]);
  const selected = draft.selectedDestinationId ? getDestination(draft.selectedDestinationId) : null;
  const readinessRows = useMemo(
    () => (draft.selectedDestinationId ? buildReadinessRows(draft, draft.selectedDestinationId) : []),
    [draft],
  );
  const activeStage = Math.max(0, stages.findIndex((stage) => stage.id === draft.stage));

  const patchDraft = (patch: Record<string, unknown>) => setDraft((current: any) => ({ ...current, ...patch }));

  const validateBasics = () => {
    const next: FieldErrors = {};
    if (!draft.tripName.trim()) next.tripName = 'Give the trip a short name.';
    if (!draft.travelMonth) next.travelMonth = 'Choose a travel month.';
    if (draft.durationDays < 3 || draft.durationDays > 14) next.durationDays = 'Choose 3–14 days.';
    if (draft.budgetPerPerson < 40000) next.budgetPerPerson = 'Use at least ₹40,000 per traveller for this demo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateTravellers = () => {
    const next: FieldErrors = {};
    const names = new Set<string>();
    draft.travellers.forEach((traveller: any, index: number) => {
      const name = traveller.name.trim().toLowerCase();
      if (!name) next[`name-${traveller.id}`] = `Add a nickname for traveller ${index + 1}.`;
      if (name && names.has(name)) next[`name-${traveller.id}`] = 'Use a unique nickname.';
      if (name) names.add(name);
      if (!traveller.departureCity) next[`city-${traveller.id}`] = 'Choose a departure city.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const continueFromBasics = () => {
    if (validateBasics()) patchDraft({ stage: 'travellers', selectedDestinationId: null });
  };

  const continueFromTravellers = () => {
    if (validateTravellers()) patchDraft({ stage: 'compare', selectedDestinationId: null });
  };

  const updateTraveller = (id: string, patch: Record<string, unknown>) => {
    setDraft((current: any) => ({
      ...current,
      selectedDestinationId: current.stage === 'readiness' ? null : current.selectedDestinationId,
      stage: current.stage === 'readiness' ? 'compare' : current.stage,
      travellers: current.travellers.map((traveller: any) => (traveller.id === id ? { ...traveller, ...patch } : traveller)),
    }));
  };

  const toggleVisa = (id: string, visa: string) => {
    const traveller = draft.travellers.find((item: any) => item.id === id);
    const hasVisa = traveller.visas.includes(visa);
    updateTraveller(id, { visas: hasVisa ? traveller.visas.filter((item: string) => item !== visa) : [...traveller.visas, visa] });
  };

  const addTraveller = () => {
    if (draft.travellers.length >= 10) return;
    const id = `traveller-${Date.now()}`;
    patchDraft({
      travellers: [...draft.travellers, { id, name: `Traveller ${draft.travellers.length + 1}`, departureCity: '', passportExpiry: '', visas: [] }],
      selectedDestinationId: null,
    });
  };

  const removeTraveller = (id: string) => {
    if (draft.travellers.length <= 4) return;
    patchDraft({ travellers: draft.travellers.filter((traveller: any) => traveller.id !== id), selectedDestinationId: null });
  };

  const selectDestination = (id: string) => patchDraft({ selectedDestinationId: id, stage: 'readiness' });

  const reset = () => {
    const confirmed = window.confirm('Delete this group-trip draft from this browser and start again?');
    if (!confirmed) return;
    const cleared = resetTripDraft(window.localStorage, true, setStorageWarning);
    if (cleared) {
      setDraft(createDefaultDraft());
      setErrors({});
      setStorageWarning('');
    }
  };

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Opening your trip workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F4FBF6_0%,#FAFBF7_42%,#F7F5ED_100%)]">
      <header className="border-b border-[#DDE8E0] bg-white/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <FermatMark className="h-7" />
            Fermat
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-[#EAF7EF] px-3 py-1.5 text-xs font-semibold text-[#285F43] sm:inline-flex">
              <LockKeyhole className="size-3" /> Saved on this device
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <RotateCcw /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#DFF4E7] px-3 py-1 text-xs font-semibold text-[#285F43]">
                <Sparkles className="size-3.5" /> Group-trip dry run
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
                The group trip that actually gets decided.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Combine everyone’s timing, budget and passport readiness. Fermat ranks three realistic starting points and shows exactly what needs attention.
              </p>
            </div>
            <div className="rounded-2xl border border-[#DDE8E0] bg-white/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground lg:max-w-xs">
              <strong className="text-foreground">Indian passports only in this MVP.</strong> Estimates are illustrative and not legal or booking advice.
            </div>
          </div>

          {storageWarning && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#E8C55F] bg-[#FFF8D9] p-4 text-sm text-[#725A10]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{storageWarning}</span>
            </div>
          )}

          <ol aria-label="Planning progress" className="mb-8 grid grid-cols-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
            {stages.map((stage, index) => (
              <li key={stage.id} className={cn('relative px-2 py-3 text-center text-xs font-semibold sm:px-4 sm:text-sm', index <= activeStage ? 'text-[#285F43]' : 'text-muted-foreground')}>
                <span className={cn('mx-auto mb-1 grid size-6 place-items-center rounded-full text-xs', index < activeStage ? 'bg-[#5DBB84] text-[#153524]' : index === activeStage ? 'bg-[#153524] text-white' : 'bg-muted')}>
                  {index < activeStage ? <Check className="size-3.5" /> : index + 1}
                </span>
                {stage.label}
                {index < stages.length - 1 && <ChevronRight aria-hidden className="absolute -right-2 top-5 hidden size-4 text-border sm:block" />}
              </li>
            ))}
          </ol>

          {draft.stage === 'basics' && (
            <Card className="overflow-hidden border-[#DDE8E0] bg-white shadow-[0_24px_60px_-38px_rgba(22,68,45,0.35)]">
              <div className="border-b bg-[#F7FBF8] p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#153524] text-[#7ED49F]"><MapPin className="size-5" /></span>
                  <div>
                    <h2 className="text-xl font-semibold md:text-2xl">Start with the shared constraints</h2>
                    <p className="text-sm text-muted-foreground">Takes about three minutes. No account required.</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
                <div className="md:col-span-2">
                  <FieldLabel htmlFor="trip-name">Trip name</FieldLabel>
                  <input id="trip-name" value={draft.tripName} onChange={(event) => patchDraft({ tripName: event.target.value })} className={textInputClass(Boolean(errors.tripName))} placeholder="December escape" aria-describedby={errors.tripName ? 'trip-name-error' : undefined} />
                  {errors.tripName && <p id="trip-name-error" className="mt-1.5 text-sm text-red-600">{errors.tripName}</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="travel-month">Travel month</FieldLabel>
                  <input id="travel-month" type="month" value={draft.travelMonth} onChange={(event) => patchDraft({ travelMonth: event.target.value, selectedDestinationId: null })} className={textInputClass(Boolean(errors.travelMonth))} />
                  {errors.travelMonth && <p className="mt-1.5 text-sm text-red-600">{errors.travelMonth}</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="duration">Trip length <span className="font-normal text-muted-foreground">(3–14 days)</span></FieldLabel>
                  <input id="duration" type="number" min={3} max={14} value={draft.durationDays} onChange={(event) => patchDraft({ durationDays: Number(event.target.value), selectedDestinationId: null })} className={textInputClass(Boolean(errors.durationDays))} />
                  {errors.durationDays && <p className="mt-1.5 text-sm text-red-600">{errors.durationDays}</p>}
                </div>
                <div className="md:col-span-2">
                  <FieldLabel htmlFor="budget" hint="total trip estimate, per traveller, excluding shopping">Budget in INR</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                    <input id="budget" type="number" min={40000} step={5000} value={draft.budgetPerPerson} onChange={(event) => patchDraft({ budgetPerPerson: Number(event.target.value), selectedDestinationId: null })} className={cn(textInputClass(Boolean(errors.budgetPerPerson)), 'pl-8')} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">One shared planning ceiling for everyone. Room-sharing and loyalty points are not modelled yet.</p>
                  {errors.budgetPerPerson && <p className="mt-1.5 text-sm text-red-600">{errors.budgetPerPerson}</p>}
                </div>
              </div>
              <div className="flex justify-end border-t bg-[#FCFDFC] p-5 md:px-8">
                <Button type="button" onClick={continueFromBasics} className="bg-[#153524] text-white hover:bg-[#204D38]">Add your group <ArrowRight /></Button>
              </div>
            </Card>
          )}

          {draft.stage === 'travellers' && (
            <div className="space-y-5">
              <Card className="border-[#DDE8E0] bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><Users className="size-5 text-[#3D9163]" /> Add 4–10 travellers</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Nicknames and planning status only—never passport numbers or document uploads.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={addTraveller} disabled={draft.travellers.length >= 10}><Plus /> Add traveller</Button>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {draft.travellers.map((traveller: any, index: number) => (
                    <div key={traveller.id} className="rounded-2xl border border-[#DDE8E0] bg-[#FBFDFB] p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#3D9163]">Traveller {index + 1}</span>
                        <button type="button" onClick={() => removeTraveller(traveller.id)} disabled={draft.travellers.length <= 4} aria-label={`Remove ${traveller.name || `traveller ${index + 1}`}`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"><Trash2 className="size-4" /></button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor={`name-${traveller.id}`}>Nickname</FieldLabel>
                          <input id={`name-${traveller.id}`} value={traveller.name} onChange={(event) => updateTraveller(traveller.id, { name: event.target.value })} className={textInputClass(Boolean(errors[`name-${traveller.id}`]))} />
                          {errors[`name-${traveller.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`name-${traveller.id}`]}</p>}
                        </div>
                        <div>
                          <FieldLabel htmlFor={`city-${traveller.id}`}>Flying from</FieldLabel>
                          <select id={`city-${traveller.id}`} value={traveller.departureCity} onChange={(event) => updateTraveller(traveller.id, { departureCity: event.target.value })} className={textInputClass(Boolean(errors[`city-${traveller.id}`]))}>
                            <option value="">Choose city</option>
                            {departureCities.map((city) => <option key={city}>{city}</option>)}
                          </select>
                          {errors[`city-${traveller.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`city-${traveller.id}`]}</p>}
                        </div>
                        <div>
                          <FieldLabel htmlFor={`passport-${traveller.id}`} hint="or leave unknown">Passport expires</FieldLabel>
                          <input id={`passport-${traveller.id}`} type="month" value={traveller.passportExpiry} onChange={(event) => updateTraveller(traveller.id, { passportExpiry: event.target.value })} className={textInputClass()} />
                        </div>
                        <fieldset>
                          <legend className="mb-2 text-sm font-semibold">Visas reported</legend>
                          <div className="flex min-h-12 flex-wrap items-center gap-2">
                            {[['uae', 'UAE'], ['schengen', 'Schengen']].map(([key, label]) => (
                              <label key={key} className={cn('cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition', traveller.visas.includes(key) ? 'border-[#5DBB84] bg-[#E9F8EF] text-[#235E3C]' : 'border-border bg-white text-muted-foreground')}>
                                <input type="checkbox" checked={traveller.visas.includes(key)} onChange={() => toggleVisa(traveller.id, key)} className="sr-only" />
                                {label}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => patchDraft({ stage: 'basics' })}><ArrowLeft /> Back</Button>
                <Button type="button" onClick={continueFromTravellers} className="bg-[#153524] text-white hover:bg-[#204D38]">Compare destinations <ArrowRight /></Button>
              </div>
            </div>
          )}

          {draft.stage === 'compare' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold md:text-3xl">Three realistic starting points</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Feasibility ranks before fit score. Expand every card to see the assumptions.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => patchDraft({ stage: 'travellers' })}>Edit group</Button>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {recommendations.map((destination: any, index: number) => (
                  <Card key={destination.id} className={cn('relative flex flex-col overflow-hidden border-[#DDE8E0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl', index === 0 && 'ring-2 ring-[#5DBB84]')}>
                    {index === 0 && <span className="absolute right-4 top-4 z-10 rounded-full bg-[#153524] px-3 py-1 text-xs font-bold text-white">Best match</span>}
                    <div className="p-6" style={{ backgroundColor: destination.accent }}>
                      <span className="text-4xl" aria-hidden>{destination.emoji}</span>
                      <h3 className="mt-4 text-2xl font-semibold">{destination.city}</h3>
                      <p className="text-sm text-muted-foreground">{destination.country}</p>
                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-semibold">{destination.fitScore}</span>
                          <span className="text-sm text-muted-foreground">/100 fit</span>
                        </div>
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', destination.blockers.length ? 'bg-white/70 text-[#725A10]' : 'bg-[#153524] text-white')}>
                          {destination.blockers.length ? `${destination.blockers.length} blocker${destination.blockers.length > 1 ? 's' : ''}` : 'No hard blockers'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Estimated per person</p>
                      <p className="mt-1 font-semibold">{formatInr(destination.estimate.min)}–{formatInr(destination.estimate.max)}</p>
                      <ul className="mt-5 space-y-3 text-sm">
                        {destination.reasons.map((reason: string) => (
                          <li key={reason} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#3D9163]" /><span>{reason}</span></li>
                        ))}
                      </ul>
                      {(destination.blockers.length > 0 || destination.actions.length > 0) && (
                        <details className="mt-5 rounded-xl border bg-[#FAFBFA] p-3 text-sm">
                          <summary className="cursor-pointer font-semibold">Why this ranking?</summary>
                          <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
                            {destination.blockers.map((item: any, itemIndex: number) => <p key={`b-${itemIndex}`}><strong className="text-[#725A10]">Blocker:</strong> {item.message}</p>)}
                            {destination.actions.slice(0, 4).map((item: any, itemIndex: number) => <p key={`a-${itemIndex}`}><strong className="text-foreground">Verify:</strong> {item.message}</p>)}
                            {destination.actions.length > 4 && <p>+ {destination.actions.length - 4} more traveller checks</p>}
                          </div>
                        </details>
                      )}
                      <div className="mt-auto pt-6">
                        <Button type="button" onClick={() => selectDestination(destination.id)} className="w-full bg-[#153524] text-white hover:bg-[#204D38]">Choose {destination.city} <ArrowRight /></Button>
                        <a href={destination.officialUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Verify official rules <ExternalLink className="size-3" /></a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="rounded-2xl border border-[#DDE8E0] bg-white p-4 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">How scores work:</strong> 40% budget, 20% passport readiness, 20% visa readiness, 20% seasonal fit. Illustrative data reviewed 24 Oct 2026; always verify government sources before paying.
              </div>
            </div>
          )}

          {draft.stage === 'readiness' && selected && (
            <div className="space-y-6">
              <Card className="overflow-hidden border-[#DDE8E0] bg-[#153524] text-white shadow-xl">
                <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
                  <div>
                    <span className="text-sm font-semibold text-[#7ED49F]">{draft.tripName || 'Your group trip'}</span>
                    <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{selected.emoji} {selected.city} is selected</h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Now focus on the people who need action. A reported visa still stays Unknown until validity and entry conditions are verified.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/10">
                    <p className="text-xs text-white/55">Group readiness</p>
                    <p className="mt-1 text-3xl font-semibold">{readinessRows.filter((row: any) => row.passport.status === 'ready' && row.cost.status === 'ready').length}/{readinessRows.length}</p>
                    <p className="text-xs text-white/55">budget + passport ready</p>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border-[#DDE8E0] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
                  <div>
                    <h3 className="text-xl font-semibold">Traveller readiness</h3>
                    <p className="text-sm text-muted-foreground">Departure cities are context only; live route availability is not scored.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => patchDraft({ stage: 'travellers', selectedDestinationId: null })}>Edit inputs</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => patchDraft({ stage: 'compare', selectedDestinationId: null })}>Change destination</Button>
                  </div>
                </div>

                <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_1.3fr] gap-4 border-b bg-[#F7F9F7] px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground md:grid">
                  <span>Traveller</span><span>Budget</span><span>Passport</span><span>Visa</span>
                </div>
                <div className="divide-y">
                  {readinessRows.map((row: any) => (
                    <div key={row.travellerId} className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr_1.2fr_1.3fr] md:items-start md:px-7">
                      <div>
                        <p className="font-semibold">{row.travellerName}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {row.departureCity}</p>
                      </div>
                      {[row.cost, row.passport, row.visa].map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-[88px_1fr] gap-3 md:block">
                          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground md:hidden">{['Budget', 'Passport', 'Visa'][index]}</span>
                          <div>
                            <StatusPill status={item.status} />
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#DDE8E0] bg-white p-5"><ShieldCheck className="size-5 text-[#3D9163]" /><h3 className="mt-3 font-semibold">Verify documents</h3><p className="mt-1 text-sm text-muted-foreground">Check passport validity and official entry rules before any non-refundable payment.</p></div>
                <div className="rounded-2xl border border-[#DDE8E0] bg-white p-5"><WalletCards className="size-5 text-[#3D9163]" /><h3 className="mt-3 font-semibold">Align the budget</h3><p className="mt-1 text-sm text-muted-foreground">The estimate uses one shared ceiling and illustrative six-day baseline costs.</p></div>
                <div className="rounded-2xl border border-[#DDE8E0] bg-white p-5"><Info className="size-5 text-[#3D9163]" /><h3 className="mt-3 font-semibold">Keep it private</h3><p className="mt-1 text-sm text-muted-foreground">This draft is unencrypted browser storage. Avoid shared devices and never enter document numbers.</p></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
