'use client';
// Screens before you're inside a trip: sign in, switch to a recoverable account, create a trip, join by invite.
import { useRef, useState } from 'react';
import { ChevronRight, Globe, LogIn, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, RadioCards, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { icons } from '@/components/ui/icons';
import { formatDateRange, nightsBetween, plural } from '@/lib/format';
import { DateFinder } from '../FermatExtras';
import { countryInSentence, currencyForCountry, currencyOptions, fiatCurrencyOptions, homeCountryOptions, popularHomeCountries, scopeAvailability, type TripScope } from './tripState';

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3" role="presentation">
      <span className="h-px flex-1 bg-line" />
      <span className="type-caption text-ink-muted">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function EmailSignIn({ disabled = false }: { disabled?: boolean }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'' | 'signIn' | 'signUp'>('');
  const submit = async (mode: 'signIn' | 'signUp') => {
    setBusy(mode);
    setError('');
    try {
      if (mode === 'signIn') await signInWithEmail(email, password);
      else await signUpWithEmail(email.split('@')[0], email, password);
    } catch (cause: any) {
      setError(cause.message || 'Email sign-in failed');
    } finally {
      setBusy('');
    }
  };
  const blocked = disabled || Boolean(busy) || !email || password.length < 6;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!blocked) submit('signIn');
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} disabled={disabled} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <Input type="password" autoComplete="current-password" value={password} disabled={disabled} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      </div>
      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" icon={Mail} loading={busy === 'signIn'} disabled={blocked}>
          Sign in with email
        </Button>
        <Button variant="ghost" loading={busy === 'signUp'} disabled={blocked} onClick={() => submit('signUp')}>
          Create an account
        </Button>
      </div>
    </form>
  );
}

const linkClass = 'font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900';

