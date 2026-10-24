const assert = require('node:assert/strict');
const test = require('node:test');

const {
  allocateInteger,
  createTripState,
  applyCommand,
  buildTripProjection,
  generatePlan,
  validatePlan,
} = require('./collaborativeTrip');

const ids = ['owner', 'm2', 'm3', 'm4'];

function completeConstraint(index, budget = 150000) {
  return {
    departureCity: ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata'][index % 4],
    budget,
    passportExpiry: '2028-12',
    visas: ['uae', 'schengen'],
    datesConfirmed: true,
    preferences: ['culture', 'food'],
    entryCheckAcknowledged: true,
  };
}

function readyTrip(count = 4, budget = 150000) {
  let trip = createTripState({
    id: 'trip-1',
    ownerUid: 'owner',
    name: 'Winter escape',
    startDate: '2026-12-10',
    endDate: '2026-12-15',
    expectedSize: count,
  });
  for (let index = 1; index < count; index += 1) {
    trip = applyCommand(trip, { type: 'requestJoin', uid: `m${index + 1}`, nickname: `Member ${index + 1}` });
    trip = applyCommand(trip, { type: 'admitMember', uid: 'owner', memberUid: `m${index + 1}` });
  }
  const members = Object.keys(trip.members);
  members.forEach((uid, index) => {
    trip = applyCommand(trip, { type: 'submitConstraints', uid, expectedInputRevision: trip.inputRevision, constraints: completeConstraint(index, budget) });
  });
  return trip;
}

test('four members can collect, vote, and atomically lock one budgeted plan', () => {
  let trip = readyTrip();
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => {
    trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision });
  });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-one' });
  assert.equal(trip.phase, 'locked');
  assert.equal(trip.lockedDestinationId, 'bangkok');
  assert.equal(trip.activePlan.version, 1);
  assert.equal(validatePlan(trip.activePlan).length, 0);
  assert.equal(trip.activePlan.memberTotals.reduce((sum, member) => sum + member.total, 0), trip.activePlan.groupTotal);
});

test('integer allocation reconciles for every group size from four through ten', () => {
  for (let count = 4; count <= 10; count += 1) {
    const allocation = allocateInteger(100003, Array.from({ length: count }, (_, index) => `m${index + 1}`));
    assert.equal(Object.values(allocation).reduce((sum, value) => sum + value, 0), 100003);
    assert.ok(Math.max(...Object.values(allocation)) - Math.min(...Object.values(allocation)) <= 1);
  }
});

test('one traveller one rupee below the mandatory baseline makes the destination infeasible', () => {
  const probe = readyTrip(4, 250000);
  const baseline = generatePlan(probe, 'bangkok');
  const ownerTotal = baseline.memberTotals.find((member) => member.uid === 'owner').total;
  const constraints = { ...probe.constraints.owner, budget: ownerTotal - 1 };
  const next = { ...probe, constraints: { ...probe.constraints, owner: constraints } };
  assert.throws(() => generatePlan(next, 'bangkok'), /budget/i);
  assert.doesNotThrow(() => generatePlan({ ...probe, constraints: { ...probe.constraints, owner: { ...probe.constraints.owner, budget: ownerTotal } } }, 'bangkok'));
});

test('shared projection never exposes raw private constraints or private ballots', () => {
  let trip = readyTrip();
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'dubai', round: trip.round, inputRevision: trip.inputRevision });
  const projection = buildTripProjection(trip, 'm2');
  assert.equal(projection.constraints, undefined);
  assert.equal(projection.ballots, undefined);
  assert.equal(JSON.stringify(projection).includes('150000'), false);
});

test('edits create a new plan revision and clear previous approvals', () => {
  let trip = readyTrip();
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => {
    trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision });
  });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-two' });
  trip = applyCommand(trip, { type: 'approvePlan', uid: 'm2', planRevision: 1, decision: 'approved' });
  assert.equal(trip.activePlan.approvals.m2, 'approved');
  const firstItem = trip.activePlan.itinerary[1].items[0];
  trip = applyCommand(trip, {
    type: 'editPlanItem',
    uid: 'owner',
    planRevision: 1,
    itemId: firstItem.id,
    patch: { title: 'Updated neighbourhood walk' },
  });
  assert.equal(trip.activePlan.revision, 2);
  assert.deepEqual(trip.activePlan.approvals, {});
});

test('capacity, stale revisions, absent ballots, and direct organizer override fail closed', () => {
  let trip = readyTrip(4);
  assert.throws(() => applyCommand(trip, { type: 'requestJoin', uid: 'late', nickname: 'Late' }), /capacity/i);
  assert.throws(() => applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision - 1, constraints: completeConstraint(0) }), /stale/i);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  assert.throws(() => applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, destinationId: 'paris', idempotencyKey: 'bad' }), /ballot|override/i);
});
