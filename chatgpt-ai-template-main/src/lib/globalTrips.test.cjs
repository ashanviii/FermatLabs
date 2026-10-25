// Trips from any country: settings, currency, scope, passports and visas, distance fares, lock explanation, payees.
// Loaded by collaborativeTrip.test.cjs so `npm run test:group-trip` runs it.
const assert = require('node:assert/strict');
const test = require('node:test');

const engine = require('./collaborativeTrip');
const { createTripState, applyCommand, buildTripProjection, generatePlan, validatePlan, seeds, geo } = engine;
const now = Date.parse('2026-10-25T09:00:00Z');

const legacyConstraint = (index, budget = 1000000, extra = {}) => ({
  departureCity: ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata'][index % 4], budget, passportExpiry: '2028-12', visas: ['uae', 'schengen'],
  datesConfirmed: true, preferences: ['culture', 'food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true, ...extra,
});
const usConstraint = (index, budget = 6000, extra = {}) => ({
  departureCity: ['Chicago', 'New York', 'Los Angeles', 'Boston'][index % 4], budget, passportExpiry: '2031-12', visas: [],
  datesConfirmed: true, preferences: ['culture', 'food'], entryCheckAcknowledged: true, isAdult: true, passportCountry: 'US', ...extra,
});

function roster(settings = {}, constraintFor = (index) => legacyConstraint(index), count = 4) {
  let trip = createTripState({ id: 'g', ownerUid: 'owner', name: 'Global', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: count, ...settings });
  for (let index = 1; index < count; index += 1) {
    trip = applyCommand(trip, { type: 'requestJoin', uid: `m${index + 1}`, nickname: `Member ${index + 1}`, now });
    trip = applyCommand(trip, { type: 'admitMember', uid: 'owner', memberUid: `m${index + 1}`, now });
  }
  Object.keys(trip.members).forEach((uid, index) => {
    trip = applyCommand(trip, { type: 'submitConstraints', uid, expectedInputRevision: trip.inputRevision, constraints: constraintFor(index, uid), now });
  });
  return trip;
}
const vote = (trip, choices) => {
  let next = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision, now });
  Object.entries(choices).forEach(([uid, destinationId]) => { next = applyCommand(next, { type: 'vote', uid, destinationId, round: next.round, inputRevision: next.inputRevision, now }); });
  return next;
};
const lock = (trip, key = 'lock') => applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: key, now });

