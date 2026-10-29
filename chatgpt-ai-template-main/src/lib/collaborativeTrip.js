const seeds = require('./groupTripSeeds.v1.json');
const features = require('./features');
const geo = require('./geo');
const payments = require('./payments');

const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (message) => { throw new Error(message); };
const destination = (id) => seeds.destinations.find((item) => item.id === id) || fail(`Unknown destination: ${id}`);
const preferenceKeys = new Set(seeds.destinations.flatMap((item) => item.tags));
const visaKeys = new Set(Object.keys(seeds.holdableVisas));

// Trip settings. States created before these existed are Indian trips priced in rupees with every option open.
const SCOPES = ['any', 'domestic', 'international'];
const DEFAULT_HOME_COUNTRY = 'IN';
function settingsOf(state) {
  const homeCountry = state.homeCountry || DEFAULT_HOME_COUNTRY;
  return { homeCountry, currency: state.currency || geo.currencyForCountry(homeCountry) || seeds.currency, scope: state.scope || 'any' };
}
// Largest budget/advance accepted: 1 crore rupees, or its equivalent in currencies with smaller units (yen, rupiah).
const maxAmount = (currency) => Math.max(10000000, geo.convert(10000000, seeds.currency, currency));

// Card/forex markup on in-destination spend when the local currency differs from the trip currency.
// India: 3.5% markup plus 18% GST on that markup (413 bps). Elsewhere: a typical 3% foreign transaction fee.
const FOREX_BASIS_POINTS = 413;
const FOREX_BASIS_POINTS_BY_HOME = { IN: FOREX_BASIS_POINTS };
const DEFAULT_FOREX_BASIS_POINTS = 300;
const forexBasisPoints = (settings) => FOREX_BASIS_POINTS_BY_HOME[settings.homeCountry] ?? DEFAULT_FOREX_BASIS_POINTS;
function chargesForex(dest, settings) {
  const local = dest.countryCode && geo.currencyForCountry(dest.countryCode);
  if (!local) return settings.homeCountry === DEFAULT_HOME_COUNTRY ? !dest.domestic : true; // legacy seed without a country
  return local !== settings.currency;
}
const forexFor = (dest, inDestination, settings = settingsOf({})) => (chargesForex(dest, settings) ? Math.ceil((inDestination * forexBasisPoints(settings)) / 10000) : 0);

// Countries a trip option touches (the destination, plus any stop in another country).
const countriesOf = (dest) => [...new Set([dest.countryCode, ...(dest.stops || []).map((stop) => stop.countryCode)].filter(Boolean))];
// Domestic = every country on the option is the trip's home country. Seeds without countryCode fall back to the old flag.
function isDomestic(dest, homeCountry) {
  const codes = countriesOf(dest);
  if (codes.length) return codes.every((code) => code === homeCountry);
  return homeCountry === DEFAULT_HOME_COUNTRY && Boolean(dest.domestic);
}
const passportCountryOf = (constraint) => constraint.passportCountry || (constraint.hasIndianPassport === true ? 'IN' : null);
// Curated visaLeadDays/entryAllowance on the original seeds describe one passport (seeds.curatedVisaPassport, India);
// every other passport, and seeds without those fields, use src/lib/geo/visaRules.json.
const curatedFor = (dest, passport, field) => passport === (seeds.curatedVisaPassport || 'IN') && dest[field] !== undefined;
function visaLeadDaysFor(dest, passport) {
  if (curatedFor(dest, passport, 'visaLeadDays')) return dest.visaLeadDays || 0;
  return Math.max(0, ...countriesOf(dest).map((code) => geo.visaLeadDays(passport, code)));
}

// Seed costs are in destination.costCurrency (default seeds.currency). A localized copy holds every cost in the trip
// currency, rounded per field; routes have their stops merged with any fromDestination they inherit from.
const COST_FIELDS = ['roomNight', 'vehicleDay', 'foodDay', 'insurance', 'entryAllowance'];
const localized = new Map();
function convertCosts(item, from, to) {
  const out = { ...item };
  COST_FIELDS.forEach((key) => { if (typeof item[key] === 'number') out[key] = geo.convert(item[key], from, to); });
  if (Array.isArray(item.activities)) out.activities = item.activities.map((activity) => ({ ...activity, costPerPerson: geo.convert(activity.costPerPerson, from, to) }));
  return out;
}
function localize(dest, currency) {
  const key = `${dest.id}\0${currency}`;
  if (localized.has(key)) return localized.get(key);
  const from = dest.costCurrency || seeds.currency;
  const out = convertCosts(dest, from, currency);
  if (dest.stops) {
    out.stops = dest.stops.map((stop) => {
      const base = stop.fromDestination ? localize(destination(stop.fromDestination), currency) : {};
      const inherited = { roomNight: base.roomNight, vehicleCapacity: base.vehicleCapacity, vehicleDay: base.vehicleDay, foodDay: base.foodDay, activities: base.activities, lat: base.lat, lon: base.lon, countryCode: base.countryCode };
      return { ...inherited, ...convertCosts(stop, from, currency) };
    });
    out.transfers = (dest.transfers || []).map((transfer) => ({ ...transfer, costPerPerson: geo.convert(transfer.costPerPerson, from, currency) }));
  }
  localized.set(key, out);
  return out;
}

// Return fare per traveller: the explicit Indian fare table when it has the pair (converted from seeds.currency),
// otherwise the labelled great-circle distance-band model in src/lib/geo (open jaw for routes).
function journeyFor(settings, cityName, dest) {
  const table = seeds.departureCities[cityName]?.[dest.id];
  if (Number.isSafeInteger(table)) return { amount: geo.convert(table, seeds.currency, settings.currency), basis: 'table' };
  const city = geo.departureCity(cityName);
  const first = dest.stops ? dest.stops[0] : dest; const last = dest.stops ? dest.stops[dest.stops.length - 1] : dest;
  if (!city || ![first.lat, first.lon, last.lat, last.lon].every(Number.isFinite)) return null;
  const estimate = geo.estimateReturnFareUsd(city, first, last);
  return { amount: geo.convert(estimate.usd, 'USD', settings.currency), basis: 'distance', km: estimate.km, label: estimate.label };
}

// Entry costs per traveller: none for domestic trips; curated seed amount for the curated passport; otherwise the typical
// government fee for that passport's rule (largest across the countries on a route).
function entryAllowanceFor(dest, passport, settings) {
  if (isDomestic(dest, settings.homeCountry)) return dest.entryAllowance || 0;
  if (curatedFor(dest, passport, 'entryAllowance')) return dest.entryAllowance;
  return geo.convert(Math.max(0, ...countriesOf(dest).map((code) => geo.entryFeeUsd(passport, code))), 'USD', settings.currency);
}

// The options a trip offers: its own destinationIds, else the home country's default shortlist, else the whole catalog;
// then filtered by scope. Seed order is kept (it is the last tie-break).
function shortlistIds(state) {
  const { homeCountry } = settingsOf(state);
  return state.destinationIds || seeds.defaultShortlists?.[homeCountry] || seeds.destinations.map((dest) => dest.id);
}
function inScope(state, dest) {
  const { homeCountry, scope } = settingsOf(state);
  if (!shortlistIds(state).includes(dest.id)) return false;
  if (scope === 'any') return true;
  return isDomestic(dest, homeCountry) === (scope === 'domestic');
}
const offeredDestinations = (state) => seeds.destinations.filter((dest) => inScope(state, dest));

