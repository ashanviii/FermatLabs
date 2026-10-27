'use client';
// Screens before you're inside a trip: sign in, switch to a recoverable account, create a trip, join by invite.
import { useState } from 'react';
import { Globe, LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, RadioCards, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { icons } from '@/components/ui/icons';
import { formatDateRange, nightsBetween, plural } from '@/lib/format';
import { DateFinder } from '../FermatExtras';
import { countryInSentence, currencyForCountry, currencyOptions, homeCountryOptions, popularHomeCountries, scopeAvailability, type TripScope } from './tripState';

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

/** Where the group lives and what kind of trip it wants. Prices follow the country unless changed. */
function TripBasics({ draft, onChange }: { draft: RoomDraft; onChange: (draft: RoomDraft) => void }) {
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
        <Field label="Where's the group based?" hint="Sets prices, cities and visa checks">
          <Select value={draft.homeCountry} onChange={(e) => setHome(e.target.value)}>
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
        <Field label="Prices in">
          <Select value={draft.currency} onChange={(e) => onChange({ ...draft, currency: e.target.value })}>
            {currencyOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <RadioCards<TripScope>
        legend="What kind of trip?"
        name="trip-scope"
        columns={1}
        value={draft.scope}
        onChange={(scope) => onChange({ ...draft, scope })}
        options={[
          {
            value: 'domestic',
            label: 'In your country',
            description: available.domestic ? `Only places in ${home}. No passports needed.` : `No trips in ${home} yet`,
            icon: icons.destination,
            disabled: !available.domestic,
          },
          { value: 'international', label: 'Abroad', description: 'We check passports and visas', icon: icons.passport, disabled: !available.international },
          { value: 'any', label: 'Open to both', description: 'See every option', icon: Globe },
        ]}
      />
    </>
  );
}

export function CreateRoomCard({ draft, onChange, onCreate, disabled, busy }: { draft: RoomDraft; onChange: (draft: RoomDraft) => void; onCreate: () => void; disabled: boolean; busy: boolean }) {
  const nights = nightsBetween(draft.startDate, draft.endDate);
  return (
    <Card>
      <CardHeader icon={icons.plan} title="Start a trip" description="Pick rough dates. You can invite friends next." />
      <CardBody className="grid gap-5">
        <Field label="Trip name">
          <Input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        </Field>
        <TripBasics draft={draft} onChange={onChange} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First day">
            <Input type="date" value={draft.startDate} onChange={(e) => onChange({ ...draft, startDate: e.target.value })} />
          </Field>
          <Field label="Last day">
            <Input type="date" value={draft.endDate} onChange={(e) => onChange({ ...draft, endDate: e.target.value })} />
          </Field>
        </div>
        <Field label="How many people" hint="Including you">
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
          <Button size="lg" className="w-full sm:w-auto" loading={busy} disabled={disabled} onClick={onCreate}>
            Create trip
          </Button>
        </div>
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
