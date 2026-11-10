const test = require('node:test');
const assert = require('node:assert/strict');
const { createTripState, applyCommand, seeds } = require('../collaborativeTrip');
const { AIWorkflowError } = require('./contracts');
const { collectDestinationContext, generateDestinationDraft } = require('./agents/destination');

const place = { id: 'geonames:667268', name: 'Sibiu', label: 'Sibiu, Romania', countryCode: 'RO', lat: 45.7983, lon: 24.1256, source: 'GeoNames' };
const departure = { id: 'geonames:1262321', name: 'Mysuru', label: 'Mysuru, Karnataka, India', countryCode: 'IN', lat: 12.2979, lon: 76.6393, source: 'GeoNames' };
const draftId = 'ai-012345abcdef';
const now = () => 1_794_268_800_000;

function fixture() {
  let state = createTripState({ id: 'private-trip-id', ownerUid: 'private-owner-uid', name: 'Private family surname', startDate: '2026-12-10', endDate: '2026-12-14', expectedSize: 2 });
  state = applyCommand(state, { type: 'requestJoin', uid: 'private-member-uid', nickname: 'Private member name' });
  state = applyCommand(state, { type: 'admitMember', uid: state.ownerUid, memberUid: 'private-member-uid' });
  for (const [index, uid] of Object.keys(state.members).entries()) {
    state = applyCommand(state, { type: 'submitConstraints', uid, expectedInputRevision: state.inputRevision, constraints: {
      departureCity: index === 0 ? departure.label : 'Delhi', ...(index === 0 ? { departurePlaceId: departure.id, departurePlace: { ...departure } } : {}),
      transportModes: index === 0 ? ['bus'] : ['train'], aiPlanningConsent: true,
      budget: index === 0 ? 871234 : 972345, passportExpiry: '2031-07', visas: [], datesConfirmed: true,
      preferences: ['food', 'culture'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true,
    } });
  }
  return state;
}

function modelDraft() {
  return {
    summary: 'Consider Sibiu for its old town and food, allowing time for a slower visit.',
    caveats: ['All costs are unverified estimates, not quotes.', 'Check transport routes, prices and opening hours independently.'],
    tags: ['food', 'culture'],
    costs: { roomNight: { low: 2000, high: 4500 }, foodDay: { low: 600, high: 1200 }, localTransportDay: { low: 300, high: 900 }, insurance: { low: 200, high: 600 } },
    roomCapacity: 2, vehicleCapacity: 4,
    activities: [{ title: 'Old town walk', location: 'Historic centre', durationMinutes: 90, cost: { low: 0, high: 400 }, tags: ['culture'] }],
    journeys: [
      { travellerRef: 'traveller-1', mode: 'bus', returnFare: { low: 4000, high: 8000 }, oneWayMinutes: 480, note: 'Unverified estimate; check the route and fare independently.' },
      { travellerRef: 'traveller-2', mode: 'train', returnFare: null, oneWayMinutes: null, note: 'Route and fare are unknown; check independently.' },
    ],
  };
}

function generate(state = fixture(), value = modelDraft(), overrides = {}) {
  return generateDestinationDraft({ state, place, draftId, now, provider: { mode: 'groq', generateDestination: async () => value }, ...overrides });
}

function safeError(code) {
  return (error) => {
    assert.ok(error instanceof AIWorkflowError);
    if (code) assert.equal(error.code, code);
    assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, /private-|871234|972345|2031-07|secret-provider/);
    assert.equal(error.cause, undefined);
    return true;
  };
}

test.beforeEach((suite) => {
  suite.mock.method(globalThis, 'fetch', () => { throw new Error('External calls are forbidden in destination tests'); });
});

