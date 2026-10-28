'use client';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, StatusPill, PrivateBadge, type Status } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { asciiArt } from '@/components/ui/ascii';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { icons, type IconComponent } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatDateRange, formatMoney, formatProgress, plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import seeds from '@/lib/groupTripSeeds.v1.json';
import worldHolidays from '@/lib/geo/holidays.json';
import indiaFestivals from '@/lib/indiaHolidays.json';
import { approxMoney, compactMoney, currencySymbol, tripCurrency, tripHome } from './results/money';

const DAY = 86400000;
/** In-scope destination summary from the engine projection (trip.destinations). */
type Dest = { id: string; name: string; country: string; countryCode?: string; domestic: boolean; tags: string[]; kind?: 'city' | 'route'; stops?: string[] };
/** trip.destinations, or for projections from before it existed, the Indian default shortlist from the seeds. */
function destinationsOf(trip: any): Dest[] {
  if (Array.isArray(trip?.destinations)) return trip.destinations;
  const shortlist: string[] = (seeds as any).defaultShortlists?.IN || seeds.destinations.map((d) => d.id);
  return (seeds.destinations as any[])
    .filter((d) => shortlist.includes(d.id))
    .map((d) => ({ id: d.id, name: d.name, country: d.country, domestic: Boolean(d.domestic), tags: d.tags, stops: d.stops?.map((stop: any) => stop.name) }));
}
const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** National holidays for a country (2026-27, date-holidays); India also gets the festival list. */
function holidayMap(countryCode: string): Map<string, string> {
  const countries = worldHolidays.countries as Record<string, { date: string; name: string }[]>;
  const list = Object.prototype.hasOwnProperty.call(countries, countryCode) ? countries[countryCode] : [];
  const map = new Map(list.map((h) => [h.date, h.name]));
  if (countryCode === 'IN') indiaFestivals.holidays.forEach((h) => { if (!map.has(h.date)) map.set(h.date, h.name); });
  return map;
}
const hasHolidays = (countryCode: string) => Object.prototype.hasOwnProperty.call(worldHolidays.countries, countryCode);
/** Region from the browser locale ("en-US" -> "US"); India when there is none (launch market). */
function browserRegion(): string {
  if (typeof navigator === 'undefined') return 'IN';
  for (const tag of [navigator.language, ...(navigator.languages || [])]) {
    try {
      const region = new Intl.Locale(tag).region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    } catch { /* ignore malformed tags */ }
  }
  return 'IN';
}
const regionName = (code: string) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; } };
// Same lists as features/Tasks: "the United States" in a sentence, and countries whose weekend is Friday and Saturday.
const NAMED_WITH_THE = new Set(['US', 'GB', 'NL', 'AE', 'PH', 'BS', 'DO', 'GM', 'MV']);
const regionInSentence = (code: string) => (NAMED_WITH_THE.has(code) ? `the ${regionName(code)}` : regionName(code));
const FRI_SAT_WEEKEND = new Set(['SA', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'IQ', 'IL', 'DZ', 'LY', 'SD', 'YE', 'SY', 'BD']);

/* ================================================================================================================ */
/* DateFinder: long-weekend finder shown while creating a room.                                                       */
/* ================================================================================================================ */

