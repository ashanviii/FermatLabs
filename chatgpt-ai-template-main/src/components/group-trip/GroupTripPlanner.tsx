'use client';

// Offline demo: the whole trip lives in this browser (no sign-in, nothing shared).
// Same design system as the shared planner. Domain logic lives in src/lib/groupTrip.js (unchanged).
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, HardDrive, Plus, RotateCcw, Trash2 } from 'lucide-react';

import FermatMark from '@/components/landing/FermatMark';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge, StatusPill, type Status } from '@/components/ui/badge';
import { ChipGroup, Field, Input, Select, ToggleChip } from '@/components/ui/field';
import { MonthYearSelect } from '@/components/ui/month-year-select';
import { Notice } from '@/components/ui/notice';
import { PageContainer } from '@/components/ui/section';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { icons } from '@/components/ui/icons';
import { formatINR, formatMonthYear, plural } from '@/lib/format';
import {
  buildReadinessRows,
  createDefaultDraft,
  getDestination,
  loadTripDraft,
  recommendDestinations,
  resetTripDraft,
  saveTripDraft,
} from '@/lib/groupTrip';
import { PlannerFooter } from './shell/PlannerChrome';
import { departureCities } from './shell/tripState';

const stages: StepperStep[] = [
  { id: 'basics', label: 'Trip basics' },
  { id: 'travellers', label: 'Your group' },
  { id: 'compare', label: 'Compare' },
  { id: 'readiness', label: 'Get ready' },
];

const demoVisas: [string, string][] = [
  ['uae', 'UAE'],
  ['schengen', 'Schengen'],
];

// Readiness status from the engine -> pill status + words (never colour alone).
const readiness: Record<string, { status: Status; label: string }> = {
  ready: { status: 'ok', label: 'Ready' },
  action: { status: 'warning', label: 'Needs action' },
  unknown: { status: 'pending', label: 'Not known yet' },
};

type FieldErrors = Record<string, string>;