export function SignInCard({ invited, consented, onConsent }: { invited: boolean; consented: boolean; onConsent: (value: boolean) => void }) {
  const { signInAsGuest, signInWithGoogle } = useAuth();
  return (
    <Card>
      <CardHeader
        icon={invited ? icons.invite : LogIn}
        title={invited ? "Join your friends' trip" : 'Sign in to start planning'}
        description={invited ? 'No account needed. You can join as a guest.' : 'Use Google or email so you can come back to your trip later.'}
      />
      <CardBody className="grid gap-5">
        <Checkbox
          variant="tile"
          checked={consented}
          onChange={(e) => onConsent(e.target.checked)}
          label="I'm 18 or older and I agree to the terms"
          description={
            <>
              Read the{' '}
              <a href="/terms" target="_blank" rel="noopener" className={linkClass}>
                Terms of Use
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener" className={linkClass}>
                Privacy Policy
              </a>
              .
            </>
          }
        />
        <div>
          <Button block size="lg" disabled={!consented} icon={invited ? icons.invite : LogIn} onClick={invited ? signInAsGuest : signInWithGoogle}>
            {invited ? 'Continue as guest' : 'Continue with Google'}
          </Button>
          {!consented && <p className="type-small m-0 mt-2 text-center text-ink-muted">Tick the box above to continue.</p>}
        </div>
        {!invited && (
          <div>
            <Divider>or use email</Divider>
            <EmailSignIn disabled={!consented} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function OrganizerIdentityCard() {
  const { signInWithGoogle } = useAuth();
  return (
    <Card>
      <CardHeader icon={icons.organizer} title="Sign in to start your own trip" description="Guest accounts can join trips but can't create one." />
      <CardBody>
        <Button block size="lg" icon={LogIn} onClick={signInWithGoogle}>
          Continue with Google
        </Button>
        <Divider>or use email</Divider>
        <EmailSignIn />
      </CardBody>
    </Card>
  );
}

export interface RoomDraft {
  name: string;
  startDate: string;
  endDate: string;
  expectedSize: number;
  /** ISO-3166 alpha-2, e.g. IN or US. */
  homeCountry: string;
  /** ISO-4217. Follows the home country unless the organizer picks another. */
  currency: string;
  scope: TripScope;
}

export type RoomDraftErrors = Partial<Record<keyof RoomDraft, string>>;

const exactDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const addDays = (value: string, days: number) => {
  if (!exactDate(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function validateRoomDraft(draft: RoomDraft): RoomDraftErrors {
  const errors: RoomDraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Give this trip a name.';
  else if (name.length > 80) errors.name = 'Keep the trip name to 80 characters or fewer.';
  if (!exactDate(draft.startDate)) errors.startDate = 'Choose a valid first day.';
  if (!exactDate(draft.endDate)) errors.endDate = 'Choose a valid last day.';
  if (!errors.startDate && !errors.endDate) {
    const days = Math.round((Date.parse(`${draft.endDate}T00:00:00Z`) - Date.parse(`${draft.startDate}T00:00:00Z`)) / 86400000) + 1;
    if (days < 2) errors.endDate = 'Choose a last day after the first day.';
    else if (days > 31) errors.endDate = 'Trips can be at most 31 days.';
  }
  if (!Number.isInteger(draft.expectedSize) || draft.expectedSize < 2 || draft.expectedSize > 10) errors.expectedSize = 'Choose between 2 and 10 people.';
  if (!homeCountryOptions.some((country) => country.code === draft.homeCountry)) errors.homeCountry = 'Choose a supported home country.';
  if (!currencyOptions.some((currency) => currency.code === draft.currency)) errors.currency = 'Choose a supported travel currency.';
  const available = scopeAvailability(draft.homeCountry);
  if ((draft.scope === 'domestic' && !available.domestic) || (draft.scope === 'international' && !available.international)) errors.scope = 'That trip type is not available from this country yet.';
  return errors;
}

/** Where the group lives and what kind of trip it wants. Prices follow the country unless changed. */
function TripBasics({ draft, onChange, errors, structuralDisabled = false }: { draft: RoomDraft; onChange: (draft: RoomDraft) => void; errors: RoomDraftErrors; structuralDisabled?: boolean }) {
  const home = countryInSentence(draft.homeCountry);
  const available = scopeAvailability(draft.homeCountry);
  const setHome = (homeCountry: string) => {
    const following = draft.currency === currencyForCountry(draft.homeCountry);
    const next = scopeAvailability(homeCountry);
    const scope: TripScope = (draft.scope === 'domestic' && !next.domestic) || (draft.scope === 'international' && !next.international) ? 'any' : draft.scope;
    onChange({ ...draft, homeCountry, scope, currency: following ? currencyForCountry(homeCountry) || draft.currency : draft.currency });
  };
  const popular = homeCountryOptions.filter((c) => popularHomeCountries.includes(c.code)).sort((a, b) => popularHomeCountries.indexOf(a.code) - popularHomeCountries.indexOf(b.code));
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Field label="Where's the group based?" hint="Sets prices, cities and visa checks" error={errors.homeCountry}>
          <Select value={draft.homeCountry} disabled={structuralDisabled} onChange={(e) => setHome(e.target.value)}>
            <optgroup label="Popular">
              {popular.map((c) => (
                <option key={`p-${c.code}`} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="All countries">
              {homeCountryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Prices in" error={errors.currency} hint={`Defaults to ${currencyForCountry(draft.homeCountry) || draft.currency}`}>
          <Input value={draft.currency} readOnly />
        </Field>
      </div>
      {!structuralDisabled && (
        <details className="group rounded-xl bg-surface-muted px-4 py-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
            Change currency
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
          </summary>
          <div className="pb-1 pt-3">
            <Field label="Search by currency code or name" error={errors.currency}>
              <Input list="fermat-fiat-currencies" value={draft.currency} onChange={(e) => onChange({ ...draft, currency: e.target.value.toUpperCase() })} />
            </Field>
            <datalist id="fermat-fiat-currencies">
              {fiatCurrencyOptions.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
            </datalist>
          </div>
        </details>
      )}
      <RadioCards<TripScope>
        legend="What kind of trip?"
        name="trip-scope"
        columns={1}
        value={draft.scope}
        onChange={(scope) => !structuralDisabled && onChange({ ...draft, scope })}
        options={[
          {
            value: 'domestic',
            label: 'In your country',
            description: available.domestic ? `Only places in ${home}. No passports needed.` : `No trips in ${home} yet`,
            icon: icons.destination,
            disabled: structuralDisabled || !available.domestic,
          },
          { value: 'international', label: 'Abroad', description: 'We check passports and visas', icon: icons.passport, disabled: structuralDisabled || !available.international },
          { value: 'any', label: 'Open to both', description: 'See every option', icon: Globe, disabled: structuralDisabled },
        ]}
      />
      {errors.scope && <p className="type-small m-0 font-medium text-danger-ink" role="alert">{errors.scope}</p>}
    </>
  );
}

export function CreateRoomCard({ draft, onChange, onCreate, disabled, busy }: { draft: RoomDraft; onChange: (draft: RoomDraft) => void; onCreate: () => void; disabled: boolean; busy: boolean }) {
  const nights = nightsBetween(draft.startDate, draft.endDate);
  const errors = validateRoomDraft(draft);
  const invalid = Object.keys(errors).length > 0;
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => {
    if (invalid) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    onCreate();
  };
  return (
    <Card>
      <CardHeader icon={icons.plan} title="Start a trip" description="Pick rough dates. You can invite friends next." />
      <CardBody>
        <form ref={formRef} className="grid gap-5" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <Field label="Trip name" error={errors.name}>
          <Input maxLength={81} value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        </Field>
        <TripBasics draft={draft} onChange={onChange} errors={errors} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First day" error={errors.startDate}>
            <Input type="date" max={draft.endDate || undefined} value={draft.startDate} onChange={(e) => onChange({ ...draft, startDate: e.target.value })} />
          </Field>
          <Field label="Last day" error={errors.endDate}>
            <Input type="date" min={addDays(draft.startDate, 1)} max={addDays(draft.startDate, 30)} value={draft.endDate} onChange={(e) => onChange({ ...draft, endDate: e.target.value })} />
          </Field>
        </div>
        <Field label="How many people" hint="Including you" error={errors.expectedSize}>
          <Select value={draft.expectedSize} onChange={(e) => onChange({ ...draft, expectedSize: Number(e.target.value) })}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} people
              </option>
            ))}
          </Select>
        </Field>
        <DateFinder startDate={draft.startDate} endDate={draft.endDate} onPick={(startDate, endDate) => onChange({ ...draft, startDate, endDate })} homeCountry={draft.homeCountry} />
        <div className="flex flex-col gap-3 border-0 border-t border-solid border-line-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-small m-0 flex items-center gap-2 text-ink-muted">
            <icons.calendar className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            {formatDateRange(draft.startDate, draft.endDate)}
            {nights > 0 && ` · ${plural(nights, 'night')}`} · {plural(draft.expectedSize, 'person', 'people')}
          </p>
          <Button type="submit" size="lg" className="w-full sm:w-auto" loading={busy} disabled={disabled || invalid}>
            Create trip
          </Button>
        </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function EditTripSetupCard({ draft, onChange, onSave, onCancel, disabled, busy, structuralDisabled, reason }: { draft: RoomDraft; onChange: (draft: RoomDraft) => void; onSave: () => void; onCancel: () => void; disabled: boolean; busy: boolean; structuralDisabled: boolean; reason?: string | null }) {
  const errors = validateRoomDraft(draft);
  const invalid = Object.keys(errors).length > 0;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Card variant="flat">
      <CardHeader icon={icons.plan} title="Edit trip setup" description="Changes to dates, location, currency or scope ask everyone to confirm their private details again." />
      <CardBody>
        <form ref={formRef} className="grid gap-5" noValidate onSubmit={(event) => {
          event.preventDefault();
          if (invalid) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
          else onSave();
        }}>
          {reason && <Notice tone="warning">{reason}</Notice>}
          <Field label="Trip name" error={errors.name}>
            <Input maxLength={81} value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
          </Field>
          <TripBasics draft={draft} onChange={onChange} errors={errors} structuralDisabled={structuralDisabled} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First day" error={errors.startDate}>
              <Input type="date" disabled={structuralDisabled} max={draft.endDate || undefined} value={draft.startDate} onChange={(e) => onChange({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label="Last day" error={errors.endDate}>
              <Input type="date" disabled={structuralDisabled} min={addDays(draft.startDate, 1)} max={addDays(draft.startDate, 30)} value={draft.endDate} onChange={(e) => onChange({ ...draft, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="How many people" hint="Never below the people already approved" error={errors.expectedSize}>
            <Select disabled={structuralDisabled} value={draft.expectedSize} onChange={(e) => onChange({ ...draft, expectedSize: Number(e.target.value) })}>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} people</option>)}
            </Select>
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={disabled || invalid}>Save setup</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export interface TripListItem {
  id: string; name: string; startDate: string; endDate: string; expectedSize: number; joined: number;
  phase: 'collecting' | 'voting' | 'locked'; membershipStatus: 'approved' | 'pending'; role: 'owner' | 'member' | 'pending';
}

export function MyTripsCard({ trips, loading, onOpen, onRefresh }: { trips: TripListItem[]; loading: boolean; onOpen: (id: string) => void; onRefresh: () => void }) {
  return (
    <Card>
      <CardHeader icon={icons.destination} title="Your trips" description={trips.length ? `${plural(trips.length, 'trip')} you can return to` : 'Trips you create or join will appear here'} action={<Button size="icon-sm" variant="ghost" aria-label="Refresh trips" title="Refresh trips" icon={RefreshCw} loading={loading} onClick={onRefresh} />} />
      <CardBody>
        {loading && !trips.length ? <p className="type-small m-0 text-ink-muted" role="status">Loading your trips…</p> : trips.length ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button type="button" className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-surface-muted px-4 py-3 text-left font-sans text-ink hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={() => onOpen(trip.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="type-body block truncate font-semibold">{trip.name}</span>
                    <span className="type-small block text-ink-muted">{formatDateRange(trip.startDate, trip.endDate)} · {trip.joined} of {trip.expectedSize} joined · {trip.membershipStatus === 'pending' ? 'Waiting for approval' : trip.phase === 'locked' ? 'Plan ready' : trip.phase === 'voting' ? 'Voting' : trip.role === 'owner' ? 'You organize' : 'Planning'}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-brand-700" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="type-small m-0 text-ink-muted">No trips yet. Start one below.</p>}
      </CardBody>
    </Card>
  );
}

export function JoinRoomCard({ nickname, onNickname, onJoin, disabled, busy }: { nickname: string; onNickname: (value: string) => void; onJoin: () => void; disabled: boolean; busy: boolean }) {
  return (
    <Card>
      <CardHeader icon={icons.invite} title="Join this trip" description="The organizer lets each person in, so they know who's coming." />
      <CardBody>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled && nickname) onJoin();
          }}
        >
          <Field label="Your name in the group" hint="What your friends call you">
            <Input value={nickname} autoComplete="nickname" placeholder="e.g. Asha" onChange={(e) => onNickname(e.target.value)} />
          </Field>
          <Button type="submit" block size="lg" loading={busy} disabled={disabled || !nickname}>
            Ask to join
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
