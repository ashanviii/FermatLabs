import assert from 'node:assert/strict';

const count = Number(process.argv[2] || 4);
assert.ok(Number.isInteger(count) && count >= 4 && count <= 10, 'Member count must be an integer from 4 through 10');

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
const idempotencyKey = `dry-run-${count}-${crypto.randomUUID()}`;
let result = await api(owner, {
  action: 'create',
  idempotencyKey,
  trip: { name: `${count}-person emulator journey`, startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: count },
});
assert.ok(result.invite, 'First create must return a one-time invite');
const createdTripId = result.trip.id;
const invite = result.invite;
const [tripId, ...secretParts] = invite.split('.');
assert.equal(tripId, createdTripId);

const replay = await api(owner, {
  action: 'create',
  idempotencyKey,
  trip: { name: `${count}-person emulator journey`, startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: count },
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
        departureCity: cities[index % cities.length],
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
  assert.equal(JSON.stringify(projection).includes('300000'), false, 'Projection must not contain a private budget ceiling');
}

console.log(`PASS ${count}-person shared journey: create retry, join/admit, private inputs, vote, lock, reconcile, approve, privacy`);
