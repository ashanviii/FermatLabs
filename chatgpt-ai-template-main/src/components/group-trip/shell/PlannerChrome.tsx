'use client';
// Frame around the planner: top bar, trip header + stepper, trip summary sidebar and footer.
import { Ban, Home, RefreshCw } from 'lucide-react';
import FermatMark from '@/components/landing/FermatMark';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Stepper, PLAN_STEPS } from '@/components/ui/stepper';
import { icons, type IconComponent } from '@/components/ui/icons';
import { formatDateRange, nightsBetween, plural } from '@/lib/format';
import { approvedCount, avatarName, memberList, phaseLabel, planApprovals, scopeLabel, type StepId } from './tripState';

export function TopBar({ trip, action, onHome }: { trip?: any; action?: React.ReactNode; onHome?: () => void }) {
  const names = memberList(trip).map((m: any) => avatarName(m.nickname));
  // Full-width frosted bar, the same as the marketing nav. It lives inside the page column, so the material and
  // hairline bleed to the screen edges (w-screen; .landing clips the overflow-x) while the content stays aligned.
  return (
    <div className="sticky top-0 z-30">
      <div
        aria-hidden
        className="material-bar pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 border-0 border-b border-solid border-line-subtle"
      />
      <div className="relative flex h-16 items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 rounded-full text-ink no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35">
          <FermatMark className="h-6 text-brand-600" />
          <span className="type-h3 text-brand-900">Fermat</span>
        </a>
        <div className="flex items-center gap-3">
          {trip && onHome && (
            <Button size="sm" variant="ghost" icon={Home} onClick={onHome}>
              <span className="hidden sm:inline">All trips</span><span className="sm:hidden">Home</span>
            </Button>
          )}
          {names.length > 0 && <AvatarStack names={names} max={4} size="sm" className="hidden sm:flex" aria-label={`${names.length} people in this trip`} />}
          {action}
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: IconComponent; children: React.ReactNode }) {
  return (
    <span className="type-small inline-flex items-center gap-1.5 text-ink-soft">
      <Icon className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  );
}

export function TripHeader({ trip, owner, step, onStepClick, action }: { trip: any; owner: boolean; step: StepId; onStepClick: (id: StepId) => void; action?: React.ReactNode }) {
  const nights = nightsBetween(trip.startDate, trip.endDate);
  return (
    <header className="grid gap-6 pb-2 pt-4 sm:pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 flex-1 gap-2">
        <p className="type-overline m-0 flex items-center gap-2 text-brand-600">
          {phaseLabel(trip)}
          {owner && (
            <Badge size="sm" tone="brand" icon={icons.organizer}>
              You're the organizer
            </Badge>
          )}
        </p>
        <h1 className="type-h1 m-0 text-balance">{trip.name}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <Meta icon={icons.calendar}>
            {formatDateRange(trip.startDate, trip.endDate)}
            {nights > 0 && ` · ${plural(nights, 'night')}`}
          </Meta>
          {trip.members && (
            <Meta icon={icons.members}>
              {approvedCount(trip)} of {trip.expectedSize} joined
            </Meta>
          )}
          <Meta icon={trip.scope === 'domestic' ? icons.destination : icons.flight}>{scopeLabel(trip)}</Meta>
          {trip.currency && <Meta icon={icons.money}>Prices in {trip.currency}</Meta>}
        </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <Stepper current={step} onStepClick={(s) => onStepClick(s.id as StepId)} />
    </header>
  );
}

function SummaryRow({ label, done, total }: { label: string; done: number; total: number }) {
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

/** Sidebar on desktop (below the step on mobile): who's coming and anonymous progress. Never per-person status. */
export function TripSummary({ trip, uid, owner, disabled, command }: { trip: any; uid: string; owner: boolean; disabled: boolean; command: (c: any) => Promise<boolean> }) {
  const members = memberList(trip).filter((m: any) => m.status !== 'pending');
  const total = trip.expectedSize;
  const people = trip.activePlan?.memberTotals?.length || members.length;
  return (
    <Card>
      <CardHeader icon={icons.members} title="Who's going" description={`${members.length} of ${total} joined`} />
      <CardBody className="grid gap-5">
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {members.map((member: any) => (
            <li key={member.uid} className="flex items-center gap-3">
              <Avatar name={avatarName(member.nickname)} size="sm" />
              <span className="type-small min-w-0 flex-1 truncate font-semibold text-ink">
                {member.nickname}
                {member.uid === uid && <span className="font-normal text-ink-muted"> (you)</span>}
              </span>
              {member.role === 'owner' && (
                <span className="type-caption inline-flex items-center gap-1 text-ink-muted">
                  <icons.organizer className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Organizer
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="grid gap-4 border-0 border-t border-solid border-line-subtle pt-5">
          <SummaryRow label="Details added" done={trip.submissionProgress ?? 0} total={total} />
          {(trip.phase === 'voting' || trip.phase === 'locked') && <SummaryRow label="Votes in" done={trip.ballotProgress ?? 0} total={total} />}
          {trip.activePlan && <SummaryRow label="Plan approvals" done={planApprovals(trip)} total={people} />}
          {trip.payee && <SummaryRow label="Advance paid" done={trip.paymentProgress ?? 0} total={people} />}
        </div>
        {owner && (
          <div className="flex flex-wrap items-center gap-2 border-0 border-t border-solid border-line-subtle pt-4">
            <span className="type-caption mr-auto text-ink-muted">Invite link</span>
            <Button size="sm" variant="ghost" icon={RefreshCw} disabled={disabled} onClick={() => command({ type: 'rotateInvite' })}>
              New link
            </Button>
            <Button size="sm" variant="ghost" icon={Ban} disabled={disabled} onClick={() => command({ type: 'revokeInvite' })}>
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
        <icons.info className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        Prices are estimates. Not travel, visa or legal advice.
      </p>
      <nav aria-label="Legal" className="flex gap-5">
        <a href="/privacy" className="type-caption font-semibold text-ink-muted no-underline hover:text-ink hover:underline">
          Privacy
        </a>
        <a href="/terms" className="type-caption font-semibold text-ink-muted no-underline hover:text-ink hover:underline">
          Terms
        </a>
      </nav>
    </footer>
  );
}

export const stepIndex = (id: StepId) => PLAN_STEPS.findIndex((s) => s.id === id);
export const stepEyebrow = (id: StepId) => `Step ${stepIndex(id) + 1} of ${PLAN_STEPS.length}`;
