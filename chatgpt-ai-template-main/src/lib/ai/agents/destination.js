const { seeds, settingsOf } = require('../../collaborativeTrip');
const geo = require('../../geo');
const { AIWorkflowError, exactKeys, plainObject } = require('../contracts');
const { assertServerOnly, AIProviderError } = require('../providers/groq');

const MODES = ['bus', 'train', 'car', 'flight'];
const INTERESTS = new Set(seeds.destinations.flatMap((destination) => destination.tags));
const MAX_AMOUNT = 10_000_000;
const DAY_MS = 86_400_000;
const invalidDraft = () => { throw new AIWorkflowError('INVALID_DESTINATION_DRAFT', 'AI returned an unusable destination suggestion. Try again.', 502); };
const invalidContext = () => { throw new AIWorkflowError('DESTINATION_CONTEXT_REQUIRED', 'Complete the trip settings and every approved traveller\'s private details first.', 409); };
const normalized = (value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
const forbiddenText = /[\p{Cc}\p{Cf}\p{Cs}<>`*\[\]{}#@]|(?:https?|ftp):|www\.|\b[\p{L}\d-]+\.[\p{L}]{2,}\b/iu;
const unsupportedClaim = /\b(?:verified|confirmed|guaranteed|live|real[- ]time|official)\s+(?:(?:return|train|bus|car|flight|operator)\s+)?(?:fares?|prices?|quotes?|routes?|services?|availability|departures?|schedules?)\b|\b(?:fares?|prices?|routes?|services?)\s+(?:(?:are|is)\s+)?(?:verified|confirmed|guaranteed)\b|\b(?:operated by|operates?|runs? daily|testimonials?|scraped|according to|sourced from|I visited|we visited|travellers? recommend|travelers? recommend)\b/iu;

function safeText(value, maximum) {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum &&
    value.trim().length > 0 && !forbiddenText.test(value.normalize('NFKC'));
}

function canonicalPlace(place) {
  if (!plainObject(place) || typeof place.id !== 'string' || !/^(?:geonames:\d{1,12}|ourairports:[A-Z0-9]{3,4})$/.test(place.id) ||
    (place.source !== undefined && !['GeoNames', 'OurAirports'].includes(place.source)) || !safeText(place.name, 200) ||
    (place.label !== undefined && !safeText(place.label, 400)) || !geo.isCountry(place.countryCode) ||
    !Number.isFinite(place.lat) || Math.abs(place.lat) > 90 || !Number.isFinite(place.lon) || Math.abs(place.lon) > 180) invalidContext();
  return { id: place.id, name: place.name, label: place.label || place.name, countryCode: place.countryCode, lat: place.lat, lon: place.lon };
}

function departureFor(constraint) {
  if (constraint.departurePlaceId !== undefined) {
    const place = constraint.departurePlace;
    if (!plainObject(place) || !['GeoNames', 'OurAirports'].includes(place.source) || place.id !== constraint.departurePlaceId ||
      typeof place.id !== 'string' || !/^(?:geonames:\d{1,12}|ourairports:[A-Z0-9]{3,4})$/.test(place.id) ||
      !safeText(place.label, 400) || constraint.departureCity !== place.label || !geo.isCountry(place.countryCode) ||
      !Number.isFinite(place.lat) || Math.abs(place.lat) > 90 || !Number.isFinite(place.lon) || Math.abs(place.lon) > 180 ||
      (place.name !== undefined && !safeText(place.name, 200))) invalidContext();
    return { city: place.name || place.label, label: place.label, countryCode: place.countryCode };
  }
  if (!safeText(constraint.departureCity, 400)) invalidContext();
  const city = geo.departureCity(constraint.departureCity);
  if (city) return { city: city.name, label: [city.name, city.region, geo.countryName(city.countryCode)].filter(Boolean).join(', '), countryCode: city.countryCode };
  if (Object.hasOwn(seeds.departureCities, constraint.departureCity)) return { city: constraint.departureCity, label: `${constraint.departureCity}, ${geo.countryName('IN')}`, countryCode: 'IN' };
  invalidContext();
}

function completeDetails(constraint, currency) {
  if (!plainObject(constraint)) return false;
  const passportValid = constraint.passportCountry === undefined ? constraint.hasIndianPassport === true
    : geo.isCountry(constraint.passportCountry) && (constraint.hasIndianPassport === undefined || constraint.hasIndianPassport === (constraint.passportCountry === 'IN'));
  return Number.isSafeInteger(constraint.budget) && constraint.budget > 0 &&
    constraint.budget <= Math.max(MAX_AMOUNT, geo.convert(MAX_AMOUNT, seeds.currency, currency)) &&
    constraint.datesConfirmed === true && passportValid &&
    (constraint.passportExpiry === 'none' || /^\d{4}-(0[1-9]|1[0-2])$/.test(constraint.passportExpiry || '')) &&
    Array.isArray(constraint.preferences) && constraint.preferences.length > 0 && constraint.preferences.length <= INTERESTS.size &&
    new Set(constraint.preferences).size === constraint.preferences.length && constraint.preferences.every((tag) => INTERESTS.has(tag) && safeText(tag, 40)) &&
    Array.isArray(constraint.visas) && constraint.visas.length <= Object.keys(seeds.holdableVisas).length &&
    new Set(constraint.visas).size === constraint.visas.length && constraint.visas.every((visa) => Object.hasOwn(seeds.holdableVisas, visa));
}

function dateMillis(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalidContext();
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalidContext();
  return date.getTime();
}

function collectDestinationContext(state, place) {
  assertServerOnly();
  const destination = canonicalPlace(place);
  if (!plainObject(state) || !plainObject(state.members) || !plainObject(state.constraints) ||
    !Number.isInteger(state.expectedSize) || state.expectedSize < 2 || state.expectedSize > 20) invalidContext();
  const settings = settingsOf(state);
  if (!geo.isCountry(settings.homeCountry) || !geo.isCurrency(settings.currency)) invalidContext();
  const days = (dateMillis(state.endDate) - dateMillis(state.startDate)) / DAY_MS + 1;
  if (!Number.isInteger(days) || days < 2 || days > 31) invalidContext();
  const roster = Object.entries(state.members).filter(([, member]) => member?.status === 'approved');
  if (roster.length !== state.expectedSize) throw new AIWorkflowError('ROSTER_INCOMPLETE', 'Approve the full trip roster before requesting destinations.', 409);
  if (roster.some(([uid, member]) => !plainObject(member) || !uid || member.uid !== uid || !Number.isSafeInteger(member.joinOrder) || member.joinOrder < 0)) invalidContext();
  roster.sort((left, right) => left[1].joinOrder - right[1].joinOrder);
  const travellerIds = {};
  const travellers = roster.map(([uid, member], index) => {
    const constraint = state.constraints[uid];
    if (!completeDetails(constraint, settings.currency)) invalidContext();
    const consent = constraint.aiPlanningConsent ?? (member.demo === true ? true : undefined);
    if (consent !== true) throw new AIWorkflowError('AI_CONSENT_REQUIRED', 'Every real traveller must explicitly consent before departure cities and preferences are shared with the configured AI provider.', 409);
    const modes = constraint.transportModes === undefined && member.demo === true ? MODES : constraint.transportModes;
    if (!Array.isArray(modes) || !modes.length || modes.length > MODES.length || new Set(modes).size !== modes.length || !modes.every((mode) => MODES.includes(mode))) {
      throw new AIWorkflowError('TRANSPORT_MODES_REQUIRED', 'Every traveller must choose at least one supported transport mode before AI planning.', 409);
    }
    const ref = `traveller-${index + 1}`;
    travellerIds[ref] = uid;
    return { ref, departure: departureFor(constraint), transportModes: [...modes], interests: constraint.preferences.slice(0, 8), ...(member.demo === true ? { synthetic: true } : {}) };
  });
  return {
    context: { destination: { name: destination.name, label: destination.label, countryCode: destination.countryCode }, currency: settings.currency,
      days, nights: days - 1, travelMonth: new Date(`${state.startDate}T00:00:00Z`).getUTCMonth() + 1, travellers },
    travellerIds,
  };
}

function text(value, maximum) {
  if (!safeText(value, maximum) || unsupportedClaim.test(value.normalize('NFKC'))) invalidDraft();
  return value.trim();
}

function integer(value, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) invalidDraft();
  return value;
}

function range(value) {
  if (!exactKeys(value, ['low', 'high'])) invalidDraft();
  const low = integer(value.low, 0, MAX_AMOUNT);
  const high = integer(value.high, low, MAX_AMOUNT);
  return { low, high };
}

function tags(value) {
  if (!Array.isArray(value) || value.length > 8) invalidDraft();
  const result = value.map((tag) => text(tag, 40));
  if (new Set(result.map(normalized)).size !== result.length) invalidDraft();
  return result;
}

function validateDraft(value, context) {
  if (!exactKeys(value, ['summary', 'caveats', 'tags', 'costs', 'roomCapacity', 'vehicleCapacity', 'activities', 'journeys']) ||
    !exactKeys(value.costs, ['roomNight', 'foodDay', 'localTransportDay', 'insurance']) ||
    !Array.isArray(value.caveats) || value.caveats.length < 1 || value.caveats.length > 8 ||
    !Array.isArray(value.activities) || value.activities.length > 12 ||
    !Array.isArray(value.journeys) || value.journeys.length !== context.travellers.length) invalidDraft();
  const summary = text(value.summary, 600);
  const caveats = value.caveats.map((caveat) => text(caveat, 300));
  const costs = Object.fromEntries(Object.entries(value.costs).map(([key, cost]) => [key, range(cost)]));
  const destinationTags = tags(value.tags);
  const roomCapacity = integer(value.roomCapacity, 1, 6);
  const vehicleCapacity = integer(value.vehicleCapacity, 1, 20);
  const seenActivities = new Set();
  const activities = value.activities.map((activity) => {
    if (!exactKeys(activity, ['title', 'location', 'durationMinutes', 'cost', 'tags'])) invalidDraft();
    const title = text(activity.title, 160);
    const key = normalized(title).replace(/[\p{P}\p{Z}]/gu, '');
    if (!key || seenActivities.has(key)) invalidDraft();
    seenActivities.add(key);
    return { title, location: text(activity.location, 160), durationMinutes: integer(activity.durationMinutes, 15, 180), cost: range(activity.cost), tags: tags(activity.tags) };
  });
  const seenTravellers = new Set();
  const journeys = value.journeys.map((journey) => {
    if (!exactKeys(journey, ['travellerRef', 'mode', 'returnFare', 'oneWayMinutes', 'note'])) invalidDraft();
    const traveller = context.travellers.find((candidate) => candidate.ref === journey.travellerRef);
    if (!traveller || seenTravellers.has(traveller.ref) || !traveller.transportModes.includes(journey.mode)) invalidDraft();
    seenTravellers.add(traveller.ref);
    return { travellerRef: traveller.ref, mode: journey.mode, returnFare: journey.returnFare === null ? null : range(journey.returnFare),
      oneWayMinutes: journey.oneWayMinutes === null ? null : integer(journey.oneWayMinutes, 1, 10080), note: text(journey.note, 300) };
  });
  const publicText = normalized(JSON.stringify([summary, caveats, destinationTags, activities]));
  if (context.travellers.some(({ departure }) => normalized(departure.city) !== normalized(context.destination.name) && publicText.includes(normalized(departure.city)))) invalidDraft();
  return { summary, caveats, tags: destinationTags, costs, roomCapacity, vehicleCapacity, activities, journeys };
}

async function generateDestinationDraft({ state, place, provider, draftId, now = Date.now }) {
  const { context, travellerIds } = collectDestinationContext(state, place);
  if (typeof draftId !== 'string' || !/^ai-[a-f0-9]{1,64}$/.test(draftId) || typeof now !== 'function') {
    throw new AIWorkflowError('INVALID_DESTINATION_REQUEST', 'A server-generated destination ID and clock are required.');
  }
  if (!['groq', 'openai'].includes(provider?.mode) || typeof provider.generateDestination !== 'function') {
    throw new AIWorkflowError('AI_DESTINATION_UNAVAILABLE', 'Destination suggestions require a configured AI provider. No simulated fallback is available.', 503);
  }
  const destination = canonicalPlace(place);
  const domestic = destination.countryCode === settingsOf(state).homeCountry;
  const origins = Object.fromEntries(Object.entries(travellerIds).map(([ref, uid]) => [ref, state.constraints[uid].departurePlaceId || state.constraints[uid].departureCity]));
  let raw;
  try {
    raw = await provider.generateDestination(structuredClone(context));
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    throw new AIWorkflowError('AI_DESTINATION_UNAVAILABLE', 'The AI provider could not generate a destination suggestion right now.', 503);
  }
  const draft = validateDraft(raw, context);
  const generatedAt = now();
  if (!Number.isSafeInteger(generatedAt) || generatedAt < 0) throw new AIWorkflowError('INVALID_DESTINATION_REQUEST', 'A valid generation time is required.');
  const journeyQuotes = Object.fromEntries(draft.journeys.map((journey) => [travellerIds[journey.travellerRef], {
    amount: journey.returnFare?.high ?? null, low: journey.returnFare?.low ?? null, high: journey.returnFare?.high ?? null,
    mode: journey.mode, oneWayMinutes: journey.oneWayMinutes, label: journey.note, basis: 'ai-estimate', status: 'unverified', origin: origins[journey.travellerRef],
  }]));
  return {
    id: draftId, placeId: destination.id, name: destination.label, country: geo.countryName(destination.countryCode),
    countryCode: destination.countryCode, lat: destination.lat, lon: destination.lon, domestic,
    costCurrency: context.currency, timeZone: 'Local time', tags: draft.tags,
    roomNight: draft.costs.roomNight.high, roomCapacity: draft.roomCapacity,
    vehicleDay: draft.costs.localTransportDay.high, vehicleCapacity: draft.vehicleCapacity,
    foodDay: draft.costs.foodDay.high, insurance: draft.costs.insurance.high,
    ...(domestic ? { entryAllowance: 0 } : {}), passportMonths: 6,
    activities: draft.activities.map((activity, index) => ({ id: `${draftId}-activity-${index}`, title: activity.title, location: activity.location,
      durationMinutes: activity.durationMinutes, costPerPerson: activity.cost.high, tags: activity.tags })),
    journeyQuotes,
    provenance: { kind: 'ai-estimate', provider: provider.mode, generatedAt, verified: false, summary: draft.summary,
      caveats: draft.caveats, costRanges: draft.costs },
  };
}

module.exports = { collectDestinationContext, generateDestinationDraft };
