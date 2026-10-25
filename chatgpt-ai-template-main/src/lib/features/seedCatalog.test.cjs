// Seed catalog checks, including the city packs imported by tools/import_city_packs.py.
// Lives in features/ only so the `src/lib/features/*.test.cjs` glob in `npm run test:group-trip` picks it up.
const assert = require('node:assert/strict');
const test = require('node:test');

const { createTripState, applyCommand, buildTripProjection, generatePlan, validatePlan, seeds, geo } = require('../collaborativeTrip');

const now = Date.parse('2026-08-01T09:00:00Z'); // four months ahead, so every visa lead time fits
const TAGS = ['adventure', 'art', 'beach', 'culture', 'food', 'nature', 'nightlife', 'shopping'];
const ORIGINAL_IN = ['bangkok', 'dubai', 'paris', 'bali', 'singapore', 'hanoi', 'goa', 'manali', 'thailand-duo', 'vietnam-duo', 'uae-duo', 'kerala-trio', 'rajasthan-duo'];
const packs = seeds.destinations.filter((dest) => String(dest.source).startsWith('pack:'));
const PACK_IDS = ['abu-dhabi', 'amsterdam', 'barcelona', 'chicago', 'hampi', 'istanbul', 'kuala-lumpur', 'las-vegas', 'london', 'mexico-city', 'pondicherry', 'rishikesh', 'san-francisco', 'seoul'];

function roster(settings, constraintFor) {
  let trip = createTripState({ id: 'catalog', ownerUid: 'owner', name: 'Catalog', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, ...settings });
  for (let index = 2; index <= 4; index += 1) {
    trip = applyCommand(trip, { type: 'requestJoin', uid: `m${index}`, nickname: `Member ${index}`, now });
    trip = applyCommand(trip, { type: 'admitMember', uid: 'owner', memberUid: `m${index}`, now });
  }
  Object.keys(trip.members).forEach((uid, index) => {
    trip = applyCommand(trip, { type: 'submitConstraints', uid, expectedInputRevision: trip.inputRevision, constraints: constraintFor(index), now });
  });
  return trip;
}
// A complete private input with a budget large enough for any option (1 crore rupees, converted to the trip currency).
const member = (departureCity, passportCountry, { currency = 'INR', ...extra } = {}) => ({
  departureCity, budget: geo.convert(10000000, 'INR', currency), passportExpiry: '2032-12', visas: [], datesConfirmed: true,
  preferences: ['culture', 'food'], entryCheckAcknowledged: true, isAdult: true, passportCountry, ...extra,
});

test('the catalog is well formed: unique ids, known tags, durations within a half day, supported countries and currencies', () => {
  assert.equal(seeds.version, '2026.10.5');
  const ids = seeds.destinations.map((dest) => dest.id);
  assert.equal(new Set(ids).size, ids.length, 'destination ids are unique');
  assert.deepEqual([...new Set(seeds.destinations.flatMap((dest) => dest.tags))].sort(), TAGS, 'tag vocabulary is unchanged');
  for (const dest of seeds.destinations) {
    assert.ok(geo.isCountry(dest.countryCode), `${dest.id} country`);
    assert.ok(geo.isCurrency(dest.costCurrency || seeds.currency), `${dest.id} currency`);
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: dest.timeZone }), `${dest.id} time zone`);
    for (const stop of dest.stops || [dest]) {
      const activities = stop.activities || [];
      assert.equal(new Set(activities.map((a) => a.id)).size, activities.length, `${dest.id}/${stop.id} activity ids are unique`);
      for (const activity of activities) {
        assert.ok(Number.isSafeInteger(activity.durationMinutes) && activity.durationMinutes >= 1 && activity.durationMinutes <= 210, `${dest.id}/${activity.id} duration`);
        assert.ok(Number.isSafeInteger(activity.costPerPerson) && activity.costPerPerson >= 0, `${dest.id}/${activity.id} cost`);
        assert.ok(activity.tags.length && activity.tags.every((tag) => TAGS.includes(tag)), `${dest.id}/${activity.id} tags`);
      }
    }
  }
});

