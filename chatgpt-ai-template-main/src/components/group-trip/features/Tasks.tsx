'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Check, ChevronDown, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, controlClass } from '@/components/ui/field';
import { icons, type IconComponent } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { formatDate, formatList, plural } from '@/lib/format';
import geoHolidays from '@/lib/geo/holidays.json';
import indiaFestivals from '@/lib/indiaHolidays.json';
import { tripHomeCountry } from './currency';
import { avatarName } from '../shell/tripState';
import type { FeatureProps } from './types';

type Task = { id: string; title: string; assigneeUid: string | null; done: boolean; createdBy: string; at: number };
type Waiting = { inputs: number; votes: number; approvals: number };

type Holiday = { date: string; name: string };

const DAY = 86400000;
const EARLY_SUGGESTIONS = ['Find dates that work', "Get everyone's inputs in"];
const NATIONAL_HOLIDAYS = geoHolidays.countries as Record<string, Holiday[]>;
// Countries whose weekend is Friday and Saturday; everywhere else it is Saturday and Sunday.
const FRI_SAT_WEEKEND = new Set(['SA', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'IQ', 'IL', 'DZ', 'LY', 'SD', 'YE', 'SY', 'BD']);
const holidayCache = new Map<string, Map<string, string> | null>();

// National public holidays for the group's home country (src/lib/geo/holidays.json); India also keeps its festival list.
function holidaysFor(country: string): Map<string, string> | null {
  if (holidayCache.has(country)) return holidayCache.get(country) ?? null;
  const national = NATIONAL_HOLIDAYS[country];
  const list: Holiday[] = [...(national || []), ...(country === 'IN' ? indiaFestivals.holidays : [])];
  const map = list.length ? new Map(list.map((h) => [h.date, h.name] as [string, string])) : null;
  holidayCache.set(country, map);
  return map;
}

const NAMED_WITH_THE = new Set(['US', 'GB', 'NL', 'AE', 'PH', 'BS', 'DO', 'GM', 'MV']);
function countryName(code: string) {
  let name = code;
  try { name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { /* old browsers: keep the code */ }
  return NAMED_WITH_THE.has(code) ? `the ${name}` : name;
}

// Bank and visa reminders only make sense abroad; India keeps its forex-card tip.
function lockedSuggestions(trip: any, home: string) {
  const dest = trip?.destinations?.find((d: any) => d.id === trip?.activePlan?.destinationId);
  if (dest?.domestic) return ['Book stays', 'Compare flights', 'Buy travel insurance'];
  const bank = home === 'IN' ? 'Sort a forex card' : home === 'US' ? "Tell your bank you're traveling" : "Tell your bank you're travelling";
  return ['Book stays', 'Compare flights', 'Check visa rules', 'Buy travel insurance', bank];
}
const ACTIONS: [keyof Waiting, string][] = [['inputs', 'add their trip details'], ['votes', 'vote'], ['approvals', 'approve the plan']];

const pretty = (iso: string) => formatDate(iso, 'medium');
const needs = (n: number) => (n === 1 ? 'needs' : 'need');
const encode = encodeURIComponent;

// Working days in the trip range (not weekend, not a public holiday at home) and the holidays it skipped.
function workingDays(start: string, end: string, country: string) {
  const holidays = holidaysFor(country); const weekend = FRI_SAT_WEEKEND.has(country) ? [5, 6] : [0, 6];
  let days = 0; const skipped: string[] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += DAY) {
    const day = new Date(t); const iso = day.toISOString().slice(0, 10);
    if (weekend.includes(day.getUTCDay())) continue;
    const holiday = holidays?.get(iso);
    if (holiday) skipped.push(holiday); else days += 1;
  }
  return { days, skipped, known: Boolean(holidays) };
}

function leaveMailto(start: string, end: string, days: number, term: string, known: boolean) {
  const subject = `${term === 'leave' ? 'Leave' : 'Time off'} request: ${pretty(start)} to ${pretty(end)}`;
  const body = [`Hi,`, '', `I would like to request ${term} from ${pretty(start)} to ${pretty(end)} for a trip with friends.`, `This needs ${days} working day${days === 1 ? '' : 's'} off. ${known ? 'Weekends and public holidays' : 'Weekends'} in that range are already left out.`, '', 'Please let me know if this works. I will make sure my work is covered before I go.', '', 'Thank you'].join('\n');
  return `mailto:?subject=${encode(subject)}&body=${encode(body)}`;
}

// Itinerary only: no money and nothing private.
function familyText(trip: any) {
  const plan = trip.activePlan; const organizer = trip.members?.[trip.ownerUid]?.nickname || 'the organizer';
  const days = plan.itinerary.map((day: any) => {
    const titles = day.items.filter((item: any) => !item.id.startsWith('meal-')).map((item: any) => item.title).join(', ');
    return `Day ${day.day} (${pretty(day.date)}, ${day.city || plan.destinationName}): ${titles}`;
  });
  return [`${trip.name}: ${plan.destinationName}, ${pretty(plan.startDate)} to ${pretty(plan.endDate)}`, '', ...days, '', `Ask ${organizer} for details.`].join('\n');
}

