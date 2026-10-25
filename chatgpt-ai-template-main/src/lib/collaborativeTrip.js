const seeds = require('./groupTripSeeds.v1.json');

const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (message) => { throw new Error(message); };
const destination = (id) => seeds.destinations.find((item) => item.id === id) || fail(`Unknown destination: ${id}`);

function allocateInteger(total, orderedIds) {
  if (!Number.isSafeInteger(total) || total < 0 || !orderedIds.length) fail('Allocation requires a nonnegative integer and members');
  const base = Math.floor(total / orderedIds.length);
  const remainder = total % orderedIds.length;
  return Object.fromEntries(orderedIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

function createTripState({ id, ownerUid, name, startDate, endDate, expectedSize }) {
  if (!id || !ownerUid || !name) fail('Trip id, owner, and name are required');
  if (!Number.isInteger(expectedSize) || expectedSize < 4 || expectedSize > 10) fail('Expected size must be 4–10');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) fail('Valid exact dates are required');
  return {
    schemaVersion: 1, seedVersion: seeds.version, id, ownerUid, name, startDate, endDate, expectedSize,
    phase: 'collecting', inputRevision: 0, round: 0,
    members: { [ownerUid]: { uid: ownerUid, nickname: 'Organizer', role: 'owner', status: 'approved', joinOrder: 0 } },
    pending: {}, constraints: {}, ballots: {}, publishedTotals: null, lockedDestinationId: null,
    activePlan: null, supersededPlans: [], idempotency: {},
  };
}

function approvedIds(state) {
  return Object.values(state.members).filter((m) => m.status === 'approved').sort((a, b) => a.joinOrder - b.joinOrder).map((m) => m.uid);
}
function ownerOnly(state, uid) { if (state.ownerUid !== uid) fail('Only the organizer can do that'); }
function memberOnly(state, uid) { if (!state.members[uid] || state.members[uid].status !== 'approved') fail('Approved membership required'); }
function collecting(state) { if (state.phase !== 'collecting') fail('Trip is not collecting inputs'); }
function invalidate(state) { state.inputRevision += 1; state.phase = 'collecting'; state.ballots = {}; state.publishedTotals = null; }

function completeConstraint(value) {
  return value && seeds.departureCities[value.departureCity] && Number.isSafeInteger(value.budget) && value.budget > 0 &&
    value.datesConfirmed === true && value.isAdult === true && value.hasIndianPassport === true &&
    typeof value.passportExpiry === 'string' && Array.isArray(value.preferences) && value.entryCheckAcknowledged === true;
}

function dateRange(start, end) {
  const result = [];
  for (let cursor = Date.parse(`${start}T00:00:00Z`), stop = Date.parse(`${end}T00:00:00Z`); cursor <= stop; cursor += DAY) result.push(new Date(cursor).toISOString().slice(0, 10));
  return result;
}

function passportSufficient(expiry, tripEnd, months) {
  const match = /^(\d{4})-(\d{2})$/.exec(expiry || '');
  if (!match) return null;
  const expiryEnd = Date.UTC(Number(match[1]), Number(match[2]), 0);
  const end = new Date(`${tripEnd}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + months);
  return expiryEnd > end.getTime();
}

function generatePlan(state, destinationId) {
  const dest = destination(destinationId);
  const ids = approvedIds(state);
  if (ids.length !== state.expectedSize) fail('Roster is incomplete');
  ids.forEach((uid) => { if (!completeConstraint(state.constraints[uid])) fail('Required private input is incomplete'); });
  const dates = dateRange(state.startDate, state.endDate);
  const days = dates.length;
  const nights = Math.max(0, days - 1);
  const allocations = Object.fromEntries(ids.map((uid) => [uid, 0]));
  const categories = { journeys: 0, lodging: 0, localTransport: 0, food: 0, insurance: 0, entryAllowance: 0, activities: 0, contingency: 0 };
  ids.forEach((uid) => {
    const constraint = state.constraints[uid];
    const journey = seeds.departureCities[constraint.departureCity][destinationId];
    if (!journey) fail('Unsupported departure route');
    if (passportSufficient(constraint.passportExpiry, state.endDate, dest.passportMonths) === false) fail('Known passport insufficiency');
    const personal = journey + dest.foodDay * days + dest.insurance + dest.entryAllowance;
    allocations[uid] += personal;
    categories.journeys += journey; categories.food += dest.foodDay * days; categories.insurance += dest.insurance; categories.entryAllowance += dest.entryAllowance;
  });
  const lodging = Math.ceil(ids.length / dest.roomCapacity) * nights * dest.roomNight;
  const transport = Math.ceil(ids.length / dest.vehicleCapacity) * days * dest.vehicleDay;
  const mandatoryActivity = dest.activities[0];
  const activities = mandatoryActivity.costPerPerson * ids.length;
  for (const [total, key] of [[lodging, 'lodging'], [transport, 'localTransport'], [activities, 'activities']]) {
    const split = allocateInteger(total, ids); ids.forEach((uid) => { allocations[uid] += split[uid]; }); categories[key] += total;
  }
  const memberTotals = ids.map((uid) => {
    const subtotal = allocations[uid]; const contingency = Math.ceil(subtotal / 10); const total = subtotal + contingency;
    if (total > state.constraints[uid].budget) fail(`Private budget exceeded for ${uid}`);
    categories.contingency += contingency;
    return { uid, subtotal, contingency, total };
  });
  const itinerary = dates.map((date, index) => ({
    day: index + 1, date,
    items: index === 0 ? [{ id: `arrival-${date}`, title: 'Arrival and check-in', time: '16:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, verificationAction: 'Confirm after flights are selected' }]
      : index === dates.length - 1 ? [{ id: `departure-${date}`, title: 'Checkout and departure', time: '09:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, verificationAction: 'Confirm after flights are selected' }]
      : [{ id: `${mandatoryActivity.id}-${date}`, title: mandatoryActivity.title, time: '10:00', durationMinutes: mandatoryActivity.durationMinutes, location: mandatoryActivity.location, attendees: ids, estimatedCost: activities, verificationAction: 'Verify opening hours and book if required' }, { id: `meal-${date}`, title: 'Meal and transfer buffer', time: '13:30', durationMinutes: 120, location: mandatoryActivity.location, attendees: ids, estimatedCost: 0, verificationAction: 'Choose locally' }],
  }));
  const groupTotal = memberTotals.reduce((sum, item) => sum + item.total, 0);
  return { version: 1, revision: 1, seedVersion: seeds.version, destinationId, destinationName: dest.name, timeZone: dest.timeZone, startDate: state.startDate, endDate: state.endDate, status: 'ready', memberTotals, categories, groupTotal, itinerary, approvals: {} };
}

function validatePlan(plan) {
  const errors = [];
  if (!plan || !Array.isArray(plan.memberTotals) || !Array.isArray(plan.itinerary)) return ['Malformed plan'];
  const members = plan.memberTotals.reduce((sum, item) => sum + item.total, 0);
  const categories = Object.values(plan.categories || {}).reduce((sum, value) => sum + value, 0);
  if (members !== plan.groupTotal) errors.push('Member totals do not reconcile');
  if (categories !== plan.groupTotal) errors.push('Category totals do not reconcile');
  if (plan.itinerary.length !== dateRange(plan.startDate, plan.endDate).length) errors.push('Itinerary does not cover every date');
  return errors;
}

function winnerFor(state) {
  const ids = approvedIds(state); const candidates = seeds.destinations.filter((dest) => { try { generatePlan(state, dest.id); return true; } catch (_) { return false; } });
  if (!candidates.length) fail('No destination is feasible within every private budget');
  const totals = Object.fromEntries(candidates.map((dest) => [dest.id, 0]));
  ids.forEach((uid) => { const ballot = state.ballots[uid]; if (!ballot) fail('Every member must cast a ballot'); if (totals[ballot.destinationId] !== undefined) totals[ballot.destinationId] += 1; });
  const fit = (dest) => ids.reduce((sum, uid) => sum + new Set(state.constraints[uid].preferences || []).size - new Set((state.constraints[uid].preferences || []).filter((tag) => !dest.tags.includes(tag))).size, 0);
  return candidates.sort((a, b) => totals[b.id] - totals[a.id] || fit(b) - fit(a) || seeds.destinations.findIndex((d) => d.id === a.id) - seeds.destinations.findIndex((d) => d.id === b.id))[0].id;
}

function applyCommand(input, command) {
  const state = clone(input); const now = command.now || Date.now();
  switch (command.type) {
    case 'requestJoin': {
      collecting(state); if (state.members[command.uid]) return state; if (state.pending[command.uid] && state.pending[command.uid].expiresAt > now) return state;
      if (Object.keys(state.pending).filter((uid) => state.pending[uid].expiresAt > now).length >= 20) fail('Pending queue capacity reached');
      state.pending[command.uid] = { uid: command.uid, nickname: String(command.nickname || '').trim(), requestedAt: now, expiresAt: now + 86400000, status: 'pending' }; return state;
    }
    case 'admitMember': {
      ownerOnly(state, command.uid); collecting(state); const request = state.pending[command.memberUid]; if (!request || request.status !== 'pending' || request.expiresAt <= now) fail('Join request expired or absent');
      if (approvedIds(state).length >= state.expectedSize) fail('Approved roster capacity reached');
      if (!request.nickname || Object.values(state.members).some((m) => m.nickname.toLowerCase() === request.nickname.toLowerCase())) fail('Nickname must be unique');
      state.members[command.memberUid] = { uid: command.memberUid, nickname: request.nickname, role: 'member', status: 'approved', joinOrder: approvedIds(state).length }; delete state.pending[command.memberUid]; invalidate(state); return state;
    }
    case 'rejectMember': ownerOnly(state, command.uid); delete state.pending[command.memberUid]; return state;
    case 'submitConstraints': memberOnly(state, command.uid); collecting(state); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); if (!completeConstraint(command.constraints)) fail('Required private input is incomplete'); state.constraints[command.uid] = clone(command.constraints); invalidate(state); return state;
    case 'openVoting': ownerOnly(state, command.uid); collecting(state); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); if (approvedIds(state).length !== state.expectedSize || approvedIds(state).some((uid) => !completeConstraint(state.constraints[uid]))) fail('Complete roster and inputs required'); state.phase = 'voting'; state.round += 1; state.ballots = {}; return state;
    case 'vote': memberOnly(state, command.uid); if (state.phase !== 'voting') fail('Voting is not open'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale ballot'); destination(command.destinationId); state.ballots[command.uid] = { destinationId: command.destinationId, round: command.round, inputRevision: command.inputRevision }; return state;
    case 'lock': {
      ownerOnly(state, command.uid); if (state.phase !== 'voting') fail('Voting is not open'); if ('destinationId' in command) fail('Organizer override is not allowed'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale lock');
      if (state.idempotency[command.idempotencyKey]) return state; const winner = winnerFor(state); const totals = {}; Object.values(state.ballots).forEach((b) => { totals[b.destinationId] = (totals[b.destinationId] || 0) + 1; });
      state.activePlan = generatePlan(state, winner); state.phase = 'locked'; state.lockedDestinationId = winner; state.publishedTotals = totals; state.idempotency[command.idempotencyKey] = { kind: 'lock', destinationId: winner }; return state;
    }
    case 'approvePlan': memberOnly(state, command.uid); if (!state.activePlan || command.planRevision !== state.activePlan.revision) fail('Stale plan revision'); if (!['approved', 'changesRequested'].includes(command.decision)) fail('Invalid decision'); state.activePlan.approvals[command.uid] = command.decision; return state;
    case 'editPlanItem': {
      ownerOnly(state, command.uid); if (!state.activePlan || command.planRevision !== state.activePlan.revision) fail('Stale plan revision');
      let found = false; state.activePlan.itinerary.forEach((day) => { day.items = day.items.map((item) => item.id === command.itemId ? (found = true, { ...item, ...command.patch, id: item.id }) : item); }); if (!found) fail('Plan item not found'); state.activePlan.revision += 1; state.activePlan.approvals = {}; return state;
    }
    case 'reopen': ownerOnly(state, command.uid); if (state.activePlan) state.supersededPlans.push(state.activePlan); state.activePlan = null; state.lockedDestinationId = null; invalidate(state); state.round += 1; return state;
    default: fail(`Unsupported command: ${command.type}`);
  }
}

function buildTripProjection(state, viewerUid) {
  const approved = state.members[viewerUid]?.status === 'approved';
  const pending = state.pending[viewerUid]?.status === 'pending';
  if (!approved && !pending) fail('Approved membership required');
  const base = { schemaVersion: state.schemaVersion, seedVersion: state.seedVersion, id: state.id, name: state.name, ownerUid: state.ownerUid, startDate: state.startDate, endDate: state.endDate, expectedSize: state.expectedSize, phase: state.phase, inputRevision: state.inputRevision, round: state.round, members: clone(state.members), submissionProgress: approvedIds(state).filter((uid) => completeConstraint(state.constraints[uid])).length, ballotProgress: Object.keys(state.ballots).length, publishedTotals: clone(state.publishedTotals), lockedDestinationId: state.lockedDestinationId, activePlan: clone(state.activePlan) };
  if (pending) return { ...base, membershipStatus: 'pending', activePlan: null, publishedTotals: null };
  return { ...base, membershipStatus: 'approved', pendingRequests: viewerUid === state.ownerUid ? Object.values(state.pending).filter((request) => request.status === 'pending').map(({ uid, nickname, expiresAt }) => ({ uid, nickname, expiresAt })) : undefined };
}

module.exports = { seeds, allocateInteger, createTripState, applyCommand, buildTripProjection, generatePlan, validatePlan };
