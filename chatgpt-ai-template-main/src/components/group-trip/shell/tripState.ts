// Pure helpers the planner shell uses to read trip state. UI only: no domain rules live here.
import seeds from '@/lib/groupTripSeeds.v1.json';
import countryData from '@/lib/geo/countries.json';
import cityData from '@/lib/geo/departureCities.json';
import fxData from '@/lib/geo/fx.json';
import { formatMoney } from '@/lib/format';

export type StepId = 'invite' | 'details' | 'choose' | 'plan' | 'go';

/** The 13 Indian departure cities with a curated fare table (the offline demo still uses this list). */
export const departureCities = Object.keys(seeds.departureCities);
/** Interests the server accepts (every catalog tag). The form narrows this to the trip's own options. */
export const preferenceOptions = Array.from(new Set(seeds.destinations.flatMap((d) => d.tags)));
/** Visas the server accepts, with short labels ("UAE", "Schengen", ...). One chip per visa, no duplicates. */
export const visaOptions = Object.entries(seeds.holdableVisas as Record<string, string>);

export const memberList = (trip: any): any[] =>
  Object.values(trip?.members || {}).sort((a: any, b: any) => (a.joinOrder ?? 0) - (b.joinOrder ?? 0));

/** Name for avatars: drop a trailing "(demo)" so initials read "AA", not "A(". */
export const avatarName = (nickname: string) => (nickname || '').replace(/\s*\(demo\)\s*$/i, '') || nickname;

export const approvedCount = (trip: any) => memberList(trip).filter((m) => m.status !== 'pending').length;

export const planApprovals = (trip: any) =>
  Object.values(trip?.activePlan?.approvals || {}).filter((decision) => decision === 'approved').length;

/** Where the trip is, from the viewer's point of view. Drives the Stepper and the order of sections. */
export function currentStep(trip: any, isMember: boolean): StepId {
  if (!trip || !isMember || trip.membershipStatus === 'pending') return 'invite';
  if (trip.activePlan || trip.phase === 'locked') {
    const people = trip.activePlan?.memberTotals?.length || approvedCount(trip);
    return people > 0 && planApprovals(trip) >= people ? 'go' : 'plan';
  }
  if (trip.phase === 'voting') return 'choose';
  if (approvedCount(trip) < trip.expectedSize) return 'invite';
  if (!trip.myConstraints || (trip.submissionProgress ?? 0) < trip.expectedSize) return 'details';
  return 'choose';
}

export const phaseLabel = (trip: any): string =>
  trip?.phase === 'locked' ? 'Trip locked' : trip?.phase === 'voting' ? 'Voting open' : 'Planning';

export const inviteUrl = (invite: string) => `${location.origin}${location.pathname}#invite=${encodeURIComponent(invite)}`;

export const openWhatsApp = (text: string) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

/** Text for "Share plan on WhatsApp". Emoji are fine here: this goes to another app, not our UI. */
export function planSummary(trip: any) {
  const plan = trip.activePlan;
  const perPerson = plan.memberTotals.map((m: any) => m.total);
  const days = plan.itinerary.map(
    (day: any) =>
      `Day ${day.day} (${day.date}${day.city ? `, ${day.city}` : ''}): ${day.items
        .filter((item: any) => !item.id.startsWith('meal-'))
        .map((item: any) => item.title)
        .join(', ')}`,
  );
  const route = plan.stops?.length > 1 ? `🗺️ ${plan.stops.map((stop: any) => `${stop.name} ${stop.nights}N`).join(' → ')}` : '';
  return [
    `✈️ ${trip.name}: ${plan.destinationName}, ${plan.startDate} to ${plan.endDate}`,
    ...(route ? [route] : []),
    `💰 ${formatMoney(Math.min(...perPerson), trip.currency)}–${formatMoney(Math.max(...perPerson), trip.currency)} per person (incl. 10% buffer)`,
    '',
    ...days,
    '',
    'Planned on Fermat. Estimates only, verify before booking.',
  ].join('\n');
}

export const inviteMessage = (tripName: string, url: string) =>
  `Join our trip "${tripName}" on Fermat. Add your budget privately and vote on where we go: ${url}`;

/** What's still missing before the details can be saved (mirrors what the server checks, for a friendly hint). */
export function missingDetails(input: any): string[] {
  const missing: string[] = [];
  if (!input.departureCity) missing.push('where you leave from');
  if (!Number.isSafeInteger(input.budget) || input.budget <= 0) missing.push('your budget');
  if (!(input.passportExpiry === 'none' || /^\d{4}-(0[1-9]|1[0-2])$/.test(input.passportExpiry || ''))) missing.push('passport expiry month and year');
  if (!input.preferences?.length) missing.push('at least one interest');
  if (!input.datesConfirmed) missing.push('the dates');
  if (!input.isAdult) missing.push('the 18+ box');
  if (!input.passportCountry && !input.hasIndianPassport) missing.push('your citizenship');
  if (!input.entryCheckAcknowledged) missing.push('the entry rules box');
  return missing;
}

/* ------------------------------------------------------------------ where the group is based */

type Country = { name: string; currency: string | null; continent: string };
const countries = countryData.countries as Record<string, Country>;
const rates = fxData.rates as Record<string, number>;
export const DEFAULT_HOME_COUNTRY = 'IN';
export type TripScope = 'any' | 'domestic' | 'international';

