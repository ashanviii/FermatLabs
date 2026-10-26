'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { monthNames } from '@/lib/format';
import { Select, useField } from './field';

export interface MonthYearSelectProps {
  /**
   * 'YYYY-MM' when complete. Partial values are allowed and round-trip: 'YYYY-' (year only), '-MM' (month only), ''.
   * 'none' (no passport) is the caller's state: pass it and the selects render empty + disabled.
   */
  value: string | null | undefined;
  /** Receives 'YYYY-MM', or a partial 'YYYY-' / '-MM' while the user is midway, or '' when both are cleared. */
  onChange: (value: string) => void;
  disabled?: boolean;
  /** First year offered (default: this year). A value outside the range is always added so it stays visible. */
  minYear?: number;
  /** Number of years offered from minYear (default 16). */
  years?: number;
  /** Prefix for the two accessible names, e.g. "Passport expiry" -> "Passport expiry month" / "Passport expiry year". */
  label?: string;
  className?: string;
}

const MONTH_LABELS = monthNames('short');

function parse(value: string | null | undefined): { year: string; month: string } {
  if (!value || value === 'none') return { year: '', month: '' };
  const [rawYear = '', rawMonth = ''] = value.split('-');
  const year = /^\d{4}$/.test(rawYear) ? rawYear : '';
  const month = /^(0[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : '';
  return { year, month };
}

function compose(year: string, month: string): string {
  return year || month ? `${year}-${month}` : '';
}

/**
 * Month + year dropdowns (passport expiry). Native <input type="month"> resets while typing in Chrome and does not
 * exist in desktop Safari, so this is two native selects.
 *
 * The selection is also held locally, so each dropdown moves immediately even if the parent stores only complete
 * values (or ignores partials). Whenever the parent passes a different value, it wins.
 *
 *   <Field label="Passport expires" aside={<PrivateBadge size="sm" />}>
 *     <MonthYearSelect label="Passport expiry" value={expiry === 'none' ? '' : expiry} disabled={expiry === 'none'} onChange={setExpiry} />
 *   </Field>
 *   <Checkbox label="I don't have a passport yet" checked={expiry === 'none'} onChange={(e) => setExpiry(e.target.checked ? 'none' : '')} />
 */
export function MonthYearSelect({ value, onChange, disabled, minYear, years = 16, label = 'Passport expiry', className }: MonthYearSelectProps) {
  const field = useField();
  const none = value === 'none';
  const [local, setLocal] = React.useState(() => parse(value));
  const lastEmitted = React.useRef<string | null>(null);

  // Adopt outside changes (reset, loaded from server) but ignore the echo of our own onChange.
  React.useEffect(() => {
    const incoming = value ?? '';
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = null;
    setLocal(parse(incoming));
  }, [value]);

  const start = minYear ?? new Date().getFullYear();
  const yearOptions = React.useMemo(() => {
    const list = Array.from({ length: Math.max(1, years) }, (_, i) => String(start + i));
    if (local.year && !list.includes(local.year)) list.push(local.year);
    return list.sort();
  }, [start, years, local.year]);

  const update = (next: { year: string; month: string }) => {
    setLocal(next);
    const out = compose(next.year, next.month);
    lastEmitted.current = out;
    onChange(out);
  };

  const shown = none ? { year: '', month: '' } : local;

  return (
    <div className={cn('grid grid-cols-[1.35fr_1fr] gap-2', className)} role="group" aria-label={label}>
      <Select
        id={field?.id}
        aria-label={`${label} month`}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        disabled={disabled || none}
        value={shown.month}
        onChange={(event) => update({ year: local.year, month: event.target.value })}
        placeholder="Month"
      >
        {MONTH_LABELS.map((name, index) => (
          <option key={name} value={String(index + 1).padStart(2, '0')}>
            {name}
          </option>
        ))}
      </Select>
      <Select
        id={field ? `${field.id}-year` : undefined}
        aria-label={`${label} year`}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        disabled={disabled || none}
        value={shown.year}
        onChange={(event) => update({ year: event.target.value, month: local.month })}
        placeholder="Year"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Select>
    </div>
  );
}
