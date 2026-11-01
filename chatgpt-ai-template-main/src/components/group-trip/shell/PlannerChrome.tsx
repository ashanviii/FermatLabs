'use client';
// Frame around the planner: top bar, trip header + stepper, trip summary sidebar and footer.
import { useEffect, useState } from 'react';
import {
  Ban,
  Check,
  ChevronRight,
  Home,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import FermatMark from '@/components/landing/FermatMark';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { Stepper, PLAN_STEPS } from '@/components/ui/stepper';
import { icons, type IconComponent } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  formatDateRange,
  formatMoney,
  nightsBetween,
  plural,
} from '@/lib/format';
import { MoneyInput, tripCurrency } from '../features/currency';
import {
  approvedCount,
  avatarName,
  memberList,
  phaseLabel,
  planApprovals,
  scopeLabel,
  type StepId,
} from './tripState';

export function TopBar({
  trip,
  action,
  onHome,
}: {
  trip?: any;
  action?: React.ReactNode;
  onHome?: () => void;
}) {
  const names = memberList(trip).map((m: any) => avatarName(m.nickname));
  // Full-width frosted bar, the same as the marketing nav. It lives inside the page column, so the material and
  // hairline bleed to the screen edges (w-screen; .landing clips the overflow-x) while the content stays aligned.
  return (
    <div className="sticky top-0 z-30">
      <div
        aria-hidden
        className="material-bar pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 border-0 border-b border-solid border-line-subtle"
      />
      <div className="relative flex h-[4.5rem] items-center justify-between gap-3">
        <a
          href="/"
          className="flex items-center gap-2 rounded-md text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <FermatMark className="h-6 text-brand-600" />
          <span className="type-h3 text-brand-900">Fermat</span>
        </a>
        <div className="flex items-center gap-3">
          {trip && onHome && (
            <Button size="sm" variant="outline" icon={Home} onClick={onHome}>
              <span className="hidden sm:inline">All trips</span>
              <span className="sm:hidden">Home</span>
            </Button>
          )}
          {names.length > 0 && (
            <AvatarStack
              names={names}
              max={4}
              size="sm"
              className="hidden sm:flex"
              aria-label={`${names.length} people in this trip`}
            />
          )}
          {action}
        </div>
      </div>
    </div>
  );
}

export function TripHeader({
  trip,
  owner,
  step,
  onStepClick,
  action,
}: {
  trip: any;
  owner: boolean;
  step: StepId;
  onStepClick: (id: StepId) => void;
  action?: React.ReactNode;
}) {
  const nights = nightsBetween(trip.startDate, trip.endDate);
  return (
    <header className="relative mt-5 overflow-hidden rounded-2xl border border-solid border-line bg-surface p-5 shadow-sm sm:p-7">
      <div
        aria-hidden
        className="absolute -right-16 -top-20 size-64 rounded-full bg-brand-100/70 blur-3xl"
      />
      <div className="relative grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid min-w-0 flex-1 gap-2">
            <p className="type-overline m-0 flex flex-wrap items-center gap-2 text-brand-700">
              {phaseLabel(trip)}
              {owner && (
                <Badge size="sm" tone="brand" icon={icons.organizer}>
                  You're the organizer
                </Badge>
              )}
            </p>
            <h1 className="type-h1 m-0 text-balance">{trip.name}</h1>
            <p className="type-small m-0 text-ink-muted">
              Everything your group needs, from first invite to final settle-up.
            </p>
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </div>
        <dl className="m-0 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="rounded-xl border border-solid border-line-subtle bg-canvas/80 p-3.5">
            <dt className="type-caption flex items-center gap-1.5 text-ink-muted">
              <icons.calendar className="size-3.5" aria-hidden />
              Dates
            </dt>
            <dd className="type-small m-0 mt-1 font-semibold text-ink">
              {formatDateRange(trip.startDate, trip.endDate)}
              {nights > 0 && ` · ${plural(nights, 'night')}`}
            </dd>
          </div>
          <div className="rounded-xl border border-solid border-line-subtle bg-canvas/80 p-3.5">
            <dt className="type-caption flex items-center gap-1.5 text-ink-muted">
              <icons.members className="size-3.5" aria-hidden />
              Group
            </dt>
            <dd className="type-small m-0 mt-1 font-semibold text-ink">
              {approvedCount(trip)} of {trip.expectedSize} joined
            </dd>
          </div>
          <div className="rounded-xl border border-solid border-line-subtle bg-canvas/80 p-3.5">
            <dt className="type-caption flex items-center gap-1.5 text-ink-muted">
              <icons.route className="size-3.5" aria-hidden />
              Trip type
            </dt>
            <dd className="type-small m-0 mt-1 font-semibold text-ink">
              {scopeLabel(trip)}
            </dd>
          </div>
          <div className="rounded-xl border border-solid border-line-subtle bg-canvas/80 p-3.5">
            <dt className="type-caption flex items-center gap-1.5 text-ink-muted">
              <icons.money className="size-3.5" aria-hidden />
              Currency
            </dt>
            <dd className="type-small m-0 mt-1 font-semibold text-ink">
              Prices in {trip.currency}
            </dd>
          </div>
        </dl>
        <Stepper
          className="lg:hidden"
          current={step}
          onStepClick={(s) => onStepClick(s.id as StepId)}
        />
      </div>
    </header>
  );
}