// Suggests trip windows of the current length that need the fewest weekday leave days, around the home country's
// public holidays. Without a homeCountry prop (the create screen has no trip yet) it uses the browser's region.
export function DateFinder({ startDate, endDate, onPick, homeCountry }: { startDate: string; endDate: string; onPick: (startDate: string, endDate: string) => void; homeCountry?: string }) {
  const [detected, setDetected] = useState('IN');
  useEffect(() => { if (!homeCountry) setDetected(browserRegion()); }, [homeCountry]);
  const country = (homeCountry || detected).toUpperCase();
  const holidays = useMemo(() => holidayMap(country), [country]);
  // India keeps "leave"; elsewhere the usual word is "time off".
  const india = country === 'IN';
  const fridayWeekend = FRI_SAT_WEEKEND.has(country);
  const length = Math.min(10, Math.max(3, Math.round((Date.parse(endDate) - Date.parse(startDate)) / DAY) + 1 || 4));
  const windows = useMemo(() => {
    const today = Date.parse(`${isoDay(Date.now())}T00:00:00Z`); const options = [];
    for (let offset = 7; offset < 240; offset += 1) {
      const days = Array.from({ length }, (_, i) => isoDay(today + (offset + i) * DAY));
      const leave = days.filter((d) => { const weekday = new Date(`${d}T00:00:00Z`).getUTCDay(); return weekday !== (fridayWeekend ? 5 : 0) && weekday !== 6 && !holidays.has(d); }).length;
      options.push({ start: days[0], end: days[days.length - 1], leave, holiday: days.map((d) => holidays.get(d)).filter(Boolean)[0] });
    }
    const picked: typeof options = [];
    for (const option of options.sort((a, b) => a.leave - b.leave || a.start.localeCompare(b.start))) {
      if (picked.length === 5) break;
      if (picked.every((p) => Math.abs(Date.parse(p.start) - Date.parse(option.start)) >= length * DAY)) picked.push(option);
    }
    return picked;
  }, [length, holidays, fridayWeekend]);
  const weekday = (iso: string) => formatDate(iso, 'weekday').split(',')[0];
  // Across a new year, keep it short ("29 Dec – 3 Jan"); the weekday line below disambiguates.
  const range = (a: string, b: string) => (a.slice(0, 4) === b.slice(0, 4) ? formatDateRange(a, b) : `${formatDate(a)} – ${formatDate(b)}`);

  return (
    <section aria-labelledby="date-finder-title" className="mt-5 rounded-2xl bg-surface-muted p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 shadow-card">
          <icons.calendar className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 id="date-finder-title" className="type-h3 m-0">{india ? 'Low-leave dates' : 'Dates with the least time off'}</h3>
          <p className="type-small m-0 mt-0.5 text-ink-muted">
            {length}-day trips around weekends{hasHolidays(country) ? ' and public holidays' : ''}. Tap one to use it.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))]">
        {windows.map((w) => {
          const selected = w.start === startDate && w.end === endDate;
          return (
            <button
              type="button"
              key={w.start}
              aria-pressed={selected}
              onClick={() => onPick(w.start, w.end)}
              className={cn(
                'm-0 flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-xl border-0 bg-surface px-3.5 py-3 text-left font-sans text-ink shadow-card transition-shadow',
                'hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted',
                selected && 'bg-brand-50 ring-2 ring-brand-700',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="type-body type-num flex items-center gap-1.5 whitespace-nowrap font-semibold">
                  {selected && <icons.check className="size-4 text-brand-700" strokeWidth={2.5} aria-hidden />}
                  {range(w.start, w.end)}
                </span>
                <span className={cn('type-caption shrink-0 rounded-full px-2 py-0.5', w.leave === 0 ? 'bg-success-soft text-success-ink' : 'bg-surface-muted text-ink-soft')}>
                  {w.leave === 0 ? (india ? 'No leave' : 'No time off') : plural(w.leave, india ? 'leave day' : 'day off', india ? 'leave days' : 'days off')}
                </span>
              </span>
              <span className="type-small block w-full truncate text-ink-muted">
                {weekday(w.start)} to {weekday(w.end)}
                {w.holiday && <span className="text-brand-700"> · {w.holiday}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="type-caption m-0 mt-3 text-ink-muted">
        {hasHolidays(country)
          ? `${country === 'IN' ? 'Festival dates can shift. Check your office holiday list.' : `Holidays for ${regionInSentence(country)}. Check your work calendar.`}`
          : `No public holiday list for ${regionInSentence(country)} yet, so this counts weekends only.`}{' '}
        {worldHolidays.attribution}.
      </p>
    </section>
  );
}

/* ================================================================================================================ */
/* DestinationPicker: the merged "Choose" step.                                                                       */
/* ================================================================================================================ */

type BoardRow = { destinationId: string; eligible: boolean; budgetShort?: number; passport?: number; visaTiming?: number; reason?: string };
type PrivateRow = { destinationId: string; total: number | null; fits: boolean; unlockAmount?: number | null; blocker?: string | null; action?: string };
type GroupStatus = { status: Status; icon?: IconComponent; label: string };

/** Anonymous group status for a destination: counts only, never names. */
function groupStatus(row: BoardRow | undefined): GroupStatus[] {
  if (!row) return [];
  if (row.eligible) return [{ status: 'ok', label: 'Everyone can go' }];
  const out: GroupStatus[] = [];
  if (row.budgetShort) out.push({ status: 'warning', icon: icons.budget, label: `${plural(row.budgetShort, 'budget')} short` });
  if (row.passport) out.push({ status: 'blocked', icon: icons.passport, label: plural(row.passport, 'passport issue') });
  if (row.visaTiming) out.push({ status: 'warning', icon: icons.visa, label: 'Visa timing' });
  if (!out.length) out.push(/Trip too short/i.test(row.reason || '') ? { status: 'blocked', icon: icons.duration, label: 'Trip too short' } : { status: 'blocked', icon: icons.route, label: 'Route not available' });
  return out;
}

/** The viewer's private fit for a destination. */
function privateFit(row: PrivateRow | undefined, currency: string): { icon: IconComponent; label: string; value?: string } | null {
  if (!row) return null;
  if (row.total == null) return { icon: icons.info, label: "Couldn't price this for you" };
  if (row.blocker === 'passport') return { icon: icons.passport, label: 'Blocked by your passport' };
  if (row.blocker === 'visaTiming') return { icon: icons.visa, label: 'Not enough time for your visa' };
  if (row.blocker) return { icon: icons.danger, label: 'Blocked by your documents' };
  if (row.fits) return { icon: icons.budget, label: 'Fits your budget', value: approxMoney(row.total, currency) };
  return { icon: icons.budget, label: `Short ${compactMoney(row.unlockAmount || 0, currency)} for you`, value: approxMoney(row.total, currency) };
}

/** Title + route line. "Thailand: Bangkok + Phuket" becomes "Thailand" with "Bangkok → Phuket". */
function describe(dest: Dest) {
  if (dest.stops?.length) {
    const [head] = dest.name.split(':');
    return { title: dest.name.includes(':') ? head.trim() : dest.name, line: dest.stops.join(' → '), multi: true };
  }
  return { title: dest.name, line: dest.country === dest.name ? '' : dest.country, multi: false };
}

function PrivateFitRow({ fit, nudge, muted }: { fit: NonNullable<ReturnType<typeof privateFit>>; nudge?: string; muted?: boolean }) {
  const Icon = fit.icon;
  return (
    <div className={cn('rounded-xl bg-private-soft px-3 py-2.5 text-private-ink', muted && 'bg-private-soft/70')}>
      <div className="flex items-center justify-between gap-3">
        <span className="type-small flex min-w-0 items-center gap-1.5 font-semibold">
          <span className="sr-only">Only you see this: </span>
          <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate">{fit.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {fit.value && <span className="type-small type-num font-bold">{fit.value}</span>}
          <icons.private className="size-3.5 text-private" strokeWidth={2} aria-hidden />
        </span>
      </div>
      {nudge && <p className="type-caption m-0 mt-1 text-private-ink">{nudge}</p>}
    </div>
  );
}

function DestinationCard({
  dest, board, mine, nudge, voting, selected, disabled, onVote, currency,
}: { dest: Dest; board?: BoardRow; mine?: PrivateRow; nudge?: string; voting: boolean; selected: boolean; disabled: boolean; onVote: (id: string) => void; currency: string }) {
  const { title, line, multi } = describe(dest);
  const blocked = Boolean(board && !board.eligible);
  const statuses = groupStatus(board);
  const fit = privateFit(mine, currency);
  const tags = (dest.tags || []).slice(0, 3);
  const extraTags = (dest.tags || []).length - tags.length;
  const LineIcon = multi ? icons.route : icons.destination;
  const titleId = `dest-${dest.id}`;
  const pills = statuses.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((s) => <StatusPill key={s.label} status={s.status} icon={s.icon} size={voting ? 'md' : 'lg'}>{s.label}</StatusPill>)}
    </div>
  ) : null;

  return (
    <Card
      aria-labelledby={titleId}
      variant={blocked ? 'sunken' : selected ? 'raised' : 'default'}
      className={cn('flex h-full flex-col overflow-hidden', !blocked && 'ring-1 ring-inset ring-line-subtle', selected && 'ring-2 ring-brand-700')}
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h3 id={titleId} className={cn('type-h3 m-0', blocked && 'text-ink-soft')}>{title}</h3>
          <p className={cn('type-small m-0 mt-0.5 items-start gap-1.5 text-ink-muted', line || dest.domestic ? 'flex' : 'hidden')}>
            <LineIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            <span>
              {line}
              {multi && dest.country !== title ? ` · ${dest.country}` : ''}
              {dest.domestic && <span className="font-medium text-brand-700">{line ? ' · ' : ''}No passport needed</span>}
            </span>
          </p>
        </div>
        {selected && <Badge tone="warm" icon={icons.check} className="shrink-0">Your vote</Badge>}
      </div>

      <div className="flex flex-wrap gap-1.5 px-5">
        {tags.map((tag) => <Badge key={tag} size="sm" tone={blocked ? 'outline' : 'neutral'}>{capitalise(tag)}</Badge>)}
        {extraTags > 0 && <Badge size="sm" tone="outline" aria-label={`${extraTags} more: ${dest.tags.slice(tags.length).join(', ')}`}>+{extraTags}</Badge>}
      </div>

      {(fit || (!voting && pills)) && (
        <div className="mt-4 flex flex-col gap-2 px-5">
          {!voting && pills}
          {fit && <PrivateFitRow fit={fit} nudge={nudge} muted={blocked} />}
        </div>
      )}
      <div className="min-h-5 flex-1" />

      {voting && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-line-subtle px-5 py-3.5">
          {pills ?? <span />}
          <Button
            size="sm"
            variant={selected ? 'secondary' : 'outline'}
            icon={selected ? icons.check : icons.vote}
            aria-pressed={selected}
            aria-label={selected ? `Your vote: ${dest.name}` : blocked ? `${dest.name} can't win right now` : `Vote for ${dest.name}`}
            disabled={disabled || blocked}
            onClick={() => onVote(dest.id)}
            className="ml-auto"
          >
            {selected ? 'Voted' : 'Vote'}
          </Button>
        </div>
      )}
    </Card>
  );
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]';

/** Private one-liner: how many options fit the viewer's budget. */
function PrivateSummary({ rows }: { rows: PrivateRow[] }) {
  if (!rows.length) return null;
  const fits = rows.filter((r) => r.fits).length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-private-soft px-4 py-3 text-private-ink">
      <span className="type-small flex items-center gap-2 font-semibold">
        <icons.budget className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        {fits === rows.length ? `All ${rows.length} fit your budget` : `${formatProgress(fits, rows.length)} fit your budget and documents`}
      </span>
      <PrivateBadge size="sm" className="bg-surface/70" />
    </div>
  );
}

interface PickerProps {
  trip: any;
  disabled: boolean;
  onVote: (id: string) => void;
  /** Optional organizer actions (Open voting, Lock and make the plan) shown next to the summary. */
  action?: React.ReactNode;
}

function Picker({ trip, disabled, onVote, action, voting, showSummary = true, showPrivateSummary = true }: PickerProps & { voting: boolean; showSummary?: boolean; showPrivateSummary?: boolean }) {
  const currency = tripCurrency(trip);
  const allDestinations = destinationsOf(trip);
  const destinationName = (id: string) => allDestinations.find((d) => d.id === id)?.name || id;
  const boardRows: BoardRow[] = trip.destinationBoard || [];
  const privateRows: PrivateRow[] = trip.myPrivateStatus || [];
  const board = new Map(boardRows.map((d) => [d.destinationId, d]));
  const mine = new Map(privateRows.map((d) => [d.destinationId, d]));
  const hasBoard = boardRows.length > 0;

  if (!hasBoard && !voting) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={icons.destination}
          art={asciiArt.pin}
          title="Destinations show up once everyone's in"
          description="When every member has added their details, you'll see where the whole group can go."
        />
        {action && <div className="flex justify-end">{action}</div>}
      </div>
    );
  }

  // Cheapest two places the viewer could unlock by stretching their budget.
  const nudges = new Map(
    privateRows
      .filter((s) => !s.blocker && s.total != null && !s.fits && (s.unlockAmount || 0) > 0)
      .sort((a, b) => (a.unlockAmount || 0) - (b.unlockAmount || 0))
      .slice(0, 2)
      .map((s) => [s.destinationId, `${compactMoney(s.unlockAmount || 0, currency)} more in your budget would unlock this for you.`]),
  );

  const eligible = allDestinations.filter((d) => board.get(d.id)?.eligible !== false);
  const ineligible = allDestinations.filter((d) => board.get(d.id)?.eligible === false);
  const myBallot: string | null = voting ? trip.myBallot || null : null;
  const total = allDestinations.length;
  const headline = !hasBoard
    ? `${plural(total, 'option')} to vote on`
    : eligible.length === 0
      ? 'No option works for everyone yet'
      : eligible.length === total
        ? `All ${total} work for everyone`
        : `${formatProgress(eligible.length, total)} work for everyone`;

  const card = (dest: Dest) => (
    <DestinationCard
      key={dest.id}
      dest={dest}
      board={board.get(dest.id)}
      mine={mine.get(dest.id)}
      nudge={nudges.get(dest.id)}
      voting={voting}
      selected={myBallot === dest.id}
      disabled={disabled}
      onVote={onVote}
      currency={currency}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 empty:hidden">
      {showSummary && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="type-h3 m-0 flex items-center gap-2 text-ink">
              <icons.members className="size-5 shrink-0 text-brand-600" strokeWidth={1.75} aria-hidden />
              {headline}
            </p>
            {voting && (
              <p
                aria-live="polite"
                className={cn(
                  'type-small m-0 inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-2',
                  myBallot ? 'bg-warm-100 text-warm-800' : 'bg-surface text-ink-soft shadow-card',
                )}
              >
                {myBallot ? <icons.check className="size-4 shrink-0" strokeWidth={2.5} aria-hidden /> : <icons.vote className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
                <span className="truncate">
                  {myBallot ? <>Your vote: <b className="font-semibold">{destinationName(myBallot)}</b></> : "You haven't voted yet"}
                </span>
              </p>
            )}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}

      {showPrivateSummary && <PrivateSummary rows={privateRows} />}
      </div>

      {eligible.length > 0 && (
        <section aria-label="Options that work for everyone" className="flex flex-col gap-3">
          {hasBoard && ineligible.length > 0 && (
            <h3 className="type-overline m-0 flex items-center gap-1.5 text-success-ink">
              <icons.success className="size-3.5" strokeWidth={2} aria-hidden /> Works for everyone · {eligible.length}
            </h3>
          )}
          <div className={GRID}>{eligible.map(card)}</div>
        </section>
      )}

      {ineligible.length > 0 && (
        <details className="group flex flex-col gap-3" open={ineligible.length <= 4 || eligible.length === 0}>
          <summary className="type-overline flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
            <icons.danger className="size-3.5" strokeWidth={2} aria-hidden />
            Not possible right now · {ineligible.length}
            <span className="ml-1 normal-case tracking-normal text-brand-700 group-open:hidden">Show</span>
          </summary>
          <p className="type-small m-0 mb-3 mt-1 text-ink-muted">Someone's budget, passport or dates rule these out. Nobody is named.</p>
          <div className={GRID}>{ineligible.map(card)}</div>
        </details>
      )}
    </div>
  );
}