test('trip settings default to India in rupees, derive currency from the home country, and validate', () => {
  const legacy = createTripState({ id: 't', ownerUid: 'o', name: 'T', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  assert.deepEqual([legacy.homeCountry, legacy.currency, legacy.scope], ['IN', 'INR', 'any']);
  const base = { id: 't', ownerUid: 'o', name: 'T', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 };
  assert.equal(createTripState({ ...base, homeCountry: 'GB' }).currency, 'GBP');
  assert.equal(createTripState({ ...base, homeCountry: 'DE' }).currency, 'EUR');
  assert.equal(createTripState({ ...base, homeCountry: 'US', currency: 'EUR' }).currency, 'EUR');
  assert.throws(() => createTripState({ ...base, homeCountry: 'XX' }), /Home country/);
  assert.throws(() => createTripState({ ...base, homeCountry: 'US', currency: 'ABC' }), /currency/);
  assert.throws(() => createTripState({ ...base, scope: 'local' }), /scope/);
  assert.throws(() => createTripState({ ...base, homeCountry: 'DE', scope: 'domestic' }), /domestic/);
  assert.throws(() => createTripState({ ...base, destinationIds: ['atlantis'] }), /Destination ids/);
  // States saved before these settings existed project as an Indian trip in rupees.
  const old = { ...roster() }; delete old.homeCountry; delete old.currency; delete old.scope;
  const view = buildTripProjection(old, 'owner', now);
  assert.deepEqual([view.homeCountry, view.currency, view.scope], ['IN', 'INR', 'any']);
});

test('a US group runs end to end in dollars with US passports and US departure cities', () => {
  let trip = createTripState({ id: 'us', ownerUid: 'owner', name: 'US crew', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, homeCountry: 'US', createdAt: now });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner', now });
  const demos = Object.values(trip.constraints);
  assert.ok(demos.every((c) => c.passportCountry === 'US' && c.hasIndianPassport === undefined && geo.departureCity(c.departureCity).countryCode === 'US'));
  assert.deepEqual(demos.map((c) => c.budget), [3800, 2600, 2100]);
  assert.ok(Object.values(trip.members).filter((m) => m.demo).every((m) => !/Aarav|Diya|Kabir/.test(m.nickname)));
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: usConstraint(0, 4000), now });
  const ready = buildTripProjection(trip, 'owner', now);
  assert.deepEqual([ready.homeCountry, ready.currency, ready.scope], ['US', 'USD', 'any']);
  assert.ok(ready.destinations.some((d) => d.id === 'new-york' && d.domestic === true && d.kind === 'city'));
  assert.ok(ready.destinations.some((d) => d.id === 'thailand-duo' && d.kind === 'route' && d.stops.join() === 'Bangkok,Phuket'));
  const nyc = ready.myPrivateStatus.find((s) => s.destinationId === 'new-york');
  assert.equal(nyc.visa, null, 'Domestic trips have no entry rules');
  assert.deepEqual(nyc.fareBasis.kind, 'distance');
  trip = applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision, now });
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'lisbon', round: trip.round, inputRevision: trip.inputRevision, now });
  trip = lock(trip, 'us-lock');
  assert.equal(trip.phase, 'locked');
  assert.equal(trip.activePlan.currency, 'USD');
  assert.deepEqual(validatePlan(trip.activePlan), []);
  const amounts = [...trip.activePlan.memberTotals.map((m) => m.total), ...Object.values(trip.activePlan.categories)];
  assert.ok(amounts.every(Number.isSafeInteger));
  assert.ok(trip.activePlan.memberTotals.every((m) => m.total < 10000), 'Totals are in dollars, not rupees');
  const view = buildTripProjection(trip, 'owner', now);
  assert.equal(view.myLockedVote, 'lisbon');
  assert.equal(view.lockExplanation.winner, trip.lockedDestinationId);
  assert.equal(view.features.settleUp.currency, 'USD');
});

test('costs convert from each destination currency through the fx snapshot, rounding to integers', () => {
  assert.equal(geo.convert(34000, 'INR', 'INR'), 34000);
  assert.equal(geo.convert(100, 'USD', 'INR'), Math.round(100 * geo.fx.rates.INR));
  assert.equal(geo.convert(34000, 'INR', 'USD'), Math.round(34000 / geo.fx.rates.INR));
  assert.equal(geo.convert(22000, 'JPY', 'EUR'), Math.round((22000 / geo.fx.rates.JPY) * geo.fx.rates.EUR));
  assert.throws(() => geo.convert(1, 'INR', 'ABC'), /Unsupported currency/);
  assert.ok(Object.keys(geo.fx.rates).length >= 35);
  // An Indian group priced in dollars: the explicit Delhi fare table and rupee seed costs convert, totals still reconcile.
  const inr = generatePlan(roster(), 'bangkok');
  const usd = generatePlan(roster({ currency: 'USD' }), 'bangkok');
  assert.equal(usd.currency, 'USD');
  assert.deepEqual(validatePlan(usd), []);
  assert.ok(Math.abs(usd.groupTotal - inr.groupTotal / geo.fx.rates.INR) / usd.groupTotal < 0.01);
  // A yen-costed destination for a rupee trip.
  const tokyo = generatePlan(roster(), 'tokyo');
  assert.equal(tokyo.currency, 'INR');
  assert.equal(tokyo.categories.lodging, 2 * 5 * geo.convert(22000, 'JPY', 'INR'));
});

