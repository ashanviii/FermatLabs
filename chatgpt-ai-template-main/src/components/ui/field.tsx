'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { IconComponent } from './icons';

/* ---------------------------------------------------------------------------------------------------------------- */
/* Field: label + control + hint/error, wired for screen readers.                                                    */
/* ---------------------------------------------------------------------------------------------------------------- */

type FieldContextValue = { id: string; describedBy?: string; invalid: boolean };
const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Read the surrounding Field's id / aria wiring (for custom controls). */
export function useField() {
  return React.useContext(FieldContext);
}

export interface FieldProps {
  label: React.ReactNode;
  /** One short helper line under the control. */
  hint?: React.ReactNode;
  /** Replaces the hint and turns the control red. */
  error?: React.ReactNode;
  /** Right side of the label row, e.g. <PrivateBadge size="sm" /> or "Optional". */
  aside?: React.ReactNode;
  /** Use an existing id instead of a generated one. */
  htmlFor?: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 *   <Field label="Departure city" hint="Where you'd fly from">
 *     <Select value={city} onChange={(e) => setCity(e.target.value)}>...</Select>
 *   </Field>
 * Input / Select / Textarea / MonthYearSelect inside a Field pick up its id and aria-describedby automatically.
 */
export function Field({
  label,
  hint,
  error,
  aside,
  htmlFor,
  hideLabel,
  className,
  children,
}: FieldProps) {
  const autoId = React.useId();
  const id = htmlFor ?? `f${autoId.replace(/:/g, '')}`;
  const messageId = `${id}-msg`;
  const message = error || hint;
  const ctx = React.useMemo(
    () => ({
      id,
      describedBy: message ? messageId : undefined,
      invalid: Boolean(error),
    }),
    [id, message, messageId, error],
  );
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          hideLabel && 'sr-only',
        )}
      >
        <label htmlFor={id} className="type-small font-semibold text-ink">
          {label}
        </label>
        {aside && <span className="type-caption text-ink-muted">{aside}</span>}
      </div>
      <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
      {message && (
        <p
          id={messageId}
          className={cn(
            'type-small m-0',
            error ? 'font-medium text-danger-ink' : 'text-ink-muted',
          )}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/*
 * Shared control look: white, hairline ring, tinted focus halo, red ring when invalid.
 * Text is 17px (Apple's body size). Anything under 16px makes iOS Safari zoom the page when the field is tapped.
 */
export const controlClass = cn(
  'h-11 w-full min-w-0 rounded-lg border-0 bg-surface px-3.5 font-sans text-[1.0625rem] tracking-[-0.024em] text-ink shadow-sm outline-none ring-1 ring-inset ring-line',
  'placeholder:text-ink-faint transition-shadow duration-200 ease-apple hover:ring-line-strong',
  'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:shadow-[0_0_0_4px_rgba(61,145,99,0.18)]',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted',
  'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger',
);

function useControlProps(props: {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
}) {
  const field = useField();
  return {
    id: props.id ?? field?.id,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid || undefined),
  };
}

/* ---------------------------------------------------------------------------------------------------------------- */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Fixed text or icon inside the left edge, e.g. "₹". */
  leading?: React.ReactNode;
  /** Fixed text or icon inside the right edge, e.g. "per person". */
  trailing?: React.ReactNode;
}

/**
 *   <Input type="number" inputMode="numeric" leading="₹" value={budget} onChange={...} />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leading, trailing, ...props }, ref) => {
    const wired = useControlProps(props);
    const input = (
      <input
        ref={ref}
        {...props}
        {...wired}
        className={cn(
          controlClass,
          leading ? 'pl-9' : '',
          trailing ? 'pr-16' : '',
          !leading && !trailing && className,
        )}
      />
    );
    if (!leading && !trailing) return input;
    return (
      <div className={cn('relative', className)}>
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[1.0625rem] font-medium text-ink-muted [&_svg]:size-4">
            {leading}
          </span>
        )}
        {input}
        {trailing && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center type-small text-ink-muted [&_svg]:size-4">
            {trailing}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  const wired = useControlProps(props);
  return (
    <textarea
      ref={ref}
      {...props}
      {...wired}
      className={cn(
        controlClass,
        'h-auto min-h-[5.5rem] py-3 leading-6',
        className,
      )}
    />
  );
});
Textarea.displayName = 'Textarea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Adds a first empty option ("Choose...") with value "". */
  placeholder?: string;
}

/**
 * Native select (best on mobile), styled.
 *   <Select value={city} onChange={(e) => setCity(e.target.value)}>{cities.map((c) => <option key={c}>{c}</option>)}</Select>
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    const wired = useControlProps(props);
    return (
      <div className={cn('relative min-w-0', className)}>
        <select
          ref={ref}
          {...props}
          {...wired}
          className={cn(
            controlClass,
            'cursor-pointer appearance-none pr-10',
            props.value === '' && 'text-ink-muted',
          )}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    );
  },
);
Select.displayName = 'Select';

/* ---------------------------------------------------------------------------------------------------------------- */

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** "tile" draws a soft surface around it (confirmations list); "plain" is inline. */
  variant?: 'plain' | 'tile';
}