// Merged "Choose" step: anonymous group status, the viewer's private fit and (while voting is open) the vote, in one card grid.
export function DestinationPicker({ trip, disabled, onVote, action }: PickerProps) {
  return <Picker trip={trip} disabled={disabled} onVote={onVote} action={action} voting={trip.phase === 'voting'} />;
}

/* ---- Back-compat wrappers. The old screen rendered these three separately; they now share the merged card grid,
        so the same list never appears twice. Prefer <DestinationPicker>. ---- */

// Shared, anonymous: which destinations can still win and why others can't. During voting the Ballot shows the grid instead.
export function WhyNotBoard({ trip }: { trip: any }) {
  if (!trip.destinationBoard?.length || trip.phase === 'voting') return null;
  return <Picker trip={trip} disabled onVote={() => undefined} voting={false} showPrivateSummary={false} />;
}

// Private to the viewer: how many options fit. Per-destination fit lives on each destination card.
export function PrivateStatus({ trip }: { trip: any }) {
  if (!trip.myPrivateStatus?.length) return null;
  return <PrivateSummary rows={trip.myPrivateStatus} />;
}

// Ballot: the merged grid in voting mode (highlights the viewer's pick; options that can't win are disabled).
export function Ballot({ trip, disabled, onVote }: { trip: any; disabled: boolean; onVote: (id: string) => void }) {
  return <div className="mt-4"><Picker trip={trip} disabled={disabled} onVote={onVote} voting showPrivateSummary={false} /></div>;
}