test('AI trips support countries without seeds and cannot vote before adding a draft', () => {
  const domain = require('../collaborativeTrip');
  const state = domain.createTripState({ id: 'ai-trip', ownerUid: 'owner', name: 'Dynamic trip', startDate: '2026-12-10', endDate: '2026-12-14', expectedSize: 2, homeCountry: 'RO', scope: 'domestic', planningMode: 'ai' });
  assert.deepEqual(domain.buildTripProjection(state, 'owner').destinations, []);
  assert.equal(domain.buildTripProjection(state, 'owner').planningMode, 'ai');
});

test('generated non-catalog destination votes, locks, supports edits and preserves private bus/train fares', async () => {
  const domain = require('../collaborativeTrip');
  let state = fixture();
  const value = modelDraft();
  value.journeys[1].returnFare = { low: 500, high: 900 };
  value.journeys[1].oneWayMinutes = 180;
  const city = { ...place, name: 'Bhatkal', label: 'Bhatkal, Karnataka, India', countryCode: 'IN', lat: 13.9853, lon: 74.5553 };
  const draft = await generate(state, value, { place: city });
  assert.equal(seeds.destinations.some((entry) => entry.id === draft.id), false);
  state = domain.applyCommand(state, { type: 'addGeneratedDestination', uid: state.ownerUid, expectedInputRevision: state.inputRevision, destination: draft });
  const view = domain.buildTripProjection(state, state.ownerUid);
  assert.equal(view.destinations.length, 1);
  assert.equal(view.myPrivateStatus[0].fareBasis.mode, 'bus');
  assert.equal(domain.buildTripProjection(state, 'private-member-uid').myPrivateStatus[0].fareBasis.mode, 'train');
  assert.doesNotMatch(JSON.stringify(view), /journeyQuotes|972345|"origin":"Delhi"/);
  state = domain.applyCommand(state, { type: 'openVoting', uid: state.ownerUid, expectedInputRevision: state.inputRevision });
  for (const uid of Object.keys(state.members)) state = domain.applyCommand(state, { type: 'vote', uid, destinationId: draft.id, round: state.round, inputRevision: state.inputRevision });
  state = domain.applyCommand(state, { type: 'lock', uid: state.ownerUid, round: state.round, inputRevision: state.inputRevision, idempotencyKey: 'dynamic-lock' });
  assert.equal(state.activePlan.destinationId, draft.id);
  assert.equal(state.activePlan.categories.journeys, 8900);
  assert.equal(state.activePlan.provenance.verified, false);
  assert.deepEqual(domain.validatePlan(state.activePlan), []);
  const item = state.activePlan.itinerary.flatMap((day) => day.items).find((entry) => entry.templateId);
  const edited = domain.applyCommand(state, { type: 'applyPlanSuggestion', uid: state.ownerUid, inputRevision: state.inputRevision, planVersion: state.activePlan.version, planRevision: state.activePlan.revision, operations: [{ kind: 'remove', itemId: item.id }] });
  assert.equal(edited.activePlan.revision, 2);
  assert.deepEqual(domain.validatePlan(edited.activePlan), []);
});

test('changed inputs invalidate AI choices and unknown fares never fall back to airfare bands', async () => {
  const domain = require('../collaborativeTrip');
  let state = fixture();
  const draft = await generate(state);
  state = domain.applyCommand(state, { type: 'addGeneratedDestination', uid: state.ownerUid, expectedInputRevision: state.inputRevision, destination: draft });
  assert.throws(() => domain.generatePlan(state, draft.id), /departure route/);
  assert.equal(domain.buildTripProjection(state, state.ownerUid).destinationBoard[0].eligible, false);
  state = domain.applyCommand(state, { type: 'updateBudget', uid: state.ownerUid, expectedInputRevision: state.inputRevision, budget: 900000 });
  assert.deepEqual(domain.buildTripProjection(state, state.ownerUid).destinations, []);
  assert.deepEqual(state.dynamicDestinations, {});
  assert.throws(() => domain.generatePlan(state, draft.id), /Unknown destination/);
  assert.throws(() => domain.applyCommand(state, { type: 'openVoting', uid: state.ownerUid, expectedInputRevision: state.inputRevision }), /draft/);
});