/** Next 18 months as 'YYYY-MM', plus the saved value if it falls outside that window. */
function travelMonthOptions(current: string) {
  const now = new Date();
  const list = Array.from({ length: 18 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  if (current && !list.includes(current)) list.unshift(current);
  return list;
}

export default function GroupTripPlanner({ onExit }: { onExit?: () => void } = {}) {
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
  const readinessRows = useMemo(() => (draft.selectedDestinationId ? buildReadinessRows(draft, draft.selectedDestinationId) : []), [draft]);
  const activeStage = Math.max(0, stages.findIndex((stage) => stage.id === draft.stage));

  const patchDraft = (patch: Record<string, unknown>) => setDraft((current: any) => ({ ...current, ...patch }));

  const validateBasics = () => {
    const next: FieldErrors = {};
    if (!draft.tripName.trim()) next.tripName = 'Give the trip a short name.';
    if (!draft.travelMonth) next.travelMonth = 'Choose a travel month.';
    if (draft.durationDays < 3 || draft.durationDays > 14) next.durationDays = 'Choose 3–14 days.';
    if (draft.budgetPerPerson < 40000) next.budgetPerPerson = 'Use at least ₹40,000 per person for this demo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateTravellers = () => {
    const next: FieldErrors = {};
    const names = new Set<string>();
    draft.travellers.forEach((traveller: any, index: number) => {
      const name = traveller.name.trim().toLowerCase();
      if (!name) next[`name-${traveller.id}`] = `Add a nickname for traveller ${index + 1}.`;
      if (name && names.has(name)) next[`name-${traveller.id}`] = 'Use a different nickname.';
      if (name) names.add(name);
      if (!traveller.departureCity) next[`city-${traveller.id}`] = 'Choose a city.';
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
    if (draft.travellers.length <= 2) return;
    patchDraft({ travellers: draft.travellers.filter((traveller: any) => traveller.id !== id), selectedDestinationId: null });
  };

  const selectDestination = (id: string) => patchDraft({ selectedDestinationId: id, stage: 'readiness' });

  // Done steps in the stepper jump back (same moves as the old Back / Edit buttons).
  const goToStage = (step: StepperStep) => {
    setErrors({});
    patchDraft(step.id === 'basics' || step.id === 'travellers' || step.id === 'compare' ? { stage: step.id, selectedDestinationId: null } : { stage: step.id });
  };

  const reset = () => {
    const confirmed = window.confirm('Delete this trip from this browser and start again?');
    if (!confirmed) return;
    const cleared = resetTripDraft(window.localStorage, true, setStorageWarning);
    if (cleared) {
      setDraft(createDefaultDraft());
      setErrors({});
      setStorageWarning('');
    }
  };

  if (!hydrated) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-canvas font-sans">
        <p className="type-body m-0 flex items-center gap-2 text-ink-muted" role="status">
          <icons.pending className="size-4 animate-pulse" strokeWidth={1.75} aria-hidden />
          Opening your trip…
        </p>
      </div>
    );
  }

  const readyCount = readinessRows.filter((row: any) => row.passport.status === 'ready' && row.cost.status === 'ready').length;

  return (
    <main className="bg-canvas pb-6 font-sans text-ink">
      <PageContainer>
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 rounded-full text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
            <FermatMark className="h-6 text-brand-900" />
            <span className="type-h3">Fermat</span>
          </a>
          <div className="flex items-center gap-2">
            <Badge size="sm" icon={HardDrive} className="hidden sm:inline-flex">
              Saved on this device
            </Badge>
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={reset}>
              Start over
            </Button>
            {onExit && (
              <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onExit}>
                <span className="sm:hidden">Exit demo</span>
                <span className="hidden sm:inline">Back to shared trips</span>
              </Button>
            )}
          </div>
        </div>

        {/* Header + progress */}
        <header className="grid gap-6 pb-2 pt-4 sm:pt-8">
          <div className="grid gap-2">
            <p className="type-overline m-0 text-brand-600">Offline demo</p>
            <h1 className="type-h1 m-0 text-balance">{draft.tripName.trim() || 'Plan a group trip'}</h1>
            <p className="type-body m-0 max-w-prose text-ink-muted">Everything stays in this browser. Visa checks assume Indian passports.</p>
          </div>
          <Stepper steps={stages} current={activeStage} onStepClick={goToStage} />
        </header>

        {storageWarning && (
          <Notice tone="warning" role="alert" className="mt-6">
            {storageWarning}
          </Notice>
        )}

        <div className="mt-10">
          {/* 1. Basics */}
          {draft.stage === 'basics' && (
            <Card className="mx-auto max-w-content">
              <CardHeader icon={icons.calendar} title="Trip basics" description="Takes about three minutes. No account needed." />
              <CardBody className="grid gap-5 sm:grid-cols-2">
                <Field label="Trip name" error={errors.tripName} className="sm:col-span-2">
                  <Input value={draft.tripName} onChange={(event) => patchDraft({ tripName: event.target.value })} placeholder="December escape" />
                </Field>
                <Field label="Travel month" error={errors.travelMonth}>
                  <Select value={draft.travelMonth} onChange={(event) => patchDraft({ travelMonth: event.target.value, selectedDestinationId: null })} placeholder="Choose a month">
                    {travelMonthOptions(draft.travelMonth).map((month) => (
                      <option key={month} value={month}>
                        {formatMonthYear(month)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Trip length" hint="3 to 14 days" error={errors.durationDays}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={3}
                    max={14}
                    trailing="days"
                    value={draft.durationDays}
                    onChange={(event) => patchDraft({ durationDays: Number(event.target.value), selectedDestinationId: null })}
                  />
                </Field>
                <Field label="Budget per person" hint="The whole trip, not counting shopping. One budget for everyone." error={errors.budgetPerPerson} className="sm:col-span-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={40000}
                    step={5000}
                    leading="₹"
                    value={draft.budgetPerPerson}
                    onChange={(event) => patchDraft({ budgetPerPerson: Number(event.target.value), selectedDestinationId: null })}
                  />
                </Field>
              </CardBody>
              <CardFooter className="justify-end">
                <Button size="lg" iconRight={ArrowRight} onClick={continueFromBasics} className="w-full sm:w-auto">
                  Add your group
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* 2. Travellers */}
          {draft.stage === 'travellers' && (
            <div className="mx-auto grid max-w-content gap-6">
              <Card>
                <CardHeader
                  icon={icons.members}
                  title={`Who's coming · ${draft.travellers.length}`}
                  description="2 to 10 people. Nicknames only, never passport numbers."
                  action={
                    <Button variant="outline" size="sm" icon={Plus} onClick={addTraveller} disabled={draft.travellers.length >= 10}>
                      Add traveller
                    </Button>
                  }
                />
                <ol className="m-0 list-none p-0">
                  {draft.travellers.map((traveller: any, index: number) => (
                    <li key={traveller.id} className="grid gap-4 border-0 border-t border-solid border-line-subtle px-5 py-5 sm:px-6">
                      <div className="flex items-center justify-between gap-3">
                        <p className="type-overline m-0 text-brand-600">Traveller {index + 1}</p>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          icon={Trash2}
                          onClick={() => removeTraveller(traveller.id)}
                          disabled={draft.travellers.length <= 2}
                          aria-label={`Remove ${traveller.name || `traveller ${index + 1}`}`}
                          title={draft.travellers.length <= 2 ? 'A trip needs at least 2 people' : 'Remove'}
                        />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Nickname" error={errors[`name-${traveller.id}`]}>
                          <Input value={traveller.name} onChange={(event) => updateTraveller(traveller.id, { name: event.target.value })} />
                        </Field>
                        <Field label="Flying from" error={errors[`city-${traveller.id}`]}>
                          <Select value={traveller.departureCity} onChange={(event) => updateTraveller(traveller.id, { departureCity: event.target.value })} placeholder="Choose a city">
                            {departureCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Passport expires" hint="Leave empty if you're not sure">
                          <MonthYearSelect
                            label={`Traveller ${index + 1} passport expiry`}
                            value={traveller.passportExpiry}
                            onChange={(passportExpiry) => updateTraveller(traveller.id, { passportExpiry })}
                          />
                        </Field>
                        <ChipGroup label="Visas they already have">
                          {demoVisas.map(([key, label]) => (
                            <ToggleChip key={key} icon={icons.visa} selected={traveller.visas.includes(key)} onSelectedChange={() => toggleVisa(traveller.id, key)}>
                              {label}
                            </ToggleChip>
                          ))}
                        </ChipGroup>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" size="lg" icon={ArrowLeft} onClick={() => patchDraft({ stage: 'basics' })}>
                  Back
                </Button>
                <Button size="lg" iconRight={ArrowRight} onClick={continueFromTravellers}>
                  Compare destinations
                </Button>
              </div>
            </div>
          )}

          {/* 3. Compare */}
          {draft.stage === 'compare' && (
            <section className="grid gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid gap-1">
                  <h2 className="type-h2 m-0">Three places to start from</h2>
                  <p className="type-small m-0 text-ink-muted">Places with nothing blocking come first, then by fit.</p>
                </div>
                <Button variant="outline" size="sm" icon={icons.members} onClick={() => patchDraft({ stage: 'travellers' })}>
                  Edit group
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((destination: any, index: number) => {
                  const blocked = destination.blockers.length > 0;
                  return (
                    <Card key={destination.id} variant={index === 0 ? 'raised' : 'default'} className={index === 0 ? 'flex flex-col ring-2 ring-brand-500' : 'flex flex-col'}>
                      <div className="grid gap-4 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="type-h3 m-0">{destination.city}</h3>
                            <p className="type-small m-0 mt-0.5 flex items-center gap-1 text-ink-muted">
                              <icons.destination className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                              {destination.country}
                            </p>
                          </div>
                          {index === 0 && (
                            <Badge size="sm" tone="brand" icon={icons.check}>
                              Best match
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <p className="m-0">
                            <span className="type-num font-display text-[1.75rem] font-bold leading-none text-ink">{destination.fitScore}</span>
                            <span className="type-small text-ink-muted"> / 100 fit</span>
                          </p>
                          {blocked ? (
                            <StatusPill status="blocked">{plural(destination.blockers.length, 'blocker')}</StatusPill>
                          ) : (
                            <StatusPill status="ok">Nothing blocking</StatusPill>
                          )}
                        </div>
                        <div className="rounded-xl bg-surface-muted px-3 py-2.5">
                          <p className="type-caption m-0 text-ink-muted">Estimated per person</p>
                          <p className="type-num type-body m-0 font-semibold text-ink">
                            ~{formatINR(destination.estimate.min)}–{formatINR(destination.estimate.max)}
                          </p>
                        </div>
                        <ul className="m-0 grid list-none gap-2 p-0">
                          {destination.reasons.map((reason: string) => (
                            <li key={reason} className="type-small flex gap-2 text-ink-soft">
                              <icons.check className="mt-0.5 size-4 shrink-0 text-brand-500" strokeWidth={2} aria-hidden />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                        {(destination.blockers.length > 0 || destination.actions.length > 0) && (
                          <details className="group rounded-xl bg-surface-muted px-3 py-2.5">
                            <summary className="type-small flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
                              What to check
                              <icons.info className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
                            </summary>
                            <ul className="m-0 mt-2 grid list-none gap-1.5 p-0">
                              {destination.blockers.map((item: any, i: number) => (
                                <li key={`b-${i}`} className="type-small flex gap-2 text-danger-ink">
                                  <icons.danger className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                                  <span>{item.message}</span>
                                </li>
                              ))}
                              {destination.actions.slice(0, 4).map((item: any, i: number) => (
                                <li key={`a-${i}`} className="type-small flex gap-2 text-ink-soft">
                                  <icons.pending className="mt-0.5 size-3.5 shrink-0 text-ink-faint" strokeWidth={2} aria-hidden />
                                  <span>{item.message}</span>
                                </li>
                              ))}
                              {destination.actions.length > 4 && <li className="type-small text-ink-muted">and {destination.actions.length - 4} more to check</li>}
                            </ul>
                          </details>
                        )}
                      </div>
                      <div className="mt-auto grid gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
                        <Button block variant={index === 0 ? 'primary' : 'outline'} iconRight={ArrowRight} onClick={() => selectDestination(destination.id)}>
                          Choose {destination.city}
                        </Button>
                        <Button asChild variant="link" size="sm" className="justify-center">
                          <a href={destination.officialUrl} target="_blank" rel="noreferrer">
                            Official entry rules
                            <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Notice variant="inline" tone="neutral" title="How fit works.">
                Budget counts for 40, passports 20, visas 20 and season 20. Sample data checked 24 Oct 2026.
              </Notice>
            </section>
          )}

          {/* 4. Readiness */}
          {draft.stage === 'readiness' && selected && (
            <div className="grid gap-6">
              <Card variant="brand" className="overflow-hidden rounded-3xl p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="grid gap-2">
                    <p className="type-overline m-0 text-brand-200">{draft.tripName || 'Your group trip'}</p>
                    <h2 className="type-display m-0 text-white">{selected.city}</h2>
                    <p className="type-body m-0 max-w-prose text-white/80">Now sort out whoever still needs something. A visa you have stays "not known" until you check its dates.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-5 py-4">
                    <p className="type-caption m-0 text-white/75">Budget and passport ready</p>
                    <p className="type-num m-0 mt-1 font-display text-[1.75rem] font-bold leading-8 text-white">
                      {readyCount} of {readinessRows.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  icon={icons.members}
                  title="Who's ready"
                  description="Departure cities are for context; routes aren't checked."
                  action={
                    <>
                      <Button size="sm" variant="outline" onClick={() => patchDraft({ stage: 'travellers', selectedDestinationId: null })}>
                        Edit group
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => patchDraft({ stage: 'compare', selectedDestinationId: null })}>
                        Change place
                      </Button>
                    </>
                  }
                />
                <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_1.3fr] gap-4 border-0 border-t border-solid border-line-subtle bg-surface-muted px-6 py-2.5 md:grid" aria-hidden>
                  {['Traveller', 'Budget', 'Passport', 'Visa'].map((label) => (
                    <span key={label} className="type-overline text-ink-muted">
                      {label}
                    </span>
                  ))}
                </div>
                <ul className="m-0 list-none p-0">
                  {readinessRows.map((row: any) => (
                    <li key={row.travellerId} className="grid gap-3 border-0 border-t border-solid border-line-subtle px-5 py-4 sm:px-6 md:grid-cols-[1.1fr_1fr_1.2fr_1.3fr] md:items-start md:gap-4">
                      <div>
                        <p className="type-body m-0 font-semibold text-ink">{row.travellerName}</p>
                        <p className="type-small m-0 mt-0.5 flex items-center gap-1 text-ink-muted">
                          <icons.departure className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                          {row.departureCity}
                        </p>
                      </div>
                      {[row.cost, row.passport, row.visa].map((item: any, i: number) => (
                        <div key={i} className="grid grid-cols-[5.5rem_1fr] items-start gap-3 md:block">
                          <span className="type-overline pt-1 text-ink-muted md:hidden">{['Budget', 'Passport', 'Visa'][i]}</span>
                          <div className="grid justify-items-start gap-1.5">
                            <StatusPill size="sm" status={readiness[item.status]?.status ?? 'pending'}>
                              {readiness[item.status]?.label ?? 'Not known yet'}
                            </StatusPill>
                            <p className="type-small m-0 text-ink-muted">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </Card>

              <Notice tone="neutral" title="Before anyone pays.">
                Check passport dates and the official entry rules. This demo is saved unencrypted in this browser, so avoid shared devices and never enter document numbers.
              </Notice>
            </div>
          )}
        </div>

        <PlannerFooter />
      </PageContainer>
    </main>
  );
}
