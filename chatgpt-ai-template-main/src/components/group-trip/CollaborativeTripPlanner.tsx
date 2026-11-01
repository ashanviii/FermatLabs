'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pencil, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { AsciiArt, asciiArt } from '@/components/ui/ascii';
import { AsciiSpinner } from '@/components/ui/ascii-motion';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { PageContainer, Section } from '@/components/ui/section';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { icons, type IconComponent } from '@/components/ui/icons';
import { sharedFirebaseConfigured } from '@/lib/firebase';
import { CONSENT_KEY, LEGAL } from '@/lib/legal';
import { plural } from '@/lib/format';
import previewFixtures from './preview/fixtures.json';
import PlanView from './PlanView';
import Pledges from './features/Pledges';
import SettleUp from './features/SettleUp';
import ShareCards from './features/ShareCards';
import SilentPrefs from './features/SilentPrefs';
import Tasks from './features/Tasks';
import { DestinationPicker, PlanMoney, UpiPanel } from './FermatExtras';
import {
  CreateRoomCard,
  EditTripSetupCard,
  JoinRoomCard,
  MyTripsCard,
  OrganizerIdentityCard,
  SignInCard,
  type RoomDraft,
  type TripListItem,
} from './shell/EntryCards';
import { InvitePanel, PendingApproval } from './shell/InvitePanel';
import {
  PlannerFooter,
  TopBar,
  TripHeader,
  TripJourneyNav,
  TripSummary,
  stepEyebrow,
} from './shell/PlannerChrome';
import {
  PrivateDetailsForm,
  PrivateDetailsSummary,
  type PrivateInput,
} from './shell/PrivateDetailsForm';
import {
  DEFAULT_HOME_COUNTRY,
  approvedCount,
  currencyForCountry,
  currentStep,
  defaultBudget,
  defaultDepartureCity,
  detectHomeCountry,
  inviteMessage,
  inviteUrl,
  openWhatsApp,
  planSummary,
  type StepId,
} from './shell/tripState';

/** Starting values for the private form, from the trip's settings. India trips start exactly as before (Delhi, ₹1,50,000). */
function startingInput(trip: any): PrivateInput {
  const home = trip?.homeCountry || DEFAULT_HOME_COUNTRY;
  return {
    departureCity: defaultDepartureCity(home),
    budget: defaultBudget(trip?.currency || 'INR'),
    passportExpiry: trip?.scope === 'domestic' ? 'none' : '',
    visas: [],
    datesConfirmed: false,
    preferences: [],
    entryCheckAcknowledged: false,
    isAdult: false,
    passportCountry: home,
  };
}

/** Saved details into form values. Old saves only have hasIndianPassport, which means an Indian passport. */
const fromSaved = (saved: any, trip: any): PrivateInput => ({
  ...saved,
  passportCountry:
    saved.passportCountry ||
    (saved.hasIndianPassport
      ? 'IN'
      : trip?.homeCountry || DEFAULT_HOME_COUNTRY),
});

/** What the engine stores: passportCountry always; hasIndianPassport only for Indian passports, for older readers. */
function constraintsPayload(input: PrivateInput) {
  const { hasIndianPassport: _legacy, ...rest } = input;
  return input.passportCountry === 'IN'
    ? { ...rest, hasIndianPassport: true }
    : rest;
}

