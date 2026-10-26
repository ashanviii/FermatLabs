const assert = require('node:assert/strict');
const test = require('node:test');

const { createTripState, applyCommand, buildTripProjection, validatePlan } = require('../collaborativeTrip');
const shareCards = require('./shareCards');

const DAY = 86400000;
const createdAt = Date.parse('2026-10-20T00:00:00Z');

function lockedTrip() {
  let trip = createTripState({ id: 't1', ownerUid: 'owner', name: 'Test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: { departureCity: 'Delhi', budget: 1000000, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true } });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  return applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-1' });
}

test('shareCards registers no commands', () => {
  assert.deepEqual(shareCards.commands, {});
  assert.equal(shareCards.name, 'shareCards');
});

test('unknown share commands are rejected by the engine', () => {
  const trip = lockedTrip();
  assert.throws(() => applyCommand(trip, { type: 'shareCard', uid: 'owner' }));
});

test('locked trip projects decision days for every approved member', () => {
  const trip = lockedTrip();
  assert.ok(trip.activePlan);
  assert.deepEqual(validatePlan(trip.activePlan), []);
  const expected = Math.max(1, Math.ceil((trip.lockedAt - createdAt) / DAY));
  Object.keys(trip.members).forEach((uid) => {
    const view = buildTripProjection(trip, uid, trip.lockedAt);
    assert.deepEqual(view.features.shareCards, { createdAt, lockedAt: trip.lockedAt, decisionDays: expected });
  });
});

test('decision days is at least one and null when timestamps are missing', () => {
  assert.equal(shareCards.decisionDays(createdAt, createdAt + 1000, DAY), 1);
  assert.equal(shareCards.decisionDays(createdAt, createdAt + 3 * DAY + 1, DAY), 4);
  assert.equal(shareCards.decisionDays(createdAt, createdAt + 2 * DAY, DAY), 2);
  assert.equal(shareCards.decisionDays(null, createdAt, DAY), null);
  assert.equal(shareCards.decisionDays(createdAt, null, DAY), null);
  assert.deepEqual(shareCards.project({ createdAt: null, lockedAt: null }, 'owner', { DAY }), { createdAt: null, lockedAt: null, decisionDays: null });
});

test('old trips without timestamps project safely', () => {
  let trip = createTripState({ id: 't2', ownerUid: 'owner', name: 'Old', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  delete trip.createdAt; delete trip.lockedAt;
  const view = buildTripProjection(trip, 'owner', createdAt);
  assert.deepEqual(view.features.shareCards, { createdAt: null, lockedAt: null, decisionDays: null });
});

test('projection never carries budgets or private preferences', () => {
  const trip = lockedTrip();
  const demoUids = Object.keys(trip.members).filter((u) => u !== 'owner');
  const view = buildTripProjection(trip, demoUids[0], trip.lockedAt);
  const text = JSON.stringify(view.features.shareCards);
  assert.deepEqual(Object.keys(view.features.shareCards).sort(), ['createdAt', 'decisionDays', 'lockedAt']);
  assert.ok(!/budget|preferences|passport|visa/i.test(text));
  assert.ok(!text.includes('1000000'));
});

test('non-members do not receive share card data', () => {
  const trip = lockedTrip();
  let view;
  try { view = buildTripProjection(trip, 'stranger', trip.lockedAt); } catch (_) { view = null; }
  assert.ok(!view || !view.features || !view.features.shareCards);
});