test('distance fares: labelled bands, open jaw for routes, the Indian table still wins, every city reaches every destination', () => {
  assert.equal(geo.fareBand(100).usd, 40);
  assert.equal(geo.fareBand(799).usd, 160);
  assert.equal(geo.fareBand(800).usd, 260);
  assert.equal(geo.fareBand(12000).usd, 1300);
  assert.ok(geo.FARE_BANDS_USD.every((band) => typeof band.label === 'string' && band.label));
  const usd = engine.settingsOf({ homeCountry: 'US', currency: 'USD' });
  const city = geo.departureCity('New York');
  const route = { id: 'x', stops: [{ lat: 13.7563, lon: 100.5018 }, { lat: 7.8804, lon: 98.3923 }] };
  const openJaw = engine.journeyFor(usd, 'New York', route);
  const expected = Math.round((geo.fareBand(geo.distanceKm(city, route.stops[0])).usd + geo.fareBand(geo.distanceKm(city, route.stops[1])).usd) / 2);
  assert.equal(openJaw.amount, expected); assert.equal(openJaw.basis, 'distance');
  const inr = engine.settingsOf({});
  assert.deepEqual(engine.journeyFor(inr, 'Delhi', seeds.destinations.find((d) => d.id === 'bangkok')), { amount: 34000, basis: 'table' });
  assert.equal(engine.journeyFor(usd, 'Delhi', seeds.destinations.find((d) => d.id === 'bangkok')).amount, geo.convert(34000, 'INR', 'USD'));
  assert.ok(geo.departureCities.length >= 90);
  Object.keys(seeds.departureCities).forEach((name) => assert.ok(geo.departureCity(name), `${name} keeps its exact name`));
  for (const { name } of geo.departureCities) {
    const trip = roster({ homeCountry: 'US' }, (index) => usConstraint(index, 10000000, { departureCity: name }));
    for (const dest of seeds.destinations) {
      const plan = generatePlan(trip, dest.id, { enforceBudgets: false, skipDocumentChecks: true });
      assert.deepEqual(validatePlan(plan), [], `${name} -> ${dest.id}`);
      assert.ok(plan.categories.journeys > 0, `${name} -> ${dest.id} has a fare`);
    }
  }
});

test('forex applies when the local currency differs from the trip currency, at 413 bps for India and 300 elsewhere', () => {
  const us = roster({ homeCountry: 'US' }, (index) => usConstraint(index, 10000000));
  const lisbon = generatePlan(us, 'lisbon'); const nyc = generatePlan(us, 'new-york');
  lisbon.memberTotals.forEach((m) => assert.equal(m.forex, Math.ceil((m.inDestination * 300) / 10000)));
  assert.equal(nyc.categories.forex, 0);
  const india = roster();
  generatePlan(india, 'bangkok').memberTotals.forEach((m) => assert.equal(m.forex, Math.ceil((m.inDestination * 413) / 10000)));
  assert.equal(generatePlan(india, 'goa').categories.forex, 0);
  // An Indian group paying in dollars still pays forex in Goa, because the rupee is foreign to a dollar card.
  assert.ok(generatePlan(roster({ currency: 'USD' }), 'goa').categories.forex > 0);
});