test('replacing one destination repeatedly does not exhaust the shortlist or retain old private journeys', async () => {
  const domain = require('../collaborativeTrip');
  let state = fixture();
  for (let index = 0; index < 15; index += 1) {
    const draft = await generate(state, modelDraft(), { draftId: `ai-${index.toString(16)}` });
    state = domain.applyCommand(state, { type: 'addGeneratedDestination', uid: state.ownerUid, expectedInputRevision: state.inputRevision, destination: draft });
    assert.equal(Object.keys(state.dynamicDestinations).length, 1);
    assert.deepEqual(state.dynamicDestinationIds, [draft.id]);
  }
});

test('saving modes on legacy catalog inputs preserves explicitly labelled legacy estimates', () => {
  const domain = require('../collaborativeTrip');
  const state = fixture();
  const view = domain.buildTripProjection(state, state.ownerUid);
  assert.equal(view.planningMode, 'catalog');
  assert.ok(view.myPrivateStatus.some((option) => ['table', 'distance'].includes(option.fareBasis?.kind)));
});

test('context contains only anonymous approved traveller preferences, modes and coarse trip timing', () => {
  const state = fixture();
  state.instructions = 'Private raw instructions';
  state.payee = { email: 'private-email@example.invalid' };
  state.members[state.ownerUid].email = 'private-email@example.invalid';
  state.constraints[state.ownerUid].rawInstructions = 'Private constraints instructions';
  state.members.pending = { uid: 'private-pending-uid', nickname: 'Private pending name', status: 'pending', joinOrder: 2 };
  const original = structuredClone(state);
  const result = collectDestinationContext(state, place);
  assert.deepEqual(result.context, {
    destination: { name: 'Sibiu', label: 'Sibiu, Romania', countryCode: 'RO' }, currency: 'INR', days: 5, nights: 4, travelMonth: 12,
    travellers: [
      { ref: 'traveller-1', departure: { city: 'Mysuru', label: 'Mysuru, Karnataka, India', countryCode: 'IN' }, transportModes: ['bus'], interests: ['food', 'culture'] },
      { ref: 'traveller-2', departure: { city: 'Delhi', label: 'Delhi, India', countryCode: 'IN' }, transportModes: ['train'], interests: ['food', 'culture'] },
    ],
  });
  assert.deepEqual(result.travellerIds, { 'traveller-1': 'private-owner-uid', 'traveller-2': 'private-member-uid' });
  const payload = JSON.stringify(result.context);
  for (const forbidden of ['private-', 'Private', '871234', '972345', '2031-07', '2026-12-10', '2026-12-14', 'budget', 'passport', 'email', 'instructions', 'geonames:', '76.6393']) assert.equal(payload.includes(forbidden), false, forbidden);
  result.context.travellers[0].transportModes.push('flight');
  result.context.travellers[0].interests.push('extra');
  assert.deepEqual(state, original);
});

test('same-name canonical cities have distinct destination and departure contexts', () => {
  const cities = [
    { id: 'geonames:4250542', name: 'Springfield', label: 'Springfield, Illinois, United States', countryCode: 'US', lat: 39.8017, lon: -89.6437, source: 'GeoNames' },
    { id: 'geonames:4951788', name: 'Springfield', label: 'Springfield, Massachusetts, United States', countryCode: 'US', lat: 42.1015, lon: -72.5898, source: 'GeoNames' },
  ];
  const destinationContexts = cities.map((city) => collectDestinationContext(fixture(), city).context);
  assert.deepEqual(destinationContexts.map((context) => context.destination), cities.map(({ name, label, countryCode }) => ({ name, label, countryCode })));
  assert.notDeepEqual(destinationContexts[0], destinationContexts[1]);

  const departureContexts = cities.map((city) => {
    const state = fixture();
    Object.assign(state.constraints[state.ownerUid], { departureCity: city.label, departurePlaceId: city.id, departurePlace: city });
    return collectDestinationContext(state, place).context;
  });
  assert.deepEqual(departureContexts.map((context) => context.travellers[0].departure), cities.map(({ name, label, countryCode }) => ({ city: name, label, countryCode })));
  assert.notDeepEqual(departureContexts[0], departureContexts[1]);
});

