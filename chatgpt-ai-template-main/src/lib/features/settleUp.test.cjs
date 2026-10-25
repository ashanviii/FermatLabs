const assert = require('node:assert/strict');
const test = require('node:test');

const { allocateInteger, createTripState, applyCommand, buildTripProjection } = require('../collaborativeTrip');
const { computeBalances, settleTransfers } = require('./settleUp');

const NOW = Date.parse('2026-10-25T00:00:00Z');

function lockedTrip() {
  let trip = createTripState({ id: 't1', ownerUid: 'owner', name: 'Test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt: Date.parse('2026-10-20T00:00:00Z') });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: { departureCity: 'Delhi', budget: 1000000, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true } });
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  trip = applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-1' });
  return trip;
}

const setup = () => { const trip = lockedTrip(); return { trip, demo: Object.keys(trip.members).filter((u) => u !== 'owner').sort((a, b) => trip.members[a].joinOrder - trip.members[b].joinOrder) }; };
const add = (trip, uid, fields) => applyCommand(trip, { type: 'addExpense', uid, now: NOW, ...fields });
const sum = (values) => values.reduce((total, value) => total + value, 0);

test('addExpense defaults payer to caller and split to every approved member', () => {
  const { trip, demo } = setup();
  const next = add(trip, 'owner', { title: '  Villa deposit ', amount: 40000 });
  assert.equal(next.expenseSeq, 1);
  assert.deepEqual(next.expenses, [{ id: 'exp-1', title: 'Villa deposit', amount: 40000, paidBy: 'owner', splitAmong: ['owner', ...demo], createdBy: 'owner', at: NOW }]);
  const second = add(next, demo[0], { title: 'Cab', amount: 900, paidBy: demo[1], splitAmong: [demo[2], demo[1]] });
  assert.equal(second.expenses[1].id, 'exp-2');
  assert.equal(second.expenses[1].paidBy, demo[1]);
  assert.deepEqual(second.expenses[1].splitAmong, [demo[1], demo[2]]);
  assert.equal(second.expenses[1].createdBy, demo[0]);
});

test('addExpense rejects outsiders and invalid input', () => {
  const { trip, demo } = setup();
  assert.throws(() => add(trip, 'stranger', { title: 'Snacks', amount: 100 }), /membership required/);
  assert.throws(() => add(trip, 'owner', { title: '   ', amount: 100 }), /title/);
  assert.throws(() => add(trip, 'owner', { title: 'x'.repeat(81), amount: 100 }), /title/);
  for (const amount of [0, -5, 10.5, 10000001, '100', null]) assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount }), /amount/);
  assert.doesNotThrow(() => add(trip, 'owner', { title: 'Max', amount: 10000000 }));
  assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount: 100, paidBy: 'stranger' }), /payer/);
  assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount: 100, splitAmong: [] }), /split/);
  assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount: 100, splitAmong: [demo[0], demo[0]] }), /split/);
  assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount: 100, splitAmong: ['owner', 'stranger'] }), /split/);
  assert.throws(() => add(trip, 'owner', { title: 'Snacks', amount: 100, splitAmong: 'owner' }), /split/);
});

test('removeExpense is limited to the creator or the organizer', () => {
  const { trip, demo } = setup();
  let next = add(trip, demo[0], { title: 'Dinner', amount: 2000 });
  next = add(next, demo[1], { title: 'Ferry', amount: 800 });
  assert.throws(() => applyCommand(next, { type: 'removeExpense', uid: demo[2], expenseId: 'exp-1' }), /allowed/);
  assert.throws(() => applyCommand(next, { type: 'removeExpense', uid: 'stranger', expenseId: 'exp-1' }), /membership required/);
  assert.throws(() => applyCommand(next, { type: 'removeExpense', uid: 'owner', expenseId: 'exp-9' }), /required/);
  const byCreator = applyCommand(next, { type: 'removeExpense', uid: demo[0], expenseId: 'exp-1' });
  assert.deepEqual(byCreator.expenses.map((e) => e.id), ['exp-2']);
  const byOrganizer = applyCommand(next, { type: 'removeExpense', uid: 'owner', expenseId: 'exp-2' });
  assert.deepEqual(byOrganizer.expenses.map((e) => e.id), ['exp-1']);
  // Ids keep counting up after removal so they never collide.
  assert.equal(add(byOrganizer, 'owner', { title: 'Tea', amount: 40 }).expenses[1].id, 'exp-3');
});