test('scope: domestic shows only home-country options, international only the rest; out-of-scope votes fail and never win', () => {
  const domestic = roster({ scope: 'domestic' });
  const view = buildTripProjection(domestic, 'owner', now);
  assert.deepEqual(view.destinations.map((d) => d.id), ['goa', 'manali', 'kerala-trio', 'rajasthan-duo']);
  assert.deepEqual(view.destinationBoard.map((d) => d.destinationId), ['goa', 'manali', 'kerala-trio', 'rajasthan-duo']);
  assert.deepEqual(view.myPrivateStatus.map((d) => d.destinationId), ['goa', 'manali', 'kerala-trio', 'rajasthan-duo']);
  let voting = applyCommand(domestic, { type: 'openVoting', uid: 'owner', expectedInputRevision: domestic.inputRevision, now });
  assert.throws(() => applyCommand(voting, { type: 'vote', uid: 'owner', destinationId: 'bangkok', round: voting.round, inputRevision: voting.inputRevision, now }), /not one of this trip/);
  const international = buildTripProjection(roster({ scope: 'international' }), 'owner', now);
  assert.ok(international.destinations.length === 9 && international.destinations.every((d) => !d.domestic));
  assert.ok(!international.destinationBoard.some((d) => ['goa', 'manali'].includes(d.destinationId)));
  const usDomestic = buildTripProjection(roster({ homeCountry: 'US', scope: 'domestic' }, (index) => usConstraint(index)), 'owner', now);
  // Every US option in the catalog, in seed order (grows as city packs are imported).
  assert.deepEqual(usDomestic.destinations.map((d) => d.id), seeds.destinations.filter((d) => d.countryCode === 'US').map((d) => d.id));
  assert.deepEqual(usDomestic.destinations.map((d) => d.id).slice(0, 3), ['new-york', 'miami', 'new-orleans']);
  // A US international trip where everyone votes for New York locks somewhere abroad instead.
  let usIntl = roster({ homeCountry: 'US', scope: 'international' }, (index) => usConstraint(index, 10000));
  usIntl = vote(usIntl, { owner: 'lisbon', m2: 'lisbon', m3: 'tokyo', m4: 'tokyo' });
  assert.throws(() => applyCommand(usIntl, { type: 'vote', uid: 'owner', destinationId: 'new-york', round: usIntl.round, inputRevision: usIntl.inputRevision, now }), /not one of this trip/);
  const locked = lock(usIntl, 'intl');
  assert.ok(['lisbon', 'tokyo'].includes(locked.lockedDestinationId));
  // India keeps exactly the original 13 options by default.
  assert.equal(buildTripProjection(roster(), 'owner', now).destinationBoard.length, 13);
});

test('passport nationality: passportCountry for new clients, hasIndianPassport for old ones, and they must agree', () => {
  const trip = createTripState({ id: 'p', ownerUid: 'owner', name: 'P', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  const submit = (constraints) => applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: 0, constraints, now });
  const legacy = submit(legacyConstraint(0));
  assert.equal('passportCountry' in legacy.constraints.owner, false, 'Legacy inputs are stored unchanged');
  const { hasIndianPassport, ...modern } = legacyConstraint(0);
  assert.equal(submit({ ...modern, passportCountry: 'US' }).constraints.owner.passportCountry, 'US');
  assert.equal(submit({ ...modern, passportCountry: 'IN', hasIndianPassport: true }).constraints.owner.passportCountry, 'IN');
  assert.throws(() => submit({ ...modern, passportCountry: 'US', hasIndianPassport: true }), /incomplete/);
  assert.throws(() => submit({ ...modern, passportCountry: 'ZZ' }), /incomplete/);
  assert.throws(() => submit(modern), /incomplete/);
  assert.equal(submit({ ...modern, passportCountry: 'GB', departureCity: 'London' }).constraints.owner.departureCity, 'London');
  assert.throws(() => submit({ ...modern, passportCountry: 'GB', departureCity: 'Atlantis' }), /incomplete/);
});

