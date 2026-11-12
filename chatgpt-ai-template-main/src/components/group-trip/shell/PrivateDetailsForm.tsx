'use client';
// Step 2: the viewer's private details. Nothing here is shown to the group.
import { useRef, useState } from 'react';
import { BusFront, Car, Plane, Sparkles, TrainFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { ChipGroup, Checkbox, Field, Input, Select, ToggleChip } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MonthYearSelect } from '@/components/ui/month-year-select';
import DepartureCitySearch from './DepartureCitySearch';
import { PrivateBadge, StatusPill } from '@/components/ui/badge';
import { icons } from '@/components/ui/icons';
import { formatDateRange, formatMoney, formatMonthYear, formatList, plural } from '@/lib/format';
import {
  DEFAULT_HOME_COUNTRY,
  countryInSentence,
  countryName,
  currencyMark,
  homeCountryOptions,
  missingDetails,
  transportOptions,
  tripPreferenceOptions,
  visaOptions,
} from './tripState';

export interface PrivateInput {
  departureCity: string;
  departurePlaceId?: string;
  transportModes?: string[];
  aiPlanningConsent?: boolean;
  budget: number;
  passportExpiry: string;
  visas: string[];
  datesConfirmed: boolean;
  preferences: string[];
  entryCheckAcknowledged: boolean;
  isAdult: boolean;
  /** ISO-3166 alpha-2 passport country. */
  passportCountry: string;
  /** Legacy flag (true = Indian passport). Sent only alongside passportCountry 'IN'. */
  hasIndianPassport?: boolean;
}

interface PrivateDetailsFormProps {
  trip: any;
  value: PrivateInput;
  dirty: boolean;
  disabled: boolean;
  busy: boolean;
  onChange: (patch: Partial<PrivateInput>) => void;
  onToggle: (key: 'visas' | 'preferences', value: string) => void;
  onSave: () => void;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const transportIcons = { train: TrainFront, bus: BusFront, car: Car, flight: Plane };

export function PrivateDetailsForm({ trip, value, dirty, disabled, busy, onChange, onToggle, onSave }: PrivateDetailsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showErrors, setShowErrors] = useState(false);
  const noPassport = value.passportExpiry === 'none';
  const saved = Boolean(trip.myConstraints) && !dirty;
  const requireTransport = trip.planningMode === 'ai';
  const missing = missingDetails(value, requireTransport);
  const transportModes = value.transportModes || [];
  const home = trip.homeCountry || DEFAULT_HOME_COUNTRY;
  const homeName = countryInSentence(home);
  const currency = trip.currency || 'INR';
  const { mark, short } = currencyMark(currency);
  // Domestic trips never check passports, so the passport questions step aside.
  const domesticOnly = trip.scope === 'domestic';
  const interests = tripPreferenceOptions(trip, value.preferences);
  // A visa for your own country is meaningless, so hide that chip (unless it was already picked).
  const ownVisa: Record<string, string> = { us: 'US', uk: 'GB', uae: 'AE', singapore: 'SG', vietnam: 'VN' };
  const visaChoices = visaOptions.filter(([key]) => ownVisa[key] !== value.passportCountry || value.visas.includes(key));
  const passportCountries = homeCountryOptions.some((c) => c.code === home) ? homeCountryOptions : [{ code: home, name: countryName(home) }, ...homeCountryOptions];
  const errors = showErrors ? {
    departureCity: value.departureCity ? undefined : "Choose where you're leaving from.",
    transportModes: !requireTransport || transportOptions.some((mode) => transportModes.includes(mode.value)) ? undefined : 'Choose at least one transport option.',
    budget: Number.isSafeInteger(value.budget) && value.budget > 0 ? undefined : 'Enter a budget greater than zero.',
    passportCountry: domesticOnly || value.passportCountry || value.hasIndianPassport ? undefined : 'Choose your passport country.',
    passportExpiry: domesticOnly || noPassport || /^\d{4}-(0[1-9]|1[0-2])$/.test(value.passportExpiry || '') ? undefined : 'Choose the expiry month and year, or select no passport.',
    preferences: value.preferences.length ? undefined : 'Choose at least one interest.',
    datesConfirmed: value.datesConfirmed ? undefined : 'Confirm that these dates work for you.',
  } : {};

