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

test('two members can collect, vote, and atomically lock one budgeted plan', () => {
  let trip = readyTrip(2);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ['owner', 'm2'].forEach((uid) => {
    trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision });
  });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-two-person-trip' });
  assert.equal(trip.phase, 'locked');
  assert.equal(trip.lockedDestinationId, 'bangkok');
  assert.equal(trip.activePlan.memberTotals.length, 2);
  assert.equal(validatePlan(trip.activePlan).length, 0);
  assert.equal(trip.activePlan.memberTotals.reduce((sum, member) => sum + member.total, 0), trip.activePlan.groupTotal);
});

test('one-person trips remain outside the supported group-size boundary', () => {
  assert.throws(
    () => createTripState({ id: 'solo', ownerUid: 'owner', name: 'Solo', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 1 }),
    /2–10/,
  );
});

test('integer allocation reconciles for every group size from two through ten', () => {
  for (let count = 2; count <= 10; count += 1) {
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

test('a member without a passport blocks international destinations but keeps domestic ones feasible', () => {
  let trip = readyTrip(4, 300000);
  const noPassport = { ...completeConstraint(1, 300000), passportExpiry: 'none', visas: [] };
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'm2', expectedInputRevision: trip.inputRevision, constraints: noPassport });
  assert.throws(() => generatePlan(trip, 'bangkok'), /passport/i);
  const goa = generatePlan(trip, 'goa');
  assert.deepEqual(validatePlan(goa), []);
  assert.equal(goa.categories.entryAllowance, 0);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => { trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision }); });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-no-passport' });
  assert.equal(trip.lockedDestinationId === 'bangkok', false, 'An ineligible vote winner must never lock');
  assert.equal(require('./collaborativeTrip').seeds.destinations.find((d) => d.id === trip.lockedDestinationId).domestic, true);
});

test('every seeded destination produces a valid plan from every departure city', () => {
  const { seeds } = require('./collaborativeTrip');
  for (const city of Object.keys(seeds.departureCities)) {
    let trip = readyTrip(4, 1000000);
    ids.forEach((uid) => { trip = applyCommand(trip, { type: 'submitConstraints', uid, expectedInputRevision: trip.inputRevision, constraints: { ...completeConstraint(0, 1000000), departureCity: city } }); });
    for (const dest of seeds.destinations) assert.deepEqual(validatePlan(generatePlan(trip, dest.id)), [], `${city} -> ${dest.id}`);
  }
});

test('international budgets include forex markup with GST, domestic ones do not, and totals still reconcile', () => {
  const trip = readyTrip(4, 1000000);
  const bangkok = generatePlan(trip, 'bangkok'); const goa = generatePlan(trip, 'goa');
  assert.ok(bangkok.categories.forex > 0);
  assert.equal(goa.categories.forex, 0);
  bangkok.memberTotals.forEach((m) => assert.equal(m.forex, Math.ceil((m.inDestination * 413) / 10000)));
  assert.deepEqual(validatePlan(bangkok), []);
  assert.deepEqual(validatePlan(goa), []);
});

test('a visa that cannot be obtained before departure blocks the destination unless a waiver visa is held', () => {
  const trip = readyTrip(4, 1000000);
  const now = Date.parse('2026-11-30T00:00:00Z'); // 10 days before the 2026-12-10 start
  const noVisas = { ...trip, constraints: Object.fromEntries(Object.entries(trip.constraints).map(([uid, c]) => [uid, { ...c, visas: [] }])) };
  assert.throws(() => generatePlan(noVisas, 'paris', { now }), /visa/i);
  assert.doesNotThrow(() => generatePlan(noVisas, 'singapore', { now }));
  const withUs = { ...noVisas, constraints: Object.fromEntries(Object.entries(noVisas.constraints).map(([uid, c]) => [uid, { ...c, visas: ['us'] }])) };
  assert.doesNotThrow(() => generatePlan(withUs, 'dubai', { now: Date.parse('2026-12-08T00:00:00Z') }));
  assert.throws(() => generatePlan(noVisas, 'dubai', { now: Date.parse('2026-12-08T00:00:00Z') }), /visa/i);
});

test('the shared board shows anonymous blocker counts while each member privately sees their unlock amount', () => {
  let trip = readyTrip(4, 1000000);
  const tight = { ...completeConstraint(2, 60000) };
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'm3', expectedInputRevision: trip.inputRevision, constraints: tight });
  const ownerView = buildTripProjection(trip, 'owner');
  const paris = ownerView.destinationBoard.find((d) => d.destinationId === 'paris');
  assert.equal(paris.eligible, false); assert.equal(paris.budgetShort, 1);
  assert.equal(JSON.stringify(ownerView.destinationBoard).includes('m3'), false, 'Board must not name the blocked member');
  assert.equal(ownerView.myPrivateStatus.find((d) => d.destinationId === 'paris').unlockAmount, 0);
  const m3View = buildTripProjection(trip, 'm3');
  const m3Paris = m3View.myPrivateStatus.find((d) => d.destinationId === 'paris');
  assert.equal(m3Paris.fits, false); assert.equal(m3Paris.unlockAmount, m3Paris.baselineTotal - 60000);
});

test('members privately see how their share changes if one person drops out', () => {
  let trip = readyTrip(4, 1000000);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => { trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'bangkok', round: trip.round, inputRevision: trip.inputRevision }); });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-dropout' });
  const impact = buildTripProjection(trip, 'owner').myDropoutImpact;
  assert.ok(impact.increase > 0, 'Shared rooms and vehicles cost more per head with fewer people');
  assert.equal(impact.stillFits, true);
});