test('visa rules differ by passport: US vs Indian passports, Schengen lead time, waivers and citizens', () => {
  const tenDays = Date.parse('2026-11-30T00:00:00Z');
  const india = roster({}, (index) => legacyConstraint(index, 1000000, { visas: [] }));
  const us = roster({ homeCountry: 'US' }, (index) => usConstraint(index, 10000000));
  assert.throws(() => generatePlan(india, 'paris', { now: tenDays }), /visa/i);
  assert.doesNotThrow(() => generatePlan(us, 'paris', { now: tenDays }));
  assert.throws(() => generatePlan(india, 'lisbon', { now: Date.parse('2026-11-01T00:00:00Z') }), /visa/i, 'Schengen needs 45 days');
  assert.doesNotThrow(() => generatePlan(india, 'tokyo', { now: tenDays }), 'Japan e-visa needs 7 days');
  assert.throws(() => generatePlan(india, 'tokyo', { now: Date.parse('2026-12-05T00:00:00Z') }), /visa/i);
  // US passports need a Vietnam e-visa (7 days) but not a Thai visa.
  assert.throws(() => generatePlan(us, 'hanoi', { now: Date.parse('2026-12-05T00:00:00Z') }), /visa/i);
  assert.doesNotThrow(() => generatePlan(us, 'bangkok', { now: Date.parse('2026-12-09T00:00:00Z') }));
  // Indian passport + US visa waives Mexico; without it a Mexican visa needs 30 days.
  assert.throws(() => generatePlan(india, 'cancun', { now: tenDays }), /visa/i);
  const withUs = roster({}, (index) => legacyConstraint(index, 1000000, { visas: ['us'] }));
  assert.doesNotThrow(() => generatePlan(withUs, 'cancun', { now: tenDays }));
  assert.doesNotThrow(() => generatePlan(withUs, 'new-york', { now: tenDays }));
  assert.throws(() => generatePlan(india, 'new-york', { now: tenDays }), /visa/i);
  // Entry costs follow the passport: Americans pay no Schengen visa fee, Indians keep the curated amount.
  assert.equal(generatePlan(us, 'paris').categories.entryAllowance, 0);
  assert.equal(generatePlan(india, 'paris').categories.entryAllowance, 4 * 10500);
  assert.equal(generatePlan(us, 'hanoi').categories.entryAllowance, 4 * 40);
  // A Canadian group going to New York: a US citizen in the group needs no visa or long passport validity.
  const canada = roster({ homeCountry: 'CA' }, (index) => usConstraint(index, 10000000, { departureCity: 'Toronto', passportCountry: index === 0 ? 'US' : 'CA', passportExpiry: index === 0 ? '2027-01' : '2031-12' }));
  assert.doesNotThrow(() => generatePlan(canada, 'new-york', { now: Date.parse('2026-12-08T00:00:00Z') }));
  const usDomestic = roster({ homeCountry: 'US' }, (index) => usConstraint(index, 10000000, { passportExpiry: 'none' }));
  assert.doesNotThrow(() => generatePlan(usDomestic, 'miami', { now }), 'Domestic trips need no passport');
  assert.throws(() => generatePlan(usDomestic, 'cancun', { now }), /passport/i);
  const view = buildTripProjection(us, 'owner', now);
  assert.deepEqual(view.myPrivateStatus.find((s) => s.destinationId === 'hanoi').visa, { passportCountry: 'US', rules: [{ countryCode: 'VN', kind: 'evisa' }], leadDays: 7, holdsVisa: false });
  assert.equal(geo.visaRule('IN', 'TH').kind, 'free');
  assert.equal(geo.visaLeadDays('IN', 'FR'), 45);
  assert.equal(geo.visaLeadDays('US', 'US'), 0);
});

