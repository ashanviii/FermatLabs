'use client';

import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const date = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const iso = (value?: Date) => value
  ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  : '';
const plusDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};
const fullDate = (value: Date) => value.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = (value: Date, year = false) => value.toLocaleDateString('en', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  disabled,
  error,
}: {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected: DateRange | undefined = date(startDate)
    ? { from: date(startDate), to: date(endDate) }
    : undefined;
  const complete = Boolean(selected?.from && selected?.to);

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Choose trip dates"
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              'grid min-h-[4.75rem] w-full cursor-pointer grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border-0 bg-surface px-4 text-left shadow-sm outline-none ring-1 ring-inset ring-line transition hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:bg-surface-muted',
              error && 'ring-2 ring-danger',
            )}
          >
            <span className="min-w-0">
              <span className="type-caption block text-ink-muted">First day</span>
              <span className={cn('type-body mt-1 block truncate font-semibold', !selected?.from && 'text-ink-faint')}>
                {selected?.from ? fullDate(selected.from) : 'Pick a date'}
              </span>
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 text-right">
              <span className="type-caption block text-ink-muted">Last day</span>
              <span className={cn('type-body mt-1 block truncate font-semibold', !selected?.to && 'text-ink-faint')}>
                {selected?.to ? fullDate(selected.to) : 'Pick a date'}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-3" align="center">
          <div className="mb-2 flex items-start justify-between gap-3 px-1">
            <div>
              <p className="type-small m-0 font-semibold text-ink">Choose your trip dates</p>
              <p className="type-caption m-0 mt-0.5 text-ink-muted">Select a first and last day · up to 31 days</p>
            </div>
            {selected?.from && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange('', '')}>
                Clear
              </Button>
            )}
          </div>
          <DayPicker
            mode="range"
            selected={selected}
            defaultMonth={selected?.from || plusDays(new Date(), 14)}
            min={1}
            max={30}
            showOutsideDays
            onSelect={(range) => {
              onChange(iso(range?.from), iso(range?.to));
              if (range?.from && range?.to) setOpen(false);
            }}
            components={{ Chevron: ({ orientation }) => (orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />) }}
            classNames={{
              root: 'w-full',
              months: 'w-full',
              month: 'w-full space-y-3',
              month_caption: 'relative flex h-10 items-center justify-center',
              caption_label: 'type-small font-semibold text-ink',
              nav: 'absolute inset-x-0 top-0 flex h-10 items-center justify-between',
              button_previous: 'grid size-9 place-items-center rounded-lg border-0 bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              button_next: 'grid size-9 place-items-center rounded-lg border-0 bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              month_grid: 'w-full border-collapse',
              weekdays: 'grid grid-cols-7',
              weekday: 'type-caption py-2 text-center font-medium text-ink-faint',
              week: 'mt-1 grid grid-cols-7',
              day: 'relative grid aspect-square place-items-center p-0 text-center',
              day_button: 'type-small grid size-10 max-w-full place-items-center rounded-lg border-0 bg-transparent text-ink hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:text-ink-faint',
              today: '[&_button]:font-bold [&_button]:text-brand-800 [&_button]:ring-1 [&_button]:ring-brand-200',
              selected: '[&_button]:bg-brand-700 [&_button]:font-semibold [&_button]:text-white [&_button]:hover:bg-brand-800',
              range_middle: 'bg-brand-50 [&_button]:rounded-none [&_button]:bg-transparent [&_button]:text-brand-900 [&_button]:hover:bg-brand-100',
              range_start: 'rounded-l-lg bg-brand-50',
              range_end: 'rounded-r-lg bg-brand-50',
              outside: 'opacity-35',
              disabled: 'opacity-30',
              hidden: 'invisible',
            }}
          />
          <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-center">
            <p className="type-small m-0 font-medium text-ink">
              {complete && selected?.from && selected?.to
                ? `${shortDate(selected.from)} → ${shortDate(selected.to, true)}`
                : selected?.from
                  ? 'Now pick the last day'
                  : 'Pick the first day'}
            </p>
          </div>
        </PopoverContent>
      </Popover>
      <input type="hidden" name="startDate" value={startDate} readOnly />
      <input type="hidden" name="endDate" value={endDate} readOnly />
      {error && <p className="type-small m-0 font-medium text-danger-ink" role="alert">{error}</p>}
    </div>
  );
}