test('organizer sets a UPI payee and members self-report payment; reopen clears payments', () => {
  let trip = readyTrip(4, 1000000);
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  ids.forEach((uid) => { trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision }); });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-upi' });
  assert.throws(() => applyCommand(trip, { type: 'markPaid', uid: 'm2' }), /required/i);
  assert.throws(() => applyCommand(trip, { type: 'setPayee', uid: 'm2', upiId: 'friend@okaxis' }), /organizer/i);
  assert.throws(() => applyCommand(trip, { type: 'setPayee', uid: 'owner', upiId: 'not a upi' }), /UPI/);
  trip = applyCommand(trip, { type: 'setPayee', uid: 'owner', upiId: 'organizer@okaxis', advancePerPerson: 5000 });
  trip = applyCommand(trip, { type: 'markPaid', uid: 'm2' });
  const view = buildTripProjection(trip, 'm2');
  assert.equal(view.payee.upiId, 'organizer@okaxis'); assert.equal(view.paymentProgress, 1); assert.equal(view.myPayment, true);
  trip = applyCommand(trip, { type: 'reopen', uid: 'owner' });
  assert.equal(buildTripProjection(trip, 'm2').paymentProgress, 0);
});

test('an organizer can fill the room with demo travellers who vote and approve on their own', () => {
  let trip = createTripState({ id: 'trip-demo', ownerUid: 'owner', name: 'Solo test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  assert.throws(() => applyCommand(trip, { type: 'addDemoMembers', uid: 'someone' }), /organizer/i);
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  assert.equal(Object.keys(trip.members).length, 4);
  assert.throws(() => applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' }), /capacity/i);
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: completeConstraint(0, 300000) });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  assert.equal(Object.keys(trip.ballots).length, 3, 'Demo travellers vote as soon as voting opens');
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-demo' });
  assert.equal(trip.phase, 'locked');
  assert.equal(Object.keys(trip.activePlan.approvals).length, 3, 'Demo travellers approve the plan');
  assert.deepEqual(validatePlan(trip.activePlan), []);
});

test('multi-city routes split nights by weight, schedule a transfer day, and cost transfers per traveller', () => {
  const trip = readyTrip(4, 1000000); // 6 days, 5 nights
  const plan = generatePlan(trip, 'thailand-duo');
  assert.deepEqual(plan.stops.map((s) => [s.name, s.nights]), [['Bangkok', 2], ['Phuket', 3]]);
  assert.deepEqual(plan.itinerary.map((d) => d.city), ['Bangkok', 'Bangkok', 'Phuket', 'Phuket', 'Phuket', 'Phuket']);
  assert.equal(plan.itinerary[2].items[0].id.startsWith('transfer-'), true);
  assert.equal(plan.categories.transfers, 4500 * 4);
  assert.deepEqual(validatePlan(plan), []);
  const kerala = generatePlan(trip, 'kerala-trio');
  assert.deepEqual(kerala.stops.map((s) => s.nights), [2, 2, 1]);
  assert.deepEqual(validatePlan(kerala), []);
});

test('a trip too short for every stop makes that route ineligible with a clear reason', () => {
  let trip = createTripState({ id: 'short', ownerUid: 'owner', name: 'Weekend', startDate: '2026-12-12', endDate: '2026-12-14', expectedSize: 4 });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: completeConstraint(0, 1000000) });
  assert.throws(() => generatePlan(trip, 'kerala-trio'), /at least 4 days/);
  const board = buildTripProjection(trip, 'owner').destinationBoard.find((d) => d.destinationId === 'kerala-trio');
  assert.equal(board.eligible, false); assert.match(board.reason, /at least 4 days/);
});

test('demo travellers hold valid passports and visas so international trips are open to them', () => {
  let trip = createTripState({ id: 'trip-intl', ownerUid: 'owner', name: 'Intl test', startDate: '2026-11-05', endDate: '2026-11-10', expectedSize: 4 });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: completeConstraint(0, 1000000) });
  const board = buildTripProjection(trip, 'owner', Date.parse('2026-10-25T00:00:00Z')).destinationBoard;
  board.forEach((d) => { assert.equal(d.passport, 0, d.destinationId); assert.equal(d.visaTiming, 0, d.destinationId); });
  ['bangkok', 'dubai', 'bali', 'hanoi', 'thailand-duo'].forEach((id) => assert.equal(board.find((d) => d.destinationId === id).eligible, true, id));
});

test('shared plans show attendee counts and the viewer\'s own attendance, never who skipped', () => {
  let trip = createTripState({ id: 'trip-att', ownerUid: 'owner', name: 'Att', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: completeConstraint(0, 1000000) });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-att' });
  const items = buildTripProjection(trip, 'owner').activePlan.itinerary.flatMap((d) => d.items);
  assert.ok(items.every((item) => item.attendees === undefined && Number.isInteger(item.attendeeCount) && typeof item.iAttend === 'boolean'));
});

test('demo travellers pledge automatically so a solo organizer can see who is firmly in', () => {
  let trip = createTripState({ id: 'trip-pledge', ownerUid: 'owner', name: 'Pledge', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: completeConstraint(0, 1000000) });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-p' });
  assert.equal(buildTripProjection(trip, 'owner').features.pledges.pledgedCount, 3);
  trip = applyCommand(trip, { type: 'setPledge', uid: 'owner', minGoing: 4, maxShare: 1000000 });
  assert.equal(buildTripProjection(trip, 'owner').features.pledges.everyoneIn, true);
});

// Trips from any country (settings, currency, scope, visas, fares, lock explanation, payees).
require('./globalTrips.test.cjs');
