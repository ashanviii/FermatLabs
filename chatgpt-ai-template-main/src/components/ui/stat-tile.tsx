import * as React from 'react';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';
import { icons } from './icons';

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Small line under the value ("per person", "3 of 5 voted"). */
  hint?: React.ReactNode;
  icon?: IconComponent;
  /** private = viewer-only number (lock + private tint). inverse = on a brand-900 hero. */
  tone?: 'default' | 'private' | 'inverse';
}

/**
 * One number with a label. Use in rows of 2-4 (grid-cols-2 on mobile, 4 on desktop).
 *   <StatTile icon={icons.money} label="Per person" value="₹42k" hint="incl. 10% buffer" />
 *   <StatTile tone="private" label="Your share" value={formatINR(me.total)} />
 */
export function StatTile({ label, value, hint, icon, tone = 'default', className, ...props }: StatTileProps) {
  const Icon = icon ?? (tone === 'private' ? icons.private : undefined);
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-2xl p-4',
        tone === 'default' && 'bg-surface shadow-card',
        tone === 'private' && 'bg-private-soft ring-1 ring-inset ring-private-line',
        tone === 'inverse' && 'bg-white/10 text-white',
        className,
      )}
      {...props}
    >
      <div className={cn('type-caption flex items-center gap-1.5', tone === 'default' && 'text-ink-muted', tone === 'private' && 'text-private-ink', tone === 'inverse' && 'text-white/75')}>
        {Icon && <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn('type-num font-display text-[1.375rem] font-bold leading-7 tracking-tight', tone === 'inverse' ? 'text-white' : 'text-ink')}>{value}</div>
      {hint && <div className={cn('type-caption font-normal', tone === 'inverse' ? 'text-white/70' : 'text-ink-muted')}>{hint}</div>}
    </div>
  );
}