const TRIP_SETUP_FIELDS = ['name', 'startDate', 'endDate', 'expectedSize', 'homeCountry', 'currency', 'scope'];
const SEMANTIC_SETUP_FIELDS = new Set(['startDate', 'endDate', 'homeCountry', 'currency', 'scope']);

function normalizeTripSetup({ name, startDate, endDate, expectedSize, homeCountry = DEFAULT_HOME_COUNTRY, currency, scope = 'any', destinationIds }) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (!cleanName || cleanName.length > 80) fail('Trip name must be between 1 and 80 characters');
  if (!Number.isInteger(expectedSize) || expectedSize < 2 || expectedSize > 10) fail('Expected size must be 2–10');
  if (!isExactDate(startDate) || !isExactDate(endDate) || endDate < startDate) fail('Valid exact dates are required');
  const tripDays = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY) + 1;
  if (tripDays < 2 || tripDays > 31) fail('Trip length must be between 2 and 31 days');
  if (!geo.isCountry(homeCountry)) fail('Home country must be an ISO-3166 alpha-2 code like IN or US');
  const tripCurrency = currency === undefined || currency === null || currency === '' ? geo.currencyForCountry(homeCountry) : currency;
  if (!geo.isCurrency(tripCurrency)) fail('Trip currency must be a supported ISO-4217 code like INR or USD');
  if (!SCOPES.includes(scope)) fail(`Trip scope must be one of ${SCOPES.join(', ')}`);
  if (destinationIds !== undefined && (!Array.isArray(destinationIds) || !destinationIds.length || destinationIds.length > 40 || new Set(destinationIds).size !== destinationIds.length || !destinationIds.every((destId) => seeds.destinations.some((dest) => dest.id === destId)))) fail('Destination ids must be 1–40 distinct known destinations');
  const setup = { name: cleanName, startDate, endDate, expectedSize, homeCountry, currency: tripCurrency, scope, ...(destinationIds ? { destinationIds: [...destinationIds] } : {}) };
  if (!offeredDestinations(setup).length) fail(scope === 'domestic' ? 'No domestic destinations are available for this home country yet' : 'No destinations match this trip scope');
  return setup;
}

