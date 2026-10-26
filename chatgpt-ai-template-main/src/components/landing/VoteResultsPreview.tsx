import React from 'react';

import { Badge, PrivateBadge, StatusPill } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/**
 * A picture of the lock explanation (trip.lockExplanation): anonymous vote counts per option, why any higher-voted
 * option couldn't win, and the viewer's own ballot in the private treatment. Example data only.
 */
const rows = [
  { name: 'Tokyo', votes: 3, result: 'missed' as const, note: '1 budget short' },
  { name: 'Lisbon', votes: 2, result: 'won' as const, note: 'Fits everyone' },
  { name: 'Cancún', votes: 1, result: 'fits' as const, note: 'Fits everyone' },
];
const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);

export default function VoteResultsPreview({ className }: { className?: string }) {
  return (
    <figure
      className={cn('m-0', className)}
      role="img"
      aria-label="Example vote results: Tokyo got 3 votes but one budget was short, so Lisbon, with 2 votes and room in everyone's budget, won. Cancún got 1 vote. Your own vote was Tokyo, shown only to you."
    >
      <Card variant="raised" aria-hidden className="rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="type-overline m-0 text-brand-600">Trip locked</p>
            <p className="type-h3 m-0 mt-0.5">Why Lisbon won</p>
          </div>
          <Badge size="sm" icon={icons.members}>
            Everyone sees this
          </Badge>
        </div>

        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li
              key={row.name}
              className={cn(
                'flex flex-col gap-2 rounded-2xl px-4 py-3',
                row.result === 'won' ? 'bg-surface shadow-card ring-2 ring-brand-700' : 'bg-surface-muted',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="type-body flex items-center gap-2 font-semibold text-ink">
                  <icons.destination className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
                  {row.name}
                </span>
                <span className="type-small type-num font-semibold text-ink-soft">
                  {row.votes} {row.votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className={cn('h-full rounded-full', row.result === 'won' ? 'bg-brand-700' : 'bg-line-strong')}
                  style={{ width: `${(row.votes / totalVotes) * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {row.result === 'won' && (
                  <StatusPill status="ok" size="sm">
                    Won: top pick that fits everyone
                  </StatusPill>
                )}
                {row.result === 'missed' && (
                  <StatusPill status="warning" icon={icons.budget} size="sm">
                    Most votes, but {row.note}
                  </StatusPill>
                )}
                {row.result === 'fits' && (
                  <StatusPill status="info" size="sm">
                    {row.note}
                  </StatusPill>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-private-soft px-3 py-2.5 text-private-ink">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="type-small flex items-center gap-2 font-semibold">
              <icons.private className="size-4" strokeWidth={1.75} aria-hidden />
              You voted Tokyo
            </span>
            <PrivateBadge size="sm" className="bg-surface" />
          </div>
          <p className="type-small m-0">It had the most votes, but one budget fell short, so it couldn’t be picked.</p>
        </div>
      </Card>
    </figure>
  );
}