test('legacy departure labels use resolved canonical names, regions and countries, not raw input', (suite) => {
  const state = fixture();
  state.constraints['private-member-uid'].departureCity = 'Saved city alias';
  suite.mock.method(require('../geo'), 'departureCity', (name) => {
    assert.equal(name, 'Saved city alias');
    return { name: 'Springfield', region: 'Illinois', countryCode: 'US', lat: 39.8017, lon: -89.6437 };
  });
  const { context } = collectDestinationContext(state, place);
  assert.deepEqual(context.travellers[1].departure, { city: 'Springfield', label: 'Springfield, Illinois, United States', countryCode: 'US' });
  assert.doesNotMatch(JSON.stringify(context), /Saved city alias/);
});

test('non-catalog canonical city becomes a per-trip destination without seed or state mutation', async () => {
  const state = fixture();
  const original = structuredClone(state);
  const originalSeeds = structuredClone(seeds);
  assert.equal(seeds.destinations.some((destination) => destination.name === place.name), false);
  let calls = 0;
  const result = await generate(state, undefined, { provider: { mode: 'groq', generateDestination: async (context) => {
    calls += 1;
    assert.deepEqual(context, collectDestinationContext(state, place).context);
    assert.doesNotMatch(JSON.stringify(context), /871234|972345|private-|passport/);
    return modelDraft();
  } } });
  assert.equal(calls, 1);
  assert.equal(result.id, draftId);
  assert.equal(result.placeId, place.id);
  assert.equal(result.name, place.label);
  assert.equal(result.country, 'Romania');
  assert.equal(result.countryCode, 'RO');
  assert.equal(result.lat, place.lat);
  assert.equal(result.lon, place.lon);
  assert.equal(result.timeZone, 'Local time');
  assert.equal(result.costCurrency, 'INR');
  assert.equal(result.roomNight, 4500);
  assert.equal(result.roomCapacity, 2);
  assert.equal(result.vehicleDay, 900);
  assert.equal(result.vehicleCapacity, 4);
  assert.equal(result.foodDay, 1200);
  assert.equal(result.insurance, 600);
  assert.equal(result.passportMonths, 6);
  assert.equal(Object.hasOwn(result, 'entryAllowance'), false);
  assert.deepEqual(result.activities, [{ id: `${draftId}-activity-0`, title: 'Old town walk', location: 'Historic centre', durationMinutes: 90, costPerPerson: 400, tags: ['culture'] }]);
  assert.deepEqual(result.provenance, { kind: 'ai-estimate', provider: 'groq', generatedAt: now(), verified: false, summary: modelDraft().summary, caveats: modelDraft().caveats, costRanges: modelDraft().costs });
  assert.deepEqual(state, original);
  assert.deepEqual(seeds, originalSeeds);
});

test('journeys respect bus/train selections, preserve unknowns and keep origins server-side', async () => {
  const result = await generate();
  assert.deepEqual(result.journeyQuotes['private-owner-uid'], { amount: 8000, low: 4000, high: 8000, mode: 'bus', oneWayMinutes: 480,
    label: modelDraft().journeys[0].note, basis: 'ai-estimate', status: 'unverified', origin: departure.id });
  assert.deepEqual(result.journeyQuotes['private-member-uid'], { amount: null, low: null, high: null, mode: 'train', oneWayMinutes: null,
    label: modelDraft().journeys[1].note, basis: 'ai-estimate', status: 'unverified', origin: 'Delhi' });
  const { journeyQuotes, ...publicFields } = result;
  assert.doesNotMatch(JSON.stringify(publicFields), /private-|Mysuru|Delhi|geonames:1262321|871234|972345/);
  const value = modelDraft();
  value.journeys[0].returnFare = null;
  value.journeys[0].oneWayMinutes = null;
  const unknown = await generate(fixture(), value);
  assert.equal(unknown.journeyQuotes['private-owner-uid'].amount, null);
});