/**
 *   <Checkbox label="These dates work for me" checked={ok} onChange={(e) => setOk(e.target.checked)} />
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, description, variant = 'plain', className, disabled, ...props },
    ref,
  ) => (
    <label
      className={cn(
        'group flex cursor-pointer items-start gap-3 text-ink',
        variant === 'tile' &&
          'rounded-xl bg-surface p-3.5 ring-1 ring-inset ring-line transition-shadow hover:ring-line-strong has-[:checked]:bg-brand-50/60 has-[:checked]:ring-brand-200',
        disabled && 'cursor-not-allowed opacity-55',
        className,
      )}
    >
      {/* Round, like iOS selection checkmarks. Still a native checkbox underneath. */}
      <span className="relative mt-0.5 flex size-[1.375rem] shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 m-0 size-[1.375rem] cursor-pointer appearance-none rounded-full border-0 bg-surface ring-[1.5px] ring-inset ring-line-strong transition-colors duration-200 ease-apple checked:bg-brand-600 checked:ring-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          {...props}
        />
        <Check
          className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="type-body block font-medium">{label}</span>
        {description && (
          <span className="type-small mt-0.5 block text-ink-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';

/* ---------------------------------------------------------------------------------------------------------------- */

export interface RadioCardOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconComponent;
  disabled?: boolean;
}

export interface RadioCardsProps<T extends string = string> {
  /** Accessible group name (shown as a legend unless hideLegend). */
  legend: React.ReactNode;
  hideLegend?: boolean;
  name: string;
  options: RadioCardOption<T>[];
  value: T | '' | null | undefined;
  onChange: (value: T) => void;
  /** Columns from the sm breakpoint up (always 1 column below 640px). */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const radioCols = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
} as const;

/**
 * Pick exactly one of a few rich options.
 *   <RadioCards legend="Trip length" name="len" value={len} onChange={setLen}
 *     options={[{ value: 'short', label: 'Long weekend', description: '3 nights' }, ...]} />
 */
export function RadioCards<T extends string = string>({
  legend,
  hideLegend,
  name,
  options,
  value,
  onChange,
  columns = 2,
  className,
}: RadioCardsProps<T>) {
  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)}>
      <legend
        className={cn(
          'type-small mb-1.5 p-0 font-semibold text-ink',
          hideLegend && 'sr-only',
        )}
      >
        {legend}
      </legend>
      <div className={cn('grid grid-cols-1 gap-2.5', radioCols[columns])}>
        {options.map((option) => {
          const Icon = option.icon;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-3.5 ring-1 ring-inset ring-line transition-shadow hover:ring-line-strong',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500',
                checked &&
                  'bg-brand-50/70 ring-2 ring-brand-600 hover:ring-brand-600',
                option.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              {Icon && (
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    checked
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-muted text-ink-soft',
                  )}
                >
                  <Icon
                    className="size-[1.125rem]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="type-body block font-semibold text-ink">
                  {option.label}
                </span>
                {option.description && (
                  <span className="type-small mt-0.5 block text-ink-muted">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                  checked
                    ? 'bg-brand-600 ring-brand-600'
                    : 'bg-surface ring-line-strong',
                )}
              >
                {checked && (
                  <Check className="size-3 text-white" strokeWidth={3.5} />
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

export interface ToggleChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
  icon?: IconComponent;
}

/**
 * Multi-select chip (preferences, visas held). A real toggle button with aria-pressed.
 *   <ChipGroup label="Visas you hold">
 *     {visas.map(([v, label]) => <ToggleChip key={v} selected={mine.includes(v)} onSelectedChange={() => toggle(v)}>{label}</ToggleChip>)}
 *   </ChipGroup>
 */
export const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  (
    {
      selected,
      onSelectedChange,
      icon: Icon,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelectedChange?.(!selected);
      }}
      className={cn(
        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3.5 font-sans text-[0.875rem] font-semibold tracking-[-0.01em] transition-[background-color,color,transform] duration-200 ease-apple active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/35',
        'disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        selected
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'bg-fill text-ink hover:bg-fill-strong',
        className,
      )}
      {...props}
    >
      {selected ? (
        <Check strokeWidth={2.5} aria-hidden />
      ) : (
        Icon && <Icon strokeWidth={1.75} aria-hidden />
      )}
      {children}
    </button>
  ),
);
ToggleChip.displayName = 'ToggleChip';

/** Wraps ToggleChips: labelled group + wrapping row. */
export function ChipGroup({
  label,
  hideLabel,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  hideLabel?: boolean;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = `cg${React.useId().replace(/:/g, '')}`;
  const messageId = `${id}-msg`;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span
        id={id}
        className={cn(
          'type-small font-semibold',
          error ? 'text-danger-ink' : 'text-ink',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        aria-describedby={error ? messageId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'flex flex-wrap gap-2 rounded-2xl',
          error && 'bg-danger-soft p-2 ring-2 ring-danger',
        )}
      >
        {children}
      </div>
      {error && (
        <p
          id={messageId}
          className="type-small m-0 font-medium text-danger-ink"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
