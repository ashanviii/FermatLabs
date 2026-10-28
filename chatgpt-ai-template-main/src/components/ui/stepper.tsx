import * as React from 'react';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperStep {
  id: string;
  label: string;
}

/** The five /plan steps, in order. Use the ids when deriving the current step from trip state. */
export const PLAN_STEPS: StepperStep[] = [
  { id: 'invite', label: 'Invite' },
  { id: 'details', label: 'Your details' },
  { id: 'choose', label: 'Choose' },
  { id: 'plan', label: 'Plan' },
  { id: 'go', label: 'Go' },
];

export interface StepperProps {
  steps?: StepperStep[];
  /** Current step: index (0-based) or id. Steps before it are done, after it upcoming. */
  current: number | string;
  /** Optional: make done steps clickable (e.g. scroll back to "Your details"). */
  onStepClick?: (step: StepperStep, index: number) => void;
  className?: string;
}

/**
 * Progress through the trip. Full row from sm up; on mobile a compact "Step 2 of 5 · Your details" + segment bar.
 * State is conveyed by icon/number + aria-current, not colour alone.
 *   <Stepper current="choose" />
 */
export function Stepper({ steps = PLAN_STEPS, current, onStepClick, className }: StepperProps) {
  const index = typeof current === 'number' ? current : Math.max(0, steps.findIndex((s) => s.id === current));
  const active = steps[index];
  return (
    <nav aria-label="Trip progress" className={cn('w-full', className)}>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="type-small m-0 font-bold text-ink">{active?.label}</p>
          <p className="type-caption m-0 text-ink-muted">
            Step {index + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {steps.map((step, i) => (
            <span key={step.id} className={cn('h-1.5 flex-1 rounded-full', i < index ? 'bg-brand-300' : i === index ? 'bg-brand-600' : 'bg-surface-strong')} />
          ))}
        </div>
      </div>

      {/* sm and up */}
      <ol className="m-0 hidden list-none items-center p-0 sm:flex">
        {steps.map((step, i) => {
          const state = i < index ? 'done' : i === index ? 'current' : 'upcoming';
          const clickable = Boolean(onStepClick) && state === 'done';
          const content = (
            <>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  state === 'done' && 'bg-brand-100 text-brand-800',
                  state === 'current' && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  state === 'upcoming' && 'bg-surface text-ink-muted ring-1 ring-inset ring-line-strong',
                )}
              >
                {state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={cn('type-small whitespace-nowrap', state === 'current' ? 'font-bold text-ink' : state === 'done' ? 'font-semibold text-ink-soft' : 'font-medium text-ink-muted')}>
                {step.label}
                {state === 'done' && <span className="sr-only"> (done)</span>}
              </span>
            </>
          );
          return (
            <li key={step.id} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')} aria-current={state === 'current' ? 'step' : undefined}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(step, i)}
                  className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent p-0 pr-1 font-sans hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2">{content}</span>
              )}
              {i < steps.length - 1 && <span aria-hidden className={cn('mx-3 h-0.5 min-w-4 flex-1 rounded-full', i < index ? 'bg-brand-300' : 'bg-line')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