test('car and flight are supported only when explicitly selected', async () => {
  const state = fixture();
  state.constraints[state.ownerUid].transportModes = ['car'];
  state.constraints['private-member-uid'].transportModes = ['flight'];
  const value = modelDraft();
  value.journeys[0].mode = 'car';
  value.journeys[1].mode = 'flight';
  const result = await generate(state, value);
  assert.equal(result.journeyQuotes[state.ownerUid].mode, 'car');
  assert.equal(result.journeyQuotes['private-member-uid'].mode, 'flight');
});

test('only domestic drafts set entry allowance to zero; timezone remains server-owned', async () => {
  const domesticPlace = { ...place, id: 'geonames:1264527', name: 'Madurai', label: 'Madurai, India', countryCode: 'IN', lat: 9.9252, lon: 78.1198, timeZone: 'Invented/Zone' };
  const result = await generate(fixture(), modelDraft(), { place: domesticPlace });
  assert.equal(result.domestic, true);
  assert.equal(result.entryAllowance, 0);
  assert.equal(result.timeZone, 'Local time');
});

test('every real member needs explicit consent and modes before any provider call', async () => {
  let calls = 0;
  const provider = { mode: 'groq', generateDestination: async () => { calls += 1; return modelDraft(); } };
  for (const uid of [fixture().ownerUid, 'private-member-uid']) {
    for (const consent of [undefined, false, null, 'true', 1]) {
      const state = fixture(); state.constraints[uid].aiPlanningConsent = consent;
      await assert.rejects(generate(state, undefined, { provider }), safeError('AI_CONSENT_REQUIRED'));
    }
    for (const modes of [undefined, null, [], ['ferry'], ['bus', 'bus'], 'bus']) {
      const state = fixture(); state.constraints[uid].transportModes = modes;
      await assert.rejects(generate(state, undefined, { provider }), safeError('TRANSPORT_MODES_REQUIRED'));
    }
  }
  assert.equal(calls, 0);
});

test('synthetic defaults are allowed only on existing explicitly marked demo members', () => {
  const state = fixture();
  const uid = 'private-member-uid';
  delete state.constraints[uid].aiPlanningConsent;
  delete state.constraints[uid].transportModes;
  state.members[uid].demo = 'true';
  assert.throws(() => collectDestinationContext(state, place), safeError('AI_CONSENT_REQUIRED'));
  state.members[uid].demo = true;
  const original = structuredClone(state);
  const demo = collectDestinationContext(state, place).context.travellers[1];
  assert.deepEqual(demo.transportModes, ['bus', 'train', 'car', 'flight']);
  assert.equal(demo.synthetic, true);
  assert.deepEqual(state, original);
  state.constraints[uid].aiPlanningConsent = false;
  assert.throws(() => collectDestinationContext(state, place), safeError('AI_CONSENT_REQUIRED'));
});

