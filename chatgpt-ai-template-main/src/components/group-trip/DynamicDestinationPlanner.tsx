'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { formatMoney } from '@/lib/format';
import DepartureCitySearch from './shell/DepartureCitySearch';
import { countryName, DEFAULT_HOME_COUNTRY, transportOptions } from './shell/tripState';

type DestinationDraft = {
  proposalId: string;
  expiresAt: number | string;
  destination: {
    id: string; name: string; countryCode: string; summary: string; caveats: string[];
    costRanges: unknown; generatedAt: number | string;
  };
  assessment: {
    groupTotal: number | null; myTotal: number | null; currency: string;
    missingTravelEstimates: boolean; withinBudgets: boolean;
  };
  myJourney: { mode: string; low: number; high: number; oneWayMinutes: number | null; status: 'unverified' } | null;
};

class DestinationRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const timestamp = (value: number | string) => typeof value === 'number' ? value : Date.parse(value);
const amount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const nullableAmount = (value: unknown) => value === null || amount(value);
const validDraft = (value: any): value is DestinationDraft => Boolean(
  value && typeof value.proposalId === 'string' && value.proposalId &&
  Number.isFinite(timestamp(value.expiresAt)) &&
  typeof value.destination?.id === 'string' && typeof value.destination?.name === 'string' &&
  typeof value.destination?.countryCode === 'string' && typeof value.destination?.summary === 'string' &&
  Number.isFinite(timestamp(value.destination?.generatedAt)) &&
  Array.isArray(value.destination?.caveats) && value.destination.caveats.every((caveat: unknown) => typeof caveat === 'string') &&
  nullableAmount(value.assessment?.groupTotal) && nullableAmount(value.assessment?.myTotal) &&
  typeof value.assessment?.currency === 'string' && /^[A-Z]{3}$/.test(value.assessment.currency) &&
  typeof value.assessment?.missingTravelEstimates === 'boolean' && typeof value.assessment?.withinBudgets === 'boolean' &&
  (value.myJourney === null || (
    transportOptions.some((mode) => mode.value === value.myJourney?.mode) &&
    amount(value.myJourney?.low) && amount(value.myJourney?.high) && value.myJourney.high >= value.myJourney.low &&
    nullableAmount(value.myJourney?.oneWayMinutes) && value.myJourney?.status === 'unverified'
  )),
);