test('imported city packs carry provenance and leave visa timing and entry fees to the per-passport rules', () => {
  assert.deepEqual(packs.map((dest) => dest.id).sort(), PACK_IDS);
  for (const dest of packs) {
    assert.ok(dest.attribution.includes('Wikivoyage') && dest.attribution.includes('CC BY-SA'), `${dest.id} attribution`);
    assert.ok(Number.isFinite(dest.lat) && Number.isFinite(dest.lon), `${dest.id} coordinates`);
    assert.ok(dest.costCurrency && dest.activities.length >= 5, dest.id);
    assert.equal('visaLeadDays' in dest, false, `${dest.id} must not look curated for Indian passports`);
    assert.equal('entryAllowance' in dest, false, dest.id);
    assert.ok(!dest.activities.some((a) => /stadium|arena|flag pole/i.test(a.title)), `${dest.id} filler removed`);
  }
  // Imported after the existing options, which keep their seed order (the last tie-break).
  assert.deepEqual(seeds.destinations.slice(0, 13).map((dest) => dest.id), ORIGINAL_IN);
  assert.deepEqual(seeds.defaultShortlists.IN, ORIGINAL_IN, 'Indian trips keep the original 13 options by default');
});

test('every imported destination plans and validates from departure cities across countries, with documents checked', () => {
  const groups = [
    { settings: { homeCountry: 'IN' }, cities: ['Delhi', 'Bengaluru', 'Kolkata', 'Kochi'], passport: 'IN', visas: ['us', 'uk', 'schengen', 'uae'] },
    { settings: { homeCountry: 'US' }, cities: ['New York', 'Los Angeles', 'Chicago', 'Miami'], passport: 'US', visas: [] },
    { settings: { homeCountry: 'GB' }, cities: ['London', 'Manchester', 'Edinburgh', 'Dublin'], passport: 'GB', visas: [] },
    { settings: { homeCountry: 'AU' }, cities: ['Sydney', 'Perth', 'Auckland', 'Singapore'], passport: 'AU', visas: [] },
    { settings: { homeCountry: 'BR' }, cities: ['São Paulo', 'Buenos Aires', 'Lagos', 'Tokyo'], passport: 'BR', visas: [] },
  ];
  for (const { settings, cities, passport, visas } of groups) {
    const currency = geo.currencyForCountry(settings.homeCountry);
    const trip = roster({ ...settings, destinationIds: PACK_IDS }, (index) => member(cities[index], passport, { visas, currency }));
    for (const id of PACK_IDS) {
      const plan = generatePlan(trip, id, { now });
      assert.deepEqual(validatePlan(plan), [], `${settings.homeCountry} -> ${id}`);
      assert.equal(plan.currency, currency);
      assert.ok(plan.categories.journeys > 0 && plan.categories.lodging > 0, `${settings.homeCountry} -> ${id} is priced`);
      const activityDays = plan.itinerary.flatMap((day) => day.items).filter((item) => item.templateId);
      assert.ok(activityDays.length >= 3, `${settings.homeCountry} -> ${id} schedules activities`);
    }
  }
});

test('every departure city reaches every imported destination', () => {
  const names = [...new Set([...Object.keys(seeds.departureCities), ...geo.departureCities.map((city) => city.name)])];
  for (const name of names) {
    const trip = roster({ homeCountry: 'US', destinationIds: PACK_IDS }, () => member(name, 'US', { currency: 'USD' }));
    for (const id of PACK_IDS) {
      const plan = generatePlan(trip, id, { enforceBudgets: false, skipDocumentChecks: true });
      assert.deepEqual(validatePlan(plan), [], `${name} -> ${id}`);
      assert.ok(plan.categories.journeys > 0, `${name} -> ${id} has a fare`);
    }
  }
});

