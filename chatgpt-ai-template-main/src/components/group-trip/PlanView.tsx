'use client';
import { useState } from 'react';
import { MessageSquareText, Pencil, Printer, RotateCcw } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { AsciiRoute } from '@/components/ui/ascii-motion';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { icons, type IconComponent } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/ui/stat-tile';
import { cn } from '@/lib/utils';
import { formatDate, formatDateRange, formatMoney, nightsBetween, plural } from '@/lib/format';
import { currencySymbol, tripCurrency } from './results/money';
import { VoteResults } from './results/VoteResults';

type ItemKind = 'flight' | 'road' | 'arrival' | 'departure' | 'meal' | 'free' | 'activity';

const duration = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`);
const kind = (item: any): ItemKind =>
  item.id.startsWith('transfer-')
    ? /^Fly /.test(item.title)
      ? 'flight'
      : 'road'
    : item.id.startsWith('arrival-')
      ? 'arrival'
      : item.id.startsWith('departure-')
        ? 'departure'
        : item.id.startsWith('meal-')
          ? 'meal'
          : item.id.startsWith('flex-')
            ? 'free'
            : 'activity';

const kindMeta: Record<ItemKind, { Icon: IconComponent; label: string; tile: string }> = {
  flight: { Icon: icons.flight, label: 'Flight', tile: 'bg-info-soft text-info-ink' },
  road: { Icon: icons.roadTransfer, label: 'Road transfer', tile: 'bg-info-soft text-info-ink' },
  arrival: { Icon: icons.arrival, label: 'Arrival', tile: 'bg-brand-50 text-brand-700' },
  departure: { Icon: icons.departure, label: 'Departure', tile: 'bg-brand-50 text-brand-700' },
  meal: { Icon: icons.meal, label: 'Meal', tile: 'bg-surface-muted text-ink-muted' },
  free: { Icon: icons.freeTime, label: 'Free time', tile: 'bg-warm-50 text-warm-700' },
  activity: { Icon: icons.activity, label: 'Activity', tile: 'bg-brand-50 text-brand-700' },
};

const decisionMeta: Record<string, { label: string; Icon: IconComponent; className: string }> = {
  approved: { label: 'Approved', Icon: icons.success, className: 'text-success-ink' },
  changesRequested: { label: 'Wants changes', Icon: icons.warning, className: 'text-warning-ink' },
  waiting: { label: 'Waiting', Icon: icons.pending, className: 'text-ink-muted' },
};

function ItemEditor({ item, currency, onSave, onCancel, disabled }: { item: any; currency: string; onSave: (patch: any) => Promise<boolean>; onCancel: () => void; disabled: boolean }) {
  const [draft, setDraft] = useState({ title: item.title, time: item.time, durationMinutes: item.durationMinutes, location: item.location, estimatedCost: item.estimatedCost, verificationAction: item.verificationAction });
  const [saving, setSaving] = useState(false);
  const set = (patch: any) => setDraft((current) => ({ ...current, ...patch }));
  return (
    <div className="mt-3 rounded-2xl bg-surface-muted p-4 sm:p-5">
      <p className="type-small m-0 flex items-center gap-2 font-semibold text-ink">
        <Pencil className="size-4 text-brand-700" strokeWidth={1.75} aria-hidden />
        Edit this stop
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="What" className="sm:col-span-2">
          <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Start time">
          <Input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} />
        </Field>
        <Field label="Duration">
          <Input type="number" inputMode="numeric" min={1} trailing="min" value={draft.durationMinutes} onChange={(e) => set({ durationMinutes: Number(e.target.value) })} />
        </Field>
        <Field label="Where">
          <Input value={draft.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Cost for the group">
          <Input type="number" inputMode="numeric" min={0} leading={currencySymbol(currency)} value={draft.estimatedCost} onChange={(e) => set({ estimatedCost: Number(e.target.value) })} />
        </Field>
      </div>
      <p className="type-small m-0 mt-4 text-ink-muted">Saving asks everyone to approve the plan again.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          icon={icons.check}
          loading={saving}
          disabled={disabled}
          onClick={async () => {
            setSaving(true);
            const ok = await onSave(draft);
            setSaving(false);
            if (ok) onCancel();
          }}
        >
          Save change
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function PlanView({ trip, uid, owner, disabled, command, onShare }: { trip: any; uid: string; owner: boolean; disabled: boolean; command: (c: any) => Promise<boolean>; onShare: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const plan = trip.activePlan;
  const people = plan.memberTotals.length;
  const mine = plan.memberTotals.find((m: any) => m.uid === uid);
  const approvals: Record<string, string> = plan.approvals || {};
  const approvedCount = Object.values(approvals).filter((d) => d === 'approved').length;
  const changesCount = Object.values(approvals).filter((d) => d === 'changesRequested').length;
  const myDecision = approvals[uid];
  const base = { planVersion: plan.version, planRevision: plan.revision };
  const currency = tripCurrency(trip);
  const money = (amount: number, compact = false) => formatMoney(amount, currency, { compact });
  const days = plan.itinerary.length;
  const nights = nightsBetween(plan.startDate, plan.endDate);
  const stops: any[] = plan.stops || [];
  const multiStop = stops.length > 1;
  const members: any[] = Object.values(trip.members || {});
  const needsReview = plan.status === 'needsReview';

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-white shadow-raised sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div className="relative">
          <p className="type-overline m-0 text-brand-200">Where you're going</p>
          <h3 className="type-display m-0 mt-2 text-white">{plan.destinationName}</h3>
          {/* The trip is locked: the route draws itself from home to the destination. */}
          <AsciiRoute
            from="YOU"
            to={plan.destinationName.toUpperCase()}
            length={16}
            className="mt-4 max-w-full overflow-hidden text-[0.6875rem] text-warm-300 sm:text-[0.8125rem]"
          />
          <ul className="type-body m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-white/85">
            <li className="flex items-center gap-2">
              <icons.calendar className="size-4 text-brand-200" strokeWidth={1.75} aria-hidden />
              {formatDateRange(plan.startDate, plan.endDate)} · {plural(days, 'day')}, {plural(nights, 'night')}
            </li>
            <li className="flex items-center gap-2">
              <icons.members className="size-4 text-brand-200" strokeWidth={1.75} aria-hidden />
              {plural(people, 'traveller')}
            </li>
            {stops.length > 0 && (
              <li className="flex items-center gap-2">
                {multiStop ? <icons.route className="size-4 text-warm-300" strokeWidth={1.75} aria-hidden /> : <icons.destination className="size-4 text-brand-200" strokeWidth={1.75} aria-hidden />}
                <span className={cn(multiStop && 'font-semibold text-white')}>
                  {multiStop ? stops.map((stop) => `${stop.name} ${stop.nights}N`).join(' → ') : `${stops[0].name} ${stops[0].nights}N`}
                </span>
              </li>
            )}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {needsReview ? (
              <StatusPill status="warning" size="lg" icon={icons.duration}>
                Needs a look: two stops overlap
              </StatusPill>
            ) : (
              <StatusPill status="ok" size="lg">
                Fits everyone's budget
              </StatusPill>
            )}
            <Badge size="lg" className="bg-white/10 text-white">
              Version {plan.revision}
            </Badge>
          </div>
        </div>
      </div>

      {/* How the vote went: anonymous tally, verdict, and (private) why the viewer's pick did or didn't win */}
      <VoteResults trip={trip} />

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="private" label="Your share" value={mine ? money(mine.total) : '—'} hint="Only you see this" />
        <StatTile tone="private" label="Per day for you" value={mine ? money(Math.round(mine.total / days)) : '—'} hint={`Over ${plural(days, 'day')}`} />
        <StatTile icon={icons.money} label="Group total" value={money(plan.groupTotal, true)} hint={`Incl. 10% buffer · ${plural(people, 'traveller')}`} />
        <StatTile
          icon={icons.success}
          label="Approvals"
          value={`${approvedCount} of ${people}`}
          hint={
            <span className="flex flex-col gap-2 pt-1">
              <Progress label="Plan approvals" value={approvedCount} max={people} tone="success" />
              {changesCount > 0 ? `${changesCount} asked for changes` : approvedCount === people ? 'Everyone is in' : `Waiting on ${people - approvedCount - changesCount}`}
            </span>
          }
        />
      </div>

      {/* Anonymous notes */}
      {plan.inclusions?.length > 0 && (
        <Notice tone="info" icon={icons.members} title="Planned around everyone's preferences">
          {plan.inclusions.join(' · ')}.
        </Notice>
      )}

      {/* Day by day */}
      <Card>
        <CardHeader icon={icons.plan} title="Day by day" description={`${plural(days, 'day')} in ${multiStop ? stops.map((s) => s.name).join(' and ') : plan.destinationName}.`} className="pb-4 sm:pb-4" />
        <nav aria-label="Jump to day" className="-mt-1 flex gap-2 overflow-x-auto px-5 pb-5 sm:px-6 print:hidden">
          {plan.itinerary.map((day: any) => (
            <a
              key={day.date}
              href={`#day-${day.day}`}
              className="type-small inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 font-semibold text-ink-soft no-underline outline-none transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="text-ink">Day {day.day}</span>
              <span className="font-normal text-ink-muted">{formatDate(day.date, 'weekday').split(',')[0]}</span>
            </a>
          ))}
        </nav>

        <ol className="m-0 list-none border-0 border-t border-solid border-line-subtle p-0">
          {plan.itinerary.map((day: any) => (
            <li key={day.date} id={`day-${day.day}`} className="scroll-mt-24 border-0 border-b border-solid border-line-subtle px-5 py-6 last:border-b-0 sm:px-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="type-overline m-0 text-brand-600">Day {day.day}</p>
                <h4 className="type-h3 m-0">{formatDate(day.date, 'long')}</h4>
                {day.city && multiStop && (
                  <Badge size="sm" tone="brand" icon={icons.destination}>
                    {day.city}
                  </Badge>
                )}
              </div>

              <ol className="relative m-0 mt-4 list-none p-0">
                <span aria-hidden className="absolute bottom-4 left-[1.1875rem] top-4 w-px bg-line" />
                {day.items.map((item: any) => {
                  const type = kind(item);
                  const meta = kindMeta[type];
                  const going = item.attendeeCount || people;
                  const perPerson = Math.round(item.estimatedCost / going);
                  const optional = item.templateId && going < people;
                  const skipping = item.iAttend === false;
                  const transport = type === 'flight' || type === 'road';
                  return (
                    <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0 sm:gap-4">
                      <span className={cn('relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-surface', meta.tile)}>
                        <meta.Icon className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
                        <span className="sr-only">{meta.label}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        {type === 'meal' ? (
                          <p className="type-small m-0 flex min-h-10 flex-wrap items-center gap-x-2 text-ink-muted">
                            <span className="type-num font-semibold text-ink-soft">{item.time}</span>
                            <span>{item.title}</span>
                            <span aria-hidden>·</span>
                            <span>{duration(item.durationMinutes)}</span>
                          </p>
                        ) : (
                          <div className={cn('rounded-2xl p-4', type === 'free' ? 'bg-surface-muted' : 'bg-surface ring-1 ring-inset ring-line-subtle', skipping && 'opacity-80')}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="type-caption m-0 flex items-center gap-1.5 text-ink-muted">
                                <span className="type-num font-semibold text-brand-700">{item.time}</span>
                                <span aria-hidden>·</span>
                                <span>{duration(item.durationMinutes)}</span>
                              </p>
                              <p className="type-small m-0 shrink-0 text-right text-ink-muted">
                                <span className="type-num font-bold text-ink">{perPerson ? money(perPerson) : transport ? 'In budget' : 'Included'}</span>
                                {perPerson > 0 && <span> per person</span>}
                              </p>
                            </div>
                            <p className="type-body m-0 mt-1 font-semibold text-ink">{item.title}</p>
                            {item.location && (
                              <p className="type-small m-0 mt-0.5 flex items-center gap-1 text-ink-muted">
                                <icons.destination className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
                                <span className="truncate">{item.location}</span>
                              </p>
                            )}
                            {(optional || skipping) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {optional && (
                                  <Badge size="sm" tone="neutral" icon={icons.members}>
                                    {`Optional · ${going} of ${people} going`}
                                  </Badge>
                                )}
                                {skipping && <Badge size="sm" tone="private">You're skipping this</Badge>}
                              </div>
                            )}
                            {((item.verificationAction && type !== 'free') || (owner && editing !== item.id)) && (
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                {item.verificationAction && type !== 'free' ? (
                                  <p className="type-caption m-0 flex items-center gap-1.5 font-normal text-ink-muted">
                                    <icons.tasks className="size-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
                                    {item.verificationAction}
                                  </p>
                                ) : (
                                  <span />
                                )}
                                {owner && editing !== item.id && (
                                  <Button size="sm" variant="ghost" icon={Pencil} className="-my-1 -mr-2 h-8 px-2.5 text-brand-700 print:hidden" onClick={() => setEditing(item.id)} aria-label={`Edit ${item.title}`}>
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {editing === item.id && <ItemEditor item={item} currency={currency} disabled={disabled} onCancel={() => setEditing(null)} onSave={(patch) => command({ type: 'editPlanItem', ...base, itemId: item.id, patch })} />}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </Card>

      {/* Approvals */}
      <section aria-labelledby="plan-approvals" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 id="plan-approvals" className="type-h3 m-0">
            Who's approved
          </h4>
          <p className="type-small m-0 text-ink-muted">{`${approvedCount} of ${people} for version ${plan.revision}`}</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {members.map((member: any) => {
            const decision = approvals[member.uid] || 'waiting';
            const d = decisionMeta[decision] || decisionMeta.waiting;
            return (
              <li key={member.uid} className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 shadow-card">
                <Avatar name={member.nickname} size="sm" />
                <span className="type-small font-semibold text-ink">
                  {member.nickname}
                  {member.uid === uid && <span className="font-normal text-ink-muted"> (you)</span>}
                </span>
                <span className={cn('type-caption flex items-center gap-1', d.className)}>
                  <d.Icon className="size-3.5" strokeWidth={2} aria-hidden />
                  {d.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Actions */}
      <div className="sticky bottom-3 z-10 flex items-center gap-2 rounded-2xl bg-surface/95 p-2.5 shadow-pop backdrop-blur sm:p-3 print:hidden">
        <Button
          className="flex-1 sm:flex-none"
          variant={myDecision === 'approved' ? 'secondary' : 'primary'}
          icon={icons.check}
          disabled={disabled}
          onClick={() => command({ type: 'approvePlan', ...base, decision: 'approved' })}
        >
          {myDecision === 'approved' ? 'You approved' : 'Approve plan'}
        </Button>
        <Button variant="outline" className="min-w-0 flex-1 px-4 sm:flex-none sm:px-5" disabled={disabled} onClick={() => command({ type: 'approvePlan', ...base, decision: 'changesRequested' })}>
          <MessageSquareText className="hidden size-4 sm:block" strokeWidth={2} aria-hidden />
          <span className="whitespace-nowrap">Request changes</span>
        </Button>
      </div>

      {/* Secondary actions: share, print, reopen */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" icon={icons.whatsapp} onClick={onShare}>
          Share on WhatsApp
        </Button>
        <Button variant="ghost" size="sm" icon={Printer} onClick={() => window.print()}>
          Print
        </Button>
        {owner && (
          <Button variant="ghost" size="sm" icon={RotateCcw} className="sm:ml-auto" disabled={disabled} onClick={() => command({ type: 'reopen' })}>
            Reopen voting
          </Button>
        )}
      </div>
    </div>
  );
}