/* ================================================================================================================ */
/* PlanMoney: where the group's money goes.                                                                           */
/* ================================================================================================================ */

const moneyLabels: Record<string, string> = {
  journeys: 'Flights and travel', lodging: 'Stay', localTransport: 'Local transport', transfers: 'Between cities', food: 'Food',
  insurance: 'Insurance', entryAllowance: 'Visa and entry', activities: 'Activities', forex: 'Card foreign transaction fee', contingency: '10% buffer',
};
const moneyLabel = (key: string, india: boolean) => (key === 'forex' && india ? 'Forex markup + GST' : moneyLabels[key] || key);

// Sorted bar list in one hue with values at the bar tips, the viewer's private drop-out impact, and (Indian groups only) a
// TCS note for trips abroad. Amounts are in the trip currency.
export function PlanMoney({ trip, uid }: { trip: any; uid: string }) {
  const plan = trip.activePlan; const mine = plan.memberTotals.find((m: any) => m.uid === uid);
  const currency = tripCurrency(trip);
  const india = tripHome(trip) === 'IN';
  const money = (amount: number) => formatMoney(amount, currency);
  const dest = destinationsOf(trip).find((d) => d.id === plan.destinationId);
  const rows = Object.entries(plan.categories).map(([k, v]) => [k, Number(v)] as [string, number]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] || 1;
  const impact = trip.myDropoutImpact;
  const abroad = Boolean(india && mine && dest && !dest.domestic);
  const showPrivate = Boolean(impact || mine?.forex);

  return (
    <Card>
      <CardHeader icon={icons.money} title="Where the money goes" description={<>Group total <span className="type-num font-semibold text-ink-soft">{money(plan.groupTotal)}</span></>} />
      <CardBody className="flex flex-col gap-5">
        <table className="w-full border-collapse">
          <caption className="sr-only">Group spend by category, largest first</caption>
          <tbody>
            {rows.map(([k, v]) => {
              const pct = Math.round((v / plan.groupTotal) * 100);
              return (
                <tr key={k} title={`${moneyLabel(k, india)}: ${money(v)} (${pct}% of total)`}>
                  <th scope="row" className="type-small w-[7.5rem] py-1.5 pr-3 text-left align-middle font-normal text-ink-soft sm:w-40">{moneyLabel(k, india)}</th>
                  <td className="py-1.5 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 rounded-r-md bg-brand-500" style={{ width: `${Math.max(2, (v / max) * 72)}%` }} aria-hidden />
                      <span className="type-small type-num whitespace-nowrap font-semibold text-ink">
                        <span className="sm:hidden">{compactMoney(v, currency)}</span>
                        <span className="hidden sm:inline">{money(v)}</span>
                        <span className="sr-only">, {pct}% of total</span>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showPrivate && (
          <div className="flex flex-col gap-3 rounded-xl bg-private-soft p-4 text-private-ink">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="type-small m-0 font-semibold">Just for you</p>
              <PrivateBadge size="sm" className="bg-surface/70" />
            </div>
            {impact && (
              <div className="flex flex-col gap-2">
                <p className="type-small m-0 flex items-start gap-2">
                  <icons.members className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span>
                    If one person drops out, your share becomes about <b className="type-num">{money(impact.totalIfOneDrops)}</b> (+{money(impact.increase)}).
                  </span>
                </p>
                <StatusPill status={impact.stillFits ? 'ok' : 'warning'} icon={icons.budget} className="ml-6 w-fit">
                  {impact.stillFits ? 'Still within your budget' : 'Over your budget'}
                </StatusPill>
              </div>
            )}
            {mine?.forex ? (
              <p className="type-small m-0 flex items-start gap-2">
                <icons.money className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>
                  {india
                    ? `Your share includes ${money(mine.forex)} in card forex fees (3.5% markup plus 18% GST).`
                    : `Your share includes ${money(mine.forex)} in card foreign transaction fees (about 3% on spending abroad).`}
                </span>
              </p>
            ) : null}
          </div>
        )}

        {abroad && (
          <Notice variant="inline" tone="neutral" title="Booking a tour package?">
            About {money(Math.ceil(mine.total * 0.05))} (5% TCS) is collected upfront. You can claim it back in your tax return.
          </Notice>
        )}
      </CardBody>
    </Card>
  );
}

/* ================================================================================================================ */
/* UpiPanel (Collect money): organizer adds a payment handle; members pay and mark it done.                           */
/* ================================================================================================================ */

type PayKind = 'upi' | 'paypal' | 'venmo' | 'revolut' | 'monzo' | 'cashapp';
const PAY_KINDS: Record<PayKind, { label: string; field: string; placeholder: string; prefix?: string; amountInLink: boolean }> = {
  upi: { label: 'UPI', field: 'Your UPI ID', placeholder: 'yourname@okaxis', amountInLink: true },
  paypal: { label: 'PayPal', field: 'PayPal.Me name or email', placeholder: 'yourname', amountInLink: true },
  venmo: { label: 'Venmo', field: 'Venmo username', placeholder: 'your-name', prefix: '@', amountInLink: false },
  revolut: { label: 'Revolut', field: 'Revolut revtag', placeholder: 'yourname', prefix: '@', amountInLink: false },
  monzo: { label: 'Monzo', field: 'monzo.me username', placeholder: 'yourname', amountInLink: true },
  cashapp: { label: 'Cash App', field: 'Cash App cashtag', placeholder: 'yourname', prefix: '$', amountInLink: true },
};
const EUROPE_CURRENCIES = ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN'];
/** Payment apps people in the home country actually use, most common first. */
function payKindsFor(home: string, currency: string): PayKind[] {
  if (home === 'IN') return ['upi', 'paypal'];
  if (home === 'US') return ['venmo', 'paypal', 'cashapp'];
  if (home === 'GB') return ['monzo', 'revolut', 'paypal'];
  if (EUROPE_CURRENCIES.includes(currency)) return ['revolut', 'paypal'];
  return ['paypal', 'revolut'];
}
/** Two significant figures, for a placeholder advance (about a quarter of the viewer's share). */
const roughAdvance = (total: number) => {
  if (!total) return '';
  const quarter = total / 4; const step = 10 ** Math.max(0, Math.floor(Math.log10(quarter)) - 1);
  return String(Math.round(quarter / step) * step);
};

// Organizer adds a payment handle (UPI, PayPal, Venmo, Revolut, Monzo or Cash App); members pay their share or the advance
// with one tap and tick it off. Links come from the engine (trip.payee.link) and are built for the viewer's own amount.
export function UpiPanel({ trip, uid, owner, disabled, command }: { trip: any; uid: string; owner: boolean; disabled: boolean; command: (c: any) => Promise<boolean> }) {
  const currency = tripCurrency(trip);
  const home = tripHome(trip);
  const money = (value: number) => formatMoney(value, currency);
  const payee = trip.payee || null;
  const payeeKind: PayKind = (payee?.kind as PayKind) || 'upi';
  const kinds = payKindsFor(home, currency);
  const options = payee && !kinds.includes(payeeKind) ? [payeeKind, ...kinds] : kinds;
  const [kind, setKind] = useState<PayKind>(payee ? payeeKind : kinds[0]);
  const [handle, setHandle] = useState<string>(payee?.handle || payee?.upiId || '');
  const [advance, setAdvance] = useState(payee?.advancePerPerson ? String(payee.advancePerPerson) : '');
  const [editing, setEditing] = useState(!payee);
  const [copied, setCopied] = useState(false);
  const mine = trip.activePlan.memberTotals.find((m: any) => m.uid === uid);
  const amount = payee?.advancePerPerson ? Math.min(payee.advancePerPerson, mine?.total || 0) : mine?.total || 0;
  const spec = PAY_KINDS[payeeKind] || PAY_KINDS.upi;
  const display: string = payee ? payee.display || `${spec.prefix || ''}${payee.handle || payee.upiId}` : '';
  const label: string = payee?.label || spec.label;
  // Old projections (UPI only) have no link; build the same UPI deep link the engine would.
  const link: string | null = payee
    ? payee.link !== undefined
      ? payee.link
      : payeeKind === 'upi'
        ? `upi://pay?pa=${encodeURIComponent(payee.upiId)}&pn=${encodeURIComponent('Fermat trip organizer')}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(`${trip.name} share`)}`
        : null
    : null;
  const paid = Number(trip.paymentProgress || 0);
  const expected = Number(trip.expectedSize || 0);
  const isAdvance = Boolean(payee?.advancePerPerson);
  const formSpec = PAY_KINDS[kind];
  const payLabel = !link ? null : spec.amountInLink ? `Pay ${money(amount)} ${payeeKind === 'upi' ? 'by' : 'on'} ${label}` : `Open ${label}`;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!handle.trim()) return;
    const ok = await command({ type: 'setPayee', kind, handle: handle.trim(), advancePerPerson: advance ? Number(advance) : null });
    if (ok !== false) setEditing(false);
  };
  const copyHandle = async () => {
    try { await navigator.clipboard.writeText(display); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the handle is on screen */ }
  };

  return (
    <Card>
      <CardHeader
        icon={icons.money}
        title={owner ? 'Collect money' : 'Pay your share'}
        description={payee ? `Pay by ${label}. Fermat never touches the money.` : 'Fermat never touches the money.'}
        action={payee ? <StatusPill status={paid >= expected && expected > 0 ? 'done' : 'pending'}>{formatProgress(paid, expected)} paid</StatusPill> : undefined}
      />
      <CardBody className="flex flex-col gap-5">
        {payee ? (
          <>
            <Progress label="People who have paid" value={paid} max={expected || 1} tone="warm" size="md" />
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="type-caption m-0 text-ink-muted">{isAdvance ? 'Advance to pay' : 'Your share'}</p>
                <p className="type-num m-0 font-display text-[1.75rem] font-bold leading-9 tracking-tight text-ink">{money(amount)}</p>
                <p className="type-small m-0 truncate text-ink-muted">
                  {spec.amountInLink && link ? 'To' : `Send it on ${label} to`} <span className="font-semibold text-ink-soft">{display}</span>
                </p>
              </div>
              {link ? (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={link} {...(/^https:/.test(link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <icons.money strokeWidth={2} aria-hidden />
                    {payLabel}
                  </a>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" icon={copied ? icons.check : icons.copy} className="w-full sm:w-auto" onClick={copyHandle}>
                  {copied ? 'Copied' : `Copy ${label} ${payeeKind === 'paypal' ? 'email' : 'handle'}`}
                </Button>
              )}
            </div>
            <Checkbox
              variant="tile"
              label="I've paid"
              description={payeeKind === 'upi' ? 'Tick this once the payment goes through. The UPI button works on a phone.' : 'Tick this once the payment goes through.'}
              checked={Boolean(trip.myPayment)}
              disabled={disabled}
              onChange={(e) => command({ type: 'markPaid', paid: e.target.checked })}
            />
          </>
        ) : (
          !owner && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-3">
              <icons.pending className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} aria-hidden />
              <p className="type-small m-0 text-ink-soft">Waiting for the organizer to add payment details.</p>
            </div>
          )
        )}

        {owner && (editing ? (
          <form onSubmit={save} className="flex flex-col gap-4 border-0 border-t border-solid border-line-subtle pt-5 first:border-t-0 first:pt-0">
            {!payee && <p className="type-small m-0 text-ink-soft">Add where you get paid so everyone can send their share in one tap.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pay with">
                <Select value={kind} onChange={(e) => setKind(e.target.value as PayKind)}>
                  {options.map((option) => (
                    <option key={option} value={option}>{PAY_KINDS[option].label}</option>
                  ))}
                </Select>
              </Field>
              <Field label={formSpec.field}>
                <Input placeholder={formSpec.placeholder} autoComplete="off" leading={formSpec.prefix} value={handle} onChange={(e) => setHandle(e.target.value)} />
              </Field>
              <Field label="Advance per person" aside="Optional" hint="Leave empty to collect full shares." className="sm:col-span-2">
                <Input type="number" inputMode="numeric" min={1} leading={currencySymbol(currency)} placeholder={home === 'IN' && currency === 'INR' ? '10000' : roughAdvance(mine?.total || 0)} value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant={payee ? 'secondary' : 'primary'} disabled={disabled || !handle.trim()}>Save payment details</Button>
              {payee && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-0 border-t border-solid border-line-subtle pt-4">
            <span className="type-small flex items-center gap-1.5 text-ink-muted">
              <icons.organizer className="size-4" strokeWidth={1.75} aria-hidden />
              Collecting on {label} to {display}{isAdvance ? ` · ${money(payee.advancePerPerson)} advance` : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit payment details</Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/** Same panel under its generic name. */
export const CollectMoneyPanel = UpiPanel;