test('lock explanation: the viewer sees why their ineligible pick lost and how the winner was decided', () => {
  let trip = roster({}, (index, uid) => legacyConstraint(index, 300000, uid === 'm2' ? { passportExpiry: 'none', visas: [] } : {}));
  trip = lock(vote(trip, { owner: 'bangkok', m2: 'bangkok', m3: 'bangkok', m4: 'bangkok' }), 'why');
  const why = buildTripProjection(trip, 'owner', now).lockExplanation;
  assert.equal(why.winner, trip.lockedDestinationId);
  assert.deepEqual(why.totals, { bangkok: 4 });
  assert.deepEqual(why.topVoted, ['bangkok']);
  assert.ok(!why.eligible.includes('bangkok'));
  assert.deepEqual(why.ineligible.find((item) => item.id === 'bangkok'), { id: 'bangkok', budgetShort: 0, passport: 1, visaTiming: 0, tooShort: false, outOfScope: false });
  assert.equal(why.decidedBy, 'orderTieBreak', 'Kerala and Rajasthan tie on votes (0) and preference fit; seed order decides');
  assert.equal(why.winner, 'kerala-trio');
  assert.equal(JSON.stringify(why).includes('m2'), false, 'Explanation is anonymous');
  assert.equal(buildTripProjection(trip, 'm3', now).myLockedVote, 'bangkok');
  trip = applyCommand(trip, { type: 'reopen', uid: 'owner', now });
  const reopened = buildTripProjection(trip, 'owner', now);
  assert.equal(reopened.lockExplanation, null); assert.equal(reopened.myLockedVote, null);
});

test('lock explanation records preference tie-breaks and plain vote wins', () => {
  const prefs = { owner: ['adventure', 'nature'], m2: ['adventure', 'nature'], m3: ['culture', 'food'], m4: ['culture', 'food'] };
  let tie = roster({}, (index, uid) => legacyConstraint(index, 1000000, { preferences: prefs[uid] }));
  tie = lock(vote(tie, { owner: 'goa', m2: 'goa', m3: 'manali', m4: 'manali' }), 'tie');
  // Fit: goa (beach,nightlife,food,nature) = 1+1+1+1 = 4; manali (nature,adventure,culture) = 2+2+1+1 = 6.
  assert.equal(tie.lockExplanation.decidedBy, 'preferenceTieBreak');
  assert.equal(tie.lockExplanation.winner, 'manali');
  assert.deepEqual(tie.lockExplanation.topVoted.sort(), ['goa', 'manali']);
  assert.equal(buildTripProjection(tie, 'owner', now).myLockedVote, 'goa');
  let plain = roster();
  plain = lock(vote(plain, { owner: 'bangkok', m2: 'bangkok', m3: 'bangkok', m4: 'dubai' }), 'plain');
  assert.equal(plain.lockExplanation.decidedBy, 'votes');
  assert.deepEqual(plain.lockExplanation.totals, { bangkok: 3, dubai: 1 });
  assert.deepEqual(plain.publishedTotals, plain.lockExplanation.totals);
});

test('payees accept UPI, PayPal, Venmo, Revolut, Monzo and Cash App with per-kind validation; old UPI payloads still work', () => {
  let trip = lock(vote(roster(), { owner: 'goa', m2: 'goa', m3: 'goa', m4: 'goa' }), 'pay');
  const set = (payload) => applyCommand(trip, { type: 'setPayee', uid: 'owner', ...payload, now });
  assert.deepEqual(set({ upiId: 'organizer@okaxis' }).payee, { kind: 'upi', handle: 'organizer@okaxis', upiId: 'organizer@okaxis', advancePerPerson: null });
  assert.deepEqual(set({ kind: 'venmo', handle: '@diya-k' }).payee, { kind: 'venmo', handle: 'diya-k', advancePerPerson: null });
  assert.equal(set({ kind: 'cashapp', handle: '$aarav' }).payee.handle, 'aarav');
  assert.equal(set({ kind: 'paypal', handle: 'aarav@example.com' }).payee.handle, 'aarav@example.com');
  assert.equal(set({ kind: 'paypal', handle: 'AaravK' }).payee.kind, 'paypal');
  assert.equal(set({ kind: 'revolut', handle: '@aarav.k' }).payee.handle, 'aarav.k');
  assert.equal(set({ kind: 'monzo', handle: 'aaravk' }).payee.kind, 'monzo');
  assert.throws(() => set({ kind: 'upi', handle: 'not a upi' }), /UPI ID/);
  assert.throws(() => set({ kind: 'cashapp', handle: '$1234' }), /cashtag/);
  assert.throws(() => set({ kind: 'venmo', handle: 'abc' }), /Venmo/);
  assert.throws(() => set({ kind: 'paypal', handle: 'https://evil.example/x' }), /PayPal/);
  assert.throws(() => set({ kind: 'zelle', handle: 'x@y.com' }), /Payment method/);
  trip = set({ kind: 'venmo', handle: 'diya-k', advancePerPerson: 50 });
  const view = buildTripProjection(trip, 'm2', now).payee;
  assert.deepEqual([view.kind, view.handle, view.display, view.label, view.link], ['venmo', 'diya-k', '@diya-k', 'Venmo', 'https://venmo.com/u/diya-k']);
  const legacyState = { ...trip, payee: { upiId: 'organizer@okaxis', advancePerPerson: null } };
  const legacyView = buildTripProjection(legacyState, 'm2', now).payee;
  assert.deepEqual([legacyView.kind, legacyView.handle, legacyView.upiId], ['upi', 'organizer@okaxis', 'organizer@okaxis']);
  assert.match(legacyView.link, /^upi:\/\/pay\?pa=organizer%40okaxis.*&cu=INR/);
});

