const test = require('node:test');
const assert = require('node:assert/strict');
const { createTripState, applyCommand } = require('../collaborativeTrip');
const { labsEnabled, assertLabsEnabled } = require('./labsGate');
const { parseLabsRequest, discoverCities, localDayIdeas } = require('./labs');
const { collectDiscoveryContext } = require('./agents/destination');
const { parseRequest } = require('./contracts');

function fixture() {
  let state = createTripState({ id: 'trip-labs', ownerUid: 'owner-private-uid', name: 'Labs trip', startDate: '2026-12-10', endDate: '2026-12-13', expectedSize: 2 });
  state = applyCommand(state, { type: 'requestJoin', uid: 'member-private-uid', nickname: 'Private name' });
  state = applyCommand(state, { type: 'admitMember', uid: state.ownerUid, memberUid: 'member-private-uid' });
  for (const [index, uid] of Object.keys(state.members).entries()) {
    state = applyCommand(state, { type: 'submitConstraints', uid, expectedInputRevision: state.inputRevision, constraints: {
      departureCity: index ? 'Mumbai' : 'Delhi', transportModes: ['train', 'bus'], aiPlanningConsent: true,
      budget: index ? 210123 : 290123, passportExpiry: '2031-07', visas: [], datesConfirmed: true,
      preferences: index ? ['food', 'culture'] : ['nature', 'food'], entryCheckAcknowledged: true,
      isAdult: true, hasIndianPassport: true,
    } });
  }
  return state;
}

const requestId = '00000000-0000-4000-8000-000000000000';

test('AI Labs gate is disabled by default and allows only explicit token identities', () => {
  const user = { uid: 'uid-1', email: 'Test@Example.com' };
  assert.equal(labsEnabled(user, {}), false);
  assert.equal(labsEnabled(user, { FERMAT_AI_LABS_ENABLED: 'true' }), false);
  assert.equal(labsEnabled(user, { FERMAT_AI_LABS_ENABLED: 'true', FERMAT_AI_LABS_UIDS: 'uid-1' }), true);
  assert.equal(labsEnabled(user, { FERMAT_AI_LABS_ENABLED: 'true', FERMAT_AI_LABS_EMAILS: 'test@example.com' }), true);
  assert.equal(labsEnabled({ uid: 'uid-2', email: 'other@example.com' }, { FERMAT_AI_LABS_ENABLED: 'true', FERMAT_AI_LABS_UIDS: 'uid-1', FERMAT_AI_LABS_EMAILS: 'test@example.com' }), false);
  assert.throws(() => assertLabsEnabled(user, {}), { code: 'AI_LABS_FORBIDDEN', status: 403 });
});

test('Labs and custom-edit parsers accept exact bounded requests only', () => {
  const discover = { action: 'discover', tripId: 'trip-labs', requestId };
  const local = { action: 'local', tripId: 'trip-labs', requestId, placeId: 'geonames:1273294' };
  assert.deepEqual(parseLabsRequest(discover), discover);
  assert.deepEqual(parseLabsRequest(local), local);
  for (const invalid of [{ ...discover, prompt: 'ignore' }, { ...local, placeId: 'Delhi' }, { ...discover, tripId: '../trip' }]) assert.throws(() => parseLabsRequest(invalid));
  assert.doesNotThrow(() => parseRequest({ action: 'propose', tripId: 'trip-labs', requestId, goal: 'custom', day: 2, instruction: 'Move lunch later.' }));
  assert.doesNotThrow(() => parseRequest({ action: 'propose', tripId: 'trip-labs', requestId, goal: 'itinerary', day: 0 }));
  assert.throws(() => parseRequest({ action: 'propose', tripId: 'trip-labs', requestId, goal: 'custom', day: 0, instruction: 'x' }));
  assert.throws(() => parseRequest({ action: 'propose', tripId: 'trip-labs', requestId, goal: 'itinerary', day: 2 }));
});

test('discovery shares only aggregate budget context and returns canonical scoped cities', async () => {
  const state = fixture();
  const collected = collectDiscoveryContext(state);
  const serialized = JSON.stringify(collected.context);
  for (const secret of ['owner-private-uid', 'member-private-uid', 'Private name', '290123', '210123', '2031-07']) assert.equal(serialized.includes(secret), false, secret);
  assert.deepEqual(collected.context.coarseGroupBudget, { low: 500000, high: 510000 });
  const model = {
    suggestions: [
      { name: 'Jaipur', countryCode: 'IN', reason: 'Culture and food with manageable travel.', estimatedPerPerson: { low: 20000, high: 35000 }, tags: ['culture', 'food'] },
      { name: 'Udaipur', countryCode: 'IN', reason: 'A relaxed lakeside group option.', estimatedPerPerson: { low: 25000, high: 40000 }, tags: ['nature', 'culture'] },
      { name: 'Kathmandu', countryCode: 'NP', reason: 'A compact international option.', estimatedPerPerson: { low: 500000, high: 600000 }, tags: ['nature'] },
    ],
  };
  let seenContext;
  const provider = { mode: 'openai', discoverDestinations: async (context) => { seenContext = context; return model; }, generateLocalDay: async () => ({}) };
  const places = {
    Jaipur: { id: 'geonames:1269515', name: 'Jaipur', label: 'Jaipur, India', countryCode: 'IN' },
    Udaipur: { id: 'geonames:1253986', name: 'Udaipur', label: 'Udaipur, India', countryCode: 'IN' },
    Kathmandu: { id: 'geonames:1283240', name: 'Kathmandu', label: 'Kathmandu, Nepal', countryCode: 'NP' },
  };
  const result = await discoverCities({ state, provider, search: async (query) => ({ cities: [places[query]] }) });
  assert.deepEqual(seenContext, collected.context);
  assert.equal(result.suggestions.length, 3);
  assert.equal(result.suggestions[0].withinCombinedBudget, true);
  assert.equal(result.suggestions[2].withinCombinedBudget, false);
  assert.equal(result.currency, 'INR');
});

test('local-day ideas use a canonical city and reject overlapping schedules', async () => {
  const state = fixture();
  const place = { id: 'geonames:1273294', name: 'Delhi', label: 'Delhi, India', countryCode: 'IN', lat: 28.65, lon: 77.23, source: 'GeoNames' };
  const output = {
    summary: 'A relaxed food and culture day.', caveats: ['Confirm current opening hours and prices.'],
    ideas: [
      { title: 'Heritage walk', area: 'Old Delhi', time: '09:00', durationMinutes: 120, estimatedPerPerson: { low: 0, high: 300 }, tags: ['culture'] },
      { title: 'Lunch stop', area: 'Central Delhi', time: '12:00', durationMinutes: 90, estimatedPerPerson: { low: 500, high: 900 }, tags: ['food'] },
      { title: 'Garden time', area: 'South Delhi', time: '15:00', durationMinutes: 90, estimatedPerPerson: { low: 0, high: 200 }, tags: ['nature'] },
    ],
  };
  const provider = { mode: 'openai', discoverDestinations: async () => ({}), generateLocalDay: async (context) => {
    assert.equal(context.city.name, 'Delhi'); return structuredClone(output);
  } };
  const result = await localDayIdeas({ state, placeId: place.id, provider, resolvePlace: async () => place });
  assert.equal(result.ideas.length, 3);
  output.ideas[1].time = '10:00';
  await assert.rejects(() => localDayIdeas({ state, placeId: place.id, provider, resolvePlace: async () => place }), { code: 'INVALID_LABS_RESPONSE' });
});