export default function DynamicDestinationPlanner({ trip, disabled, onAdded }: {
  trip: any; disabled: boolean; onAdded: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [capability, setCapability] = useState<{ mode: 'groq'; label: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState<{ name: string; placeId?: string }>({ name: '' });
  const [preview, setPreview] = useState<{ draft: DestinationDraft; context: string } | null>(null);
  const [pending, setPending] = useState<'' | 'generate' | 'add'>('');
  const [confirmed, setConfirmed] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [reload, setReload] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const sequence = useRef(0);
  const operation = useRef<AbortController | null>(null);
  const allowed = Boolean(user && trip.members?.[user.uid]?.role === 'owner' && trip.phase === 'collecting');
  const context = JSON.stringify([trip.id, trip.inputRevision, trip.revision, trip.round, trip.phase, trip.planningMode, trip.myConstraints]);
  const draft = preview?.draft;
  const stale = Boolean(preview && (preview.context !== context || invalidated));
  const expiresAt = draft ? timestamp(draft.expiresAt) : 0;
  const expired = Boolean(draft && clock >= expiresAt);
  const consented = trip.myConstraints?.aiPlanningConsent === true;
  const hasTransport = transportOptions.some((mode) => trip.myConstraints?.transportModes?.includes(mode.value));

  async function send(signal: AbortSignal, body?: object) {
    if (!user) throw new Error('Sign in to plan a destination.');
    const token = await user.getIdToken();
    if (signal.aborted) throw new Error('Request cancelled.');
    const response = await fetch(body ? '/api/group-trips/destinations' : `/api/group-trips/destinations?tripId=${encodeURIComponent(trip.id)}`, {
      method: body ? 'POST' : 'GET', cache: 'no-store', signal,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new DestinationRequestError(typeof result?.error === 'string' ? result.error : 'Groq destination planning is unavailable. Please try again later.', response.status);
    if (!result) throw new Error('The destination service returned an invalid response.');
    return result;
  }

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    setChecking(true); setCapability(null); setError(''); setPending(''); setConfirmed(false);
    setMessage(operation.current ? 'The trip changed. Generate a new draft using the latest details.' : '');
    operation.current?.abort(); operation.current = null;
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const load = async () => {
      try {
        if (!allowed) return;
        const result = await send(controller.signal);
        if (result.mode !== 'groq' || typeof result.label !== 'string') throw new Error('Groq destination planning is unavailable. No draft was generated.');
        if (current === sequence.current && !controller.signal.aborted) setCapability(result);
      } catch (cause) {
        if (current === sequence.current) setError(controller.signal.aborted ? 'Availability check timed out. Please retry.' : cause instanceof Error ? cause.message : 'Destination planning is unavailable.');
      } finally {
        clearTimeout(timeout);
        if (current === sequence.current) setChecking(false);
      }
    };
    void load();
    return () => { sequence.current++; clearTimeout(timeout); controller.abort(); operation.current?.abort(); };
  }, [context, user, allowed, reload]);

  useEffect(() => {
    setClock(Date.now());
    if (!draft) return;
    const timeout = setTimeout(() => { setClock(Date.now()); setConfirmed(false); }, Math.min(2_147_483_647, Math.max(0, expiresAt - Date.now()) + 10));
    return () => clearTimeout(timeout);
  }, [draft, expiresAt]);

  async function generate() {
    if (!allowed || disabled || pending || operation.current || !capability || !selection.placeId || !consented || !hasTransport) return;
    const controller = new AbortController();
    operation.current = controller;
    const current = ++sequence.current;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    setPending('generate'); setError(''); setMessage(''); setPreview(null); setConfirmed(false); setInvalidated(false);
    try {
      const result = await send(controller.signal, { action: 'generate', tripId: trip.id, placeId: selection.placeId, requestId: crypto.randomUUID() });
      if (!validDraft(result.draft)) throw new Error('The destination service returned an incomplete draft. Please regenerate.');
      if (current === sequence.current && !controller.signal.aborted) {
        setClock(Date.now());
        setPreview({ draft: result.draft, context });
      }
    } catch (cause) {
      if (current === sequence.current) setError(controller.signal.aborted ? 'Draft generation timed out. Please try again.' : cause instanceof Error ? cause.message : 'Could not generate a destination draft.');
    } finally {
      clearTimeout(timeout);
      if (current === sequence.current) { operation.current = null; setPending(''); }
    }
  }

  async function add() {
    if (!draft || !allowed || disabled || pending || operation.current || !capability || !consented || !hasTransport || !confirmed || stale) return;
    if (Date.now() >= expiresAt) { setClock(Date.now()); setConfirmed(false); return; }
    const controller = new AbortController();
    operation.current = controller;
    const current = ++sequence.current;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    setPending('add'); setError(''); setMessage('');
    try {
      const result = await send(controller.signal, { action: 'add', tripId: trip.id, proposalId: draft.proposalId, confirmed: true });
      if (result.added !== true || typeof result.replayed !== 'boolean') throw new Error('The addition was not confirmed. Refresh the trip before retrying.');
      if (current !== sequence.current || controller.signal.aborted) return;
      setPreview(null); setConfirmed(false);
      setMessage(result.replayed ? 'This destination was already added to the vote.' : 'Destination added to the vote. This trip now uses AI planning.');
      await onAdded();
    } catch (cause) {
      if (current === sequence.current) {
        if (cause instanceof DestinationRequestError && [409, 410].includes(cause.status)) setInvalidated(true);
        setConfirmed(false);
        setError(controller.signal.aborted ? 'Add was not confirmed before the request timed out. Refresh the trip before retrying.' : cause instanceof Error ? cause.message : 'Could not add this destination.');
      }
    } finally {
      clearTimeout(timeout);
      if (current === sequence.current) { operation.current = null; setPending(''); }
    }
  }

  if (!allowed) return null;
  const blocked = disabled || Boolean(pending);
  const money = (value: number | null) => value === null ? 'Not yet available' : formatMoney(value, draft!.assessment.currency);
  const budgetIncomplete = draft && (draft.assessment.missingTravelEstimates || draft.assessment.groupTotal === null || draft.assessment.myTotal === null);
  return (
    <section aria-labelledby="destination-planner-title" className="min-w-0 space-y-4 border-y border-line py-6" aria-busy={checking || Boolean(pending)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 id="destination-planner-title" className="type-h3 m-0 flex items-center gap-2"><Sparkles className="size-5 shrink-0 text-brand-700" aria-hidden />Search destination</h4>
        <Badge>{checking ? 'Checking availability' : capability?.label || 'AI unavailable'}</Badge>
      </div>
      {error && <Notice tone="warning" role="alert" title="Destination planning">{error}</Notice>}
      {message && <p className="type-small m-0 text-ink-muted" role="status">{message}</p>}
      {!checking && !capability && <Button variant="outline" icon={RefreshCw} disabled={blocked} onClick={() => setReload((value) => value + 1)}>Retry availability</Button>}
      {capability && <>
        <p className="type-small m-0 text-ink-muted">AI drafts require each traveller's consent to send their departure city, travel month, interests and transport choices to Groq. Budgets, names and passports stay private.</p>
        {(!consented || !hasTransport) && <Notice tone="warning">Your saved details need transport choices and permission to allow AI trip drafts before generating.</Notice>}
        <Field label="Destination">
          <DepartureCitySearch
            key={trip.id}
            value={selection.name}
            placeId={selection.placeId}
            country={trip.scope === 'domestic' ? trip.homeCountry || DEFAULT_HOME_COUNTRY : ''}
            disabled={blocked}
            onSelect={(city) => { setSelection({ name: city.departureCity, placeId: city.departurePlaceId }); setPreview(null); setConfirmed(false); setError(''); setMessage(''); }}
          />
        </Field>
        <Button icon={Sparkles} loading={pending === 'generate'} disabled={blocked || !selection.placeId || !consented || !hasTransport} onClick={generate}>{draft ? 'Regenerate draft' : 'Generate draft'}</Button>
      </>}
      {draft && <div className="min-w-0 space-y-4 border-t border-line pt-5" aria-live="polite">
        <div>
          <p className="type-caption m-0 font-semibold text-ink-muted">Draft preview</p>
          <h5 className="type-h3 m-0 mt-1 break-words">{draft.destination.name}, {countryName(draft.destination.countryCode)}</h5>
          <p className="type-body m-0 mt-2 break-words">{draft.destination.summary}</p>
          <p className="type-caption m-0 mt-2 text-ink-muted">Generated {new Date(timestamp(draft.destination.generatedAt)).toLocaleString()}. Expires {new Date(expiresAt).toLocaleString()}.</p>
        </div>
        <Notice tone="warning" title="Generated estimate, not a quote">Prices, routes and service availability are unverified. Confirm current fares, schedules and entry requirements before booking.</Notice>
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          <div><dt className="type-small text-ink-muted">Group estimate</dt><dd className="type-body m-0 break-words font-semibold">{money(draft.assessment.groupTotal)}</dd></div>
          <div><dt className="type-small text-ink-muted">Your estimate, private</dt><dd className="type-body m-0 break-words font-semibold">{money(draft.assessment.myTotal)}</dd></div>
        </dl>
        <p className="type-small m-0 text-ink-muted">{budgetIncomplete ? 'Budget fit is incomplete while travel estimates are missing.' : draft.assessment.withinBudgets ? 'Fits saved budgets at this generated estimate. Actual costs may differ.' : 'Does not fit every saved budget.'}</p>
        <div className="space-y-1">
          <p className="type-small m-0 font-semibold">Your journey, private</p>
          {draft.myJourney ? <>
            <p className="type-small m-0">{transportOptions.find((mode) => mode.value === draft.myJourney!.mode)?.label}: {money(draft.myJourney.low)} to {money(draft.myJourney.high)} (unverified)</p>
            <p className="type-small m-0 text-ink-muted">{draft.myJourney.oneWayMinutes === null ? 'One-way travel time unknown.' : `Estimated one-way travel time: ${draft.myJourney.oneWayMinutes} minutes.`} Route and service availability unverified.</p>
          </> : <p className="type-small m-0 text-ink-muted">No travel estimate yet. Route and service availability unverified.</p>}
        </div>
        {draft.destination.caveats.length > 0 && <ul className="m-0 space-y-1 pl-5 text-ink-muted">{draft.destination.caveats.map((caveat, index) => <li key={index} className="type-small break-words">{caveat}</li>)}</ul>}
        {(stale || expired) && <Notice tone="warning" title={stale ? 'Trip changed' : 'Draft expired'}>This preview can no longer be added. Regenerate a draft using the latest trip details.</Notice>}
        <Checkbox
          label="I reviewed this estimate and want to add it to the vote"
          description="This switches the trip to AI destination planning. Travel services and prices are not verified."
          checked={confirmed && !stale && !expired}
          disabled={blocked || stale || expired || !capability}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <div className="flex flex-wrap gap-2">
          <Button icon={Check} loading={pending === 'add'} disabled={blocked || !capability || !consented || !hasTransport || !confirmed || stale || expired} onClick={add}>Add to vote</Button>
          <Button variant="ghost" icon={X} disabled={blocked} onClick={() => { setPreview(null); setConfirmed(false); setError(''); }}>Discard</Button>
        </div>
      </div>}
    </section>
  );
}