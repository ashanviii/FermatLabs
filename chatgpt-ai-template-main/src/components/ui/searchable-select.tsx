'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { controlClass, useField } from './field';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

export function SearchableSelect({
  value,
  options,
  onValueChange,
  placeholder = 'Choose an option',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches found.',
  disabled,
  className,
}: {
  value: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}) {
  const field = useField();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = normalized
    ? options.filter((option) =>
        `${option.label} ${option.value} ${option.keywords || ''}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
    : options;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={field?.id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-describedby={field?.describedBy}
          aria-invalid={field?.invalid || undefined}
          disabled={disabled}
          className={cn(
            controlClass,
            'flex cursor-pointer items-center justify-between gap-3 text-left',
            !selected && 'text-ink-muted',
            className,
          )}
        >
          <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => searchRef.current?.focus());
        }}
      >
        <div className="flex items-center gap-2 border-0 border-b border-solid border-line px-3">
          <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <div role="listbox" className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length ? (
            filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    'type-small flex min-h-11 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active && 'bg-brand-50 font-semibold text-brand-900',
                  )}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4 shrink-0', active ? 'opacity-100' : 'opacity-0')} aria-hidden />
                  <span className="min-w-0 flex-1">{option.label}</span>
                  <span className="type-caption text-ink-faint">{option.value}</span>
                </button>
              );
            })
          ) : (
            <p className="type-small m-0 px-3 py-8 text-center text-ink-muted">{emptyMessage}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