const openWhatsApp = (text: string) => window.open(`https://wa.me/?text=${encode(text)}`, '_blank', 'noopener');
async function share(text: string) {
  if (navigator.share) { try { await navigator.share({ text }); } catch { /* cancelled */ } return; }
  openWhatsApp(text);
}

/** A row in the "more" list under the tasks: icon, title, one line, actions. */
function Extra({ icon: Icon, title, children, actions }: { icon: IconComponent; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-0 border-t border-solid border-line-subtle py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
        <Icon className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="grid min-w-0 flex-1 gap-2">
        <div>
          <p className="type-body m-0 font-semibold text-ink">{title}</p>
          <div className="type-small m-0 text-ink-muted">{children}</div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Shared to-dos plus anonymous nudges. Never names who is running late.
export default function Tasks({ trip, uid, owner, disabled, command }: FeatureProps) {
  const data = trip?.features?.tasks || {};
  const tasks: Task[] = data.tasks || [];
  const waiting: Waiting = { inputs: 0, votes: 0, approvals: 0, ...(data.waitingOn || {}) };
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setOrigin(location.origin); setCanShare(typeof navigator.share === 'function'); }, []);

  const members = Object.values(trip?.members || {}).filter((m: any) => m.status === 'approved').sort((a: any, b: any) => a.joinOrder - b.joinOrder) as any[];
  const nickname = (id: string | null) => (id && trip?.members?.[id]?.nickname) || 'Someone';
  const canEdit = (task: Task) => owner || task.createdBy === uid || task.assigneeUid === uid;
  const canRemove = (task: Task) => owner || task.createdBy === uid;
  const existing = new Set(tasks.map((task) => task.title.toLowerCase()));
  const home = tripHomeCountry(trip);
  const phaseSuggestions = trip?.phase === 'locked' ? lockedSuggestions(trip, home) : trip?.phase === 'collecting' || trip?.phase === 'voting' ? EARLY_SUGGESTIONS : [];
  const suggestions = phaseSuggestions.filter((s) => !existing.has(s.toLowerCase()));
  const ordered = [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)];
  const doneCount = tasks.filter((t) => t.done).length;

  const add = async (text: string) => { const clean = text.trim(); if (clean && (await command({ type: 'addTask', title: clean }))) setTitle(''); };
  const submit = (e: FormEvent) => { e.preventDefault(); add(title); };

  const nudges = ACTIONS.filter(([key]) => waiting[key] > 0).map(([key, action]) => ({ key, count: waiting[key], action }));
  const nudgeText = nudges.length ? `${nudges.map((n) => `${n.count} of us still ${needs(n.count)} to ${n.action}`).join(' and ')} for ${trip.name} on Fermat: ${origin}/plan` : '';
  const leave = trip?.startDate && trip?.endDate ? workingDays(trip.startDate, trip.endDate, home) : null;
  const leaveDays = leave ? leave.days : null;
  const term = home === 'IN' ? 'leave' : 'time off';
  const skippedNames = leave ? Array.from(new Set(leave.skipped)) : [];
  const skipsText = !leave?.known ? 'Skips weekends. Check your local public holidays.'
    : skippedNames.length ? `Skips weekends and ${formatList(skippedNames.length > 2 ? [...skippedNames.slice(0, 2), `${skippedNames.length - 2} more`] : skippedNames)}.`
      : `Skips weekends and public holidays in ${countryName(home)}.`;
  const myOpen: number = data.myOpenTasks || 0;

  return (
    <Card>
      <CardHeader
        icon={icons.tasks}
        title="Who's doing what"
        description="Split the planning so it doesn't all land on one person."
        action={myOpen > 0 ? <Badge tone="brand" size="sm">{plural(myOpen, 'task')} for you</Badge> : undefined}
      />
      <CardBody className="grid gap-5">
        <form className="flex gap-2" onSubmit={submit}>
          <Input aria-label="New task" className="flex-1" maxLength={80} placeholder="e.g. Book the airport cab" value={title} disabled={disabled} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" variant="secondary" size="icon" className="h-11 w-11 shrink-0" aria-label="Add task" disabled={disabled || !title.trim()}>
            <Plus strokeWidth={2} aria-hidden />
          </Button>
        </form>

        {suggestions.length > 0 && (
          <div className="grid gap-2">
            <p className="type-overline m-0 text-ink-muted">Quick add</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} size="sm" variant="outline" icon={Plus} className="h-8 px-3 text-[0.8125rem]" disabled={disabled} onClick={() => add(s)}>{s}</Button>
              ))}
            </div>
          </div>
        )}

        {ordered.length === 0 ? (
          <EmptyState size="sm" icon={icons.tasks} title="No tasks yet" description="Add one, like booking the airport cab." />
        ) : (
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <p className="type-overline m-0 text-ink-muted">Tasks</p>
              <span className="type-caption type-num text-ink-muted">{doneCount} of {tasks.length} done</span>
            </div>
            <ul className="m-0 grid list-none gap-0 p-0">
              {ordered.map((task) => {
                const editable = !disabled && canEdit(task);
                return (
                  <li key={task.id} className="grid gap-2 border-0 border-b border-solid border-line-subtle py-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                        <input
                          type="checkbox"
                          aria-label={`Mark "${task.title}" as done`}
                          checked={task.done}
                          disabled={!editable}
                          onChange={(e) => command({ type: 'completeTask', taskId: task.id, done: e.target.checked })}
                          className="peer absolute inset-0 m-0 size-5 cursor-pointer appearance-none rounded-full border-0 bg-surface ring-1 ring-inset ring-line-strong transition-colors checked:bg-success checked:ring-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-muted"
                        />
                        <Check className="pointer-events-none relative size-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('type-body m-0 font-medium', task.done ? 'text-ink-muted line-through' : 'text-ink')}>{task.title}</p>
                        <p className="type-caption m-0 text-ink-muted">Added by {task.createdBy === uid ? 'you' : nickname(task.createdBy)}</p>
                      </div>
                      {canRemove(task) && (
                        <Button size="icon-sm" variant="ghost" className="-mr-1 -mt-1 shrink-0" title="Remove" aria-label={`Remove "${task.title}"`} disabled={disabled} onClick={() => command({ type: 'removeTask', taskId: task.id })}>
                          <Trash2 strokeWidth={1.75} aria-hidden />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      {task.assigneeUid ? <Avatar name={avatarName(nickname(task.assigneeUid))} size="xs" /> : <span className="size-6 shrink-0 rounded-full bg-surface-muted ring-1 ring-inset ring-line" aria-hidden />}
                      <div className="relative min-w-0 flex-1">
                        <select
                          aria-label={`Who is doing "${task.title}"`}
                          className={cn(controlClass, 'h-9 cursor-pointer appearance-none rounded-lg pr-8 text-[0.8125rem]', !task.assigneeUid && 'text-ink-muted')}
                          value={task.assigneeUid || ''}
                          disabled={!editable}
                          onChange={(e) => command({ type: 'assignTask', taskId: task.id, assigneeUid: e.target.value || null })}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => <option key={m.uid} value={m.uid}>{m.uid === uid ? `${m.nickname} (you)` : m.nickname}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" strokeWidth={2} aria-hidden />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {nudges.length > 0 && (
          <div className="grid gap-3 rounded-2xl bg-surface-muted p-4">
            <div className="flex items-center gap-2">
              <icons.nudge className="size-[1.125rem] text-ink-soft" strokeWidth={1.75} aria-hidden />
              <p className="type-body m-0 font-semibold text-ink">Waiting on the group</p>
            </div>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {nudges.map((n) => <li key={n.key}><StatusPill status="pending" className="bg-surface">{n.count} still {needs(n.count)} to {n.action}</StatusPill></li>)}
            </ul>
            <p className="type-small m-0 text-ink-muted">Reminders go to everyone. Nobody is named.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="whatsapp" icon={icons.whatsapp} onClick={() => openWhatsApp(nudgeText)}>Remind on WhatsApp</Button>
              <Button asChild size="sm" variant="outline">
                <a href={`sms:?&body=${encode(nudgeText)}`}><MessageSquare strokeWidth={2} aria-hidden />Text</a>
              </Button>
              {canShare && <Button size="sm" variant="outline" icon={icons.share} onClick={() => share(nudgeText)}>Share</Button>}
            </div>
          </div>
        )}

        {(leaveDays !== null || trip?.activePlan) && (
          <div className="grid border-0 border-t border-solid border-line-subtle pt-5">
            {leaveDays !== null && (
              <Extra
                icon={icons.calendar}
                title={`Ask for ${term}`}
                actions={leaveDays > 0 && (
                  <Button asChild size="sm" variant="outline">
                    <a href={leaveMailto(trip.startDate, trip.endDate, leaveDays, term, Boolean(leave?.known))}><Mail strokeWidth={2} aria-hidden />Draft {term === 'leave' ? 'leave' : 'time-off'} email</a>
                  </Button>
                )}
              >
                {leaveDays > 0
                  ? <>Needs <span className="font-semibold text-ink">{plural(leaveDays, 'working day')}</span> off. {skipsText}</>
                  : `This trip falls on weekends${leave?.known ? ' and public holidays' : ''}. No ${term} needed.`}
                {leave?.known && (
                  <span className="type-caption mt-1 block">
                    Public holidays from <a className="text-ink-muted underline underline-offset-2 hover:text-ink" href="https://github.com/commenthol/date-holidays" target="_blank" rel="noopener noreferrer">date-holidays</a> by commenthol and contributors, CC BY 3.0.
                  </span>
                )}
              </Extra>
            )}
            {trip?.activePlan && (
              <Extra
                icon={icons.members}
                title="Share with family"
                actions={<Button size="sm" variant="outline" icon={icons.share} onClick={() => share(familyText(trip))}>Share the plan</Button>}
              >
                Where you&apos;re going and the day plan. No money or private details.
              </Extra>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