  const revealErrors = () => {
    setShowErrors(true);
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;
      const invalid = Array.from(form.querySelectorAll<HTMLElement>('[aria-invalid="true"]'));
      const first = invalid[0];
      const focusTarget = first?.matches('button, input, select, textarea')
        ? first
        : first?.querySelector<HTMLElement>('button, input, select, textarea');
      focusTarget?.focus();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const animated = new Set<HTMLElement>();
      invalid.forEach((element) => {
        const target = element.closest<HTMLElement>('label') || element;
        if (animated.has(target)) return;
        animated.add(target);
        target.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(-2px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 280, easing: 'ease-out' },
        );
      });
    });
  };

  return (
    <Card>
      <CardHeader
        icon={icons.private}
        iconTone="private"
        title="Your details"
        description="Used to check which trips work for you. Never shown to the group."
        action={<PrivateBadge size="sm" />}
      />
      <CardBody>
        <form
          ref={formRef}
          id="private-details"
          className="grid gap-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            if (missing.length) {
              revealErrors();
              return;
            }
            setShowErrors(false);
            onSave();
          }}
        >
          {showErrors && missing.length > 0 && (
            <p className="type-small m-0 rounded-xl bg-danger-soft px-3.5 py-3 font-medium text-danger-ink" role="alert">
              Check the highlighted details before saving.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Leaving from" hint="Select a city or town from the search results" error={errors.departureCity}>
              <DepartureCitySearch key={trip.id} value={value.departureCity} placeId={value.departurePlaceId} country={home} disabled={disabled || busy} onSelect={onChange} />
            </Field>
            <Field label="Your budget" hint={`Per person in ${currency}, everything included`} error={errors.budget}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                leading={short ? mark : undefined}
                trailing={short ? undefined : mark}
                value={Number.isFinite(value.budget) && value.budget !== 0 ? value.budget : ''}
                onChange={(e) => onChange({ budget: Number(e.target.value) })}
              />
            </Field>
          </div>

          <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0" disabled={disabled || busy} aria-describedby={errors.transportModes ? 'private-transport-error' : undefined}>
            {trip.planningMode !== 'ai' && <p className="type-small m-0 text-ink-muted">Transport choices apply to new AI drafts. Existing catalog estimates are legacy fares and do not reflect these choices.</p>}
            <legend className="type-small mb-2 p-0 font-semibold text-ink">Transport choices</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {transportOptions.map((mode) => {
                const Icon = transportIcons[mode.value as keyof typeof transportIcons];
                return (
                  <Checkbox
                    key={mode.value}
                    label={<span className="inline-flex items-center gap-2"><Icon className="size-4 shrink-0" aria-hidden />{mode.label}</span>}
                    checked={transportModes.includes(mode.value)}
                    aria-invalid={Boolean(errors.transportModes) || undefined}
                    aria-describedby={errors.transportModes ? 'private-transport-error' : undefined}
                    onChange={(event) => onChange({ transportModes: event.target.checked ? [...transportModes, mode.value] : transportModes.filter((selected) => selected !== mode.value) })}
                  />
                );
              })}
            </div>
            {errors.transportModes && <p id="private-transport-error" className="type-small m-0 font-medium text-danger-ink" role="alert">{errors.transportModes}</p>}
          </fieldset>

          <Checkbox
            label="Allow AI trip drafts"
            description="Send my departure city, travel month, interests and transport choices to Groq. My budget, name and passport stay private."
            checked={value.aiPlanningConsent === true}
            disabled={disabled || busy}
            onChange={(event) => onChange({ aiPlanningConsent: event.target.checked })}
          />

          {domesticOnly ? (
            <p className="type-small m-0 flex items-start gap-2 rounded-xl bg-surface-muted px-3.5 py-3 text-ink-soft">
              <icons.passport className="mt-0.5 size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
              No passport needed. This trip stays in {homeName}.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Passport country" hint="Visa checks use this" error={errors.passportCountry}>
                <SearchableSelect
                  value={value.passportCountry || home}
                  searchPlaceholder="Search passport countries…"
                  options={passportCountries.map((country) => ({ value: country.code, label: country.name }))}
                  onValueChange={(passportCountry) => onChange({ passportCountry, hasIndianPassport: passportCountry === 'IN' })}
                />
              </Field>
              <div className="grid content-start gap-3">
                <Field label="Passport expires" hint={noPassport ? `Trips in ${homeName} only` : 'Some countries need 6 months left on it'} error={errors.passportExpiry}>
                  <MonthYearSelect
                    label="Passport expiry"
                    value={noPassport ? '' : value.passportExpiry}
                    disabled={noPassport}
                    minYear={new Date().getFullYear()}
                    onChange={(passportExpiry) => onChange({ passportExpiry })}
                  />
                </Field>
                <Checkbox
                  label="I don't have a passport yet"
                  description={`Trips in ${homeName} only`}
                  checked={noPassport}
                  onChange={(e) => onChange({ passportExpiry: e.target.checked ? 'none' : '' })}
                />
              </div>
            </div>
          )}

          <ChipGroup label="What you're into" error={errors.preferences}>
            {interests.map((option) => (
              <ToggleChip key={option} selected={value.preferences.includes(option)} onSelectedChange={() => onToggle('preferences', option)}>
                {capitalize(option)}
              </ToggleChip>
            ))}
          </ChipGroup>

          {!domesticOnly && (
            <ChipGroup label="Visas you already have">
              {visaChoices.map(([key, label]) => (
                <ToggleChip key={key} icon={icons.visa} selected={value.visas.includes(key)} onSelectedChange={() => onToggle('visas', key)}>
                  {label}
                </ToggleChip>
              ))}
            </ChipGroup>
          )}

          <fieldset
            className="m-0 grid min-w-0 gap-3 border-0 p-0"
            aria-describedby={showErrors && errors.datesConfirmed ? 'private-confirmation-error' : undefined}
          >
            <legend className={`type-small mb-2 p-0 font-semibold ${showErrors && errors.datesConfirmed ? 'text-danger-ink' : 'text-ink'}`}>Confirm your dates</legend>
            <div className="grid gap-3">
              <Checkbox
                variant="tile"
                label="These dates work for me"
                description={formatDateRange(trip.startDate, trip.endDate)}
                checked={value.datesConfirmed}
                aria-invalid={Boolean(errors.datesConfirmed) || undefined}
                aria-describedby={errors.datesConfirmed ? 'private-confirmation-error' : undefined}
                className={errors.datesConfirmed ? 'bg-danger-soft ring-2 ring-danger hover:ring-danger' : undefined}
                onChange={(e) => onChange({ datesConfirmed: e.target.checked })}
              />
            </div>
            {showErrors && errors.datesConfirmed && (
              <p id="private-confirmation-error" className="type-small m-0 font-medium text-danger-ink" role="alert">Confirm that the trip dates work for you.</p>
            )}
          </fieldset>
          {!domesticOnly && <p className="type-small m-0 text-ink-muted">We never ask for your passport number or documents.</p>}
        </form>
      </CardBody>
      <CardFooter>
        <div className="type-small min-w-0 flex-[1_1_14rem] text-ink-muted" aria-live="polite">
          {saved ? (
            <StatusPill status="done">Saved</StatusPill>
          ) : missing.length > 0 ? (
            <span className={showErrors ? 'font-medium text-danger-ink' : undefined}>Still needed: {missing.length <= 2 ? formatList(missing) : `${missing[0]} and ${missing.length - 1} more`}.</span>
          ) : dirty ? (
            <StatusPill status="pending">Not saved yet</StatusPill>
          ) : null}
        </div>
        <Button type="submit" form="private-details" size="lg" className="w-full sm:w-auto" loading={busy} disabled={disabled}>
          Save my details
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Compact read-out of saved details (private), shown once you've moved past step 2. */
export function PrivateDetailsSummary({ trip, value }: { trip: any; value: PrivateInput }) {
  const passportCountry = value.passportCountry || (value.hasIndianPassport ? 'IN' : '');
  const expiry = formatMonthYear(value.passportExpiry) || 'Not set';
  const passport = trip?.scope === 'domestic' ? 'Not needed' : value.passportExpiry === 'none' || !passportCountry ? expiry : `${passportCountry} · ${expiry}`;
  const rows: [typeof icons.budget, string, string][] = [
    [icons.departure, 'Leaving from', value.departureCity],
    [icons.budget, 'Budget', formatMoney(value.budget, trip?.currency || 'INR')],
    [icons.passport, 'Passport', passport],
    [icons.visa, 'Visas', value.visas.length ? plural(value.visas.length, 'visa') : 'None'],
    [TrainFront, 'Transport', transportOptions.filter((mode) => value.transportModes?.includes(mode.value)).map((mode) => mode.label).join(', ') || 'Not selected'],
    [Sparkles, 'AI trip drafts', value.aiPlanningConsent === true ? 'Allowed' : 'Not allowed'],
  ];
  return (
    <div className="grid gap-3 rounded-xl bg-private-soft p-4 text-private-ink">
    <p className="type-caption m-0 flex items-center gap-1.5 font-semibold">
      <icons.private className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      Private from the group
    </p>
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {rows.map(([Icon, label, text]) => (
        <div key={label} className="min-w-0">
          <dt className="type-caption flex items-center gap-1.5 opacity-80">
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            {label}
          </dt>
          <dd className="type-small m-0 mt-0.5 break-words font-semibold">{text}</dd>
        </div>
      ))}
    </dl>
    {value.departurePlaceId?.startsWith('geonames:') && <p className="type-caption m-0"><a href="https://www.geonames.org/" target="_blank" rel="noreferrer" className="underline">City data: GeoNames</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY 4.0</a></p>}
    </div>
  );
}
