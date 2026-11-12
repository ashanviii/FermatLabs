'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Textarea } from '@/components/ui/field';
import { ChoiceSelect, type ChoiceSelectGroup } from '@/components/ui/choice-select';
import { Notice } from '@/components/ui/notice';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/format';

type ItemPreview = { title: string; time: string; durationMinutes: number; estimatedCost: number };
type Proposal = {
  proposalId: string; expiresAt: number; mode: string; providerLabel: string; goal: string; day: number;
  planVersion: number; planRevision: number; inputRevision: number; explanation: string; currency: string;
  beforeGroupTotal: number; afterGroupTotal: number; beforeYourTotal: number; afterYourTotal: number;
  changes: { kind: string; day: number; before: ItemPreview; after: ItemPreview | null }[];
  checks: string[]; warnings: string[]; source: string;
};

const goals = [
  { value: 'cost', label: 'Reduce estimated cost' }, { value: 'pace', label: 'Leave more free time' },
  { value: 'later', label: 'Start an activity later' }, { value: 'food', label: 'Choose a food experience' },
];
const labGoals = [
  { value: 'custom', label: 'Describe a custom change', description: 'Tell Fermat what to move or replace' },
  { value: 'itinerary', label: 'Refresh the full day-by-day flow', description: 'Rework activities across every day' },
];