export const countryName = (code?: string | null) => (code && countries[code]?.name) || code || '';
// Names that read with "the" in a sentence ("trips in the United States").
const WITH_THE = new Set(['US', 'GB', 'AE', 'NL', 'PH', 'CZ', 'DO', 'BS', 'GM', 'CF', 'CD', 'CG', 'KM', 'MV', 'MH', 'SB', 'SC', 'VA', 'VG', 'VI', 'KY', 'FO', 'FK', 'TC', 'MP']);
/** countryName for use inside a sentence: "the United States", "India". */
export const countryInSentence = (code?: string | null) => (code && WITH_THE.has(code) ? `the ${countryName(code)}` : countryName(code));
/** Primary currency of a country, if we have an exchange rate for it. */
export const currencyForCountry = (code?: string | null) => {
  const currency = code ? countries[code]?.currency : null;
  return currency && rates[currency] ? currency : null;
};

/** Home countries a trip can use (their currency has a rate), A to Z. */
export const homeCountryOptions = Object.entries(countries)
  .filter(([, c]) => c.currency && rates[c.currency])
  .map(([code, c]) => ({ code, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));
/** Shown first in the home-country list. */
export const popularHomeCountries = ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG'].filter((code) => currencyForCountry(code));

let currencyNames: Intl.DisplayNames | null = null;
try {
  currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
} catch {
  currencyNames = null;
}
export const currencyName = (code: string) => {
  try {
    return currencyNames?.of(code) || code;
  } catch {
    return code;
  }
};
export const currencyOptions = Object.keys(rates)
  .sort()
  .map((code) => ({ code, label: `${code} · ${currencyName(code)}` }));

/** "$", "€", "₹"; longer marks ("MX$", "AED") come back as the ISO code so they fit a trailing slot. */
export function currencyMark(currency: string): { mark: string; short: boolean } {
  const mark = formatMoney(0, currency).replace(/[\d\s.,\u00a0-]/g, '');
  return mark.length === 1 ? { mark, short: true } : { mark: currency, short: false };
}

/** Home country from the browser language region: en-US -> US, en-IN -> IN, hi -> IN. Null when unknown. */
export function detectHomeCountry(): string | null {
  if (typeof navigator === 'undefined') return null;
  const tags = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const tag of tags) {
    let region: string | undefined;
    try {
      region = new Intl.Locale(tag).maximize().region;
    } catch {
      region = tag.split(/[-_]/)[1]?.toUpperCase();
    }
    if (region && currencyForCountry(region)) return region;
  }
  return null;
}

// Mirrors the engine: an option is domestic when every country it touches is the home country.
const optionCountries = (dest: any): string[] => Array.from(new Set([dest.countryCode, ...(dest.stops || []).map((stop: any) => stop.countryCode)].filter(Boolean)));
const isDomesticFor = (dest: any, home: string) => {
  const codes = optionCountries(dest);
  return codes.length ? codes.every((code) => code === home) : home === DEFAULT_HOME_COUNTRY && Boolean(dest.domestic);
};
/** Before a trip exists: which scopes have at least one option for this home country (so the create form can say so). */
export function scopeAvailability(home: string): { domestic: number; international: number } {
  const shortlist = (seeds as any).defaultShortlists?.[home] as string[] | undefined;
  const offered = shortlist ? seeds.destinations.filter((d: any) => shortlist.includes(d.id)) : seeds.destinations;
  const domestic = offered.filter((d) => isDomesticFor(d, home)).length;
  return { domestic, international: offered.length - domestic };
}

/** "In India", "Abroad from the US", "India or abroad". */
export function scopeLabel(trip: any): string {
  const code = trip?.homeCountry || DEFAULT_HOME_COUNTRY;
  if (trip?.scope === 'domestic') return `Within ${countryInSentence(code)}`;
  if (trip?.scope === 'international') return `Abroad from ${countryInSentence(code)}`;
  return `${countryName(code)} or abroad`;
}

/* ------------------------------------------------------------------ departure cities */

type City = { name: string; countryCode: string; iata?: string };
const cities = cityData.cities as City[];
export interface CityGroup {
  code: string;
  name: string;
  cities: City[];
}
/** Departure cities grouped by country: the home country first, then A to Z. Keeps an unknown saved name visible. */
export function departureCityGroups(home: string, current?: string): CityGroup[] {
  const byCountry = new Map<string, City[]>();
  cities.forEach((city) => byCountry.set(city.countryCode, [...(byCountry.get(city.countryCode) || []), city]));
  const groups = Array.from(byCountry, ([code, list]) => ({ code, name: countryName(code), cities: list }));
  groups.sort((a, b) => (a.code === home ? -1 : b.code === home ? 1 : a.name.localeCompare(b.name)));
  if (current && !cities.some((city) => city.name === current)) groups.unshift({ code: '', name: 'Saved', cities: [{ name: current, countryCode: '' }] });
  return groups;
}
/** First departure city in the home country (Delhi for India), else the first listed. */
export const defaultDepartureCity = (home: string) => (cities.find((city) => city.countryCode === home) || cities[0]).name;

/** A sensible starting budget: ₹1,50,000 for INR trips (unchanged), the same value in other currencies, to 2 significant figures. */
export function defaultBudget(currency: string): number {
  if (currency === 'INR' || !rates[currency] || !rates.INR) return 150000;
  const value = (150000 / rates.INR) * rates[currency];
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

/** Interests to offer: tags on this trip's own options (plus anything already picked), in catalog order. */
export function tripPreferenceOptions(trip: any, picked: string[] = []): string[] {
  const own = new Set<string>([...(trip?.destinations || []).flatMap((d: any) => d.tags || []), ...picked]);
  return own.size ? preferenceOptions.filter((tag) => own.has(tag)) : preferenceOptions;
}
