const { createHash } = require('node:crypto');
const domain = require('../collaborativeTrip');
const { AIWorkflowError, fail, plainObject, exactKeys } = require('./contracts');
const { readJsonBody } = require('../server/jsonRequest');
const { resolveCity } = require('../geo/cityDirectory.server');
const { fingerprint } = require('./agents/catalog');
const { collectDestinationContext, generateDestinationDraft } = require('./agents/destination');
const { assertServerOnly } = require('./providers/groq');
const { rateBucket } = require('./proposals');

const hash = (value) => createHash('sha256').update(value).digest('hex');
const EXPIRY_MS = 10 * 60 * 1000;
const LEASE_MS = 30 * 1000;

function assertDestinationOrganizer(state, uid, requireCollecting = true) {
  if (!state || !uid || state.ownerUid !== uid || state.members?.[uid]?.status !== 'approved') {
    fail('FORBIDDEN', 'Only the trip organizer can request destinations.', 403);
  }
  if (requireCollecting && state.phase !== 'collecting') fail('COLLECTING_REQUIRED', 'Collect trip inputs before requesting destinations.', 409);
}

function assertProvider(provider) {
  assertServerOnly();
  if (!['groq', 'openai'].includes(provider?.mode) || typeof provider.generateDestination !== 'function') {
    fail('AI_DESTINATION_UNAVAILABLE', 'Destination drafts require a configured AI provider. No simulated fallback is available.', 503);
  }
}

function destinationCapabilities({ state, uid, provider }) {
  assertDestinationOrganizer(state, uid);
  assertProvider(provider);
  return { mode: provider.mode, label: provider.mode === 'openai' ? 'OpenAI destination drafts' : 'Groq destination drafts' };
}

function assertCapacity(state, placeId) {
  const active = state.dynamicDestinationIds || Object.keys(state.dynamicDestinations || {});
  if (active.filter((id) => state.dynamicDestinations[id]?.placeId !== placeId).length >= 12) fail('DESTINATION_LIMIT', 'This trip already has 12 destination choices. Change the trip inputs to start a new shortlist.', 409);
}

function assertScope(state, place) {
  const { homeCountry, scope } = domain.settingsOf(state);
  if (!['any', 'domestic', 'international'].includes(scope) ||
    (scope !== 'any' && (place.countryCode === homeCountry) !== (scope === 'domestic'))) {
    fail('DESTINATION_OUT_OF_SCOPE', 'Choose a destination matching the trip scope.', 409);
  }
}

function parseDestinationRequest(body) {
  if (!plainObject(body) || typeof body.tripId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.tripId)) {
    fail('INVALID_REQUEST', 'A valid trip ID is required.');
  }
  if (body.action === 'generate' && exactKeys(body, ['action', 'tripId', 'placeId', 'requestId'])) {
    if (typeof body.placeId !== 'string' || !/^(?:geonames:\d{1,12}|ourairports:[A-Z0-9]{3,4})$/.test(body.placeId) || typeof body.requestId !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId)) {
      fail('INVALID_REQUEST', 'Choose a city and use a new destination request ID.');
    }
  } else if (body.action === 'add' && exactKeys(body, ['action', 'tripId', 'proposalId', 'confirmed'])) {
    if (typeof body.proposalId !== 'string' || !/^[a-f0-9]{64}$/.test(body.proposalId) || body.confirmed !== true) {
      fail('CONFIRMATION_REQUIRED', 'Confirm the destination preview before adding it.');
    }
  } else fail('INVALID_REQUEST', 'Unsupported destination request.');
  return body;
}

async function readDestinationRequest(request, appOrigin = process.env.FERMAT_APP_ORIGIN || new URL(request.url).origin) {
  return parseDestinationRequest(await readJsonBody(request, appOrigin));
}