test('demo travellers for a British trip leave from UK or nearby cities with British passports and pound budgets', () => {
  let trip = createTripState({ id: 'gb', ownerUid: 'owner', name: 'UK', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 6, homeCountry: 'GB' });
  trip = applyCommand(trip, { type: 'addDemoMembers', uid: 'owner', now });
  const demos = Object.values(trip.constraints);
  assert.equal(demos.length, 5);
  assert.deepEqual(demos.slice(0, 4).map((c) => geo.departureCity(c.departureCity).countryCode), ['GB', 'GB', 'GB', 'GB']);
  assert.ok(demos.every((c) => c.passportCountry === 'GB' && Number.isSafeInteger(c.budget) && c.budget < 10000));
  let india = createTripState({ id: 'in', ownerUid: 'owner', name: 'IN', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 });
  india = applyCommand(india, { type: 'addDemoMembers', uid: 'owner', now });
  assert.deepEqual(Object.values(india.constraints).map((c) => [c.departureCity, c.budget, c.hasIndianPassport]), [['Mumbai', 180000, true], ['Bengaluru', 120000, true], ['Delhi', 95000, true]]);
});

test('holiday and source snapshots carry licenses; India merges its festival list', () => {
  assert.ok(geo.holidaysFor('US').some((h) => h.date === '2026-07-04'));
  assert.ok(geo.holidaysFor('IN').some((h) => h.name === 'Diwali'));
  for (const code of ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG', 'DE', 'FR', 'ES', 'NL', 'IE', 'NZ', 'ZA', 'JP']) assert.ok(geo.holidaysFor(code).length > 3, code);
  Object.values(geo.sources).forEach((source) => { assert.ok(source.source && source.license && source.fetchedAt); });
  seeds.destinations.forEach((dest) => {
    assert.match(dest.countryCode, /^[A-Z]{2}$/, dest.id);
    (dest.stops || [dest]).forEach((point) => assert.ok(Number.isFinite(point.lat) && Number.isFinite(point.lon), dest.id));
  });
});

test('formatMoney uses lakh grouping for rupees and local conventions elsewhere', async (t) => {
  let format;
  try { format = await import('./format.ts'); } catch (_) { t.skip('This Node cannot strip TypeScript types'); return; }
  assert.equal(format.formatMoney(150000, 'INR'), format.formatINR(150000));
  assert.equal(format.formatMoney(150000, 'INR', { compact: true }), '₹1.5L');
  assert.equal(format.formatMoney(2400, 'USD'), '$2,400');
  assert.equal(format.formatMoney(1890, 'EUR'), '€1,890');
  assert.equal(format.formatMoney(2400, 'USD', { compact: true }), '$2.4K');
  assert.equal(format.formatMoney(null, 'USD'), '—');
});