export default function TripAssistant({ trip, disabled, onApplied }: { trip: any; disabled: boolean; onApplied: () => Promise<void> }) {
  const { user } = useAuth();
  const [capability, setCapability] = useState<{ mode: string; label: string; labs?: boolean } | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState('cost');
  const [day, setDay] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reload, setReload] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const generation = useRef(0);
  const plan = trip.activePlan;
  const stale = Boolean(proposal && (proposal.planVersion !== plan.version || proposal.planRevision !== plan.revision || proposal.inputRevision !== trip.inputRevision));
  const expired = Boolean(proposal && clock >= proposal.expiresAt);

  useEffect(() => {
    const controller = new AbortController();
    setChecking(true); setCapability(null); setError('');
    const load = async () => {
      try {
        if (!user) throw new Error('Sign in to use the assistant.');
        const token = await user.getIdToken();
        const response = await fetch(`/api/group-trips/assistant?tripId=${encodeURIComponent(trip.id)}`, { headers: { authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Assistant unavailable.');
        if (!controller.signal.aborted) setCapability(body);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Assistant unavailable.');
      } finally { if (!controller.signal.aborted) setChecking(false); }
    };
    void load();
    return () => { controller.abort(); generation.current++; };
  }, [trip.id, user, reload]);

  useEffect(() => {
    if (!proposal) return;
    setClock(Date.now());
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, proposal.expiresAt - Date.now()) + 5);
    return () => clearTimeout(timer);
  }, [proposal]);

  async function send(body: object) {
    if (!user) throw new Error('Sign in to use the assistant.');
    const token = await user.getIdToken();
    const response = await fetch('/api/group-trips/assistant', {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(25_000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The assistant could not complete this request.');
    return data;
  }

  async function suggest() {
    const current = ++generation.current;
    setPending(true); setError(''); setProposal(null);
    try {
      const result = await send({ action: 'propose', tripId: trip.id, requestId: crypto.randomUUID(), goal,
        day: goal === 'itinerary' ? 0 : day, ...(goal === 'custom' ? { instruction: instruction.trim() } : {}) });
      if (current === generation.current) setProposal(result.proposal);
    } catch (cause) { if (current === generation.current) setError(cause instanceof Error ? cause.message : 'Could not prepare a suggestion.'); }
    finally { if (current === generation.current) setPending(false); }
  }

  async function apply() {
    if (!proposal || stale || expired) return;
    setPending(true); setError('');
    try {
      await send({ action: 'apply', tripId: trip.id, proposalId: proposal.proposalId, confirmed: true });
      setConfirming(false); setProposal(null); await onApplied();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not apply this suggestion.'); setConfirming(false); }
    finally { setPending(false); }
  }

  const money = (amount: number) => formatMoney(amount, proposal?.currency || plan.currency);
  const goalGroups: ChoiceSelectGroup[] = [
    { options: goals },
    ...(capability?.labs ? [{ label: 'AI Labs', icon: Sparkles, options: labGoals }] : []),
  ];
  const dayGroups: ChoiceSelectGroup[] = [{ options: [
    { value: '0', label: 'Any day' },
    ...plan.itinerary.map((entry: any) => ({ value: String(entry.day), label: `Day ${entry.day}` })),
  ] }];
  return (
    <section aria-labelledby="trip-assistant-title" className="min-w-0 border-y border-line py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 id="trip-assistant-title" tabIndex={-1} className="type-h3 m-0 flex scroll-mt-24 items-center gap-2"><Sparkles className="size-5 text-brand-700" aria-hidden />Trip assistant</h4>
        <Badge>{capability?.mode === 'development' ? 'Development simulation - no AI call' : capability?.mode === 'openai' ? 'OpenAI' : capability?.mode === 'groq' ? 'Groq AI' : checking ? 'Checking availability' : 'Unavailable'}</Badge>
      </div>
      {error && <div role="alert" className="mt-4"><Notice tone="warning" title="Assistant status">{error}</Notice></div>}
      {!capability && !checking && <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => setReload((value) => value + 1)} className="mt-3">Retry availability</Button>}
      {capability && <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="What would improve this trip?">
            <ChoiceSelect value={goal} groups={goalGroups} disabled={pending || disabled} onValueChange={(value) => { setGoal(value); if (value === 'itinerary') setDay(0); setProposal(null); }} />
          </Field>
          <Field label="Day">
            <ChoiceSelect value={String(goal === 'itinerary' ? 0 : day)} groups={dayGroups} disabled={pending || disabled || goal === 'itinerary'} onValueChange={(value) => { setDay(Number(value)); setProposal(null); }} />
          </Field>
        </div>
        {goal === 'custom' && <Field label="Describe the change" hint="The assistant can remove, replace or reschedule existing activities. It cannot book travel or invent new catalog items." className="mt-4">
          <Textarea value={instruction} maxLength={400} placeholder="For example: Make day 2 calmer and move the museum after lunch." disabled={pending || disabled} onChange={(event) => { setInstruction(event.target.value); setProposal(null); }} />
        </Field>}
        {goal === 'itinerary' && <Notice tone="info" title="AI Labs preview">This refresh can replace and reschedule existing activities across the trip. Fermat still checks private budgets and time overlaps before showing the preview.</Notice>}
        <Button className="mt-4" icon={Sparkles} loading={pending && !confirming} disabled={disabled || pending || (goal === 'custom' && instruction.trim().length < 5)} onClick={suggest}>Preview suggestion</Button>
      </>}
      {proposal && <div className="mt-6 min-w-0 space-y-4" aria-live="polite">
        <p className="type-body m-0 text-ink">{proposal.explanation}</p>
        <p className="type-caption m-0 text-ink-muted">{proposal.source}</p>
        <ul className="m-0 list-none divide-y divide-line p-0">
          {proposal.changes.map((change, index) => <li key={index} className="py-4">
            <p className="type-small m-0 font-semibold">Day {change.day} · {change.kind === 'remove' ? 'Remove activity' : change.kind === 'replace' ? 'Replace activity' : 'Move activity later'}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div><p className="type-caption m-0 text-ink-muted">Current</p><p className="type-body m-0 break-words">{change.before.title}</p><p className="type-small m-0 text-ink-muted">{change.before.time} · {change.before.durationMinutes} min · {money(change.before.estimatedCost)} group estimate</p></div>
              <div><p className="type-caption m-0 text-ink-muted">Proposed</p><p className="type-body m-0 break-words">{change.after?.title || 'Unscheduled time'}</p>{change.after && <p className="type-small m-0 text-ink-muted">{change.after.time} · {change.after.durationMinutes} min · {money(change.after.estimatedCost)} group estimate</p>}</div>
            </div>
          </li>)}
        </ul>
        {proposal.changes.length > 0 && <>
          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            <div><dt className="type-small text-ink-muted">Group estimate</dt><dd className="type-body m-0 font-semibold">{money(proposal.beforeGroupTotal)} to {money(proposal.afterGroupTotal)}</dd></div>
            <div><dt className="type-small text-ink-muted">Your estimate, private</dt><dd className="type-body m-0 font-semibold">{money(proposal.beforeYourTotal)} to {money(proposal.afterYourTotal)}</dd></div>
          </dl>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">{proposal.checks.map((check) => <li key={check} className="type-caption flex items-center gap-1 text-success-ink"><Check className="size-3.5" aria-hidden />{check}</li>)}</ul>
          <ul className="m-0 space-y-1 pl-5 text-ink-muted">{proposal.warnings.map((warning) => <li key={warning} className="type-small">{warning}</li>)}</ul>
          {(stale || expired) && <Notice tone="warning" title="Preview expired">The trip changed or this preview expired. Request a fresh suggestion.</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button icon={Check} disabled={disabled || pending || stale || expired} onClick={() => setConfirming(true)}>Review and apply</Button>
            <Button variant="ghost" icon={X} disabled={pending} onClick={() => setProposal(null)}>Discard</Button>
          </div>
        </>}
      </div>}
      {confirming && <Dialog open onOpenChange={(open) => { if (!pending) setConfirming(open); }}>
        <DialogContent><DialogHeader><DialogTitle>Apply these trip changes?</DialogTitle><DialogDescription>The proposal will be rechecked against the current trip. Everyone will need to approve the updated plan again.</DialogDescription></DialogHeader>
          <div className="mt-5 flex flex-wrap gap-2"><Button icon={Check} loading={pending} disabled={disabled || stale || expired} onClick={apply}>Apply changes</Button><Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button></div>
        </DialogContent>
      </Dialog>}
    </section>
  );
}