function destinationPreview(state, uid, destination) {
  const candidate = domain.applyCommand(structuredClone(state), {
    type: 'addGeneratedDestination', uid, expectedInputRevision: state.inputRevision, destination,
  });
  const members = Object.keys(state.members).filter((memberUid) => state.members[memberUid].status === 'approved');
  let missingTravelEstimates = members.some((memberUid) => !Number.isSafeInteger(destination.journeyQuotes[memberUid]?.amount));
  let plan;
  try {
    plan = domain.generatePlan(candidate, destination.id, { enforceBudgets: false, skipDocumentChecks: true });
  } catch (error) {
    if (error.message !== 'Unsupported departure route') throw error;
    missingTravelEstimates = true;
  }
  if (plan && (domain.validatePlan(plan).length || !Number.isSafeInteger(plan.groupTotal) || plan.groupTotal < 0 ||
    plan.memberTotals.length !== members.length || members.some((memberUid) => {
      const total = plan.memberTotals.find((member) => member.uid === memberUid)?.total;
      return !Number.isSafeInteger(total) || total < 0;
    }))) fail('INVALID_DESTINATION_ASSESSMENT', 'The destination could not be assessed. Request a fresh draft.', 503);
  const ownJourney = destination.journeyQuotes[uid];
  const { summary, caveats, costRanges, generatedAt } = destination.provenance;
  return {
    destination: { id: destination.id, name: destination.name, countryCode: destination.countryCode,
      summary, caveats: structuredClone(caveats), costRanges: structuredClone(costRanges), generatedAt },
    assessment: {
      groupTotal: missingTravelEstimates ? null : plan.groupTotal,
      myTotal: missingTravelEstimates ? null : plan.memberTotals.find((member) => member.uid === uid).total,
      currency: domain.settingsOf(state).currency, missingTravelEstimates,
      withinBudgets: !missingTravelEstimates && plan.memberTotals.every((member) => member.total <= state.constraints[member.uid].budget),
    },
    myJourney: Number.isSafeInteger(ownJourney?.amount) ? {
      mode: ownJourney.mode, low: ownJourney.low, high: ownJourney.high, oneWayMinutes: ownJourney.oneWayMinutes, status: 'unverified',
    } : null,
  };
}

async function generateDestinationProposal({ firestore, uid, body, provider, resolvePlace = resolveCity, now = Date.now }) {
  parseDestinationRequest(body);
  if (body.action !== 'generate') fail('INVALID_REQUEST', 'A destination generation request is required.');
  assertProvider(provider);
  const placeId = body.placeId.startsWith('geonames:')
    ? `geonames:${body.placeId.slice(9).replace(/^0+(?=\d)/, '')}`
    : `ourairports:${body.placeId.slice(12).toUpperCase()}`;
  const proposalId = hash(`destination\0${uid}\0${body.tripId}\0${body.requestId.toLowerCase()}`);
  const inputHash = hash(JSON.stringify([placeId, provider.mode]));
  const tripRef = firestore.doc(`groupTrips/${body.tripId}`);
  const proposalRef = firestore.doc(`_aiProposals/${proposalId}`);
  const leaseRef = firestore.doc(`_aiLeases/${hash(body.tripId)}`);
  const userLimit = firestore.doc(`_aiUsage/${hash(uid)}`);
  const globalLimit = firestore.doc('_aiUsage/global');
  const reserved = await firestore.runTransaction(async (transaction) => {
    const [trip, existing, lease, userUsage, globalUsage] = await Promise.all(
      [tripRef, proposalRef, leaseRef, userLimit, globalLimit].map((ref) => transaction.get(ref)),
    );
    const state = trip.data()?.state;
    assertDestinationOrganizer(state, uid);
    let place;
    try { place = await resolvePlace(placeId); }
    catch { fail('PLACE_UNAVAILABLE', 'Search and select an available destination city.', 400); }
    if (place?.id !== placeId || !['GeoNames', 'OurAirports'].includes(place.source)) fail('PLACE_UNAVAILABLE', 'Search and select an available destination city.', 400);
    collectDestinationContext(state, place);
    assertScope(state, place);
    const clock = now();
    if (existing.exists) {
      const record = existing.data();
      if (record.kind !== 'destination' || record.uid !== uid || record.tripId !== body.tripId || record.mode !== provider.mode || record.inputHash !== inputHash) {
        fail('IDEMPOTENCY_CONFLICT', 'This request ID belongs to another action.', 409);
      }
      if (record.expiresAt <= clock) fail('PROPOSAL_EXPIRED', 'Request a fresh destination draft.', 409);
      if (record.status === 'ready') {
        if (record.fingerprint !== fingerprint(state)) fail('STALE_PROPOSAL', 'The trip changed. Request a fresh destination draft.', 409);
        return { cached: record.preview };
      }
      fail('REQUEST_ALREADY_USED', 'This request is already processing or finished. Start a new request explicitly.', 409);
    }
    assertCapacity(state, placeId);
    if (Number(lease.data()?.until) > clock) fail('BUSY', 'Another suggestion is processing for this trip.', 409);
    const nextUser = rateBucket(userUsage.data(), clock, 10, 60 * 60 * 1000);
    const nextGlobal = rateBucket(globalUsage.data(), clock, 100, 24 * 60 * 60 * 1000);
    transaction.set(userLimit, nextUser);
    transaction.set(globalLimit, nextGlobal);
    transaction.set(leaseRef, { kind: 'destination', proposalId, until: clock + LEASE_MS, expiresAt: new Date(clock + LEASE_MS) });
    transaction.set(proposalRef, { kind: 'destination', uid, tripId: body.tripId, mode: provider.mode, inputHash,
      status: 'pending', expiresAt: clock + EXPIRY_MS, deleteAfter: new Date(clock + EXPIRY_MS) });
    return { state, place, fingerprint: fingerprint(state) };
  });
  if (reserved.cached) return reserved.cached;
  try {
    const destination = await generateDestinationDraft({ state: reserved.state, place: reserved.place, provider, draftId: `ai-${proposalId}`, now });
    const result = destinationPreview(reserved.state, uid, destination);
    return await firestore.runTransaction(async (transaction) => {
      const [trip, proposal, lease] = await Promise.all([tripRef, proposalRef, leaseRef].map((ref) => transaction.get(ref)));
      const state = trip.data()?.state;
      assertDestinationOrganizer(state, uid);
      const clock = now();
      const record = proposal.data();
      if (record?.kind !== 'destination' || record.status !== 'pending' || record.uid !== uid || record.tripId !== body.tripId ||
        record.inputHash !== inputHash || lease.data()?.proposalId !== proposalId || !(lease.data()?.until > clock) || reserved.fingerprint !== fingerprint(state)) {
        fail('STALE_PROPOSAL', 'The trip changed while the destination was being prepared.', 409);
      }
      const expiresAt = clock + EXPIRY_MS;
      const preview = { proposalId, expiresAt, ...result };
      transaction.update(proposalRef, { status: 'ready', fingerprint: reserved.fingerprint, destination, preview,
        expiresAt, deleteAfter: new Date(expiresAt) });
      transaction.delete(leaseRef);
      return preview;
    });
  } catch (error) {
    await firestore.runTransaction(async (transaction) => {
      const [proposal, lease] = await Promise.all([proposalRef, leaseRef].map((ref) => transaction.get(ref)));
      const record = proposal.data();
      if (record?.kind === 'destination' && record.uid === uid && record.tripId === body.tripId && record.status === 'pending') {
        transaction.update(proposalRef, { status: 'failed' });
        if (lease.data()?.proposalId === proposalId) transaction.delete(leaseRef);
      }
    }).catch(() => {});
    if (error instanceof AIWorkflowError) throw error;
    fail('AI_DESTINATION_UNAVAILABLE', 'The destination draft is unavailable. Try again later.', 503);
  }
}