function allocateInteger(total, orderedIds) {
  if (!Number.isSafeInteger(total) || total < 0 || !orderedIds.length) fail('Allocation requires a nonnegative integer and members');
  const base = Math.floor(total / orderedIds.length);
  const remainder = total % orderedIds.length;
  return Object.fromEntries(orderedIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

function createTripState({ id, ownerUid, name, startDate, endDate, expectedSize, createdAt = null, homeCountry = DEFAULT_HOME_COUNTRY, currency, scope = 'any', destinationIds }) {
  if (!id || !ownerUid) fail('Trip id and owner are required');
  const setup = normalizeTripSetup({ name, startDate, endDate, expectedSize, homeCountry, currency, scope, destinationIds });
  return {
    schemaVersion: 1, seedVersion: seeds.version, id, ownerUid, ...setup,
    phase: 'collecting', inputRevision: 0, round: 0,
    members: { [ownerUid]: { uid: ownerUid, nickname: 'Organizer', role: 'owner', status: 'approved', joinOrder: 0 } },
    pending: {}, constraints: {}, ballots: {}, publishedTotals: null, lockedDestinationId: null, lockExplanation: null,
    activePlan: null, supersededPlans: [], planVersion: 0, idempotency: {}, payee: null, payments: {}, createdAt: Number.isSafeInteger(createdAt) ? createdAt : null, lockedAt: null,
  };
}

function isExactDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function approvedIds(state) {
  return Object.values(state.members).filter((m) => m.status === 'approved').sort((a, b) => a.joinOrder - b.joinOrder).map((m) => m.uid);
}
function ownerOnly(state, uid) { if (state.ownerUid !== uid) fail('Only the organizer can do that'); }
function memberOnly(state, uid) { if (!state.members[uid] || state.members[uid].status !== 'approved') fail('Approved membership required'); }
function collecting(state) { if (state.phase !== 'collecting') fail('Trip is not collecting inputs'); }
function invalidate(state) { state.inputRevision += 1; state.phase = 'collecting'; state.ballots = {}; state.publishedTotals = null; state.lockExplanation = null; }

function hasPlanOrMoneyHistory(state) {
  return Boolean(
    state.activePlan || state.lockedAt || (state.planVersion || 0) > 0 || (state.supersededPlans || []).length || state.payee ||
    Object.keys(state.payments || {}).length || Object.keys(state.pledges || {}).length || (state.expenses || []).length || (state.expenseSeq || 0) > 0,
  );
}

// Passport nationality: new clients send passportCountry (ISO2); legacy clients send hasIndianPassport: true (= 'IN').
// When both are present they must agree.
function validPassport(value) {
  if (value.passportCountry === undefined) return value.hasIndianPassport === true;
  return geo.isCountry(value.passportCountry) && (value.hasIndianPassport === undefined || value.hasIndianPassport === (value.passportCountry === 'IN'));
}

const knownDepartureCity = (name) => typeof name === 'string' && Boolean(seeds.departureCities[name] || geo.departureCity(name));

function completeConstraint(value) {
  return value && knownDepartureCity(value.departureCity) && Number.isSafeInteger(value.budget) && value.budget > 0 &&
    value.datesConfirmed === true && value.isAdult === true && validPassport(value) &&
    (value.passportExpiry === 'none' || /^\d{4}-(0[1-9]|1[0-2])$/.test(value.passportExpiry || '')) && Array.isArray(value.preferences) &&
    value.preferences.length > 0 && value.preferences.length <= preferenceKeys.size && new Set(value.preferences).size === value.preferences.length && value.preferences.every((item) => preferenceKeys.has(item)) &&
    Array.isArray(value.visas) && value.visas.length <= visaKeys.size && new Set(value.visas).size === value.visas.length && value.visas.every((item) => visaKeys.has(item)) && value.entryCheckAcknowledged === true;
}

function validatedConstraint(value, settings = settingsOf({})) {
  const allowed = ['departureCity', 'budget', 'passportExpiry', 'visas', 'datesConfirmed', 'preferences', 'entryCheckAcknowledged', 'isAdult', 'hasIndianPassport', 'passportCountry'];
  if (!value || Object.keys(value).some((key) => !allowed.includes(key)) || !completeConstraint(value) || value.budget > maxAmount(settings.currency)) fail('Required private input is incomplete or invalid');
  // Optional keys (hasIndianPassport, passportCountry) are stored only when sent, so legacy inputs round-trip unchanged.
  return Object.fromEntries(allowed.filter((key) => value[key] !== undefined).map((key) => [key, clone(value[key])]));
}

function dateRange(start, end) {
  if (!isExactDate(start) || !isExactDate(end)) fail('Valid exact dates are required');
  const span = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY) + 1;
  if (span < 1 || span > 31) fail('Trip length must be between 1 and 31 days');
  const result = [];
  for (let cursor = Date.parse(`${start}T00:00:00Z`), stop = Date.parse(`${end}T00:00:00Z`); cursor <= stop; cursor += DAY) result.push(new Date(cursor).toISOString().slice(0, 10));
  return result;
}

function passportSufficient(expiry, tripEnd, months) {
  if (expiry === 'none') return false;
  const match = /^(\d{4})-(\d{2})$/.exec(expiry || '');
  if (!match) return null;
  const end = new Date(`${tripEnd}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + months);
  const expiryMonth = Number(match[1]) * 12 + Number(match[2]);
  const cutoffMonth = end.getUTCFullYear() * 12 + end.getUTCMonth() + 1;
  return expiryMonth === cutoffMonth ? null : expiryMonth > cutoffMonth;
}

// null when the member can travel; 'passport' for a known passport problem; 'visaTiming' when entry paperwork cannot be
// ready before departure. Domestic trips need no passport. A citizen of the destination needs no visa.
function documentBlocker(dest, constraint, startDate, endDate, now, homeCountry = DEFAULT_HOME_COUNTRY) {
  if (isDomestic(dest, homeCountry)) return null;
  const passport = passportCountryOf(constraint); const codes = countriesOf(dest);
  if (passport && codes.length && codes.every((code) => code === passport)) return constraint.passportExpiry === 'none' ? 'passport' : null;
  if (passportSufficient(constraint.passportExpiry, endDate, dest.passportMonths) === false) return 'passport';
  const holdsVisa = constraint.visas.includes(dest.visaKey) || (dest.visaWaivedBy || []).some((visa) => constraint.visas.includes(visa));
  const leadDays = visaLeadDaysFor(dest, passport);
  if (now !== undefined && leadDays && !holdsVisa && Math.floor((Date.parse(`${startDate}T00:00:00Z`) - now) / DAY) < leadDays) return 'visaTiming';
  return null;
}

// The viewer's own entry rule for an option (null when domestic), so the UI can say "e-visa, allow 7 days".
function visaSummary(dest, constraint, settings) {
  if (isDomestic(dest, settings.homeCountry)) return null;
  const passport = passportCountryOf(constraint);
  const rules = countriesOf(dest).map((code) => ({ countryCode: code, ...geo.visaRule(passport, code) }));
  const holdsVisa = constraint.visas.includes(dest.visaKey) || (dest.visaWaivedBy || []).some((visa) => constraint.visas.includes(visa));
  return { passportCountry: passport, rules, leadDays: visaLeadDaysFor(dest, passport), holdsVisa };
}

// A trip option is one city or an ordered list of stops; single destinations become a one-stop route.
// `dest` is localized (see localize), so route stops already carry inherited costs and activities.
function stopsFor(dest) {
  if (!dest.stops) return { stops: [{ id: dest.id, name: dest.name, weight: 1, roomNight: dest.roomNight, vehicleCapacity: dest.vehicleCapacity, vehicleDay: dest.vehicleDay, foodDay: dest.foodDay, activities: dest.activities, prefix: '' }], transfers: [] };
  return { stops: dest.stops.map((stop) => ({ ...stop, prefix: `${stop.id}/` })), transfers: dest.transfers };
}

// Every stop gets at least one night; the rest are split by weight using largest remainders.
function splitNights(nights, stops) {
  if (nights < stops.length) fail(`Trip too short: this route needs at least ${stops.length + 1} days`);
  const spare = nights - stops.length; const weight = stops.reduce((sum, stop) => sum + stop.weight, 0);
  const shares = stops.map((stop, index) => ({ index, exact: (spare * stop.weight) / weight }));
  const result = shares.map((share) => 1 + Math.floor(share.exact));
  let left = nights - result.reduce((sum, n) => sum + n, 0);
  [...shares].sort((x, y) => (y.exact % 1) - (x.exact % 1) || x.index - y.index).forEach((share) => { if (left > 0) { result[share.index] += 1; left -= 1; } });
  return result;
}

function generatePlan(state, destinationId, options = {}) {
  const settings = settingsOf(state);
  const dest = localize(destination(destinationId), settings.currency);
  const ids = approvedIds(state);
  if (ids.length !== state.expectedSize) fail('Roster is incomplete');
  ids.forEach((uid) => { if (!completeConstraint(state.constraints[uid])) fail('Required private input is incomplete'); });
  const dates = dateRange(state.startDate, state.endDate);
  const days = dates.length;
  const nights = Math.max(0, days - 1);
  const { stops, transfers } = stopsFor(dest);
  const stopNights = stops.length === 1 ? [nights] : splitNights(nights, stops);
  const stopOfDay = dates.map((_, index) => { let night = Math.min(index, nights - 1); for (let s = 0; s < stops.length; s += 1) { if (night < stopNights[s]) return s; night -= stopNights[s]; } return stops.length - 1; });
  if (days === 1) stopOfDay[0] = 0;
  const transferDays = new Set(stopOfDay.map((stop, index) => (index > 0 && stop !== stopOfDay[index - 1] ? index : -1)).filter((index) => index > 0));
  const baseAllocations = Object.fromEntries(ids.map((uid) => [uid, 0]));
  const categories = { journeys: 0, lodging: 0, localTransport: 0, transfers: 0, food: 0, insurance: 0, entryAllowance: 0, activities: 0, forex: 0, contingency: 0 };
  const outsideSpend = Object.fromEntries(ids.map((uid) => [uid, 0]));
  const foodPerPerson = stopOfDay.reduce((sum, stop) => sum + stops[stop].foodDay, 0);
  const transfersPerPerson = transfers.reduce((sum, transfer) => sum + transfer.costPerPerson, 0);
  ids.forEach((uid) => {
    const constraint = state.constraints[uid];
    const fare = journeyFor(settings, constraint.departureCity, dest);
    if (!fare) fail('Unsupported departure route');
    const journey = fare.amount;
    const blocker = options.skipDocumentChecks ? null : documentBlocker(dest, constraint, state.startDate, state.endDate, options.now, settings.homeCountry);
    if (blocker === 'passport') fail('Known passport insufficiency');
    if (blocker === 'visaTiming') fail('Not enough time to get a visa before departure');
    const entryAllowance = entryAllowanceFor(dest, passportCountryOf(constraint), settings);
    outsideSpend[uid] = journey + dest.insurance;
    baseAllocations[uid] += journey + foodPerPerson + transfersPerPerson + dest.insurance + entryAllowance;
    categories.journeys += journey; categories.food += foodPerPerson; categories.transfers += transfersPerPerson; categories.insurance += dest.insurance; categories.entryAllowance += entryAllowance;
  });
  const lodging = stops.reduce((sum, stop, s) => sum + Math.ceil(ids.length / dest.roomCapacity) * stopNights[s] * stop.roomNight, 0);
  const transport = stopOfDay.reduce((sum, s) => sum + Math.ceil(ids.length / stops[s].vehicleCapacity) * stops[s].vehicleDay, 0);
  for (const [total, key] of [[lodging, 'lodging'], [transport, 'localTransport']]) {
    const split = allocateInteger(total, ids); ids.forEach((uid) => { baseAllocations[uid] += split[uid]; }); categories[key] += total;
  }
  // Activity slots: full days at a stop (not arrival, departure, or transfer days), each taking that stop's next activity.
  const used = stops.map(() => 0); const slots = [];
  dates.forEach((date, index) => {
    if (index === 0 || index === days - 1 || transferDays.has(index)) return;
    const s = stopOfDay[index]; const activity = stops[s].activities[used[s]];
    if (activity) { slots.push({ index, stop: s, activity }); used[s] += 1; }
  });
  let scheduled = slots.slice(0, Math.min(slots.length, options.maxActivities ?? Number.MAX_SAFE_INTEGER));
  let memberTotals;
  let activities;
  while (true) {
    activities = scheduled.reduce((sum, slot) => sum + slot.activity.costPerPerson * ids.length, 0);
    const activitySplit = allocateInteger(activities, ids);
    memberTotals = ids.map((uid) => {
      const beforeForex = baseAllocations[uid] + activitySplit[uid]; const inDestination = beforeForex - outsideSpend[uid]; const forex = forexFor(dest, inDestination, settings);
      const subtotal = beforeForex + forex; const contingency = Math.ceil(subtotal / 10); const total = subtotal + contingency;
      return { uid, subtotal, contingency, total, inDestination, forex };
    });
    if (options.enforceBudgets === false || memberTotals.every((member) => member.total <= state.constraints[member.uid].budget)) break;
    if (scheduled.length === 0) fail('One or more private budgets are exceeded');
    scheduled = scheduled.slice(0, -1);
  }
  categories.activities = activities;
  categories.forex = memberTotals.reduce((sum, member) => sum + member.forex, 0);
  categories.contingency = memberTotals.reduce((sum, member) => sum + member.contingency, 0);
  const byDay = new Map(scheduled.map((slot) => [slot.index, slot]));
  const itinerary = dates.map((date, index) => {
    const stop = stops[stopOfDay[index]]; const city = stop.name;
    if (index === 0) return { day: index + 1, date, city, items: [{ id: `arrival-${date}`, title: `Arrive in ${city} and check in`, time: '16:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, costBasis: 'included', verificationAction: 'Confirm after flights are selected' }] };
    if (index === dates.length - 1) return { day: index + 1, date, city, items: [{ id: `departure-${date}`, title: `Check out and fly home from ${city}`, time: '09:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, costBasis: 'included', verificationAction: 'Confirm after flights are selected' }] };
    if (transferDays.has(index)) {
      const transfer = transfers[stopOfDay[index] - 1];
      return { day: index + 1, date, city, items: [{ id: `transfer-${date}`, title: transfer.title, time: '09:00', durationMinutes: transfer.durationMinutes, location: city, attendees: ids, estimatedCost: 0, costBasis: `${transfer.costPerPerson} per traveller, counted in transfers`, verificationAction: transfer.mode === 'flight' ? 'Book the flight once dates are final' : 'Book a cab or train once dates are final' }, { id: `meal-${date}`, title: 'Meal and check-in buffer', time: '13:30', durationMinutes: 120, location: city, attendees: ids, estimatedCost: 0, costBasis: 'food allowance already included', verificationAction: 'Choose locally' }] };
    }
    const slot = byDay.get(index);
    const primary = slot
      ? { id: `${slot.activity.id}-${date}`, templateId: `${stop.prefix}${slot.activity.id}`, title: slot.activity.title, time: '10:00', durationMinutes: slot.activity.durationMinutes, location: slot.activity.location, attendees: ids, estimatedCost: slot.activity.costPerPerson * ids.length, costBasis: `${slot.activity.costPerPerson} per traveller`, verificationAction: 'Verify opening hours and book if required' }
      : { id: `flex-${date}`, title: 'Free and flexible time', time: '10:00', durationMinutes: 180, location: 'Choose together', attendees: ids, estimatedCost: 0, costBasis: 'free', verificationAction: 'Agree as a group' };
    return { day: index + 1, date, city, items: [primary, { id: `meal-${date}`, title: 'Meal and transfer buffer', time: '13:30', durationMinutes: 120, location: primary.location, attendees: ids, estimatedCost: 0, costBasis: 'food allowance already included', verificationAction: 'Choose locally' }] };
  });
  const groupTotal = memberTotals.reduce((sum, item) => sum + item.total, 0);
  const plan = { version: options.version || 1, revision: 1, seedVersion: seeds.version, destinationId, destinationName: dest.name, timeZone: dest.timeZone, currency: settings.currency, startDate: state.startDate, endDate: state.endDate, stops: stops.map((stop, s) => ({ id: stop.id, name: stop.name, nights: stopNights[s] })), status: 'ready', memberTotals, categories, groupTotal, itinerary, approvals: {} };
  return features.adjustPlan(plan, state, featureContext(state));
}

function validatePlan(plan) {
  const errors = [];
  if (!plan || !Array.isArray(plan.memberTotals) || !Array.isArray(plan.itinerary)) return ['Malformed plan'];
  const members = plan.memberTotals.reduce((sum, item) => sum + item.total, 0);
  const categories = Object.values(plan.categories || {}).reduce((sum, value) => sum + value, 0);
  if (members !== plan.groupTotal) errors.push('Member totals do not reconcile');
  if (categories !== plan.groupTotal) errors.push('Category totals do not reconcile');
  if (plan.itinerary.length !== dateRange(plan.startDate, plan.endDate).length) errors.push('Itinerary does not cover every date');
  if (plan.itinerary.some((day) => day.items.some((item) => !validScheduleItem(item)))) errors.push('Itinerary contains an invalid time or duration');
  if (hasScheduleConflict(plan)) errors.push('Itinerary contains overlapping items');
  const paidTemplates = plan.itinerary.flatMap((day) => day.items).filter((item) => item.templateId && item.estimatedCost > 0).map((item) => item.templateId);
  if (new Set(paidTemplates).size !== paidTemplates.length) errors.push('Paid activity templates repeat');
  return errors;
}

// Why an option could not win, as anonymous counts (the same numbers the shared board shows).
function ineligibility(state, dest, now, error) {
  const base = { id: dest.id, budgetShort: 0, passport: 0, visaTiming: 0, tooShort: false, outOfScope: false };
  if (/Trip too short/.test(error.message)) return { ...base, tooShort: true };
  try { const { counts } = diagnose(state, dest, now); return { ...base, budgetShort: counts.budget, passport: counts.passport, visaTiming: counts.visaTiming }; } catch (_) { return base; }
}

// Decides the lock: the most-voted option that every member can take; ties go to the best shared preference fit, then
// seed order. Returns the full explanation stored as state.lockExplanation.
function explainLock(state, now) {
  const ids = approvedIds(state); const offered = offeredDestinations(state);
  ids.forEach((uid) => { if (!state.ballots[uid]) fail('Every member must cast a ballot'); });
  const totals = {}; Object.values(state.ballots).forEach((b) => { totals[b.destinationId] = (totals[b.destinationId] || 0) + 1; });
  const candidates = []; const ineligible = [];
  offered.forEach((dest) => { try { generatePlan(state, dest.id, { now }); candidates.push(dest); } catch (error) { ineligible.push(ineligibility(state, dest, now, error)); } });
  Object.keys(totals).filter((destId) => !offered.some((dest) => dest.id === destId)).forEach((destId) => ineligible.push({ id: destId, budgetShort: 0, passport: 0, visaTiming: 0, tooShort: false, outOfScope: true }));
  if (!candidates.length) fail('No destination is feasible within every private budget');
  const votes = (dest) => ids.filter((uid) => state.ballots[uid].destinationId === dest.id).length;
  const fit = (dest) => ids.reduce((sum, uid) => sum + [...new Set(state.constraints[uid].preferences || [])].filter((tag) => dest.tags.includes(tag)).length, 0);
  const order = (dest) => seeds.destinations.findIndex((d) => d.id === dest.id);
  const ranked = [...candidates].sort((a, b) => votes(b) - votes(a) || fit(b) - fit(a) || order(a) - order(b));
  const [winner, runnerUp] = ranked;
  const decidedBy = !runnerUp || votes(winner) > votes(runnerUp) ? 'votes' : fit(winner) > fit(runnerUp) ? 'preferenceTieBreak' : 'orderTieBreak';
  const max = Math.max(0, ...Object.values(totals));
  return { winner: winner.id, totals, eligible: candidates.map((dest) => dest.id), ineligible, decidedBy, topVoted: Object.keys(totals).filter((destId) => totals[destId] === max) };
}

// Pretend travellers for testing a room solo: inputs prefilled, they vote by preference fit and approve every revision.
// Indian trips use DEMO_PEOPLE unchanged. Other home countries reuse their preferences with DEMO_GLOBAL names, budgets set
// in USD and converted to the trip currency, departure cities in or near the home country and home-country passports.
const DEMO_PEOPLE = [
  { nickname: 'Aarav (demo)', departureCity: 'Mumbai', budget: 180000, preferences: ['beach', 'food'] },
  { nickname: 'Diya (demo)', departureCity: 'Bengaluru', budget: 120000, preferences: ['culture', 'nature'] },
  { nickname: 'Kabir (demo)', departureCity: 'Delhi', budget: 95000, preferences: ['nightlife', 'adventure'] },
  { nickname: 'Meera (demo)', departureCity: 'Hyderabad', budget: 250000, preferences: ['shopping', 'food'] },
  { nickname: 'Rohan (demo)', departureCity: 'Pune', budget: 150000, preferences: ['adventure', 'nature'] },
  { nickname: 'Ananya (demo)', departureCity: 'Chennai', budget: 200000, preferences: ['art', 'culture'] },
  { nickname: 'Vihaan (demo)', departureCity: 'Kolkata', budget: 110000, preferences: ['food', 'beach'] },
  { nickname: 'Isha (demo)', departureCity: 'Jaipur', budget: 160000, preferences: ['culture', 'shopping'] },
  { nickname: 'Arjun (demo)', departureCity: 'Kochi', budget: 140000, preferences: ['beach', 'nature'] },
];
const DEMO_GLOBAL = [['Alex', 3800], ['Sam', 2600], ['Jordan', 2100], ['Taylor', 5200], ['Morgan', 3200], ['Riley', 4300], ['Casey', 2400], ['Jamie', 3500], ['Avery', 3000]];
// Two significant figures so demo budgets read like something a person would type (3,400 EUR, 600,000 JPY).
const roundBudget = (value) => { const step = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, value))) - 1); return Math.max(step, Math.round(value / step) * step); };
function demoPeople(state) {
  const { homeCountry, currency } = settingsOf(state);
  if (homeCountry === DEFAULT_HOME_COUNTRY) return DEMO_PEOPLE;
  const cities = geo.citiesNear(homeCountry, DEMO_GLOBAL.length);
  return DEMO_GLOBAL.map(([name, usd], index) => ({ nickname: `${name} (demo)`, departureCity: cities[index % cities.length].name, budget: roundBudget(geo.convert(usd, 'USD', currency)), preferences: DEMO_PEOPLE[index].preferences, passportCountry: homeCountry }));
}

function resetConstraintsAfterSetupChange(state) {
  const demos = Object.values(state.members).filter((member) => member.demo && member.status === 'approved').sort((a, b) => a.joinOrder - b.joinOrder);
  const people = demoPeople(state);
  state.constraints = {};
  demos.forEach((member, index) => {
    const person = people[index % people.length];
    const passport = person.passportCountry ? { passportCountry: person.passportCountry } : { hasIndianPassport: true };
    state.constraints[member.uid] = { departureCity: person.departureCity, budget: person.budget, passportExpiry: '2031-12', visas: Object.keys(seeds.holdableVisas), datesConfirmed: true, preferences: person.preferences, entryCheckAcknowledged: true, isAdult: true, ...passport };
  });
}

function addDemoMembers(state) {
  const open = state.expectedSize - approvedIds(state).length; if (open <= 0) fail('Approved roster capacity reached');
  const taken = new Set(Object.values(state.members).map((m) => m.nickname));
  demoPeople(state).filter((person) => !taken.has(person.nickname)).slice(0, open).forEach((person, index) => {
    const uid = `demo-${index}-${state.inputRevision}-${Object.keys(state.members).length}`;
    state.members[uid] = { uid, nickname: person.nickname, role: 'member', status: 'approved', joinOrder: approvedIds(state).length, demo: true };
    const passport = person.passportCountry ? { passportCountry: person.passportCountry } : { hasIndianPassport: true };
    state.constraints[uid] = { departureCity: person.departureCity, budget: person.budget, passportExpiry: '2031-12', visas: Object.keys(seeds.holdableVisas), datesConfirmed: true, preferences: person.preferences, entryCheckAcknowledged: true, isAdult: true, ...passport };
  });
  invalidate(state); return state;
}

function actForDemoMembers(state) {
  const demos = Object.values(state.members).filter((m) => m.demo && m.status === 'approved').map((m) => m.uid);
  if (state.phase === 'voting') demos.filter((uid) => !state.ballots[uid]).forEach((uid) => {
    const prefs = state.constraints[uid].preferences; const fit = (dest) => dest.tags.filter((tag) => prefs.includes(tag)).length;
    const choice = offeredDestinations(state).reduce((best, dest) => (fit(dest) > fit(best) ? dest : best));
    state.ballots[uid] = { destinationId: choice.id, round: state.round, inputRevision: state.inputRevision };
  });
  if (state.activePlan) demos.filter((uid) => !state.activePlan.approvals[uid]).forEach((uid) => { state.activePlan.approvals[uid] = 'approved'; });
  if (state.activePlan) demos.filter((uid) => state.pledges?.[uid]?.planVersion !== state.activePlan.version).forEach((uid) => {
    state.pledges = { ...(state.pledges || {}), [uid]: { minGoing: 2, maxShare: state.constraints[uid].budget, deadline: null, planVersion: state.activePlan.version, at: 0 } };
  });
  return state;
}

function applyCommand(input, command) { return actForDemoMembers(applyTripCommand(input, command)); }

function applyTripCommand(input, command) {
  const state = clone(input); const now = command.now || Date.now();
  switch (command.type) {
    case 'requestJoin': {
      collecting(state); if (state.members[command.uid]) return state; if (state.pending[command.uid] && state.pending[command.uid].expiresAt > now) return state;
      if (Object.keys(state.pending).filter((uid) => state.pending[uid].expiresAt > now).length >= 20) fail('Pending queue capacity reached');
      const nickname = typeof command.nickname === 'string' ? command.nickname.trim() : '';
      if (!nickname || nickname.length > 40) fail('Nickname must be between 1 and 40 characters');
      state.pending[command.uid] = { uid: command.uid, nickname, requestedAt: now, expiresAt: now + 86400000, status: 'pending' }; return state;
    }
    case 'updateTripSetup': {
      ownerOnly(state, command.uid); collecting(state);
      if (!Number.isInteger(command.expectedInputRevision) || command.expectedInputRevision !== state.inputRevision) fail('Stale input revision');
      const patch = command.patch;
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) fail('Trip setup patch is required');
      const keys = Object.keys(patch);
      if (keys.some((key) => !TRIP_SETUP_FIELDS.includes(key))) fail('Unsupported trip setup field');
      const currentSettings = settingsOf(state);
      const current = Object.fromEntries(TRIP_SETUP_FIELDS.map((key) => [key, ['homeCountry', 'currency', 'scope'].includes(key) ? currentSettings[key] : state[key]]));
      const next = normalizeTripSetup({ ...current, ...patch, ...(state.destinationIds ? { destinationIds: state.destinationIds } : {}) });
      const changed = TRIP_SETUP_FIELDS.filter((key) => next[key] !== current[key]);
      if (!changed.length) return state;
      if (changed.some((key) => key !== 'name') && hasPlanOrMoneyHistory(state)) fail('Trip setup cannot change after a plan or money activity has started');
      if (next.expectedSize < approvedIds(state).length) fail('Expected size cannot be below the approved roster');
      TRIP_SETUP_FIELDS.forEach((key) => { state[key] = next[key]; });
      if (changed.some((key) => SEMANTIC_SETUP_FIELDS.has(key))) resetConstraintsAfterSetupChange(state);
      invalidate(state);
      return state;
    }
    case 'admitMember': {
      ownerOnly(state, command.uid); collecting(state); const request = state.pending[command.memberUid]; if (!request || request.status !== 'pending' || request.expiresAt <= now) fail('Join request expired or absent');
      if (approvedIds(state).length >= state.expectedSize) fail('Approved roster capacity reached');
      if (!request.nickname || Object.values(state.members).some((m) => m.nickname.toLowerCase() === request.nickname.toLowerCase())) fail('Nickname must be unique');
      state.members[command.memberUid] = { uid: command.memberUid, nickname: request.nickname, role: 'member', status: 'approved', joinOrder: approvedIds(state).length }; delete state.pending[command.memberUid]; invalidate(state); return state;
    }
    case 'rejectMember': ownerOnly(state, command.uid); delete state.pending[command.memberUid]; return state;
    case 'submitConstraints': memberOnly(state, command.uid); if (!['collecting', 'voting'].includes(state.phase)) fail('Trip is not accepting inputs'); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); state.constraints[command.uid] = validatedConstraint(command.constraints, settingsOf(state)); invalidate(state); return state;
    case 'updateBudget': {
      memberOnly(state, command.uid);
      if (!['collecting', 'voting', 'locked'].includes(state.phase)) fail('Budget cannot be changed right now');
      if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision');
      const constraint = state.constraints[command.uid];
      if (!completeConstraint(constraint)) fail('Add your trip details before changing your budget');
      const budget = command.budget;
      if (!Number.isSafeInteger(budget) || budget <= 0 || budget > maxAmount(settingsOf(state).currency)) fail('Budget is invalid');
      if (budget === constraint.budget) return state;
      if (state.phase === 'locked') {
        const currentTotal = state.activePlan?.memberTotals.find((member) => member.uid === command.uid)?.total;
        if (!Number.isSafeInteger(currentTotal)) fail('Current plan total is unavailable');
        if (budget < currentTotal) fail('Budget cannot be below your current plan total');
        state.constraints[command.uid].budget = budget;
        state.inputRevision += 1;
        return state;
      }
      state.constraints[command.uid].budget = budget;
      invalidate(state);
      return state;
    }
    case 'openVoting': ownerOnly(state, command.uid); collecting(state); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); if (approvedIds(state).length !== state.expectedSize || approvedIds(state).some((uid) => !completeConstraint(state.constraints[uid]))) fail('Complete roster and inputs required'); state.phase = 'voting'; state.round += 1; state.ballots = {}; return state;
    case 'vote': memberOnly(state, command.uid); if (state.phase !== 'voting') fail('Voting is not open'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale ballot'); if (!inScope(state, destination(command.destinationId))) fail('That destination is not one of this trip\'s options'); state.ballots[command.uid] = { destinationId: command.destinationId, round: command.round, inputRevision: command.inputRevision }; return state;
    case 'lock': {
      ownerOnly(state, command.uid); if (!command.idempotencyKey) fail('Lock idempotency key is required'); if (state.idempotency[command.idempotencyKey]?.kind === 'lock') return state; if (state.phase !== 'voting') fail('Voting is not open'); if ('destinationId' in command) fail('Organizer override is not allowed'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale lock');
      const explanation = explainLock(state, now); const winner = explanation.winner; const totals = clone(explanation.totals);
      state.planVersion = Number.isSafeInteger(state.planVersion) ? state.planVersion + 1 : Math.max(0, ...state.supersededPlans.map((plan) => plan.version || 0), state.activePlan?.version || 0) + 1;
      state.activePlan = generatePlan(state, winner, { version: state.planVersion, now }); state.payments = {}; state.lockedAt = now; state.phase = 'locked'; state.lockedDestinationId = winner; state.publishedTotals = totals; state.lockExplanation = explanation; state.idempotency[command.idempotencyKey] = { kind: 'lock', destinationId: winner }; return state;
    }
    case 'approvePlan': memberOnly(state, command.uid); if (!state.activePlan || command.planVersion !== state.activePlan.version || command.planRevision !== state.activePlan.revision) fail('Stale plan version or revision'); if (!['approved', 'changesRequested'].includes(command.decision)) fail('Invalid decision'); state.activePlan.approvals[command.uid] = command.decision; return state;
    case 'editPlanItem': {
      ownerOnly(state, command.uid); if (!state.activePlan || command.planVersion !== state.activePlan.version || command.planRevision !== state.activePlan.revision) fail('Stale plan version or revision');
      const allowed = new Set(['title', 'time', 'durationMinutes', 'location', 'estimatedCost', 'verificationAction']);
      if (Object.keys(command.patch || {}).some((key) => !allowed.has(key))) fail('Unsupported plan edit field');
      let found = false; let oldCost = 0; let newCost = 0; let payers = null;
      state.activePlan.itinerary.forEach((day) => { day.items = day.items.map((item) => {
        if (item.id !== command.itemId) return item; found = true; oldCost = item.estimatedCost; payers = item.attendees;
        const next = { ...item, ...command.patch, id: item.id }; newCost = next.estimatedCost;
        if (!Number.isSafeInteger(newCost) || newCost < 0 || !validScheduleItem(next)) fail('Plan costs, local time, and duration are invalid');
        for (const key of ['title', 'location', 'verificationAction']) if (typeof next[key] !== 'string' || !next[key].trim() || next[key].length > 160) fail('Plan text fields must be 1–160 characters');
        return next;
      }); });
      if (!found) fail('Plan item not found');
      const ids = approvedIds(state); const attending = (payers || ids).filter((uid) => ids.includes(uid)); const splitAmong = attending.length ? attending : ids;
      const oldSplit = allocateInteger(oldCost, splitAmong); const nextSplit = allocateInteger(newCost, splitAmong);
      state.activePlan.memberTotals = state.activePlan.memberTotals.map((member) => {
        const inDestination = member.inDestination === undefined ? undefined : member.inDestination - (oldSplit[member.uid] || 0) + (nextSplit[member.uid] || 0);
        const forex = inDestination === undefined ? member.forex || 0 : forexFor(destination(state.activePlan.destinationId), inDestination, settingsOf(state));
        const subtotal = member.subtotal - (member.forex || 0) - (oldSplit[member.uid] || 0) + (nextSplit[member.uid] || 0) + forex; const contingency = Math.ceil(subtotal / 10); const total = subtotal + contingency;
        if (total > state.constraints[member.uid].budget) fail('One or more private budgets are exceeded');
        return { ...member, subtotal, contingency, total, ...(inDestination === undefined ? {} : { inDestination, forex }) };
      });
      state.activePlan.categories.activities += newCost - oldCost;
      if (state.activePlan.categories.forex !== undefined) state.activePlan.categories.forex = state.activePlan.memberTotals.reduce((sum, member) => sum + (member.forex || 0), 0);
      state.activePlan.categories.contingency = state.activePlan.memberTotals.reduce((sum, member) => sum + member.contingency, 0);
      state.activePlan.groupTotal = state.activePlan.memberTotals.reduce((sum, member) => sum + member.total, 0);
      state.activePlan.status = hasScheduleConflict(state.activePlan) ? 'needsReview' : 'ready';
      state.activePlan.revision += 1; state.activePlan.approvals = {}; return state;
    }
    case 'setPayee': {
      ownerOnly(state, command.uid); const { kind, handle } = payments.validatePayee(command); const { currency } = settingsOf(state);
      const advance = command.advancePerPerson == null || command.advancePerPerson === '' ? null : command.advancePerPerson;
      if (advance !== null && (!Number.isSafeInteger(advance) || advance < 1 || advance > maxAmount(currency))) fail(currency === 'INR' ? 'A whole-rupee advance amount is required' : 'A whole-number advance amount is required');
      state.payee = { kind, handle, ...(kind === 'upi' ? { upiId: handle } : {}), advancePerPerson: advance }; return state;
    }
    case 'markPaid': memberOnly(state, command.uid); if (!state.activePlan || !state.payee) fail('Payment details are required first'); state.payments = { ...(state.payments || {}), [command.uid]: command.paid !== false }; return state;
    case 'addDemoMembers': ownerOnly(state, command.uid); collecting(state); return addDemoMembers(state);
    case 'reopen': ownerOnly(state, command.uid); state.payments = {}; if (state.activePlan) state.supersededPlans.push(state.activePlan); state.activePlan = null; state.lockedDestinationId = null; state.lockExplanation = null; invalidate(state); state.round += 1; return state;
    default: {
      const handler = features.commands[command.type]; if (!handler) fail(`Unsupported command: ${command.type}`);
      return handler(state, { ...command, now }, featureContext(state));
    }
  }
}

function hasScheduleConflict(plan) {
  return plan.itinerary.some((day) => {
    const timed = day.items.map((item) => {
      const [hour, minute] = item.time.split(':').map(Number); return { start: hour * 60 + minute, end: hour * 60 + minute + item.durationMinutes };
    }).sort((a, b) => a.start - b.start);
    return timed.some((item, index) => index > 0 && item.start < timed[index - 1].end);
  });
}

function validScheduleItem(item) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time || '') || !Number.isSafeInteger(item.durationMinutes) || item.durationMinutes < 1 || item.durationMinutes > 1440) return false;
  const [hour, minute] = item.time.split(':').map(Number);
  return hour * 60 + minute + item.durationMinutes <= 1440;
}

function diagnose(state, dest, now) {
  const counts = { budget: 0, passport: 0, visaTiming: 0 };
  const { homeCountry } = settingsOf(state);
  approvedIds(state).forEach((uid) => { const blocker = documentBlocker(dest, state.constraints[uid], state.startDate, state.endDate, now, homeCountry); if (blocker) counts[blocker] += 1; });
  const baseline = generatePlan(state, dest.id, { enforceBudgets: false, maxActivities: 0, skipDocumentChecks: true });
  baseline.memberTotals.forEach((member) => { if (member.total > state.constraints[member.uid].budget) counts.budget += 1; });
  return { counts, baseline };
}

// How the viewer's share moves if the last-joined other member drops out, holding the plan's activity count.
function dropoutImpact(state, viewerUid) {
  const ids = approvedIds(state); const leaving = [...ids].reverse().find((uid) => uid !== viewerUid);
  const maxActivities = state.activePlan.itinerary.flatMap((day) => day.items).filter((item) => item.templateId).length;
  const options = { enforceBudgets: false, skipDocumentChecks: true, maxActivities };
  const members = clone(state.members); delete members[leaving];
  const full = generatePlan(state, state.activePlan.destinationId, options).memberTotals.find((m) => m.uid === viewerUid).total;
  const reduced = generatePlan({ ...state, members, expectedSize: ids.length - 1 }, state.activePlan.destinationId, options).memberTotals.find((m) => m.uid === viewerUid).total;
  const current = state.activePlan.memberTotals.find((m) => m.uid === viewerUid).total; const totalIfOneDrops = current + reduced - full;
  return { increase: reduced - full, totalIfOneDrops, stillFits: totalIfOneDrops <= state.constraints[viewerUid].budget };
}

// Members see how many people attend each item and whether they do, never who skipped (skips can reveal private preferences).
function sharedPlanView(plan, viewerUid) {
  if (!plan) return null;
  const copy = clone(plan);
  copy.itinerary.forEach((day) => { day.items = day.items.map(({ attendees = [], ...item }) => ({ ...item, attendeeCount: attendees.length, iAttend: attendees.includes(viewerUid) })); });
  return copy;
}

// In-scope options for the UI, so it never needs to read the seed file directly.
function destinationSummaries(state) {
  const { homeCountry } = settingsOf(state);
  return offeredDestinations(state).map((dest) => ({
    id: dest.id, name: dest.name, country: dest.country, countryCode: dest.countryCode || null, domestic: isDomestic(dest, homeCountry), tags: [...dest.tags],
    kind: dest.stops ? 'route' : 'city', ...(dest.stops ? { stops: dest.stops.map((stop) => stop.name) } : {}),
    timeZone: dest.timeZone, officialUrl: dest.officialUrl, reviewedAt: dest.reviewedAt, visaKey: dest.visaKey || null, passportMonths: dest.passportMonths,
  }));
}

// Payee as members see it: legacy { upiId } records gain kind/handle; link is a pay link for the viewer's own amount.
function payeeView(state, viewerUid) {
  if (!state.payee) return null;
  const { currency } = settingsOf(state);
  const payee = { ...clone(state.payee), kind: state.payee.kind || 'upi', handle: state.payee.handle || state.payee.upiId };
  const mine = state.activePlan?.memberTotals.find((member) => member.uid === viewerUid)?.total || 0;
  const amount = payee.advancePerPerson ? Math.min(payee.advancePerPerson, mine) : mine;
  return { ...payee, label: payments.PAYEE_KINDS[payee.kind].label, display: payments.displayHandle(payee), link: payments.payLink(payee, { amount: amount || undefined, currency, note: `${state.name} share` }) };
}

function buildTripProjection(state, viewerUid, now = Date.now()) {
  const approved = state.members[viewerUid]?.status === 'approved';
  const pendingRequest = state.pending[viewerUid];
  const pending = pendingRequest?.status === 'pending' && pendingRequest.expiresAt > now;
  if (!approved && !pending) fail('Approved membership required');
  const settings = settingsOf(state);
  if (pending) return { schemaVersion: state.schemaVersion, id: state.id, name: state.name, startDate: state.startDate, endDate: state.endDate, expectedSize: state.expectedSize, homeCountry: settings.homeCountry, currency: settings.currency, scope: settings.scope, membershipStatus: 'pending', pendingRequest: { nickname: pendingRequest.nickname, expiresAt: pendingRequest.expiresAt } };
  const payments = state.payments || {};
  const base = { schemaVersion: state.schemaVersion, seedVersion: state.seedVersion, id: state.id, name: state.name, ownerUid: state.ownerUid, startDate: state.startDate, endDate: state.endDate, expectedSize: state.expectedSize, phase: state.phase, inputRevision: state.inputRevision, round: state.round, members: clone(state.members), submissionProgress: approvedIds(state).filter((uid) => completeConstraint(state.constraints[uid])).length, ballotProgress: Object.keys(state.ballots).length, publishedTotals: clone(state.publishedTotals), lockedDestinationId: state.lockedDestinationId, activePlan: sharedPlanView(state.activePlan, viewerUid), payee: payeeView(state, viewerUid), paymentProgress: Object.values(payments).filter(Boolean).length,
    homeCountry: settings.homeCountry, currency: settings.currency, scope: settings.scope, destinations: destinationSummaries(state), lockExplanation: clone(state.lockExplanation || null) };
  if (viewerUid === state.ownerUid) base.setupEdit = {
    canRename: state.phase === 'collecting',
    canEditStructure: state.phase === 'collecting' && !hasPlanOrMoneyHistory(state),
    reason: state.phase !== 'collecting' ? 'Trip setup is locked while voting or planning is active.' : hasPlanOrMoneyHistory(state) ? 'Only the trip name can change after a plan or money activity has started.' : null,
  };
  const ready = completeConstraint(state.constraints[viewerUid]) && approvedIds(state).length === state.expectedSize && approvedIds(state).every((uid) => completeConstraint(state.constraints[uid]));
  const destinationBoard = []; const myPrivateStatus = [];
  if (ready) {
    const ceiling = state.constraints[viewerUid].budget; const mine = state.constraints[viewerUid];
    offeredDestinations(state).forEach((dest) => {
      try {
        const { counts, baseline } = diagnose(state, dest, now);
        destinationBoard.push({ destinationId: dest.id, eligible: !counts.budget && !counts.passport && !counts.visaTiming, budgetShort: counts.budget, passport: counts.passport, visaTiming: counts.visaTiming });
        const plan = state.activePlan?.destinationId === dest.id ? state.activePlan : generatePlan(state, dest.id, { enforceBudgets: false, skipDocumentChecks: true });
        const total = plan.memberTotals.find((member) => member.uid === viewerUid).total;
        const baselineTotal = baseline.memberTotals.find((member) => member.uid === viewerUid).total;
        const blocker = documentBlocker(dest, mine, state.startDate, state.endDate, now, settings.homeCountry);
        const unlockAmount = Math.max(0, baselineTotal - ceiling);
        const fare = journeyFor(settings, mine.departureCity, localize(dest, settings.currency));
        myPrivateStatus.push({ destinationId: dest.id, total, baselineTotal, fits: !blocker && unlockAmount === 0, shortfall: unlockAmount, unlockAmount, blocker, journey: fare.amount, fareBasis: fare.basis === 'table' ? { kind: 'table' } : { kind: 'distance', km: fare.km, label: fare.label }, visa: visaSummary(dest, mine, settings) });
      } catch (error) {
        destinationBoard.push({ destinationId: dest.id, eligible: false, budgetShort: 0, passport: 0, visaTiming: 0, reason: /Trip too short/.test(error.message) ? error.message : 'Route or input issue' });
        myPrivateStatus.push({ destinationId: dest.id, total: null, fits: false, shortfall: null, action: 'Check passport or route assumptions' });
      }
    });
  }
  const myDropoutImpact = state.activePlan && approvedIds(state).length > 2 ? dropoutImpact(state, viewerUid) : null;
  return { ...base, features: features.project(state, viewerUid, featureContext(state), now), membershipStatus: 'approved', myLockedVote: state.phase === 'locked' ? state.ballots[viewerUid]?.destinationId || null : null, myConstraints: state.constraints[viewerUid] ? clone(state.constraints[viewerUid]) : null, myPrivateStatus, destinationBoard, myDropoutImpact, myPayment: Boolean(payments[viewerUid]), myBallot: state.phase === 'voting' ? state.ballots[viewerUid]?.destinationId || null : null, pendingRequests: viewerUid === state.ownerUid ? Object.values(state.pending).filter((request) => request.status === 'pending' && request.expiresAt > now).map(({ uid, nickname, expiresAt }) => ({ uid, nickname, expiresAt })) : undefined };
}

function buildTripSummary(state, viewerUid, now = Date.now()) {
  const member = state.members?.[viewerUid];
  const pending = state.pending?.[viewerUid];
  const pendingActive = pending?.status === 'pending' && pending.expiresAt > now;
  if (member?.status !== 'approved' && !pendingActive) fail('Approved membership required');
  const settings = settingsOf(state);
  return {
    id: state.id, name: state.name, startDate: state.startDate, endDate: state.endDate,
    expectedSize: state.expectedSize, joined: approvedIds(state).length, phase: state.phase,
    homeCountry: settings.homeCountry, currency: settings.currency, scope: settings.scope,
    membershipStatus: member?.status === 'approved' ? 'approved' : 'pending', role: member?.role || 'pending',
  };
}

// Helpers handed to feature modules in src/lib/features so they never import this file (no cycles).
// forexFor and documentBlocker are bound to the trip's settings (currency, home country); settings is exposed for display.
function featureContext(state = {}) {
  const settings = settingsOf(state);
  return {
    DAY, seeds, fail, clone, approvedIds, ownerOnly, memberOnly, collecting, invalidate, generatePlan, validatePlan, allocateInteger, destination, completeConstraint, dateRange, settings, maxAmount: maxAmount(settings.currency),
    documentBlocker: (dest, constraint, startDate, endDate, now) => documentBlocker(dest, constraint, startDate, endDate, now, settings.homeCountry),
    forexFor: (dest, inDestination) => forexFor(dest, inDestination, settings),
  };
}

module.exports = {
  seeds, geo, allocateInteger, createTripState, applyCommand, buildTripProjection, buildTripSummary, generatePlan, validatePlan,
  settingsOf, isDomestic, forexFor, journeyFor, normalizeTripSetup, SCOPES, FOREX_BASIS_POINTS, DEFAULT_FOREX_BASIS_POINTS,
};
