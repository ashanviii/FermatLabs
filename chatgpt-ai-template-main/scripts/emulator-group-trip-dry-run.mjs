import assert from 'node:assert/strict';

const count = Number(process.argv[2] || 2);
assert.ok(Number.isInteger(count) && count >= 2 && count <= 10, 'Member count must be an integer from 2 through 10');

const authBase = process.env.AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';
const appBase = process.env.APP_URL || 'http://127.0.0.1:3001';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key';

async function createIdentity(recoverable = false) {
  const credentials = recoverable ? { email: `owner-${crypto.randomUUID()}@example.test`, password: `Dry-run-${crypto.randomUUID()}!` } : {};
  const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...credentials, returnSecureToken: true }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, `Auth emulator signup failed: ${body.error?.message || response.status}`);
  return { uid: body.localId, token: body.idToken };
}

async function api(identity, body) {
  const response = await fetch(`${appBase}/api/group-trips`, {
    method: 'POST',
    headers: { authorization: `Bearer ${identity.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  assert.equal(response.ok, true, `API command failed (${body.action}/${body.command?.type || 'none'}): ${result.error || response.status}`);
  return result;
}

async function read(identity, tripId) {
  const response = await fetch(`${appBase}/api/group-trips?tripId=${encodeURIComponent(tripId)}`, {
    headers: { authorization: `Bearer ${identity.token}` },
  });
  const result = await response.json();
  assert.equal(response.ok, true, `Trip read failed: ${result.error || response.status}`);
  return result.trip;
}

const people = [await createIdentity(true), ...await Promise.all(Array.from({ length: count - 1 }, () => createIdentity()))];
const owner = people[0];
let departure;
if (process.argv.includes('--dynamic-city')) {
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(appBase).hostname), 'Dynamic city smoke test is local-only');
  const search = (identity, body) => fetch(`${appBase}/api/places`, { method: 'POST', headers: { ...(identity ? { authorization: `Bearer ${identity.token}` } : {}), 'content-type': 'application/json', origin: new URL(appBase).origin }, body: JSON.stringify(body) });
  assert.equal((await search(null, { query: 'Mysore', country: 'IN' })).status, 401);
  assert.equal((await search(owner, { query: 'Mysore', country: 'IN', latitude: 0 })).status, 400);
  const response = await search(owner, { query: 'Mysore', country: 'IN' });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, 'GeoNames', 'Run npm run data:cities before the dynamic city smoke test');
  departure = result.cities.find((city) => city.countryCode === 'IN');
  assert.ok(departure?.id?.startsWith('geonames:'));
  assert.equal('lat' in departure, false);
}
const idempotencyKey = `dry-run-${count}-${crypto.randomUUID()}`;
let result = await api(owner, {
  action: 'create',
  idempotencyKey,
  trip: { name: `${count}-person emulator journey`, startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: count, planningMode: 'catalog' },
});
assert.ok(result.invite, 'First create must return a one-time invite');
const createdTripId = result.trip.id;
const invite = result.invite;
const [tripId, ...secretParts] = invite.split('.');
assert.equal(tripId, createdTripId);

const replay = await api(owner, {
  action: 'create',
  idempotencyKey,
  trip: { name: `${count}-person emulator journey`, startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: count, planningMode: 'catalog' },
});
assert.equal(replay.trip.id, createdTripId, 'Create retry must resolve to the original trip');
assert.equal(replay.invite, undefined, 'Create retry must not reveal or rotate the invite');

for (let index = 1; index < people.length; index += 1) {
  await api(people[index], { action: 'join', tripId, inviteSecret: secretParts.join('.'), nickname: `Traveller ${index + 1}` });
  result = await api(owner, { action: 'command', tripId, command: { type: 'admitMember', memberUid: people[index].uid } });
}
assert.equal(Object.keys(result.trip.members).length, count);

const cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
for (let index = 0; index < people.length; index += 1) {
  result = await api(people[index], {
    action: 'command',
    tripId,
    command: {
      type: 'submitConstraints',
      expectedInputRevision: result.trip.inputRevision,
      constraints: {
        departureCity: index === 0 && departure ? 'untrusted client label' : cities[index % cities.length],
        ...(index === 0 && departure ? { departurePlaceId: departure.id } : {}),
        budget: 300000,
        passportExpiry: '2028-12',
        visas: [],
        datesConfirmed: true,
        preferences: ['culture', 'food'],
        entryCheckAcknowledged: true,
        isAdult: true,
        hasIndianPassport: true,
      },
    },
  });
}
assert.equal(result.trip.submissionProgress, count);

if (departure) {
  const ownView = await read(owner, tripId);
  assert.equal(ownView.myConstraints.departurePlaceId, departure.id);
  assert.equal(ownView.myConstraints.departureCity, departure.label);
  assert.equal(ownView.myConstraints.departurePlace.source, 'GeoNames');
  assert.ok(Number.isFinite(ownView.myConstraints.departurePlace.lat));
  const otherView = await read(people[1], tripId);
  assert.equal(JSON.stringify(otherView).includes(departure.id), false);
  assert.ok(ownView.myPrivateStatus.every((option) => option.fareBasis?.kind === 'distance' || option.total === null));
  console.log('PASS dynamic departure: authenticated search, server-owned coordinates, non-catalog city and private member projection');
}

result = await api(owner, { action: 'command', tripId, command: { type: 'openVoting', expectedInputRevision: result.trip.inputRevision } });
for (const person of people) {
  result = await api(person, { action: 'command', tripId, command: { type: 'vote', destinationId: 'bangkok', round: result.trip.round, inputRevision: result.trip.inputRevision } });
}
assert.equal(result.trip.ballotProgress, count);

result = await api(owner, { action: 'command', tripId, command: { type: 'lock', round: result.trip.round, inputRevision: result.trip.inputRevision, idempotencyKey: `lock-${crypto.randomUUID()}` } });
assert.equal(result.trip.phase, 'locked');
assert.equal(result.trip.lockedDestinationId, 'bangkok');
assert.equal(result.trip.activePlan.memberTotals.length, count);
assert.equal(result.trip.activePlan.memberTotals.reduce((sum, member) => sum + member.total, 0), result.trip.activePlan.groupTotal);

for (const person of people) {
  result = await api(person, { action: 'command', tripId, command: { type: 'approvePlan', planVersion: result.trip.activePlan.version, planRevision: result.trip.activePlan.revision, decision: 'approved' } });
}
assert.equal(Object.keys(result.trip.activePlan.approvals).length, count);

for (const person of people) {
  const projection = await read(person, tripId);
  assert.equal(projection.id, tripId);
  assert.equal(projection.constraints, undefined);
  assert.equal(projection.ballots, undefined);
  // Each traveller sees their own inputs; no other part of the projection may carry a ceiling.
  const { myConstraints, ...shared } = projection;
  assert.equal(myConstraints.budget, 300000, 'Traveller must see their own budget');
  assert.equal(JSON.stringify(shared).includes('300000'), false, 'Projection must not contain a private budget ceiling');
}

console.log(`PASS ${count}-person shared journey: create retry, join/admit, private inputs, vote, lock, reconcile, approve, privacy`);

if (process.argv.includes('--assistant')) {
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(appBase).hostname), 'Assistant smoke test is local-only');
  async function assistant(identity, body, expectedStatus = 200) {
    const response = await fetch(`${appBase}/api/group-trips/assistant`, {
      method: 'POST', headers: { ...(identity ? { authorization: `Bearer ${identity.token}` } : {}), 'content-type': 'application/json', origin: new URL(appBase).origin },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    assert.equal(response.status, expectedStatus, `Assistant request failed: ${payload.code || response.status}`);
    return payload;
  }
  const proposalRequest = { action: 'propose', tripId, requestId: crypto.randomUUID(), goal: 'cost', day: 0 };
  await assistant(null, proposalRequest, 401);
  await assistant(people[1], proposalRequest, 403);
  await assistant(owner, { ...proposalRequest, provider: 'groq' }, 400);
  const { proposal } = await assistant(owner, proposalRequest);
  assert.equal(proposal.mode, 'development', 'Run this test only with the development provider');
  assert.ok(proposal.changes.length);
  assert.ok(proposal.afterGroupTotal < proposal.beforeGroupTotal);
  assert.equal(JSON.stringify(proposal).includes('300000'), false);
  assert.deepEqual((await assistant(owner, proposalRequest)).proposal, proposal);
  const before = await read(owner, tripId);
  assert.equal(before.activePlan.revision, proposal.planRevision);
  const applyRequest = { action: 'apply', tripId, proposalId: proposal.proposalId, confirmed: true };
  await assistant(owner, { ...applyRequest, confirmed: false }, 400);
  await assistant(owner, { ...applyRequest, operations: [] }, 400);
  await assistant(people[1], applyRequest, 403);
  assert.equal((await assistant(owner, applyRequest)).applied, true);
  assert.equal((await assistant(owner, applyRequest)).replayed, true);
  const updated = await read(owner, tripId);
  assert.equal(updated.activePlan.revision, before.activePlan.revision + 1);
  assert.equal(updated.activePlan.groupTotal, proposal.afterGroupTotal);
  assert.deepEqual(updated.activePlan.approvals, {});
  const stale = (await assistant(owner, { ...proposalRequest, requestId: crypto.randomUUID(), goal: 'pace' })).proposal;
  await api(people[1], { action: 'command', tripId, command: { type: 'approvePlan', planVersion: updated.activePlan.version, planRevision: updated.activePlan.revision, decision: 'approved' } });
  await assistant(owner, { ...applyRequest, proposalId: stale.proposalId }, 409);
  console.log('PASS assistant: authenticated preview, cost checks, no premature mutation, confirmation, replay, stale rejection and private response');
}