test('Indian packs are domestic for Indian groups, US packs for US groups, and both are international elsewhere', () => {
  const indian = buildTripProjection(roster({ homeCountry: 'IN', destinationIds: PACK_IDS }, (index) => member(['Delhi', 'Chennai', 'Bengaluru', 'Pune'][index], 'IN')), 'owner', now);
  const domesticIn = indian.destinations.filter((d) => d.domestic).map((d) => d.id);
  assert.deepEqual(domesticIn, ['hampi', 'pondicherry', 'rishikesh']);
  const hampi = indian.myPrivateStatus.find((s) => s.destinationId === 'hampi');
  assert.equal(hampi.visa, null);
  assert.deepEqual(hampi.fareBasis, { kind: 'table' }, 'Indian fare table prices the short domestic hops');
  assert.equal(generatePlan(roster({ homeCountry: 'IN', destinationIds: PACK_IDS }, (index) => member('Delhi', 'IN', { passportExpiry: index === 1 ? 'none' : '2032-12' })), 'rishikesh', { now }).categories.forex, 0);

  const usDomestic = buildTripProjection(roster({ homeCountry: 'US', scope: 'domestic' }, (index) => member(['Boston', 'Austin', 'Seattle', 'Denver'][index], 'US', { currency: 'USD' })), 'owner', now);
  for (const id of ['las-vegas', 'san-francisco', 'chicago', 'new-york']) assert.ok(usDomestic.destinations.some((d) => d.id === id && d.domestic), id);
  assert.ok(usDomestic.destinations.every((d) => d.countryCode === 'US'));

  const usAny = buildTripProjection(roster({ homeCountry: 'US' }, (index) => member('Boston', 'US', { currency: 'USD' })), 'owner', now);
  assert.equal(usAny.destinations.length, seeds.destinations.length, 'groups without a shortlist see the whole catalog');
  assert.ok(usAny.destinations.find((d) => d.id === 'hampi').domestic === false);
  const indianDefault = buildTripProjection(roster({ homeCountry: 'IN' }, (index) => member('Delhi', 'IN')), 'owner', now);
  assert.deepEqual(indianDefault.destinations.map((d) => d.id), ORIGINAL_IN);
});

test('pack visa rules follow the passport: Indian passports need UK and Schengen visas unless they hold one', () => {
  const view = (visas) => buildTripProjection(roster({ homeCountry: 'IN', destinationIds: PACK_IDS }, () => member('Mumbai', 'IN', { visas })), 'owner', now);
  const status = (projection, id) => projection.myPrivateStatus.find((s) => s.destinationId === id).visa;
  const none = view([]);
  assert.ok(status(none, 'london').leadDays >= 30 && status(none, 'london').holdsVisa === false);
  assert.ok(status(none, 'barcelona').leadDays >= 30);
  assert.equal(status(view(['uk', 'schengen', 'us']), 'london').holdsVisa, true);
  assert.equal(status(view(['us']), 'mexico-city').holdsVisa, true, 'a US visa waives Mexico for Indian passports');
  assert.equal(status(view(['us']), 'abu-dhabi').holdsVisa, true);
  // A visa that takes longer than the time left blocks the option for that member.
  const soon = Date.parse('2026-11-25T09:00:00Z');
  const trip = roster({ homeCountry: 'IN', destinationIds: PACK_IDS }, () => member('Mumbai', 'IN'));
  assert.throws(() => generatePlan(trip, 'london', { now: soon }), /visa/);
  const us = buildTripProjection(roster({ homeCountry: 'US', destinationIds: PACK_IDS }, () => member('Boston', 'US', { currency: 'USD' })), 'owner', now);
  assert.ok(status(us, 'london').leadDays <= 3, 'US passports need at most an ETA for the UK');
});

test('pack costs in local currencies convert to the trip currency at sensible levels', () => {
  const us = roster({ homeCountry: 'US', destinationIds: PACK_IDS }, (index) => member(['Boston', 'Austin', 'Seattle', 'Denver'][index], 'US', { currency: 'USD' }));
  for (const id of PACK_IDS) {
    const plan = generatePlan(us, id, { now });
    const perNightPerRoom = plan.categories.lodging / 2 / plan.stops[0].nights; // 4 people share 2 rooms
    assert.ok(perNightPerRoom >= 20 && perNightPerRoom <= 400, `${id}: ${perNightPerRoom} USD per room-night`);
  }
  const seoul = seeds.destinations.find((d) => d.id === 'seoul');
  assert.equal(seoul.costCurrency, 'KRW');
  assert.equal(generatePlan(us, 'seoul', { now }).categories.lodging, 2 * 5 * geo.convert(seoul.roomNight, 'KRW', 'USD'));
});
