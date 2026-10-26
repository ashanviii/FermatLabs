const assert = require('node:assert/strict');
const test = require('node:test');

const { createTripState, applyCommand, buildTripProjection, generatePlan, validatePlan } = require('../collaborativeTrip');

const NOW = Date.parse('2026-10-25T00:00:00Z');
const OWNER_INPUT = { departureCity: 'Delhi', budget: 1000000, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true };

function votingTrip() {
  let trip = createTripState({ id: 't1', ownerUid: 'owner', name: 'Test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt: Date.parse('2026-10-20T00:00:00Z') });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: OWNER_INPUT });
  return applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
}

function lock(trip) {
  const voted = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  return applyCommand(voted, { type: 'lock', uid: 'owner', round: voted.round, inputRevision: voted.inputRevision, idempotencyKey: 'lock-1', now: NOW });
}

const demoUids = (trip) => Object.keys(trip.members).filter((u) => u !== 'owner').sort((a, b) => trip.members[a].joinOrder - trip.members[b].joinOrder);
const setPrefs = (trip, uid, fields) => applyCommand(trip, { type: 'setPrivatePreferences', uid, diet: 'any', alcohol: 'fine', skipTags: [], ...fields });
const items = (plan) => plan.itinerary.flatMap((day) => day.items);
const byUid = (plan) => Object.fromEntries(plan.memberTotals.map((member) => [member.uid, member]));

test('members save their own preferences; outsiders cannot', () => {
  const trip = votingTrip(); const kabir = demoUids(trip)[2];
  const next = setPrefs(trip, kabir, { diet: 'jain', alcohol: 'avoid', skipTags: ['adventure', 'nightlife'] });
  assert.deepEqual(next.privatePrefs[kabir], { diet: 'jain', alcohol: 'avoid', skipTags: ['adventure', 'nightlife'] });
  assert.equal(next.inputRevision, trip.inputRevision, 'preferences do not reset ballots');
  assert.deepEqual(next.ballots, trip.ballots);
  assert.throws(() => setPrefs(trip, 'stranger', {}), /membership required/);
});

test('invalid preferences are rejected with validation messages', () => {
  const trip = votingTrip();
  for (const fields of [{ diet: 'keto' }, { diet: undefined }, { alcohol: 'sometimes' }, { skipTags: 'nightlife' }, { skipTags: ['nightlife', 'nightlife'] }, { skipTags: ['bungee'] }, { skipTags: null }]) {
    assert.throws(() => setPrefs(trip, 'owner', fields), /required|allowed/, JSON.stringify(fields));
  }
});

test('preferences cannot change after the plan is locked', () => {
  const locked = lock(votingTrip());
  assert.equal(locked.phase, 'locked');
  assert.throws(() => setPrefs(locked, 'owner', { alcohol: 'avoid' }), /not allowed after lock/);
});

test('alcohol avoid removes nightlife costs only from that member', () => {
  const trip = votingTrip(); const kabir = demoUids(trip)[2];
  const before = generatePlan(trip, 'goa');
  const after = generatePlan(setPrefs(trip, kabir, { alcohol: 'avoid' }), 'goa');
  const nightlife = items(before).filter((item) => ['north-beaches', 'cruise'].includes(item.templateId));
  assert.equal(nightlife.length, 2);
  const perPerson = nightlife.reduce((sum, item) => sum + item.estimatedCost / item.attendees.length, 0);

  assert.deepEqual(validatePlan(after), []);
  const [b, a] = [byUid(before), byUid(after)];
  Object.keys(b).filter((uid) => uid !== kabir).forEach((uid) => assert.deepEqual(a[uid], b[uid]));
  assert.equal(a[kabir].inDestination, b[kabir].inDestination - perPerson);
  assert.ok(a[kabir].total < b[kabir].total);
  assert.equal(after.groupTotal, before.groupTotal - (b[kabir].total - a[kabir].total));

  for (const item of items(after).filter((entry) => ['north-beaches', 'cruise'].includes(entry.templateId))) {
    assert.equal(item.attendees.includes(kabir), false);
    assert.equal(item.attendees.length, 3);
    assert.equal(item.estimatedCost, nightlife.find((n) => n.id === item.id).estimatedCost / 4 * 3);
  }
  const untouched = items(after).find((item) => item.templateId === 'old-goa');
  assert.deepEqual(untouched, items(before).find((item) => item.templateId === 'old-goa'));
  assert.deepEqual(after.inclusions, ['2 activities are optional for some travellers']);
});

test('an activity everyone skips becomes free time and the plan still reconciles', () => {
  let trip = votingTrip();
  for (const uid of Object.keys(trip.members)) trip = setPrefs(trip, uid, { skipTags: ['adventure'] });
  const before = generatePlan(votingTrip(), 'goa'); const after = generatePlan(trip, 'goa');
  const day = after.itinerary.find((entry) => entry.date === '2026-12-13');
  assert.deepEqual(day.items[0], { id: 'flex-2026-12-13', title: 'Free and flexible time', time: '10:00', durationMinutes: 180, location: 'Choose together', attendees: Object.keys(byUid(after)), estimatedCost: 0, costBasis: 'free', verificationAction: 'Agree as a group' });
  assert.equal(after.categories.activities, before.categories.activities - 10000);
  assert.deepEqual(validatePlan(after), []);
  assert.deepEqual(after.inclusions, ['1 activity was swapped for free time']);
});

test('diet notes are anonymous and the locked plan respects preferences', () => {
  let trip = votingTrip(); const [aarav, diya, kabir] = demoUids(trip);
  trip = setPrefs(trip, diya, { diet: 'jain' });
  trip = setPrefs(trip, aarav, { diet: 'vegetarian' });
  trip = setPrefs(trip, kabir, { alcohol: 'avoid' });
  const locked = lock(trip); const plan = locked.activePlan;
  assert.deepEqual(validatePlan(plan), []);
  const meals = items(plan).filter((item) => item.id.startsWith('meal-'));
  assert.ok(meals.length > 0);
  meals.forEach((meal) => assert.equal(meal.verificationAction, 'Choose places with vegetarian and Jain options'));
  assert.equal(plan.inclusions[0], 'Vegetarian and Jain-friendly meals');
  const text = JSON.stringify(plan.inclusions) + JSON.stringify(meals.map((meal) => meal.verificationAction));
  for (const name of ['Aarav', 'Diya', 'Kabir', aarav, diya, kabir]) assert.equal(text.includes(name), false);
  items(plan).filter((item) => item.attendees.length < 4).forEach((item) => assert.ok(item.templateId));
});

test('no preferences leaves generated plans unchanged', () => {
  const trip = votingTrip();
  const plan = generatePlan(setPrefs(trip, 'owner', {}), 'goa');
  assert.deepEqual(plan, generatePlan(trip, 'goa'));
  assert.equal('inclusions' in plan, false);
});

test('projection shows only the viewer\'s own preferences', () => {
  let trip = votingTrip(); const [aarav, diya] = demoUids(trip);
  trip = setPrefs(trip, aarav, { diet: 'halal', alcohol: 'avoid', skipTags: ['nightlife'] });
  assert.deepEqual(buildTripProjection(trip, aarav, NOW).features.silentPrefs, { myPreferences: { diet: 'halal', alcohol: 'avoid', skipTags: ['nightlife'] } });
  const other = buildTripProjection(trip, diya, NOW);
  assert.deepEqual(other.features.silentPrefs, { myPreferences: { diet: 'any', alcohol: 'fine', skipTags: [] } });
  assert.equal(JSON.stringify(other).includes('halal'), false);
  assert.equal('privatePrefs' in other, false);
  assert.throws(() => buildTripProjection(trip, 'stranger', NOW), /membership required/);
});