test('incomplete roster, required private details and invalid canonical places fail safely', async () => {
  const edits = [
    (state) => { state.members['private-member-uid'].status = 'pending'; },
    (state) => { delete state.constraints['private-member-uid']; },
    (state) => { state.constraints[state.ownerUid].budget = 0; },
    (state) => { state.constraints[state.ownerUid].datesConfirmed = false; },
    (state) => { state.constraints[state.ownerUid].entryCheckAcknowledged = false; },
    (state) => { state.constraints[state.ownerUid].isAdult = false; },
    (state) => { state.constraints[state.ownerUid].passportExpiry = 'invalid'; },
    (state) => { state.constraints[state.ownerUid].preferences = ['raw private instructions']; },
    (state) => { state.constraints[state.ownerUid].visas = ['invalid']; },
    (state) => { state.constraints[state.ownerUid].departurePlaceId = 'geonames:1'; },
    (state) => { state.endDate = '2026-02-31'; },
    (state) => { state.currency = 'invalid'; },
  ];
  let calls = 0;
  const provider = { mode: 'groq', generateDestination: async () => { calls += 1; return modelDraft(); } };
  for (const edit of edits) {
    const state = fixture(); edit(state);
    await assert.rejects(generate(state, undefined, { provider }), safeError());
  }
  for (const patch of [{ id: 'invented' }, { lat: Infinity }, { lon: 181 }, { countryCode: 'XX' }, { name: '<script>' }, { source: 'model' }]) {
    await assert.rejects(generate(fixture(), undefined, { place: { ...place, ...patch }, provider }), safeError('DESTINATION_CONTEXT_REQUIRED'));
  }
  assert.equal(calls, 0);
});

test('exact model schema rejects unknown keys including model-owned IDs, prices and sources', async () => {
  for (const edit of [
    (value) => { value.id = 'invented'; },
    (value) => { value.countryCode = 'US'; },
    (value) => { value.timeZone = 'America/New_York'; },
    (value) => { value.costs.entryAllowance = { low: 0, high: 0 }; },
    (value) => { value.costs.roomNight.currency = 'USD'; },
    (value) => { value.activities[0].costPerPerson = 0; },
    (value) => { value.activities[0].id = 'invented'; },
    (value) => { value.journeys[0].verified = true; },
    (value) => { value.journeys[0].operator = 'Invented service'; },
    (value) => { value.journeys[0].returnFare.source = 'https://example.invalid'; },
    (value) => { delete value.summary; },
  ]) {
    const value = modelDraft(); edit(value);
    await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
  }
  for (const value of [null, [], 'raw prose', { operations: [] }]) await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
});

test('nonfinite, negative, fractional, reversed and excessive model prices are rejected', async () => {
  for (const bad of [NaN, Infinity, -Infinity, -1, 0.1, '100', null, 10_000_001, Number.MAX_SAFE_INTEGER]) {
    for (const edit of [
      (value) => { value.costs.roomNight.high = bad; },
      (value) => { value.costs.foodDay.low = bad; },
      (value) => { value.activities[0].cost.high = bad; },
      (value) => { value.journeys[0].returnFare.high = bad; },
    ]) {
      const value = modelDraft(); edit(value);
      await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
    }
  }
  const reversed = modelDraft(); reversed.costs.insurance = { low: 100, high: 99 };
  await assert.rejects(generate(fixture(), reversed), safeError('INVALID_DESTINATION_DRAFT'));
});

test('unsupported modes, invented or duplicate refs and missing journeys cannot become routes', async () => {
  for (const edit of [
    (value) => { value.journeys[0].mode = 'flight'; },
    (value) => { value.journeys[0].mode = 'ferry'; },
    (value) => { value.journeys[0].travellerRef = 'private-owner-uid'; },
    (value) => { value.journeys[0].travellerRef = 'traveller-3'; },
    (value) => { value.journeys[1] = { ...value.journeys[0] }; },
    (value) => { value.journeys.pop(); },
    (value) => { value.journeys[0].oneWayMinutes = 0; },
    (value) => { value.journeys[0].oneWayMinutes = 10081; },
    (value) => { value.journeys[0].oneWayMinutes = 1.5; },
  ]) {
    const value = modelDraft(); edit(value);
    await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
  }
});

