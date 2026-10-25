'use client';
// Step 2: the viewer's private details. Nothing here is shown to the group.
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { ChipGroup, Checkbox, Field, Input, Select, ToggleChip } from '@/components/ui/field';
import { MonthYearSelect } from '@/components/ui/month-year-select';
import { PrivateBadge, StatusPill } from '@/components/ui/badge';
import { icons } from '@/components/ui/icons';
import { formatDateRange, formatMoney, formatMonthYear, formatList, plural } from '@/lib/format';
import {
  DEFAULT_HOME_COUNTRY,
  countryInSentence,
  countryName,
  currencyMark,
  departureCityGroups,
  homeCountryOptions,
  missingDetails,
  tripPreferenceOptions,
  visaOptions,
} from './tripState';

export interface PrivateInput {
  departureCity: string;
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

export function PrivateDetailsForm({ trip, value, dirty, disabled, busy, onChange, onToggle, onSave }: PrivateDetailsFormProps) {
  const noPassport = value.passportExpiry === 'none';
  const saved = Boolean(trip.myConstraints) && !dirty;
  const missing = missingDetails(value);
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
          id="private-details"
          className="grid gap-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled) onSave();
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Leaving from" hint="Nearest big airport">
              <Select value={value.departureCity} onChange={(e) => onChange({ departureCity: e.target.value })}>
                {departureCityGroups(home, value.departureCity).map((group) => (
                  <optgroup key={group.code || 'saved'} label={group.name}>
                    {group.cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.iata ? `${city.name} (${city.iata})` : city.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            <Field label="Your budget" hint={`Per person in ${currency}, everything included`}>
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

          {domesticOnly ? (
            <p className="type-small m-0 flex items-start gap-2 rounded-xl bg-surface-muted px-3.5 py-3 text-ink-soft">
              <icons.passport className="mt-0.5 size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
              No passport needed. This trip stays in {homeName}.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Passport country" hint="Visa checks use this">
                <Select value={value.passportCountry || home} onChange={(e) => onChange({ passportCountry: e.target.value, hasIndianPassport: e.target.value === 'IN' })}>
                  {passportCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid content-start gap-3">
                <Field label="Passport expires" hint={noPassport ? `Trips in ${homeName} only` : 'Some countries need 6 months left on it'}>
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

          <ChipGroup label="What you're into">
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

          <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
            <legend className="type-small mb-2 p-0 font-semibold text-ink">Please confirm</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                variant="tile"
                label="These dates work for me"
                description={formatDateRange(trip.startDate, trip.endDate)}
                checked={value.datesConfirmed}
                onChange={(e) => onChange({ datesConfirmed: e.target.checked })}
              />
              <Checkbox variant="tile" label="I'm 18 or older" checked={value.isAdult} onChange={(e) => onChange({ isAdult: e.target.checked })} />
              <Checkbox
                variant="tile"
                label={domesticOnly ? "I'll check travel rules before booking" : "I'll check entry rules before booking"}
                description={domesticOnly ? 'Like the ID you need to fly' : 'On the official government site'}
                checked={value.entryCheckAcknowledged}
                onChange={(e) => onChange({ entryCheckAcknowledged: e.target.checked })}
              />
            </div>
          </fieldset>
          {!domesticOnly && <p className="type-small m-0 text-ink-muted">We never ask for your passport number or documents.</p>}
        </form>
      </CardBody>
      <CardFooter>
        <div className="type-small min-w-0 flex-[1_1_14rem] text-ink-muted" aria-live="polite">
          {saved ? (
            <StatusPill status="done">Saved</StatusPill>
          ) : missing.length > 0 ? (
            <span>Still needed: {missing.length <= 2 ? formatList(missing) : `${missing[0]} and ${missing.length - 1} more`}.</span>
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
  ];
  return (
    <div className="grid gap-3 rounded-xl bg-private-soft p-4 text-private-ink">
    <p className="type-caption m-0 flex items-center gap-1.5 font-semibold">
      <icons.private className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      Only you see this
    </p>
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {rows.map(([Icon, label, text]) => (
        <div key={label} className="min-w-0">
          <dt className="type-caption flex items-center gap-1.5 opacity-80">
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            {label}
          </dt>
          <dd className="type-small m-0 mt-0.5 truncate font-semibold">{text}</dd>
        </div>
      ))}
    </dl>
    </div>
  );
}
