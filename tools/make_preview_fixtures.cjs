// Builds realistic planner projections at every stage with the real trip engine, for the UI preview mode.
// Usage: node make_preview_fixtures.cjs <app root>
const path = require('node:path');
const root = path.resolve(process.argv[2]);
const { createTripState, applyCommand, buildTripProjection } = require(path.join(root, 'src/lib/collaborativeTrip.js'));
const now = Date.parse('2026-10-25T09:00:00Z');
const at = (trip, command) => applyCommand(trip, { now, ...command });
const owner = 'owner';
const mine = { departureCity: 'Bengaluru', budget: 220000, passportExpiry: '2031-12', visas: ['schengen'], datesConfirmed: true, preferences: ['food', 'beach'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true };
let trip = createTripState({ id: 'preview-trip', ownerUid: owner, name: 'Goa or abroad? December crew', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt: Date.parse('2026-10-22T09:00:00Z') });
trip = at(trip, { type: 'addDemoMembers', uid: owner });
trip = at(trip, { type: 'addTask', uid: owner, title: 'Find dates that work' });
const fixtures = {};
fixtures.collecting = buildTripProjection(trip, owner, now);
trip = at(trip, { type: 'setPrivatePreferences', uid: owner, diet: 'vegetarian', alcohol: 'fine', skipTags: ['nightlife'] });
trip = at(trip, { type: 'submitConstraints', uid: owner, expectedInputRevision: trip.inputRevision, constraints: mine });
fixtures.ready = buildTripProjection(trip, owner, now);
trip = at(trip, { type: 'openVoting', uid: owner, expectedInputRevision: trip.inputRevision });
fixtures.voting = buildTripProjection(trip, owner, now);
trip = at(trip, { type: 'vote', uid: owner, destinationId: 'thailand-duo', round: trip.round, inputRevision: trip.inputRevision });
fixtures.voted = buildTripProjection(trip, owner, now);
trip = at(trip, { type: 'lock', uid: owner, round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'preview-lock' });
trip = at(trip, { type: 'setPayee', uid: owner, upiId: 'organizer@okaxis', advancePerPerson: 10000 });
trip = at(trip, { type: 'setPayoutHandle', uid: owner, kind: 'upi', handle: 'organizer@okaxis' });
const demos = Object.keys(trip.members).filter((uid) => uid !== owner);
trip = at(trip, { type: 'addExpense', uid: owner, title: 'Airport cabs', amount: 3200 });
trip = at(trip, { type: 'addExpense', uid: demos[0], title: 'Phi Phi boat deposit', amount: 8000, splitAmong: [owner, demos[0], demos[1]] });
trip = at(trip, { type: 'addTask', uid: owner, title: 'Book stays', assigneeUid: demos[1] });
trip = at(trip, { type: 'addTask', uid: owner, title: 'Compare flights', assigneeUid: owner });
trip = at(trip, { type: 'markPaid', uid: demos[0] });
fixtures.locked = buildTripProjection(trip, owner, now);
fixtures.lockedMember = buildTripProjection(trip, demos[1], now);

// A US group priced in dollars (homeCountry US, scope any). The organizer votes for New York, which their own budget
// cannot cover, so the locked states carry a lockExplanation where the organizer's pick was ineligible and lost.
const usMine = { departureCity: 'Chicago', budget: 1900, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food', 'nightlife'], entryCheckAcknowledged: true, isAdult: true, passportCountry: 'US' };
let us = createTripState({ id: 'preview-us-trip', ownerUid: owner, name: 'Winter break: stateside or abroad?', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, homeCountry: 'US', currency: 'USD', scope: 'any', createdAt: Date.parse('2026-10-22T09:00:00Z') });
us = at(us, { type: 'addDemoMembers', uid: owner });
us = at(us, { type: 'submitConstraints', uid: owner, expectedInputRevision: us.inputRevision, constraints: usMine });
fixtures.usReady = buildTripProjection(us, owner, now);
us = at(us, { type: 'openVoting', uid: owner, expectedInputRevision: us.inputRevision });
fixtures.usVoting = buildTripProjection(us, owner, now);
us = at(us, { type: 'vote', uid: owner, destinationId: 'new-york', round: us.round, inputRevision: us.inputRevision });
us = at(us, { type: 'lock', uid: owner, round: us.round, inputRevision: us.inputRevision, idempotencyKey: 'preview-us-lock' });
us = at(us, { type: 'setPayee', uid: owner, kind: 'venmo', handle: '@trip-organizer', advancePerPerson: 300 });
const usDemos = Object.keys(us.members).filter((uid) => uid !== owner);
us = at(us, { type: 'setPayoutHandle', uid: owner, kind: 'venmo', handle: 'trip-organizer' });
us = at(us, { type: 'addExpense', uid: owner, title: 'Airport rideshare', amount: 64 });
us = at(us, { type: 'addExpense', uid: usDemos[0], title: 'Snorkel trip deposit', amount: 180, splitAmong: [owner, usDemos[0], usDemos[1]] });
us = at(us, { type: 'addTask', uid: owner, title: 'Compare flights', assigneeUid: owner });
us = at(us, { type: 'markPaid', uid: usDemos[0] });
fixtures.usLocked = buildTripProjection(us, owner, now);
fixtures.usLockedMember = buildTripProjection(us, usDemos[1], now);
const why = fixtures.usLocked.lockExplanation; const mineWhy = fixtures.locked.lockExplanation;
if (why.winner === 'new-york' || !why.ineligible.some((item) => item.id === 'new-york')) throw new Error('US preview must show an ineligible organizer pick');
if (mineWhy.winner === 'thailand-duo') throw new Error('India preview must show an organizer pick that lost on votes');

const out = path.join(root, 'src/components/group-trip/preview/fixtures.json');
require('node:fs').writeFileSync(out, JSON.stringify({ generatedFrom: 'fermat-tools/make_preview_fixtures.cjs', memberUid: demos[1], usMemberUid: usDemos[1], memberUids: { lockedMember: demos[1], usLockedMember: usDemos[1] }, ...fixtures }, null, 1));
console.log('wrote', out, Object.keys(fixtures).join(', '));