const journeyIcons: Record<StepId, IconComponent> = {
  invite: icons.invite,
  details: icons.private,
  choose: icons.vote,
  plan: icons.plan,
  go: icons.departure,
};

/** Desktop application-shell navigation. Mobile uses the compact Stepper above. */
export function TripJourneyNav({
  current,
  onStepClick,
}: {
  current: StepId;
  onStepClick: (id: StepId) => void;
}) {
  const currentIndex = stepIndex(current);
  return (
    <nav
      aria-label="Trip journey"
      className="sticky top-24 rounded-xl border border-solid border-line bg-surface p-3 shadow-sm"
    >
      <div className="px-2 pb-3 pt-1">
        <p className="type-overline m-0 text-brand-700">Trip journey</p>
        <p className="type-caption m-0 mt-1 text-ink-muted">
          From first invite to takeoff.
        </p>
      </div>
      <ol className="m-0 grid list-none gap-1 p-0">
        {PLAN_STEPS.map((item, index) => {
          const Icon = journeyIcons[item.id as StepId];
          const active = index === currentIndex;
          const done = index < currentIndex;
          const available = index <= currentIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={!available}
                aria-current={active ? 'step' : undefined}
                onClick={() => available && onStepClick(item.id as StepId)}
                className={cn(
                  'group flex min-h-12 w-full items-center gap-3 rounded-lg border-0 px-3 py-2 text-left font-sans transition-colors',
                  active
                    ? 'cursor-default bg-brand-900 text-white shadow-sm'
                    : done
                    ? 'cursor-pointer bg-transparent text-ink hover:bg-brand-50'
                    : 'cursor-not-allowed bg-transparent text-ink-muted opacity-55',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    active
                      ? 'bg-white/15 text-white'
                      : done
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-surface-muted text-ink-muted',
                  )}
                >
                  {done ? (
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="type-caption block opacity-70">
                    Step {index + 1}
                  </span>
                  <span className="type-small block font-semibold">
                    {item.label}
                  </span>
                </span>
                {available && !active && (
                  <ChevronRight
                    className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SummaryRow({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-small text-ink-soft">{label}</span>
        <span className="type-small type-num font-semibold text-ink">
          {done} of {total}
        </span>
      </div>
      <Progress label={label} value={done} max={total} size="sm" />
    </div>
  );
}

function PrivateBudgetEditor({
  trip,
  uid,
  disabled,
  command,
}: {
  trip: any;
  uid: string;
  disabled: boolean;
  command: (c: any) => Promise<boolean>;
}) {
  const budget = trip.myConstraints?.budget;
  const currency = tripCurrency(trip);
  const currentPlanTotal = trip.activePlan?.memberTotals?.find(
    (member: any) => member.uid === uid,
  )?.total;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget ? String(budget) : '');
  const [saving, setSaving] = useState(false);
  // During voting, saving clears everyone's ballots, so it takes a second, explicit step.
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const votesCast = trip.ballotProgress ?? 0;
  const clearsVotes = trip.phase === 'voting' && votesCast > 0;

  useEffect(() => {
    setDraft(budget ? String(budget) : '');
  }, [budget]);
  useEffect(() => {
    setConfirming(false);
  }, [draft, trip.phase]);
  if (!Number.isSafeInteger(budget)) return null;

  const amount = Number(draft);
  const error =
    !draft || !Number.isSafeInteger(amount) || amount <= 0
      ? 'Enter a positive whole amount.'
      : trip.phase === 'locked' &&
        Number.isSafeInteger(currentPlanTotal) &&
        amount < currentPlanTotal
      ? `Keep it at least ${formatMoney(
          currentPlanTotal,
          currency,
        )} to cover your current plan.`
      : undefined;
  const hint =
    trip.phase === 'voting'
      ? 'Saving reopens planning and clears the current votes.'
      : trip.phase === 'locked' && Number.isSafeInteger(currentPlanTotal)
      ? `Your current plan is ${formatMoney(currentPlanTotal, currency)}.`
      : 'Saving refreshes which destinations fit your group.';

  const save = async (confirmed = false) => {
    if (error || amount === budget) return;
    if (clearsVotes && !confirmed) {
      setConfirming(true);
      return;
    }
    setSaving(true);
    const saved = await command({
      type: 'updateBudget',
      expectedInputRevision: trip.inputRevision,
      budget: amount,
    });
    setSaving(false);
    if (saved) {
      setEditing(false);
      setConfirming(false);
      setAnnouncement(
        clearsVotes
          ? 'Budget saved. Votes were cleared and options updated.'
          : 'Budget saved. Options updated.',
      );
    }
  };

  return (
    <div className="grid gap-3 border-0 border-t border-solid border-line-subtle pt-4">
      {!editing ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-caption m-0 text-ink-muted">
              Your private budget
            </p>
            <p className="type-small type-num m-0 font-semibold text-ink">
              {formatMoney(budget, currency)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            disabled={disabled}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Field
            label="Your private budget"
            hint={error ? undefined : hint}
            error={error}
          >
            <MoneyInput
              currency={currency}
              step={1}
              value={draft}
              disabled={disabled || saving}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus
            />
          </Field>
          {confirming ? (
            <Notice
              tone="warning"
              title={`Saving clears ${plural(votesCast, 'vote')}`}
            >
              <p className="m-0">
                Everyone, including you, will need to vote again. Nobody will
                see that it was your change.
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  autoFocus
                  disabled={saving}
                  onClick={() => setConfirming(false)}
                >
                  Keep editing
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={saving}
                  disabled={disabled}
                  onClick={() => void save(true)}
                >
                  Save and clear votes
                </Button>
              </div>
            </Notice>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setDraft(String(budget));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                loading={saving}
                disabled={disabled || Boolean(error) || amount === budget}
              >
                Save budget
              </Button>
            </div>
          )}
        </form>
      )}
      {!editing && (
        <p className="type-caption m-0 text-ink-muted">
          Only you can see this amount.
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

/** Sidebar on desktop (below the step on mobile): who's coming and anonymous progress. Never per-person status. */
export function TripSummary({
  trip,
  uid,
  owner,
  disabled,
  command,
}: {
  trip: any;
  uid: string;
  owner: boolean;
  disabled: boolean;
  command: (c: any) => Promise<boolean>;
}) {
  const members = memberList(trip).filter((m: any) => m.status !== 'pending');
  const total = trip.expectedSize;
  const people = trip.activePlan?.memberTotals?.length || members.length;
  return (
    <Card>
      <CardHeader
        icon={icons.members}
        title="Who's going"
        description={`${members.length} of ${total} joined`}
      />
      <CardBody className="grid gap-5">
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {members.map((member: any) => (
            <li key={member.uid} className="flex items-center gap-3">
              <Avatar name={avatarName(member.nickname)} size="sm" />
              <span className="type-small min-w-0 flex-1 truncate font-semibold text-ink">
                {member.nickname}
                {member.uid === uid && (
                  <span className="font-normal text-ink-muted"> (you)</span>
                )}
              </span>
              {member.role === 'owner' && (
                <span className="type-caption inline-flex items-center gap-1 text-ink-muted">
                  <icons.organizer
                    className="size-3.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  Organizer
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="grid gap-4 border-0 border-t border-solid border-line-subtle pt-5">
          <SummaryRow
            label="Details added"
            done={trip.submissionProgress ?? 0}
            total={total}
          />
          {(trip.phase === 'voting' || trip.phase === 'locked') && (
            <SummaryRow
              label="Votes in"
              done={trip.ballotProgress ?? 0}
              total={total}
            />
          )}
          {trip.activePlan && (
            <SummaryRow
              label="Plan approvals"
              done={planApprovals(trip)}
              total={people}
            />
          )}
          {trip.payee && (
            <SummaryRow
              label="Advance paid"
              done={trip.paymentProgress ?? 0}
              total={people}
            />
          )}
        </div>
        <PrivateBudgetEditor
          trip={trip}
          uid={uid}
          disabled={disabled}
          command={command}
        />
        {owner && (
          <div className="flex flex-wrap items-center gap-2 border-0 border-t border-solid border-line-subtle pt-4">
            <span className="type-caption mr-auto text-ink-muted">
              Invite link
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              disabled={disabled}
              onClick={() => command({ type: 'rotateInvite' })}
            >
              New link
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Ban}
              disabled={disabled}
              onClick={() => command({ type: 'revokeInvite' })}
            >
              Turn off
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function PlannerFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-3 border-0 border-t border-solid border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="type-caption m-0 flex items-center gap-1.5 text-ink-muted">
        <icons.info
          className="size-3.5 shrink-0"
          strokeWidth={1.75}
          aria-hidden
        />
        Prices are estimates. Not travel, visa or legal advice.
      </p>
      <nav aria-label="Legal" className="flex gap-5">
        <a
          href="/privacy"
          className="type-caption font-semibold text-ink-muted no-underline hover:text-ink hover:underline"
        >
          Privacy
        </a>
        <a
          href="/terms"
          className="type-caption font-semibold text-ink-muted no-underline hover:text-ink hover:underline"
        >
          Terms
        </a>
      </nav>
    </footer>
  );
}

export const stepIndex = (id: StepId) =>
  PLAN_STEPS.findIndex((s) => s.id === id);
export const stepEyebrow = (id: StepId) =>
  `Step ${stepIndex(id) + 1} of ${PLAN_STEPS.length}`;
