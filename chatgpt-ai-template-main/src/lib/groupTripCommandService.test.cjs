const assert = require('node:assert/strict');
const test = require('node:test');
const { createTrip, mutateTrip } = require('./groupTripCommandService');
const { buildTripProjection } = require('./collaborativeTrip');

function memoryFirestore() {
  const records = new Map();
  const snapshot = (ref) => ({ id: ref.path.split('/').pop(), exists: records.has(ref.path), data: () => structuredClone(records.get(ref.path)) });
  return {
    records,
    doc: (path) => ({ path }),
    runTransaction: async (callback) => callback({
      get: async (ref) => snapshot(ref),
      create: (ref, value) => { if (records.has(ref.path)) throw new Error('already exists'); records.set(ref.path, structuredClone(value)); },
      update: (ref, patch) => { if (!records.has(ref.path)) throw new Error('not found'); records.set(ref.path, { ...records.get(ref.path), ...structuredClone(patch) }); },
    }),
  };
}

const basics = { name: 'Friends escape', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4 };
const common = { serverTimestamp: () => 'server-time', now: () => 1000 };

test('create retries return one trip and never mint a second invite', async () => {
  const firestore = memoryFirestore();
  const first = await createTrip({ firestore, uid: 'owner', body: { idempotencyKey: 'create-key-1', trip: basics }, ...common, makeId: () => 'trip-1', makeSecret: () => 'first-secret' });
  const replay = await createTrip({ firestore, uid: 'owner', body: { idempotencyKey: 'create-key-1', trip: basics }, ...common, makeId: () => 'trip-2', makeSecret: () => 'unused-secret' });
  assert.equal(first.invite, 'trip-1.first-secret');
  assert.equal(replay.tripId, 'trip-1');
  assert.equal(replay.invite, undefined);
  assert.equal([...firestore.records.keys()].filter((key) => key.startsWith('groupTrips/')).length, 1);
});

test('rotated and revoked invites fail closed while existing membership remains', async () => {
  const firestore = memoryFirestore();
  await createTrip({ firestore, uid: 'owner', body: { idempotencyKey: 'create-key-2', trip: basics }, ...common, makeId: () => 'trip-1', makeSecret: () => 'old-secret' });
  const rotated = await mutateTrip({ firestore, uid: 'owner', body: { tripId: 'trip-1', action: 'command', command: { type: 'rotateInvite' } }, ...common, makeSecret: () => 'new-secret' });
  assert.equal(rotated.invite, 'trip-1.new-secret');
  await assert.rejects(() => mutateTrip({ firestore, uid: 'late', body: { tripId: 'trip-1', action: 'join', inviteSecret: 'old-secret', nickname: 'Late' }, ...common }), /invite/i);
  const joined = await mutateTrip({ firestore, uid: 'member', body: { tripId: 'trip-1', action: 'join', inviteSecret: 'new-secret', nickname: 'Member' }, ...common });
  assert.equal(buildTripProjection(joined.state, 'member').membershipStatus, 'pending');
  await assert.rejects(() => mutateTrip({ firestore, uid: 'member', body: { tripId: 'trip-1', action: 'command', command: { type: 'revokeInvite' } }, ...common }), /organizer/i);
  await mutateTrip({ firestore, uid: 'owner', body: { tripId: 'trip-1', action: 'command', command: { type: 'revokeInvite' } }, ...common });
  await assert.rejects(() => mutateTrip({ firestore, uid: 'later', body: { tripId: 'trip-1', action: 'join', inviteSecret: 'new-secret', nickname: 'Later' }, ...common }), /invite/i);
  assert.equal(buildTripProjection(joined.state, 'member').membershipStatus, 'pending');
});

test('public projections contain neither raw invite secrets nor private constraints', async () => {
  const firestore = memoryFirestore();
  const created = await createTrip({ firestore, uid: 'owner', body: { idempotencyKey: 'create-key-3', trip: basics }, ...common, makeId: () => 'trip-1', makeSecret: () => 'sentinel-secret' });
  const payload = JSON.stringify(buildTripProjection(created.state, 'owner'));
  assert.equal(payload.includes('sentinel-secret'), false);
  assert.equal(payload.includes('constraints'), false);
  assert.equal(payload.includes('ballots'), false);
});
