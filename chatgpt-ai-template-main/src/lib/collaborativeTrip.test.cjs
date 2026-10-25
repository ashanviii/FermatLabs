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
    isAdult: true,
    hasIndianPassport: true,
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
  const replayed = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-one' });
  assert.deepEqual(replayed, trip);
});

test('integer allocation reconciles for every group size from four through ten', () => {
  for (let count = 4; count <= 10; count += 1) {
    const allocation = allocateInteger(100003, Array.from({ length: count }, (_, index) => `m${index + 1}`));
    assert.equal(Object.values(allocation).reduce((sum, value) => sum + value, 0), 100003);
    assert.ok(Math.max(...Object.values(allocation)) - Math.min(...Object.values(allocation)) <= 1);
    const plan = generatePlan(readyTrip(count, 300000), 'bangkok');
    assert.equal(validatePlan(plan).length, 0);
    assert.equal(plan.memberTotals.reduce((sum, member) => sum + member.contingency, 0), plan.categories.contingency);
  }
});

test('one traveller one rupee below the mandatory baseline makes the destination infeasible', () => {
  const probe = readyTrip(4, 250000);
  const baseline = generatePlan(probe, 'bangkok', { enforceBudgets: false, maxActivities: 0 });
  const ownerTotal = baseline.memberTotals.find((member) => member.uid === 'owner').total;
  const constraints = { ...probe.constraints.owner, budget: ownerTotal - 1 };
  const next = { ...probe, constraints: { ...probe.constraints, owner: constraints } };
  assert.throws(() => generatePlan(next, 'bangkok'), /budget/i);
  assert.doesNotThrow(() => generatePlan({ ...probe, constraints: { ...probe.constraints, owner: { ...probe.constraints.owner, budget: ownerTotal } } }, 'bangkok'));
});

test('shared projection never exposes raw private constraints or private ballots', () => {
  let trip = readyTrip();
  trip.constraints.owner.budget = 149321;
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'dubai', round: trip.round, inputRevision: trip.inputRevision });
  const projection = buildTripProjection(trip, 'm2');
  assert.equal(projection.constraints, undefined);
  assert.equal(projection.ballots, undefined);
  assert.equal(projection.myConstraints.budget, 150000);
  assert.equal(JSON.stringify(projection).includes('149321'), false);
});

test('pending member gets a safe waiting-room projection and owner can admit them', () => {
  let trip = createTripState({ id: 'waiting', ownerUid: 'owner', name: 'Waiting', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  trip = applyCommand(trip, { type: 'requestJoin', uid: 'm2', nickname: 'Member 2', now: 100 });
  const waiting = buildTripProjection(trip, 'm2', 101);
  assert.equal(waiting.membershipStatus, 'pending');
  assert.equal(waiting.activePlan, undefined);
  assert.equal(waiting.members, undefined);
  assert.equal(buildTripProjection(trip, 'owner', 101).pendingRequests[0].nickname, 'Member 2');
  trip = applyCommand(trip, { type: 'admitMember', uid: 'owner', memberUid: 'm2', now: 101 });
  assert.equal(buildTripProjection(trip, 'm2').membershipStatus, 'approved');
});

test('edits create a new plan revision and clear previous approvals', () => {
  let trip = readyTrip();
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => {
    trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision });
  });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-two' });
  trip = applyCommand(trip, { type: 'approvePlan', uid: 'm2', planVersion: trip.activePlan.version, planRevision: 1, decision: 'approved' });
  assert.equal(trip.activePlan.approvals.m2, 'approved');
  const firstItem = trip.activePlan.itinerary[1].items[0];
  trip = applyCommand(trip, {
    type: 'editPlanItem',
    uid: 'owner',
    planVersion: trip.activePlan.version,
    planRevision: 1,
    itemId: firstItem.id,
    patch: { title: 'Updated neighbourhood walk' },
  });
  assert.equal(trip.activePlan.revision, 2);
  assert.deepEqual(trip.activePlan.approvals, {});
});

test('cost edits reconcile totals and schedule conflicts mark the revision for review', () => {
  let trip = readyTrip(4, 300000);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => { trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision }); });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'edit-lock' });
  const item = trip.activePlan.itinerary[1].items[0];
  const before = trip.activePlan.groupTotal;
  trip = applyCommand(trip, { type: 'editPlanItem', uid: 'owner', planVersion: trip.activePlan.version, planRevision: 1, itemId: item.id, patch: { estimatedCost: item.estimatedCost + 1003, time: '13:00' } });
  assert.ok(trip.activePlan.groupTotal > before);
  assert.match(validatePlan(trip.activePlan).join(' '), /overlapping/i);
  assert.equal(trip.activePlan.status, 'needsReview');
});

test('editing a ballot-round constraint invalidates every ballot and returns to collection', () => {
  let trip = readyTrip();
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'm2', expectedInputRevision: trip.inputRevision, constraints: { ...trip.constraints.m2, preferences: ['art'] } });
  assert.equal(trip.phase, 'collecting');
  assert.deepEqual(trip.ballots, {});
});

test('invalid calendar dates and unauthenticated projections fail closed', () => {
  assert.throws(() => createTripState({ id: 'bad', ownerUid: 'owner', name: 'Bad', startDate: '2026-02-30', endDate: '2026-03-02', expectedSize: 4 }), /date/i);
  assert.throws(() => buildTripProjection(readyTrip(), 'outsider'), /membership/i);
});

test('private inputs require a real passport month and an explicit preference', () => {
  let trip = createTripState({ id: 'private-inputs', ownerUid: 'owner', name: 'Private inputs', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  assert.throws(() => applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: 0, constraints: { ...completeConstraint(0), passportExpiry: '2028-13' } }), /incomplete/i);
  assert.throws(() => applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: 0, constraints: { ...completeConstraint(0), preferences: [] } }), /incomplete/i);
});

test('capacity, stale revisions, absent ballots, and direct organizer override fail closed', () => {
  let trip = readyTrip(4);
  trip = applyCommand(trip, { type: 'requestJoin', uid: 'late', nickname: 'Late' });
  assert.equal(trip.pending.late.status, 'pending');
  assert.throws(() => applyCommand(trip, { type: 'admitMember', uid: 'owner', memberUid: 'late' }), /capacity/i);
  assert.throws(() => applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision - 1, constraints: completeConstraint(0) }), /stale/i);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  assert.throws(() => applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, destinationId: 'paris', idempotencyKey: 'bad' }), /ballot|override/i);
});