const scrollToStep = (id: StepId) =>
  document
    .getElementById(`step-${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Point({
  icon: Icon,
  title,
  inverse = false,
  children,
}: {
  icon: IconComponent;
  title: string;
  inverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-solid border-white/10 bg-white/[0.06] p-3.5">
      <span
        className={
          inverse
            ? 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-100'
            : 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700'
        }
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 pt-0.5">
        <span
          className={
            inverse
              ? 'type-body block font-semibold text-white'
              : 'type-body block font-semibold text-ink'
          }
        >
          {title}
        </span>
        <span
          className={
            inverse
              ? 'type-small block text-white/65'
              : 'type-small block text-ink-muted'
          }
        >
          {children}
        </span>
      </span>
    </li>
  );
}

function CoordinationDisclosure({
  icon: Icon,
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl bg-surface shadow-card"
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open !== open)
          onOpenChange(event.currentTarget.open);
      }}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="type-h3 block">{title}</span>
          <span className="type-small block text-ink-muted">{description}</span>
        </span>
        <span className="text-brand-700 group-open:hidden">Open</span>
        <span className="text-brand-700 hidden group-open:inline">Close</span>
      </summary>
      <div className="grid gap-5 border-0 border-t border-solid border-line-subtle p-5 sm:p-6">
        {children}
      </div>
    </details>
  );
}

function StepSummaryRow({
  number,
  title,
  status,
  actionLabel,
  onAction,
}: {
  number: number;
  title: string;
  status: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card sm:px-5">
      <span
        className="type-caption flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700"
        aria-hidden
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-body block font-semibold text-ink">{title}</span>
        <span className="type-small block truncate text-ink-muted">
          {status}
        </span>
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={onAction}
        aria-label={`${actionLabel}: ${title}`}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function EntryHero() {
  return (
    <div className="relative isolate grid overflow-hidden rounded-2xl border border-solid border-brand-800 bg-brand-950 p-6 text-white shadow-raised sm:p-8 lg:sticky lg:top-24 lg:p-10">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-10" />
      <div
        aria-hidden
        className="absolute -right-20 -top-20 -z-10 size-72 rounded-full bg-brand-500/30 blur-3xl"
      />
      <div className="grid content-start gap-8">
        <div className="grid gap-4">
          <p className="type-overline m-0 text-brand-200">
            Your trip workspace
          </p>
          <h1 className="type-display m-0 max-w-[13ch] text-balance !text-white">
            Find a trip your whole group can actually take
          </h1>
          <p className="type-lead m-0 max-w-prose text-white/70">
            One organized workspace for private budgets, group decisions and the
            final day-by-day plan.
          </p>
        </div>
        <ul className="m-0 grid list-none gap-3 p-0">
          <Point inverse icon={icons.private} title="Budgets stay private">
            The group sees the blocker, never whose budget it is.
          </Point>
          <Point inverse icon={icons.vote} title="Decisions stay clear">
            Everyone votes privately. The winning logic stays visible.
          </Point>
          <Point inverse icon={icons.plan} title="The plan stays actionable">
            Days, personal costs, tasks and settle-up in one place.
          </Point>
        </ul>
      </div>
    </div>
  );
}

export default function CollaborativeTripPlanner() {
  const auth = useAuth();
  // UI preview mode (/plan?preview=signin|create|collecting|ready|voting|voted|locked|lockedMember): engine-generated sample trips, no network.
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    setPreview(new URLSearchParams(location.search).get('preview'));
  }, []);
  const previewUid =
    (preview && (previewFixtures as any).memberUids?.[preview]) ||
    (preview === 'lockedMember' ? previewFixtures.memberUid : 'owner');
  const previewUser: any =
    preview && preview !== 'signin'
      ? { uid: previewUid, isAnonymous: false, getIdToken: async () => '' }
      : null;
  const user: any = preview ? previewUser : auth.user;
  const loading = preview ? false : auth.loading;
  const [consented, setConsented] = useState(false);
  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === LEGAL.version);
  }, []);
  const updateConsent = (value: boolean) => {
    setConsented(value);
    if (value) localStorage.setItem(CONSENT_KEY, LEGAL.version);
    else localStorage.removeItem(CONSENT_KEY);
  };
  const [trip, setTrip] = useState<any>();
  const [invite, setInvite] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingCommand, setPendingCommand] = useState('');
  const [nickname, setNickname] = useState('');
  const [online, setOnline] = useState(true);
  const [inviteReady, setInviteReady] = useState(false);
  const [privateInputDirty, setPrivateInputDirty] = useState(false);
  const [privateDraftRevision, setPrivateDraftRevision] = useState<
    number | null
  >(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingSetup, setEditingSetup] = useState(false);
  const [setupDraft, setSetupDraft] = useState<RoomDraft | null>(null);
  const [setupDraftRevision, setSetupDraftRevision] = useState<number | null>(
    null,
  );
  const [trips, setTrips] = useState<TripListItem[]>([]);
  // Start as loading so the first paint never shows a plausible-but-wrong empty list.
  const [tripsLoading, setTripsLoading] = useState(true);
  const [entryTab, setEntryTab] = useState<'trips' | 'new'>('trips');
  useEffect(() => {
    if (!tripsLoading) setEntryTab(trips.length ? 'trips' : 'new');
  }, [trips, tripsLoading]);
  const [draftReady, setDraftReady] = useState(false);
  // Every fetch/command takes a sequence number; a refresh that started before the latest saved command finished is stale.
  const fetchSeq = useRef(0);
  const savedAtSeq = useRef(0);
  const [planStepOverride, setPlanStepOverride] = useState<
    'plan' | 'go' | null
  >(null);
  // Pre-lock steps you've chosen to look at (step bar, Back, Edit). Cleared whenever the trip itself moves on.
  const [collectStep, setCollectStep] = useState<StepId | null>(null);
  const [openGo, setOpenGo] = useState<string | null>(null);
  // Polite screen-reader announcements for async results (replaces stale route-announcer text after renames).
  const [announcement, setAnnouncement] = useState('');
  const [createKey] = useState(
    () => `create-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
  );
  const [draft, setDraft] = useState<RoomDraft>({
    name: 'Friends escape',
    startDate: '2026-12-10',
    endDate: '2026-12-15',
    expectedSize: 2,
    homeCountry: DEFAULT_HOME_COUNTRY,
    currency: 'INR',
    scope: 'any',
  });
  // Guess where the group is based from the browser language (en-US -> US). Runs once, before anyone edits the form.
  useEffect(() => {
    const detected = detectHomeCountry();
    if (detected && detected !== DEFAULT_HOME_COUNTRY)
      setDraft((current) => ({
        ...current,
        homeCountry: detected,
        currency: currencyForCountry(detected) || current.currency,
      }));
    setDraftReady(true);
  }, []);
  const [privateInput, setPrivateInput] = useState<PrivateInput>(() =>
    startingInput(null),
  );
  const updatePrivateInput = (patch: Partial<PrivateInput>) => {
    if (!privateInputDirty)
      setPrivateDraftRevision(trip?.inputRevision ?? null);
    setPrivateInputDirty(true);
    setPrivateInput((current) => ({ ...current, ...patch }));
  };
  const togglePrivateList = (key: 'visas' | 'preferences', value: string) => {
    if (!privateInputDirty)
      setPrivateDraftRevision(trip?.inputRevision ?? null);
    setPrivateInputDirty(true);
    setPrivateInput((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };
  useEffect(() => {
    const found = location.hash.match(/invite=([^&]+)/)?.[1];
    if (found) {
      setTrip(undefined);
      setToken(decodeURIComponent(found));
      history.replaceState(null, '', location.pathname + location.search);
    }
    setInviteReady(true);
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    addEventListener('online', update);
    addEventListener('offline', update);
    return () => {
      removeEventListener('online', update);
      removeEventListener('offline', update);
    };
  }, []);
  async function readTrip(tripId: string, quiet = false) {
    if (!user || preview) return;
    try {
      const auth = await user.getIdToken();
      const startedAt = ++fetchSeq.current;
      const response = await fetch(
        `/api/group-trips?tripId=${encodeURIComponent(tripId)}`,
        { headers: { authorization: `Bearer ${auth}` } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (startedAt < savedAtSeq.current) return; // a save landed while this refresh was in flight; its data is older
      setTrip(data.trip);
    } catch (cause: any) {
      if (!quiet) setError(cause.message || 'Could not refresh the trip');
    }
  }
  async function loadTrips() {
    if (!user || preview || user.isAnonymous || token) {
      setTripsLoading(false);
      return;
    }
    setTripsLoading(true);
    try {
      const auth = await user.getIdToken();
      const response = await fetch('/api/group-trips', {
        headers: { authorization: `Bearer ${auth}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTrips(data.trips || []);
      setAnnouncement(
        data.trips?.length
          ? `${plural(data.trips.length, 'trip')} loaded`
          : 'No trips yet',
      );
    } catch (cause: any) {
      setError(cause.message || 'Could not load your trips');
    } finally {
      setTripsLoading(false);
    }
  }
  const openTrip = (tripId: string) => {
    setError('');
    const url = new URL(location.href);
    url.searchParams.set('trip', tripId);
    url.searchParams.delete('preview');
    history.pushState(
      null,
      '',
      `${url.pathname}?${url.searchParams.toString()}`,
    );
    readTrip(tripId);
  };
  const goHome = () => {
    setTrip(undefined);
    setInvite('');
    setEditingDetails(false);
    setEditingSetup(false);
    setPrivateInputDirty(false);
    const url = new URL(location.href);
    url.searchParams.delete('trip');
    url.searchParams.delete('preview');
    const query = url.searchParams.toString();
    history.pushState(null, '', `${url.pathname}${query ? `?${query}` : ''}`);
    loadTrips();
  };
  useEffect(() => {
    if (!user || !inviteReady || token) return;
    const selected = new URLSearchParams(location.search).get('trip');
    if (selected) readTrip(selected);
    else loadTrips();
  }, [user, inviteReady, token]);
  useEffect(() => {
    if (!user || !inviteReady || token) return;
    const onPopState = () => {
      const selected = new URLSearchParams(location.search).get('trip');
      if (selected) readTrip(selected);
      else {
        setTrip(undefined);
        loadTrips();
      }
    };
    addEventListener('popstate', onPopState);
    return () => removeEventListener('popstate', onPopState);
  }, [user, inviteReady, token]);
  useEffect(() => {
    if (!user || !trip?.id) return;
    localStorage.setItem(`fermat.shared-trip.${user.uid}`, trip.id);
    const timer = setInterval(() => readTrip(trip.id, true), 3000);
    return () => clearInterval(timer);
  }, [user, trip?.id]);
  // Copy saved details into the form only when the saved value actually changes, never on every 3s poll,
  // so a half-picked passport month/year (or any edit) is never overwritten while you're filling it in.
  const syncedConstraints = useRef('');
  useEffect(() => {
    const saved = trip?.myConstraints;
    if (!saved || privateInputDirty) return;
    const key = JSON.stringify(saved);
    if (key === syncedConstraints.current) return;
    syncedConstraints.current = key;
    setPrivateInput(fromSaved(saved, trip));
    setPrivateDraftRevision(trip.inputRevision);
  }, [trip?.myConstraints, privateInputDirty]);
  // No saved details yet: start the form from this trip's country, currency and scope.
  const startedFor = useRef('');
  useEffect(() => {
    if (!trip?.id || trip.myConstraints || privateInputDirty) return;
    const key = `${trip.id}|${trip.homeCountry}|${trip.currency}|${trip.scope}`;
    if (key === startedFor.current) return;
    startedFor.current = key;
    setPrivateInput(startingInput(trip));
    setPrivateDraftRevision(trip.inputRevision);
  }, [
    trip?.id,
    trip?.homeCountry,
    trip?.currency,
    trip?.scope,
    trip?.myConstraints,
    privateInputDirty,
  ]);
  // Private details can only be edited while the group is still collecting inputs.
  useEffect(() => {
    if (trip?.phase !== 'collecting') {
      if (trip?.myConstraints)
        setPrivateInput(fromSaved(trip.myConstraints, trip));
      setEditingDetails(false);
      setPrivateInputDirty(false);
      setPrivateDraftRevision(trip?.inputRevision ?? null);
    }
  }, [trip?.phase]);
  async function request(body: any) {
    if (preview) return true;
    if (!user) return false;
    setBusy(true);
    setPendingCommand(body.command?.type || body.action || '');
    setError('');
    try {
      if (!navigator.onLine)
        throw new Error('You are offline. Your unsent form is still here.');
      const auth = await user.getIdToken();
      const response = await fetch('/api/group-trips', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      savedAtSeq.current = ++fetchSeq.current;
      setTrip(data.trip);
      if (data.trip?.id && ['create', 'join'].includes(body.action)) {
        const url = new URL(location.href);
        url.searchParams.set('trip', data.trip.id);
        history.replaceState(
          null,
          '',
          `${url.pathname}?${url.searchParams.toString()}`,
        );
      }
      if (data.invite) setInvite(data.invite);
      if (body.command?.type === 'revokeInvite') setInvite('');
      return true;
    } catch (cause: any) {
      setError(cause.message || 'Command failed');
      return false;
    } finally {
      setBusy(false);
      setPendingCommand('');
    }
  }
  const command = (command: any) =>
    request({ action: 'command', tripId: trip.id, command });
  const me = user && trip?.members?.[user.uid];
  const owner = me?.role === 'owner';
  const disabled = busy || !online;
  const featureProps = { trip, uid: user?.uid || '', owner, disabled, command };
  useEffect(() => {
    const sample = preview && (previewFixtures as any)[preview];
    if (sample && typeof sample === 'object') setTrip(sample);
  }, [preview]);
  useEffect(
    () => setPlanStepOverride(null),
    [trip?.id, trip?.activePlan?.version],
  );

  // Commands (payloads unchanged).
  const saveDetails = async () => {
    if (privateDraftRevision !== trip.inputRevision) {
      setError(
        'The trip changed while you were editing. Review the updated dates and prices, then save again.',
      );
      return;
    }
    if (
      await command({
        type: 'submitConstraints',
        expectedInputRevision: privateDraftRevision,
        constraints: constraintsPayload(privateInput),
      })
    ) {
      setPrivateInputDirty(false);
      setEditingDetails(false);
      setCollectStep(null);
    }
  };
  const editDetails = () => {
    if (trip?.phase !== 'collecting') return;
    setEditingDetails(true);
    requestAnimationFrame(() => scrollToStep('details'));
  };
  const cancelDetailsEdit = () => {
    if (trip?.myConstraints)
      setPrivateInput(fromSaved(trip.myConstraints, trip));
    setPrivateInputDirty(false);
    setEditingDetails(false);
    setCollectStep(null);
    setPrivateDraftRevision(trip?.inputRevision ?? null);
  };
  const reloadPrivateDraft = () => {
    setPrivateInput(
      trip?.myConstraints
        ? fromSaved(trip.myConstraints, trip)
        : startingInput(trip),
    );
    setPrivateDraftRevision(trip?.inputRevision ?? null);
    setPrivateInputDirty(false);
    setError('');
  };
  const editSetup = () => {
    if (!owner || trip?.phase !== 'collecting') return;
    setSetupDraft({
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      expectedSize: trip.expectedSize,
      homeCountry: trip.homeCountry,
      currency: trip.currency,
      scope: trip.scope,
    });
    setSetupDraftRevision(trip.inputRevision);
    setEditingSetup(true);
  };
  const saveSetup = async () => {
    if (!setupDraft || setupDraftRevision === null) return;
    if (setupDraftRevision !== trip.inputRevision) {
      setError(
        'The trip changed while you were editing its setup. Reopen the editor and try again.',
      );
      return;
    }
    const semanticChange = [
      'startDate',
      'endDate',
      'homeCountry',
      'currency',
      'scope',
    ].some((key) => setupDraft[key as keyof RoomDraft] !== trip[key]);
    if (
      await command({
        type: 'updateTripSetup',
        expectedInputRevision: setupDraftRevision,
        patch: setupDraft,
      })
    ) {
      setAnnouncement(
        `Trip setup saved. The trip is called ${setupDraft.name}.`,
      );
      setEditingSetup(false);
      setSetupDraft(null);
      setPrivateInputDirty(false);
      setEditingDetails(false);
      if (semanticChange) setPrivateInput(startingInput(setupDraft));
      setPrivateDraftRevision(setupDraftRevision + 1);
    }
  };
  const openVoting = () =>
    command({ type: 'openVoting', expectedInputRevision: trip.inputRevision });
  const vote = (id: string) =>
    command({
      type: 'vote',
      destinationId: id,
      round: trip.round,
      inputRevision: trip.inputRevision,
    });
  const lock = () =>
    command({
      type: 'lock',
      round: trip.round,
      inputRevision: trip.inputRevision,
      idempotencyKey: `lock-${trip.round}`,
    });
  const sharePlan = () => openWhatsApp(planSummary(trip));
  const join = () => {
    const [tripId, ...secret] = token.split('.');
    request({
      action: 'join',
      tripId,
      inviteSecret: secret.join('.'),
      nickname,
    });
  };

  const autoStep = currentStep(trip, Boolean(me));
  useEffect(() => {
    document.title = trip?.name
      ? `${trip.name} · Fermat`
      : 'Fermat · Plan a group trip';
  }, [trip?.name]);
  useEffect(() => {
    setCollectStep(null);
  }, [autoStep, trip?.id]);

  if (loading)
    return (
      <main className="relative isolate flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas font-sans">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <AsciiArt
          art={asciiArt.suitcase}
          className="text-[0.8125rem] text-brand-600"
        />
        <p
          className="type-overline m-0 flex items-center gap-3 text-ink-muted"
          role="status"
        >
          <AsciiSpinner className="text-brand-600" />
          Opening your trip
        </p>
      </main>
    );

  const stateStep = autoStep;
  const preLock =
    !trip?.activePlan &&
    (trip?.phase === 'collecting' || trip?.phase === 'voting');
  const defaultPreLockStep: StepId =
    stateStep === 'invite' && me && me.role !== 'owner' && !trip?.myConstraints
      ? 'details'
      : stateStep;
  const step: StepId =
    trip?.activePlan && planStepOverride
      ? planStepOverride
      : preLock && trip?.phase === 'collecting' && editingDetails
      ? 'details'
      : preLock && collectStep
      ? collectStep
      : preLock
      ? defaultPreLockStep
      : stateStep;
  const navigateStep = (id: StepId) => {
    if (trip?.activePlan && (id === 'plan' || id === 'go')) {
      if (id === 'go' && stateStep !== 'go') return;
      setPlanStepOverride(id);
      requestAnimationFrame(() => scrollToStep(id));
      return;
    }
    if (preLock && (id === 'invite' || id === 'details' || id === 'choose')) {
      if (id !== 'details') setEditingDetails(false);
      setCollectStep(id);
      requestAnimationFrame(() => scrollToStep(id));
      return;
    }
    scrollToStep(id);
  };
  const joined = trip ? approvedCount(trip) : 0;
  const requests: any[] = trip?.pendingRequests || [];
  const showInvite =
    Boolean(me) &&
    trip?.phase === 'collecting' &&
    (joined < trip.expectedSize || (owner && requests.length > 0));
  const showInviteSection =
    Boolean(me) && trip?.phase === 'collecting' && (owner || showInvite);
  const everyoneIn =
    trip &&
    joined >= trip.expectedSize &&
    (trip.submissionProgress ?? 0) >= trip.expectedSize;
  const hasBoard =
    (trip?.destinationBoard?.length ?? 0) > 0 ||
    (trip?.myPrivateStatus?.length ?? 0) > 0;

  const headerAction =
    me && trip?.activePlan ? (
      <Button
        size="sm"
        variant="outline"
        icon={icons.share}
        onClick={sharePlan}
      >
        Share plan
      </Button>
    ) : me && invite && trip?.phase === 'collecting' ? (
      <Button
        size="sm"
        variant="whatsapp"
        icon={icons.whatsapp}
        onClick={() =>
          openWhatsApp(inviteMessage(trip.name, inviteUrl(invite)))
        }
      >
        Invite
      </Button>
    ) : null;

  /* ---------------------------------------------------------------- sections */

  const inviteSection = showInviteSection && (
    <Section
      key="invite"
      id="step-invite"
      className="scroll-mt-6"
      eyebrow={stepEyebrow('invite')}
      title="Invite your friends"
      description="Fermat works best when the whole group is in."
    >
      <InvitePanel
        trip={trip}
        owner={owner}
        invite={invite}
        disabled={disabled}
        command={command}
      />
    </Section>
  );

  const detailsForm = (
    <div className="grid gap-4">
      {privateInputDirty && privateDraftRevision !== trip.inputRevision && (
        <Notice
          tone="warning"
          title="Trip setup changed"
          action={
            <Button size="sm" variant="outline" onClick={reloadPrivateDraft}>
              Review updated details
            </Button>
          }
        >
          Reload the current dates and prices before saving. Your old answers
          will not be submitted silently.
        </Notice>
      )}
      <PrivateDetailsForm
        trip={trip}
        value={privateInput}
        dirty={privateInputDirty}
        disabled={
          disabled ||
          (privateInputDirty && privateDraftRevision !== trip.inputRevision)
        }
        busy={pendingCommand === 'submitConstraints'}
        onChange={updatePrivateInput}
        onToggle={togglePrivateList}
        onSave={saveDetails}
      />
    </div>
  );

  const showDetailsForm =
    trip?.phase === 'collecting' &&
    (!trip.myConstraints ||
      step === 'details' ||
      step === 'invite' ||
      editingDetails);

  // Before the vote: full form when it's your step or you explicitly reopen it; otherwise show a private summary.
  const detailsSection = me &&
    (trip.phase === 'collecting' || trip.phase === 'voting') && (
      <Section
        key="details"
        id="step-details"
        className="scroll-mt-6"
        eyebrow={stepEyebrow('details')}
        title={
          step === 'details' || step === 'invite'
            ? 'What works for you'
            : 'Your details'
        }
        description={
          trip.phase === 'voting'
            ? 'Locked while voting is open.'
            : 'Takes about a minute. You can change it until voting opens.'
        }
        action={
          trip.phase === 'collecting' ? (
            <>
              {owner && showInviteSection && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={() => navigateStep('invite')}
                >
                  Back to invite
                </Button>
              )}
              {trip.myConstraints &&
                (showDetailsForm ? (
                  editingDetails && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelDetailsEdit}
                    >
                      Cancel
                    </Button>
                  )
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Pencil}
                    onClick={editDetails}
                  >
                    Edit details
                  </Button>
                ))}
            </>
          ) : undefined
        }
      >
        {showDetailsForm ? (
          detailsForm
        ) : (
          <div className="grid gap-4">
            <PrivateDetailsSummary trip={trip} value={privateInput} />
          </div>
        )}
        <SilentPrefs {...featureProps} />
      </Section>
    );

  const voting = trip?.phase === 'voting';
  const votesIn = trip?.ballotProgress ?? 0;
  const allVoted = trip && votesIn >= trip.expectedSize;
  const chooseBar = me && (trip.phase === 'collecting' || voting) && (
    <Card>
      <CardBody className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
        {voting ? (
          <div className="grid min-w-0 flex-1 gap-2">
            <p className="type-h3 m-0">
              {votesIn} of {trip.expectedSize} voted
            </p>
            <p className="type-small m-0 text-ink-muted">
              {owner
                ? allVoted
                  ? 'Everyone has voted. Lock it in when you are ready.'
                  : 'You can lock now or wait for the rest.'
                : 'The organizer locks the vote once everyone is in.'}
            </p>
            <Progress
              label="Votes in"
              value={votesIn}
              max={trip.expectedSize}
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="type-h3 m-0">
              {everyoneIn
                ? "Everyone's details are in"
                : `Details in: ${trip.submissionProgress ?? 0} of ${
                    trip.expectedSize
                  }`}
            </p>
            <p className="type-small m-0 mt-0.5 text-ink-muted">
              {owner
                ? everyoneIn
                  ? 'Open voting when you are ready. Votes stay secret.'
                  : 'Voting can open once everyone has joined and added details.'
                : everyoneIn
                ? 'Waiting for the organizer to open voting.'
                : 'Voting opens once everyone has added details.'}
            </p>
          </div>
        )}
        {owner && !voting && (
          <Button
            size="lg"
            variant={everyoneIn ? 'primary' : 'outline'}
            icon={icons.vote}
            className="w-full sm:w-auto"
            loading={pendingCommand === 'openVoting'}
            disabled={disabled}
            onClick={openVoting}
          >
            Open voting
          </Button>
        )}
        {owner && voting && (
          <Button
            size="lg"
            variant={allVoted ? 'primary' : 'outline'}
            icon={icons.private}
            className="w-full sm:w-auto"
            loading={pendingCommand === 'lock'}
            disabled={disabled}
            onClick={lock}
          >
            Lock and make the plan
          </Button>
        )}
      </CardBody>
    </Card>
  );

  const chooseSection = me && (trip.phase === 'collecting' || voting) && (
    <Section
      key="choose"
      id="step-choose"
      className="scroll-mt-6"
      eyebrow={stepEyebrow('choose')}
      title={voting ? 'Vote for where to go' : 'Where you could go'}
      description={
        voting
          ? "Your vote is secret. A place someone can't afford or enter can't win."
          : 'Everyone sees the same list. Only you see your own fit.'
      }
      action={
        trip.phase === 'collecting' && trip.myConstraints ? (
          <Button
            size="sm"
            variant="outline"
            icon={ArrowLeft}
            onClick={editDetails}
          >
            Back to your details
          </Button>
        ) : undefined
      }
    >
      {chooseBar}
      {hasBoard ? (
        <DestinationPicker trip={trip} disabled={disabled} onVote={vote} />
      ) : (
        <EmptyState
          icon={icons.destination}
          art={asciiArt.pin}
          title="Places show up here soon"
          description="Once everyone has added their details, you'll see where the whole group can go."
        />
      )}
    </Section>
  );

  const planSection = me && trip.activePlan && (
    <Section
      key="plan"
      id="step-plan"
      className="scroll-mt-6"
      eyebrow={stepEyebrow('plan')}
      title="Your plan"
      description="Check the days, then approve it or ask for changes."
      action={
        stateStep === 'go' ? (
          <Button
            size="sm"
            variant="outline"
            iconRight={ArrowRight}
            onClick={() => {
              setPlanStepOverride('go');
              requestAnimationFrame(() => scrollToStep('go'));
            }}
          >
            Continue to Go
          </Button>
        ) : undefined
      }
    >
      <PlanView
        trip={trip}
        uid={user!.uid}
        owner={owner}
        disabled={disabled}
        command={command}
        onShare={sharePlan}
      />
      <PlanMoney trip={trip} uid={user!.uid} />
    </Section>
  );

  const expenses = trip?.features?.settleUp?.expenses?.length ?? 0;
  const pledges = trip?.features?.pledges;
  const tasksList: any[] = trip?.features?.tasks?.tasks || [];
  const goStatus = {
    money: [
      trip?.payee
        ? `${trip.paymentProgress ?? 0} of ${
            trip.activePlan?.memberTotals?.length || trip?.expectedSize
          } paid the advance`
        : 'No advance set yet',
      expenses ? plural(expenses, 'shared expense') : 'No shared expenses yet',
    ].join(' · '),
    commitments: pledges?.pledgedCount
      ? `${pledges.firmlyInCount ?? 0} firmly in · ${
          pledges.pledgedCount
        } pledged`
      : 'Nobody has pledged yet',
    tasks: tasksList.length
      ? `${tasksList.filter((task) => task.done).length} of ${
          tasksList.length
        } done`
      : 'No tasks yet',
  };

  const goSection = me && trip.activePlan && (
    <Section
      key="go"
      id="step-go"
      className="scroll-mt-6"
      eyebrow={stepEyebrow('go')}
      title="Get going"
      description="Collect the advance, split costs and share the trip."
      action={
        <Button
          size="sm"
          variant="outline"
          icon={ArrowLeft}
          onClick={() => {
            setPlanStepOverride('plan');
            requestAnimationFrame(() => scrollToStep('plan'));
          }}
        >
          Back to plan
        </Button>
      }
    >
      <div className="grid gap-4">
        <CoordinationDisclosure
          icon={icons.money}
          title="Money"
          description={goStatus.money}
          open={openGo === 'money'}
          onOpenChange={(open) => setOpenGo(open ? 'money' : null)}
        >
          <UpiPanel
            trip={trip}
            uid={user!.uid}
            owner={owner}
            disabled={disabled}
            command={command}
          />
          <SettleUp {...featureProps} />
        </CoordinationDisclosure>
        <CoordinationDisclosure
          icon={icons.members}
          title="Commitments"
          description={goStatus.commitments}
          open={openGo === 'commitments'}
          onOpenChange={(open) => setOpenGo(open ? 'commitments' : null)}
        >
          <Pledges {...featureProps} />
        </CoordinationDisclosure>
        <CoordinationDisclosure
          icon={icons.check}
          title="Tasks"
          description={goStatus.tasks}
          open={openGo === 'tasks'}
          onOpenChange={(open) => setOpenGo(open ? 'tasks' : null)}
        >
          <Tasks {...featureProps} />
        </CoordinationDisclosure>
        <CoordinationDisclosure
          icon={icons.share}
          title="Sharing"
          description="Send the plan and useful trip cards."
          open={openGo === 'sharing'}
          onOpenChange={(open) => setOpenGo(open ? 'sharing' : null)}
        >
          <ShareCards {...featureProps} />
        </CoordinationDisclosure>
      </div>
    </Section>
  );

  const stepSummaries: Record<'invite' | 'details', React.ReactNode> = {
    invite: showInviteSection && (
      <StepSummaryRow
        key="sum-invite"
        number={1}
        title="Invite"
        status={`${joined} of ${trip?.expectedSize} joined${
          requests.length
            ? ` · ${plural(requests.length, 'request')} waiting`
            : ''
        }`}
        actionLabel="View"
        onAction={() => navigateStep('invite')}
      />
    ),
    details: me &&
      (trip?.phase === 'collecting' || trip?.phase === 'voting') && (
        <StepSummaryRow
          key="sum-details"
          number={2}
          title="Your details"
          status={
            trip?.myConstraints
              ? trip.phase === 'voting'
                ? 'Saved · locked while voting is open'
                : 'Saved · only you can see them'
              : 'Not added yet'
          }
          actionLabel={
            trip?.phase === 'collecting'
              ? trip?.myConstraints
                ? 'Edit'
                : 'Add'
              : 'View'
          }
          onAction={() =>
            trip?.phase === 'collecting' && trip?.myConstraints
              ? editDetails()
              : navigateStep('details')
          }
        />
      ),
  };
  const nextDetailsRow = me &&
    trip?.phase === 'collecting' &&
    !trip?.myConstraints && (
      <StepSummaryRow
        key="next-details"
        number={2}
        title="Your details"
        status="Add yours while your friends join"
        actionLabel="Add details"
        onAction={() => navigateStep('details')}
      />
    );
  const ordered: Record<StepId, React.ReactNode[]> = {
    invite: [inviteSection, nextDetailsRow],
    details: [stepSummaries.invite, detailsSection],
    choose: [stepSummaries.invite, stepSummaries.details, chooseSection],
    plan: [planSection],
    go: [goSection],
  };

  /* ---------------------------------------------------------------- page */

  return (
    <main className="bg-canvas pb-6 font-sans text-ink">
      <PageContainer>
        <TopBar
          trip={me ? trip : undefined}
          action={headerAction}
          onHome={trip ? goHome : undefined}
        />

        {(!online || error) && (
          <div className="mt-4 grid gap-3">
            {!online && (
              <Notice tone="warning" icon={WifiOff} title="You're offline.">
                Buttons are paused until you're back. Anything you've typed
                stays here.
              </Notice>
            )}
            {error && (
              <Notice
                tone="danger"
                role="alert"
                title="That didn't work."
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setError('')}
                  >
                    Dismiss
                  </Button>
                }
              >
                {error}
              </Notice>
            )}
          </div>
        )}

        {!trip && (
          <div className="mx-auto grid max-w-content gap-6 py-6 sm:py-10 lg:max-w-none lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-6 lg:py-12">
            <EntryHero />
            <div className="grid content-start gap-4 rounded-2xl border border-solid border-line bg-surface p-3 shadow-sm sm:p-5">
              {!sharedFirebaseConfigured && !preview ? (
                <Notice tone="warning" title="Shared trips aren't set up here.">
                  This copy of Fermat is missing its Firebase settings
                  (NEXT_PUBLIC_FIREBASE_*), so trips can't be saved. Try the
                  offline demo below instead.
                </Notice>
              ) : !user ? (
                <SignInCard
                  invited={Boolean(token)}
                  consented={consented}
                  onConsent={updateConsent}
                />
              ) : token ? (
                <JoinRoomCard
                  nickname={nickname}
                  onNickname={setNickname}
                  onJoin={join}
                  disabled={busy}
                  busy={pendingCommand === 'join'}
                />
              ) : user.isAnonymous ? (
                <OrganizerIdentityCard />
              ) : (
                <Tabs
                  value={entryTab}
                  onValueChange={(value) =>
                    setEntryTab(value as 'trips' | 'new')
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trips">My trips</TabsTrigger>
                    <TabsTrigger value="new">New trip</TabsTrigger>
                  </TabsList>
                  <TabsContent value="trips">
                    <MyTripsCard
                      trips={trips}
                      loading={tripsLoading}
                      onOpen={openTrip}
                      onRefresh={loadTrips}
                    />
                  </TabsContent>
                  <TabsContent value="new">
                    {!draftReady ? (
                      <p
                        className="type-small m-0 py-6 text-ink-muted"
                        role="status"
                      >
                        Getting the trip form ready…
                      </p>
                    ) : (
                      <CreateRoomCard
                        draft={draft}
                        onChange={setDraft}
                        onCreate={() =>
                          request({
                            action: 'create',
                            idempotencyKey: createKey,
                            trip: draft,
                          })
                        }
                        disabled={disabled}
                        busy={pendingCommand === 'create'}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}

        {trip && !me && (
          <div className="mx-auto grid max-w-content gap-6 pt-8 sm:pt-12">
            <div className="grid gap-1 text-center">
              <p className="type-overline m-0 text-brand-600">
                You asked to join
              </p>
              <h1 className="type-h1 m-0">{trip.name}</h1>
            </div>
            {trip.membershipStatus === 'pending' ? (
              <PendingApproval />
            ) : (
              <EmptyState
                icon={icons.private}
                art={asciiArt.lock}
                title="You're not in this trip"
                description="Ask the organizer for a new invite link."
              />
            )}
          </div>
        )}

        {trip && me && (
          <>
            <TripHeader
              trip={trip}
              owner={owner}
              step={step}
              onStepClick={navigateStep}
              action={
                owner && trip.phase === 'collecting' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Pencil}
                    onClick={editSetup}
                  >
                    Edit trip
                  </Button>
                ) : undefined
              }
            />
            <Dialog
              open={editingSetup}
              onOpenChange={(open) => {
                setEditingSetup(open);
                if (!open) setSetupDraft(null);
              }}
            >
              {setupDraft && (
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit trip setup</DialogTitle>
                    <DialogDescription>
                      Update the trip name, dates and group settings. Everyone
                      will see the changes.
                    </DialogDescription>
                  </DialogHeader>
                  <EditTripSetupCard
                    draft={setupDraft}
                    onChange={setSetupDraft}
                    onSave={saveSetup}
                    onCancel={() => {
                      setEditingSetup(false);
                      setSetupDraft(null);
                    }}
                    disabled={disabled}
                    busy={pendingCommand === 'updateTripSetup'}
                    structuralDisabled={
                      trip.setupEdit ? !trip.setupEdit.canEditStructure : false
                    }
                    reason={trip.setupEdit?.reason}
                  />
                </DialogContent>
              )}
            </Dialog>
            <div className="mt-6 grid gap-4 xl:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button block variant="outline" icon={icons.members}>
                    View trip overview
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader className="mb-5 pr-8 text-left">
                    <SheetTitle>Trip overview</SheetTitle>
                    <SheetDescription>
                      People, progress and your private budget.
                    </SheetDescription>
                  </SheetHeader>
                  <TripSummary
                    trip={trip}
                    uid={user.uid}
                    owner={owner && !showInvite}
                    disabled={disabled}
                    command={command}
                  />
                </SheetContent>
              </Sheet>
              {!trip.activePlan && <Tasks {...featureProps} />}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
              <aside
                className="hidden min-w-0 lg:block"
                aria-label="Trip steps"
              >
                <TripJourneyNav current={step} onStepClick={navigateStep} />
              </aside>
              <div className="grid min-w-0 content-start gap-4">
                {ordered[step].filter(Boolean)}
              </div>
              <aside
                className="hidden min-w-0 content-start gap-6 xl:grid"
                aria-label="Trip overview"
              >
                <TripSummary
                  trip={trip}
                  uid={user.uid}
                  owner={owner && !showInvite}
                  disabled={disabled}
                  command={command}
                />
                {!trip.activePlan && <Tasks {...featureProps} />}
              </aside>
            </div>
          </>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        <PlannerFooter />
      </PageContainer>
    </main>
  );
}
