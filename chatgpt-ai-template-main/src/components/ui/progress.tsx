import * as React from 'react';

import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Votes in". */
  label: string;
  tone?: 'brand' | 'warm' | 'success' | 'warning' | 'danger' | 'private';
  size?: 'sm' | 'md';
}

const fill = { brand: 'bg-brand-600', warm: 'bg-warm-500', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', private: 'bg-private' } as const;

/**
 * Thin progress bar. Always pair with a text count nearby ("3 of 5 voted").
 *   <Progress label="Votes in" value={3} max={5} />
 */
export function Progress({ value, max = 100, label, tone = 'brand', size = 'sm', className, ...props }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('w-full overflow-hidden rounded-full bg-surface-strong', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
      {...props}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', fill[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
