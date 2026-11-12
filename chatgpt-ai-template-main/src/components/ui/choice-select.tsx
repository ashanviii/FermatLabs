'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { controlClass, useField } from './field';
import type { IconComponent } from './icons';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type ChoiceSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type ChoiceSelectGroup = {
  label?: string;
  icon?: IconComponent;
  options: ChoiceSelectOption[];
};

export function ChoiceSelect({
  value,
  groups,
  onValueChange,
  placeholder = 'Choose an option',
  disabled,
  className,
}: {
  value: string;
  groups: ChoiceSelectGroup[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const field = useField();
  const generatedId = React.useId();
  const triggerId = field?.id ?? `choice-${generatedId.replace(/:/g, '')}`;
  const listboxId = `${triggerId}-options`;
  const [open, setOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const options = React.useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selected = options.find((option) => option.value === value);

  function focusRelativeOption(current: HTMLElement, direction: 1 | -1) {
    const choices = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    if (!choices.length) return;
    const currentIndex = choices.indexOf(current);
    const nextIndex = (currentIndex + direction + choices.length) % choices.length;
    choices[nextIndex]?.focus();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-describedby={field?.describedBy}
          aria-invalid={field?.invalid || undefined}
          disabled={disabled}
          className={cn(
            controlClass,
            'group flex cursor-pointer items-center justify-between gap-3 text-left',
            'data-[state=open]:ring-2 data-[state=open]:ring-brand-500 data-[state=open]:shadow-[0_0_0_4px_rgba(85,116,194,0.16)]',
            !selected && 'text-ink-muted',
            className,
          )}
        >
          <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fill text-ink-muted transition-colors group-hover:bg-fill-strong">
            <ChevronDown
              className={cn('size-4 transition-transform duration-200 ease-apple', open && 'rotate-180')}
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-1.5"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            const selectedOption = contentRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
            const firstOption = contentRef.current?.querySelector<HTMLElement>('[role="option"]');
            (selectedOption || firstOption)?.focus();
          });
        }}
      >
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="max-h-[min(22rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain"
        >
          {groups.map((group, groupIndex) => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.label || `group-${groupIndex}`}
                role={group.label ? 'group' : undefined}
                aria-label={group.label}
                className={cn(groupIndex > 0 && 'mt-1 border-0 border-t border-solid border-line-subtle pt-1')}
              >
                {group.label && (
                  <div className="type-overline flex items-center gap-1.5 px-3 pb-1 pt-2 text-brand-700">
                    {GroupIcon && <GroupIcon className="size-3.5" aria-hidden />}
                    {group.label}
                  </div>
                )}
                {group.options.map((option) => {
                  const active = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-selected={active}
                      className={cn(
                        'group/option flex min-h-11 w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-ink transition-colors',
                        'hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
                        active && 'bg-brand-50 text-brand-900',
                      )}
                      onClick={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                          event.preventDefault();
                          focusRelativeOption(event.currentTarget, event.key === 'ArrowDown' ? 1 : -1);
                        }
                        if (event.key === 'Home' || event.key === 'End') {
                          event.preventDefault();
                          const choices = Array.from(
                            contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
                          );
                          (event.key === 'Home' ? choices[0] : choices.at(-1))?.focus();
                        }
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn('type-body block', active && 'font-semibold')}>{option.label}</span>
                        {option.description && (
                          <span className="type-caption mt-0.5 block text-ink-muted">{option.description}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                          active ? 'bg-brand-600 text-white' : 'text-transparent group-hover/option:text-ink-faint',
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
