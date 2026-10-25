const { createHash, randomBytes, randomUUID } = require('node:crypto');
const domain = require('./collaborativeTrip');

const digest = (value) => createHash('sha256').update(value).digest('hex');
const commandTypes = new Set(['admitMember', 'rejectMember', 'submitConstraints', 'openVoting', 'vote', 'lock', 'approvePlan', 'editPlanItem', 'reopen', 'rotateInvite', 'revokeInvite']);

async function createTrip({ firestore, uid, body, serverTimestamp, now = Date.now, makeId = randomUUID, makeSecret = () => randomBytes(24).toString('base64url') }) {
  const idempotencyKey = String(body.idempotencyKey || '');
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) throw new Error('Create idempotency key is required');
  const tripId = makeId(); const inviteSecret = makeSecret();
  const state = domain.createTripState({ ...body.trip, id: tripId, ownerUid: uid });
  const requestRef = firestore.doc(`groupTripCreateRequests/${digest(`${uid}\0${idempotencyKey}`)}`);
  const result = await firestore.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (requestSnap.exists) {
      const existingRef = firestore.doc(`groupTrips/${requestSnap.data().tripId}`); const existingSnap = await transaction.get(existingRef);
      if (!existingSnap.exists) throw new Error('Idempotent trip record not found');
      return { tripId: existingSnap.id, state: existingSnap.data().state, created: false };
    }
    const tripRef = firestore.doc(`groupTrips/${tripId}`);
    transaction.create(tripRef, { state, inviteHash: digest(inviteSecret), inviteExpiresAt: now() + 7 * 86400000, createdAt: serverTimestamp() });
    transaction.create(requestRef, { uid, tripId, createdAt: serverTimestamp() });
    return { tripId, state, created: true };
  });
  return { tripId: result.tripId, state: result.state, ...(result.created ? { invite: `${result.tripId}.${inviteSecret}` } : {}) };
}

async function mutateTrip({ firestore, uid, body, serverTimestamp, now = Date.now, makeSecret = () => randomBytes(24).toString('base64url') }) {
  const tripId = String(body.tripId || ''); if (!tripId) throw new Error('Trip ID is required');
  if (!['join', 'command'].includes(body.action)) throw new Error('Unsupported trip action');
  if (body.action === 'command' && !commandTypes.has(body.command?.type)) throw new Error('Unsupported trip command');
  const ref = firestore.doc(`groupTrips/${tripId}`); const replacementSecret = body.action === 'command' && body.command.type === 'rotateInvite' ? makeSecret() : '';
  const state = await firestore.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref); if (!snap.exists) throw new Error('Trip not found'); const record = snap.data(); let next = record.state;
    if (body.action === 'join') {
      if (!body.inviteSecret || digest(body.inviteSecret) !== record.inviteHash || record.inviteExpiresAt <= now()) throw new Error('Invite is invalid, revoked, or expired');
      next = domain.applyCommand(next, { type: 'requestJoin', uid, nickname: body.nickname, now: now() });
      transaction.update(ref, { state: next, updatedAt: serverTimestamp() });
    } else if (body.command.type === 'rotateInvite' || body.command.type === 'revokeInvite') {
      if (next.ownerUid !== uid) throw new Error('Only the organizer can manage invites');
      transaction.update(ref, body.command.type === 'rotateInvite'
        ? { inviteHash: digest(replacementSecret), inviteExpiresAt: now() + 7 * 86400000, updatedAt: serverTimestamp() }
        : { inviteHash: null, inviteExpiresAt: 0, updatedAt: serverTimestamp() });
    } else {
      next = domain.applyCommand(next, { ...body.command, uid, now: now() });
      transaction.update(ref, { state: next, updatedAt: serverTimestamp() });
    }
    return next;
  });
  return { tripId, state, ...(replacementSecret ? { invite: `${tripId}.${replacementSecret}` } : {}) };
}

module.exports = { createTrip, mutateTrip };