test('setPayoutHandle validates each kind and stores a group-visible handle', () => {
  const { trip, demo } = setup();
  const set = (uid, kind, handle) => applyCommand(trip, { type: 'setPayoutHandle', uid, kind, handle });
  assert.deepEqual(set('owner', 'upi', ' aarav@okaxis ').payoutHandles, { owner: { kind: 'upi', handle: 'aarav@okaxis' } });
  assert.deepEqual(set(demo[0], 'venmo', '@diya-k').payoutHandles[demo[0]], { kind: 'venmo', handle: 'diya-k' });
  for (const kind of ['paypal', 'revolut', 'monzo']) assert.equal(set('owner', kind, 'aarav.k_1').payoutHandles.owner.kind, kind);
  assert.throws(() => set('owner', 'upi', 'aarav'), /UPI ID/);
  assert.throws(() => set('owner', 'upi', 'a@1bank'), /UPI ID/);
  assert.throws(() => set('owner', 'paypal', 'has space'), /required/);
  assert.throws(() => set('owner', 'paypal', 'x'), /required/);
  assert.throws(() => set('owner', 'paypal', 'https://evil.example/x'), /required/);
  assert.throws(() => set('owner', 'cashapp', 'aarav'), /allowed/);
  assert.throws(() => set('stranger', 'upi', 'aarav@okaxis'), /membership required/);
});

test('balances sum to zero and remainders go to the earliest joiners', () => {
  const members = { a: { joinOrder: 0 }, b: { joinOrder: 1 }, c: { joinOrder: 2 } };
  const balances = computeBalances([{ amount: 100, paidBy: 'c', splitAmong: ['c', 'b', 'a'] }], members, allocateInteger, ['a', 'b', 'c']);
  assert.deepEqual(balances, { a: -34, b: -33, c: 67 });
  assert.equal(sum(Object.values(balances)), 0);
});

test('settleTransfers pays largest creditor from largest debtor with integer amounts', () => {
  assert.deepEqual(settleTransfers({ a: 0, b: 0 }), []);
  const balances = { a: 1200, b: -400, c: -500, d: -300 };
  const transfers = settleTransfers(balances, ['a', 'b', 'c', 'd']);
  assert.deepEqual(transfers, [{ from: 'c', to: 'a', amount: 500 }, { from: 'b', to: 'a', amount: 400 }, { from: 'd', to: 'a', amount: 300 }]);
  const mixed = { a: 700, b: 300, c: -600, d: -400 };
  const result = settleTransfers(mixed, ['a', 'b', 'c', 'd']);
  assert.ok(result.length <= 3);
  const after = { ...mixed }; result.forEach(({ from, to, amount }) => { assert.ok(Number.isInteger(amount) && amount > 0); after[from] += amount; after[to] -= amount; });
  assert.deepEqual(Object.values(after), [0, 0, 0, 0]);
});

test('projection exposes shared expenses, balances, transfers, handles, and the viewer net', () => {
  const { trip, demo } = setup();
  let next = add(trip, 'owner', { title: 'Villa', amount: 4001 });
  next = add(next, demo[0], { title: 'Scooters', amount: 1000, splitAmong: [demo[0], demo[1]] });
  next = applyCommand(next, { type: 'setPayoutHandle', uid: 'owner', kind: 'upi', handle: 'aarav@okaxis' });
  const view = buildTripProjection(next, demo[1], NOW).features.settleUp;
  assert.equal(view.currency, 'INR');
  assert.equal(view.expenses.length, 2);
  assert.deepEqual(view.balances, { owner: 3000, [demo[0]]: -500, [demo[1]]: -1500, [demo[2]]: -1000 });
  assert.equal(view.myNet, -1500);
  assert.equal(sum(view.transfers.filter((t) => t.to === 'owner').map((t) => t.amount)), 3000);
  assert.deepEqual(view.payoutHandles, { owner: { kind: 'upi', handle: 'aarav@okaxis' } });
  assert.equal(buildTripProjection(next, 'owner', NOW).features.settleUp.myNet, 3000);
});

test('projection never leaks private constraints and old trips default cleanly', () => {
  const { trip, demo } = setup();
  const empty = buildTripProjection(trip, demo[0], NOW).features.settleUp;
  assert.deepEqual(empty.expenses, []);
  assert.deepEqual(empty.transfers, []);
  assert.deepEqual(empty.payoutHandles, {});
  assert.equal(empty.myNet, 0);
  const next = add(trip, 'owner', { title: 'Villa', amount: 4000 });
  const text = JSON.stringify(buildTripProjection(next, demo[0], NOW).features.settleUp);
  assert.ok(!text.includes('budget') && !text.includes('1000000') && !text.includes('passport'));
  assert.ok(!text.includes(String(next.constraints[demo[1]].budget)));
});
