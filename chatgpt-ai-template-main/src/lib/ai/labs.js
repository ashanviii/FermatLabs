const domain = require('../collaborativeTrip');
const { searchCities, resolveCity } = require('../geo/cityDirectory.server');
const { readJsonBody } = require('../server/jsonRequest');
const { collectDiscoveryContext } = require('./agents/destination');
const { AIWorkflowError, exactKeys, fail, plainObject } = require('./contracts');
const { AIProviderError } = require('./providers/groq');

const MAX_AMOUNT = 10_000_000;
const forbiddenText = /[\p{Cc}\p{Cf}\p{Cs}<>`*\[\]{}#@]|(?:https?|ftp):|www\.|\b[\p{L}\d-]+\.[\p{L}]{2,}\b/iu;
const normalized = (value) => String(value).normalize('NFKD').replace(/\p{M}/gu, '').trim().replace(/\s+/gu, ' ').toLowerCase();

function safeText(value, maximum) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum && !forbiddenText.test(value.normalize('NFKC'));
}

function parseLabsRequest(body) {
  if (!plainObject(body) || typeof body.tripId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.tripId) ||
    typeof body.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId)) {
    fail('INVALID_REQUEST', 'A valid trip and request ID are required.');
  }
  if (body.action === 'discover' && exactKeys(body, ['action', 'tripId', 'requestId'])) return body;
  if (body.action === 'local' && exactKeys(body, ['action', 'tripId', 'requestId', 'placeId']) &&
    typeof body.placeId === 'string' && /^(?:geonames:\d{1,12}|ourairports:[A-Z0-9]{3,4})$/.test(body.placeId)) return body;
  fail('INVALID_REQUEST', 'Choose destination discovery or local-day ideas.');
}

async function readLabsRequest(request, appOrigin = process.env.FERMAT_APP_ORIGIN || new URL(request.url).origin) {
  return parseLabsRequest(await readJsonBody(request, appOrigin));
}

function assertLabsProvider(provider) {
  if (provider?.mode !== 'openai' || typeof provider.discoverDestinations !== 'function' || typeof provider.generateLocalDay !== 'function') {
    fail('AI_LABS_UNAVAILABLE', 'AI Labs requires the configured OpenAI provider.', 503);
  }
}

function range(value) {
  if (!exactKeys(value, ['low', 'high']) || !Number.isSafeInteger(value.low) || !Number.isSafeInteger(value.high) ||
    value.low < 0 || value.high < value.low || value.high > MAX_AMOUNT) fail('INVALID_LABS_RESPONSE', 'AI returned unusable cost estimates.', 502);
  return { low: value.low, high: value.high };
}

function tags(value) {
  if (!Array.isArray(value) || value.length > 8 || value.some((tag) => !safeText(tag, 40))) fail('INVALID_LABS_RESPONSE', 'AI returned unusable tags.', 502);
  const result = value.map((tag) => tag.trim());
  if (new Set(result.map(normalized)).size !== result.length) fail('INVALID_LABS_RESPONSE', 'AI returned duplicate tags.', 502);
  return result;
}

function inScope(state, countryCode) {
  const { homeCountry, scope } = domain.settingsOf(state);
  return scope === 'any' || (countryCode === homeCountry) === (scope === 'domestic');
}

async function discoverCities({ state, provider, search = searchCities }) {
  assertLabsProvider(provider);
  const { context, groupBudget } = collectDiscoveryContext(state);
  let raw;
  try { raw = await provider.discoverDestinations(structuredClone(context)); }
  catch (error) {
    if (error instanceof AIProviderError || error instanceof AIWorkflowError) throw error;
    fail('AI_LABS_UNAVAILABLE', 'Destination discovery is unavailable right now.', 503);
  }
  if (!exactKeys(raw, ['suggestions']) || !Array.isArray(raw.suggestions) || raw.suggestions.length < 3 || raw.suggestions.length > 5) {
    fail('INVALID_LABS_RESPONSE', 'AI returned an unusable destination shortlist.', 502);
  }
  const seen = new Set(); const suggestions = [];
  for (const item of raw.suggestions) {
    if (!exactKeys(item, ['name', 'countryCode', 'reason', 'estimatedPerPerson', 'tags']) || !safeText(item.name, 120) ||
      !/^[A-Z]{2}$/.test(item.countryCode || '') || !safeText(item.reason, 300)) continue;
    let results;
    try { results = await search(item.name, context.homeCountry); } catch { continue; }
    const place = results?.cities?.find((city) => normalized(city.name) === normalized(item.name) && city.countryCode === item.countryCode);
    if (!place || seen.has(place.id) || !inScope(state, place.countryCode)) continue;
    let estimate; let itemTags;
    try { estimate = range(item.estimatedPerPerson); itemTags = tags(item.tags); } catch { continue; }
    seen.add(place.id);
    suggestions.push({ placeId: place.id, name: place.name, label: place.label, countryCode: place.countryCode,
      reason: item.reason.trim(), estimatedPerPerson: estimate, tags: itemTags,
      withinCombinedBudget: estimate.high * context.groupSize <= groupBudget });
  }
  if (suggestions.length < 2) fail('INVALID_LABS_RESPONSE', 'AI could not produce enough canonical cities. Try again.', 502);
  return { suggestions, currency: context.currency, generatedAt: Date.now(), estimateNotice: 'Generated estimates only; verify current fares, routes and prices.' };
}

function minutes(value) {
  if (typeof value !== 'string' || !/^(?:0[89]|1\d|2[0-2]):[0-5]\d$/.test(value)) return NaN;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

async function localDayIdeas({ state, placeId, provider, resolvePlace = resolveCity }) {
  assertLabsProvider(provider);
  let place;
  try { place = await resolvePlace(placeId); } catch { fail('PLACE_UNAVAILABLE', 'Search and select an available city.', 400); }
  if (!place || place.id !== placeId) fail('PLACE_UNAVAILABLE', 'Choose an available city.', 400);
  const { context } = collectDiscoveryContext(state);
  const input = { ...context, city: { name: place.name, label: place.label, countryCode: place.countryCode } };
  let raw;
  try { raw = await provider.generateLocalDay(structuredClone(input)); }
  catch (error) {
    if (error instanceof AIProviderError || error instanceof AIWorkflowError) throw error;
    fail('AI_LABS_UNAVAILABLE', 'Local-day ideas are unavailable right now.', 503);
  }
  if (!exactKeys(raw, ['summary', 'caveats', 'ideas']) || !safeText(raw.summary, 500) || !Array.isArray(raw.caveats) ||
    raw.caveats.length < 1 || raw.caveats.length > 5 || raw.caveats.some((value) => !safeText(value, 240)) ||
    !Array.isArray(raw.ideas) || raw.ideas.length < 3 || raw.ideas.length > 6) fail('INVALID_LABS_RESPONSE', 'AI returned an unusable local-day plan.', 502);
  const seen = new Set();
  const ideas = raw.ideas.map((item) => {
    if (!exactKeys(item, ['title', 'area', 'time', 'durationMinutes', 'estimatedPerPerson', 'tags']) || !safeText(item.title, 140) ||
      !safeText(item.area, 140) || !Number.isSafeInteger(item.durationMinutes) || item.durationMinutes < 30 || item.durationMinutes > 240) {
      fail('INVALID_LABS_RESPONSE', 'AI returned an unusable local-day stop.', 502);
    }
    const start = minutes(item.time); const key = normalized(item.title);
    if (!Number.isFinite(start) || start + item.durationMinutes > 23 * 60 || seen.has(key)) fail('INVALID_LABS_RESPONSE', 'AI returned an invalid local-day schedule.', 502);
    seen.add(key);
    return { title: item.title.trim(), area: item.area.trim(), time: item.time, durationMinutes: item.durationMinutes,
      estimatedPerPerson: range(item.estimatedPerPerson), tags: tags(item.tags) };
  }).sort((left, right) => left.time.localeCompare(right.time));
  for (let index = 1; index < ideas.length; index += 1) {
    if (minutes(ideas[index].time) < minutes(ideas[index - 1].time) + ideas[index - 1].durationMinutes) {
      fail('INVALID_LABS_RESPONSE', 'AI returned overlapping local-day stops.', 502);
    }
  }
  return { city: { placeId: place.id, name: place.name, label: place.label, countryCode: place.countryCode },
    summary: raw.summary.trim(), caveats: raw.caveats.map((value) => value.trim()), ideas,
    currency: context.currency, generatedAt: Date.now(), estimateNotice: 'Generated estimates only; verify opening hours, access and prices.' };
}

module.exports = { parseLabsRequest, readLabsRequest, assertLabsProvider, discoverCities, localDayIdeas };