async function addDestinationProposal({ firestore, uid, body, provider, now = Date.now }) {
  parseDestinationRequest(body);
  if (body.action !== 'add') fail('INVALID_REQUEST', 'A confirmed destination addition is required.');
  assertProvider(provider);
  const tripRef = firestore.doc(`groupTrips/${body.tripId}`);
  const proposalRef = firestore.doc(`_aiProposals/${body.proposalId}`);
  return firestore.runTransaction(async (transaction) => {
    const [trip, proposal] = await Promise.all([tripRef, proposalRef].map((ref) => transaction.get(ref)));
    const state = trip.data()?.state;
    assertDestinationOrganizer(state, uid, false);
    const record = proposal.data();
    if (!record || record.kind !== 'destination' || record.uid !== uid || record.tripId !== body.tripId || record.mode !== provider.mode) {
      fail('PROPOSAL_UNAVAILABLE', 'This destination draft is not available.', 404);
    }
    if (record.status === 'applied') return { added: true, replayed: true };
    assertDestinationOrganizer(state, uid);
    if (record.status !== 'ready' || record.expiresAt <= now()) fail('PROPOSAL_EXPIRED', 'Request a fresh destination draft.', 409);
    if (record.fingerprint !== fingerprint(state)) fail('STALE_PROPOSAL', 'The trip changed. Request a fresh destination draft.', 409);
    assertCapacity(state, record.destination.placeId);
    assertScope(state, record.destination);
    const next = domain.applyCommand(structuredClone(state), {
      type: 'addGeneratedDestination', uid, expectedInputRevision: state.inputRevision, destination: record.destination,
    });
    domain.buildTripProjection(next, uid, now());
    transaction.update(tripRef, { state: next, updatedAt: new Date(now()) });
    transaction.update(proposalRef, { status: 'applied', appliedAt: now() });
    return { added: true, replayed: false };
  });
}

module.exports = { parseDestinationRequest, readDestinationRequest, assertDestinationOrganizer, destinationCapabilities,
  generateDestinationProposal, addDestinationProposal };
