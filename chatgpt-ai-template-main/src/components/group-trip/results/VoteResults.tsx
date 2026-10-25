'use client';
// "How the vote went": the anonymous tally behind a lock, a plain-language verdict and, only for the viewer, why their own
// pick did or didn't win. Reads trip.lockExplanation + trip.myLockedVote; never shows who voted for what.
import { Badge, PrivateBadge, StatusPill, type Status } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { icons, type IconComponent } from '@/components/ui/icons';
import { formatMoney, formatProgress, plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import { tripCurrency } from './money';
import { summariseVotes, type ReasonKey, type VoteRow } from './voteSummary';

const reasonStyle: Record<ReasonKey, { status: Status; icon: IconComponent }> = {
  budget: { status: 'warning', icon: icons.budget },
  passport: { status: 'blocked', icon: icons.passport },
  visa: { status: 'warning', icon: icons.visa },
  tooShort: { status: 'blocked', icon: icons.duration },
  scope: { status: 'blocked', icon: icons.destination },
  unknown: { status: 'blocked', icon: icons.route },
};

function TallyRow({ row, max }: { row: VoteRow; max: number }) {
  const out = row.eligible === false;
  const width = max > 0 ? Math.max(row.votes > 0 ? 6 : 0, Math.round((row.votes / max) * 100)) : 0;
  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className={cn('type-body font-semibold', out ? 'text-ink-soft' : 'text-ink')}>{row.name}</span>
          {row.winner && (
            <StatusPill status="ok" size="sm">
              Won
            </StatusPill>
          )}
          {row.mine && (
            <Badge tone="warm" size="sm" icon={icons.check}>
              Your vote
            </Badge>
          )}
        </div>
        <span className="type-small type-num shrink-0 pt-0.5 font-semibold text-ink">{plural(row.votes, 'vote')}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted" aria-hidden>
        <div className={cn('h-full rounded-full', row.winner ? 'bg-brand-700' : out ? 'bg-line-strong' : 'bg-brand-300')} style={{ width: `${width}%` }} />
      </div>
      {out ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="type-caption text-ink-muted">Couldn't win:</span>
          {row.reasons.map((reason) => (
            <StatusPill key={reason.key} status={reasonStyle[reason.key].status} icon={reasonStyle[reason.key].icon} size="sm">
              {reason.pill}
            </StatusPill>
          ))}
        </div>
      ) : (
        !row.winner &&
        row.eligible && (
          <p className="type-caption m-0 flex items-center gap-1 text-ink-muted">
            <icons.success className="size-3.5 text-success" strokeWidth={2} aria-hidden />
            Everyone could go
          </p>
        )
      )}
    </li>
  );
}

export function VoteResults({ trip }: { trip: any }) {
  const plan = trip.activePlan;
  const currency = tripCurrency(trip);
  const summaries: any[] = trip.destinations || [];
  const nameOf = (id: string) => summaries.find((d) => d.id === id)?.name || (plan && id === plan.destinationId ? plan.destinationName : '');
  const myVote: string | null = trip.myLockedVote || null;
  const myFit = (trip.myPrivateStatus || []).find((row: any) => row.destinationId === myVote);
  const summary = summariseVotes({
    explanation: trip.lockExplanation,
    publishedTotals: trip.publishedTotals,
    winnerId: trip.lockedDestinationId || plan?.destinationId,
    myVote,
    myFit,
    nameOf,
    scope: trip.scope,
  });
  if (!summary) return null;
  const max = Math.max(1, ...summary.rows.map((row) => row.votes));
  const expected = Number(trip.expectedSize || 0);
  const { personal } = summary;
  const own = personal?.ownShare;

  return (
    <Card aria-labelledby="vote-results-title">
      <CardHeader
        icon={icons.vote}
        title={<span id="vote-results-title">How the vote went</span>}
        description={`${expected && summary.totalVotes <= expected ? formatProgress(summary.totalVotes, expected) : summary.totalVotes} voted. Counts only, nobody is named.`}
      />
      <CardBody className="flex flex-col gap-5">
        <p className="type-body m-0 font-medium text-ink" aria-live="polite">
          {summary.verdict}
        </p>

        <ol aria-label="Votes per option, most first" className="m-0 flex list-none flex-col divide-x-0 divide-y divide-solid divide-line-subtle p-0">
          {summary.rows.map((row) => (
            <TallyRow key={row.id} row={row} max={max} />
          ))}
        </ol>

        {summary.otherIneligible > 0 && (
          <p className="type-caption m-0 text-ink-muted">
            {summary.otherIneligible === 1 ? '1 other option' : `${summary.otherIneligible} other options`} got no votes and didn't work for everyone.
          </p>
        )}

        {personal && (
          <div className="flex flex-col gap-1.5 rounded-xl bg-private-soft px-4 py-3 text-private-ink">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="type-small m-0 flex items-center gap-1.5 font-semibold">
                <icons.vote className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                {personal.outcome === 'won' ? 'Your pick won' : 'Why your pick didn’t win'}
              </p>
              <PrivateBadge size="sm" className="bg-surface/70" />
            </div>
            <p className="type-small m-0">
              {personal.text}
              {own && ` ${own.count === 1 ? 'That was' : 'One of those was'} your ${own.kind === 'budget' ? 'budget' : own.kind === 'passport' ? 'passport' : 'visa timing'}.`}
              {own?.kind === 'budget' && own.unlockAmount ? ` ${formatMoney(own.unlockAmount, currency)} more would have covered it.` : null}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default VoteResults;