test('markup, controls, sources, unsupported claims and public origin echoes are rejected', async () => {
  for (const bad of ['<b>Great trip</b>', '**Great trip**', '[Link](https://example.invalid)', 'Visit www.example.invalid', 'Visit example.com', 'line\nnext', 'hidden\u202etext', 'x'.repeat(601), 'Verified fares are available.', 'Confirmed train services.', 'The bus is operated by Fictional Lines.', 'According to traveller testimonials, this is ideal.', 'Travel from Mysuru for this trip.', 'Travel from Delhi for this trip.']) {
    const value = modelDraft(); value.summary = bad;
    await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
  }
  for (const edit of [
    (value) => { value.caveats[0] = '<script>'; },
    (value) => { value.tags = ['food\u0000']; },
    (value) => { value.activities[0].location = '`location`'; },
    (value) => { value.journeys[0].note = 'https://example.invalid'; },
  ]) {
    const value = modelDraft(); edit(value);
    await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
  }
});

test('activities, text lists, capacities and durations stay bounded and distinct', async () => {
  for (const edit of [
    (value) => { value.activities.push({ ...value.activities[0], title: ' OLD TOWN WALK ' }); },
    (value) => { value.activities = Array.from({ length: 13 }, (_, index) => ({ ...value.activities[0], title: `Walk ${index}` })); },
    (value) => { value.activities[0].durationMinutes = 181; },
    (value) => { value.activities[0].durationMinutes = 0; },
    (value) => { value.activities[0].durationMinutes = Infinity; },
    (value) => { value.activities[0].title = 'x'.repeat(161); },
    (value) => { value.activities[0].location = ''; },
    (value) => { value.tags = ['food', ' Food ']; },
    (value) => { value.tags = Array.from({ length: 9 }, (_, index) => `tag${index}`); },
    (value) => { value.caveats = []; },
    (value) => { value.caveats = Array(9).fill('Unverified'); },
    (value) => { value.roomCapacity = 0; },
    (value) => { value.roomCapacity = 7; },
    (value) => { value.vehicleCapacity = 21; },
  ]) {
    const value = modelDraft(); edit(value);
    await assert.rejects(generate(fixture(), value), safeError('INVALID_DESTINATION_DRAFT'));
  }
  const empty = modelDraft(); empty.activities = [];
  assert.deepEqual((await generate(fixture(), empty)).activities, []);
});

test('provider cannot mutate the allowlisted modes used by the validator', async () => {
  const provider = { mode: 'groq', generateDestination: async (context) => {
    context.travellers[0].transportModes.push('flight');
    const value = modelDraft(); value.journeys[0].mode = 'flight'; return value;
  } };
  await assert.rejects(generate(fixture(), undefined, { provider }), safeError('INVALID_DESTINATION_DRAFT'));
});

test('destination generation fails closed without Groq and never falls back to edit generation', async () => {
  let calls = 0;
  for (const provider of [undefined, { mode: 'development', generateDestination: async () => { calls += 1; return modelDraft(); } }, { mode: 'groq', generate: async () => { calls += 1; return modelDraft(); } }]) {
    await assert.rejects(generate(fixture(), undefined, { provider }), safeError('AI_DESTINATION_UNAVAILABLE'));
  }
  assert.equal(calls, 0);
  const provider = { mode: 'groq', generateDestination: async () => { calls += 1; throw new Error('secret-provider private-owner-uid'); } };
  await assert.rejects(generate(fixture(), undefined, { provider }), safeError('AI_DESTINATION_UNAVAILABLE'));
  assert.equal(calls, 1);
});

test('server IDs and generation timestamps are validated and browser execution is refused', async (suite) => {
  for (const invalid of ['seed-city', 'ai-nothex', '../ai-a', 'ai-', 'ai-' + 'a'.repeat(65)]) {
    await assert.rejects(generate(fixture(), undefined, { draftId: invalid }), safeError('INVALID_DESTINATION_REQUEST'));
  }
  await assert.rejects(generate(fixture(), undefined, { now: () => NaN }), safeError('INVALID_DESTINATION_REQUEST'));
  globalThis.window = {};
  suite.after(() => { delete globalThis.window; });
  assert.throws(() => collectDestinationContext(fixture(), place), (error) => error.code === 'AI_SERVER_ONLY');
  await assert.rejects(generate(), (error) => error.code === 'AI_SERVER_ONLY');
});