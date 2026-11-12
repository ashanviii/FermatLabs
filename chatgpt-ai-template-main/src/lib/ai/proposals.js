const { createHash } = require('node:crypto');
const domain = require('../collaborativeTrip');
const { fail, parseRequest } = require('./contracts');
const { assertOrganizer, fingerprint } = require('./agents/catalog');
const { runTripAgents } = require('./orchestrator');

const hash = (value) => createHash('sha256').update(value).digest('hex');
const EXPIRY_MS = 10 * 60 * 1000;
const LEASE_MS = 30 * 1000;

function rateBucket(data, now, limit, windowMs) {
  const active = Number(data?.resetAt) > now;
  const count = active ? Number(data.count) : 0;
  if (!Number.isFinite(count) || count >= limit) fail('RATE_LIMITED', 'Assistant allowance reached. Try again later.', 429);
  return { count: count + 1, resetAt: active ? data.resetAt : now + windowMs, expiresAt: new Date(now + windowMs + EXPIRY_MS) };
}

async function generateProposal({ firestore, uid, body, provider, now = Date.now }) {
  parseRequest(body);
  if (body.action !== 'propose') fail('INVALID_REQUEST', 'A proposal request is required.');
  const proposalId = hash(`${uid}\0${body.tripId}\0${body.requestId}`);
  const inputHash = hash(JSON.stringify([body.goal, body.day, body.instruction || null, provider.mode]));
  const tripRef = firestore.doc(`groupTrips/${body.tripId}`);
  const proposalRef = firestore.doc(`_aiProposals/${proposalId}`);
  const leaseRef = firestore.doc(`_aiLeases/${hash(body.tripId)}`);
  const userLimit = firestore.doc(`_aiUsage/${hash(uid)}`);
  const globalLimit = firestore.doc('_aiUsage/global');
  const reserved = await firestore.runTransaction(async (transaction) => {
    const [trip, existing, lease, userUsage, globalUsage] = await Promise.all([tripRef, proposalRef, leaseRef, userLimit, globalLimit].map((ref) => transaction.get(ref)));
    const state = trip.data()?.state; assertOrganizer(state, uid);
    const clock = now();
    if (existing.exists) {
      const record = existing.data();
      if (record.inputHash !== inputHash) fail('IDEMPOTENCY_CONFLICT', 'This request ID belongs to another action.', 409);
      if (record.expiresAt <= clock) fail('PROPOSAL_EXPIRED', 'Request a fresh suggestion.', 409);
      if (record.status === 'ready') {
        if (record.fingerprint !== fingerprint(state)) fail('STALE_PROPOSAL', 'The trip changed. Request a fresh suggestion.', 409);
        return { cached: record.preview };
      }
      fail('REQUEST_ALREADY_USED', 'This request is already processing or finished. Start a new request explicitly.', 409);
    }
    if (Number(lease.data()?.until) > clock) fail('BUSY', 'Another suggestion is processing for this trip.', 409);
    const nextUser = rateBucket(userUsage.data(), clock, 10, 60 * 60 * 1000);
    const nextGlobal = rateBucket(globalUsage.data(), clock, 100, 24 * 60 * 60 * 1000);
    transaction.set(userLimit, nextUser); transaction.set(globalLimit, nextGlobal);
    transaction.set(leaseRef, { proposalId, until: clock + LEASE_MS, expiresAt: new Date(clock + LEASE_MS) });
    transaction.set(proposalRef, { uid, tripId: body.tripId, inputHash, status: 'pending', expiresAt: clock + EXPIRY_MS, deleteAfter: new Date(clock + EXPIRY_MS) });
    return { state };
  });
  if (reserved.cached) return reserved.cached;
  try {
    const result = await runTripAgents(reserved.state, uid, body, provider);
    return await firestore.runTransaction(async (transaction) => {
      const [trip, lease] = await Promise.all([transaction.get(tripRef), transaction.get(leaseRef)]);
      const state = trip.data()?.state; assertOrganizer(state, uid);
      if (lease.data()?.proposalId !== proposalId || lease.data()?.until <= now() || result.fingerprint !== fingerprint(state)) fail('STALE_PROPOSAL', 'The trip changed while the suggestion was being prepared.', 409);
      const expiresAt = now() + EXPIRY_MS;
      const preview = { ...result.preview, proposalId, expiresAt };
      transaction.update(proposalRef, { status: 'ready', mode: provider.mode, fingerprint: result.fingerprint, operations: result.operations, preview, expiresAt, deleteAfter: new Date(expiresAt) });
      transaction.delete(leaseRef);
      return preview;
    });
  } catch (error) {
    await firestore.runTransaction(async (transaction) => {
      const lease = await transaction.get(leaseRef);
      transaction.update(proposalRef, { status: 'failed' });
      if (lease.data()?.proposalId === proposalId) transaction.delete(leaseRef);
    }).catch(() => {});
    throw error;
  }
}

async function applyProposal({ firestore, uid, body, provider, now = Date.now }) {
  parseRequest(body);
  if (body.action !== 'apply') fail('INVALID_REQUEST', 'An apply request is required.');
  const tripRef = firestore.doc(`groupTrips/${body.tripId}`);
  const proposalRef = firestore.doc(`_aiProposals/${body.proposalId}`);
  return firestore.runTransaction(async (transaction) => {
    const [trip, proposal] = await Promise.all([transaction.get(tripRef), transaction.get(proposalRef)]);
    const state = trip.data()?.state; assertOrganizer(state, uid);
    const record = proposal.data();
    if (!record || record.uid !== uid || record.tripId !== body.tripId) fail('PROPOSAL_UNAVAILABLE', 'This suggestion is not available.', 404);
    if (record.status === 'applied') return { applied: true, replayed: true };
    if (record.status !== 'ready' || record.expiresAt <= now() || record.mode !== provider.mode) fail('PROPOSAL_EXPIRED', 'Request a fresh suggestion.', 409);
    if (record.fingerprint !== fingerprint(state)) fail('STALE_PROPOSAL', 'The trip changed. Request a fresh suggestion.', 409);
    if (!record.operations.length) fail('NO_CHANGES', 'There are no changes to apply.', 409);
    const next = domain.applyCommand(state, { type: 'applyPlanSuggestion', uid, planVersion: record.preview.planVersion, planRevision: record.preview.planRevision, inputRevision: record.preview.inputRevision, operations: record.operations });
    transaction.update(tripRef, { state: next, updatedAt: new Date(now()) });
    transaction.update(proposalRef, { status: 'applied', appliedAt: now() });
    return { applied: true, replayed: false };
  });
}

module.exports = { generateProposal, applyProposal, rateBucket };
