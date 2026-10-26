const assert = require('node:assert/strict');
const test = require('node:test');

const { createTripState, applyCommand, buildTripProjection, generatePlan } = require('../collaborativeTrip');
const { resolvePledges } = require('./pledges');

// Demo travellers auto-pledge; these tests need members who only pledge when told to.
function quiet(trip) {
  const next = JSON.parse(JSON.stringify(trip));
  Object.values(next.members).forEach((member) => { if (member.demo) { delete member.demo; delete (next.pledges || {})[member.uid]; } });
  return next;
}

function lockedTrip() {
  let trip = createTripState({ id: 't1', ownerUid: 'owner', name: 'Test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt: Date.parse('2026-10-20T00:00:00Z') });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: { departureCity: 'Delhi', budget: 1000000, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true } });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  return quiet(applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-1' }));
}

const base = lockedTrip();
const demoUids = Object.keys(base.members).filter((u) => u !== 'owner');
const allUids = ['owner', ...demoUids];
const shareOf = (trip, uid) => trip.activePlan.memberTotals.find((m) => m.uid === uid).total;
const pledge = (trip, uid, minGoing, maxShare, extra = {}) => applyCommand(trip, { type: 'setPledge', uid, minGoing, maxShare, ...extra });
const view = (trip, uid) => buildTripProjection(trip, uid).features.pledges;
const ctx = { generatePlan, approvedIds: (s) => Object.values(s.members).filter((m) => m.status === 'approved').sort((a, b) => a.joinOrder - b.joinOrder).map((m) => m.uid) };

test('pledging requires approved membership and a locked plan', () => {
  assert.throws(() => pledge(base, 'stranger', 2, 100000), /membership required/);
  assert.throws(() => applyCommand(base, { type: 'clearPledge', uid: 'stranger' }), /membership required/);
  const reopened = applyCommand(base, { type: 'reopen', uid: 'owner' });
  assert.throws(() => pledge(reopened, 'owner', 2, 100000), /locked plan is required/);
  assert.throws(() => applyCommand(reopened, { type: 'clearPledge', uid: 'owner' }), /locked plan is required/);
});

test('pledge fields are validated', () => {
  for (const minGoing of [1, 5, 2.5, '3', undefined]) assert.throws(() => pledge(base, 'owner', minGoing, 100000), /required/);
  for (const maxShare of [0, -1, 10000001, 1.5, '90000', undefined]) assert.throws(() => pledge(base, 'owner', 2, maxShare), /required/);
  for (const deadline of ['2026-02-30', '12/01/2026', 20261201]) assert.throws(() => pledge(base, 'owner', 2, 100000, { deadline }), /required/);
  assert.throws(() => pledge(base, 'owner', 2, 100000, { deadline: '2026-12-11' }), /not allowed/);
});

test('setPledge stores the pledge against the plan version and clearPledge removes it', () => {
  const trip = pledge(base, 'owner', 3, 120000, { deadline: '2026-11-15' });
  assert.equal(trip.pledges.owner.minGoing, 3);
  assert.equal(trip.pledges.owner.maxShare, 120000);
  assert.equal(trip.pledges.owner.deadline, '2026-11-15');
  assert.equal(trip.pledges.owner.planVersion, base.activePlan.version);
  assert.equal(typeof trip.pledges.owner.at, 'number');
  assert.equal(pledge(base, 'owner', 2, 100000, { deadline: '' }).pledges.owner.deadline, null);
  const cleared = applyCommand(trip, { type: 'clearPledge', uid: 'owner' });
  assert.equal(cleared.pledges.owner, undefined);
  assert.equal(applyCommand(base, { type: 'clearPledge', uid: 'owner' }).pledges.owner, undefined);
});

test('everyone is firmly in when all conditions hold', () => {
  let trip = base;
  allUids.forEach((uid) => { trip = pledge(trip, uid, 4, shareOf(trip, uid), { deadline: uid === 'owner' ? '2026-11-01' : '2026-11-20' }); });
  const mine = view(trip, 'owner');
  assert.equal(mine.pledgedCount, 4);
  assert.equal(mine.firmlyInCount, 4);
  assert.equal(mine.everyoneIn, true);
  assert.equal(mine.earliestDeadline, '2026-11-01');
  assert.equal(mine.iAmFirmlyIn, true);
  assert.equal(mine.myShareIfFirm, shareOf(trip, 'owner'));
});

test('one unmet condition cascades through the group', () => {
  let trip = base;
  // owner can afford only the four-person share; demo 0 needs all four; demo 2's cap is below any share.
  trip = pledge(trip, 'owner', 2, shareOf(trip, 'owner'));
  trip = pledge(trip, demoUids[0], 4, 10000000);
  trip = pledge(trip, demoUids[1], 2, 10000000);
  trip = pledge(trip, demoUids[2], 2, 1000);
  assert.deepEqual(resolvePledges(trip, ctx).firm, []);
  assert.equal(view(trip, 'owner').firmlyInCount, 0);
  assert.equal(view(trip, 'owner').iAmFirmlyIn, false);
  assert.equal(view(trip, 'owner').myShareIfFirm, null);

  // With a generous owner cap, owner and demo 1 travel as a pair at the two-person share.
  trip = pledge(trip, 'owner', 2, 10000000);
  const { firm, shares } = resolvePledges(trip, ctx);
  assert.deepEqual(firm.sort(), ['owner', demoUids[1]].sort());
  assert.ok(shares.owner > shareOf(trip, 'owner'));
  assert.equal(view(trip, demoUids[1]).myShareIfFirm, shares[demoUids[1]]);
  assert.equal(view(trip, demoUids[0]).iAmFirmlyIn, false);
});

test('a lone pledger is never firmly in', () => {
  const trip = pledge(base, 'owner', 2, 10000000);
  assert.equal(view(trip, 'owner').pledgedCount, 1);
  assert.equal(view(trip, 'owner').firmlyInCount, 0);
});

test('pledges from an earlier plan version are ignored and marked stale', () => {
  let trip = pledge(base, 'owner', 2, 10000000);
  trip = pledge(trip, demoUids[0], 2, 10000000);
  trip = applyCommand(trip, { type: 'reopen', uid: 'owner' });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  [...demoUids, 'owner'].forEach((uid) => { trip = applyCommand(trip, { type: 'vote', uid, destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision }); });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-2' });
  const mine = view(trip, 'owner');
  assert.equal(mine.pledgedCount, 0);
  assert.equal(mine.firmlyInCount, 0);
  assert.equal(mine.myPledge.stale, true);
});

test('projections never reveal who pledged or anyone else\'s conditions', () => {
  let trip = pledge(base, 'owner', 3, 987654, { deadline: '2026-11-11' });
  trip = pledge(trip, demoUids[0], 2, 10000000);
  const other = view(trip, demoUids[1]);
  assert.equal(other.myPledge, null);
  assert.equal(other.pledgedCount, 2);
  const text = JSON.stringify(buildTripProjection(trip, demoUids[1]));
  assert.ok(!text.includes('987654'));
  assert.ok(!text.includes('"pledges":{"owner"'));
  assert.ok(!JSON.stringify(other).includes('owner'));
  assert.ok(!JSON.stringify(view(trip, demoUids[0])).includes('987654'));
  assert.equal(view(trip, 'owner').myPledge.maxShare, 987654);
  assert.throws(() => buildTripProjection(trip, 'stranger'), /membership required/);
});
