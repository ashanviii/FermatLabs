const seeds = require('./groupTripSeeds.v1.json');

const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (message) => { throw new Error(message); };
const destination = (id) => seeds.destinations.find((item) => item.id === id) || fail(`Unknown destination: ${id}`);
const preferenceKeys = new Set(seeds.destinations.flatMap((item) => item.tags));
const visaKeys = new Set(seeds.destinations.map((item) => item.visaKey).filter(Boolean));

function allocateInteger(total, orderedIds) {
  if (!Number.isSafeInteger(total) || total < 0 || !orderedIds.length) fail('Allocation requires a nonnegative integer and members');
  const base = Math.floor(total / orderedIds.length);
  const remainder = total % orderedIds.length;
  return Object.fromEntries(orderedIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

function createTripState({ id, ownerUid, name, startDate, endDate, expectedSize }) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (!id || !ownerUid || !cleanName || cleanName.length > 80) fail('Trip id, owner, and a name of at most 80 characters are required');
  if (!Number.isInteger(expectedSize) || expectedSize < 4 || expectedSize > 10) fail('Expected size must be 4–10');
  if (!isExactDate(startDate) || !isExactDate(endDate) || endDate < startDate) fail('Valid exact dates are required');
  const tripDays = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY) + 1;
  if (tripDays < 2 || tripDays > 31) fail('Trip length must be between 2 and 31 days');
  return {
    schemaVersion: 1, seedVersion: seeds.version, id, ownerUid, name: cleanName, startDate, endDate, expectedSize,
    phase: 'collecting', inputRevision: 0, round: 0,
    members: { [ownerUid]: { uid: ownerUid, nickname: 'Organizer', role: 'owner', status: 'approved', joinOrder: 0 } },
    pending: {}, constraints: {}, ballots: {}, publishedTotals: null, lockedDestinationId: null,
    activePlan: null, supersededPlans: [], planVersion: 0, idempotency: {},
  };
}

function isExactDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
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
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value.passportExpiry || '') && Array.isArray(value.preferences) &&
    value.preferences.length > 0 && value.preferences.length <= preferenceKeys.size && new Set(value.preferences).size === value.preferences.length && value.preferences.every((item) => preferenceKeys.has(item)) &&
    Array.isArray(value.visas) && value.visas.length <= visaKeys.size && new Set(value.visas).size === value.visas.length && value.visas.every((item) => visaKeys.has(item)) && value.entryCheckAcknowledged === true;
}

function validatedConstraint(value) {
  const allowed = ['departureCity', 'budget', 'passportExpiry', 'visas', 'datesConfirmed', 'preferences', 'entryCheckAcknowledged', 'isAdult', 'hasIndianPassport'];
  if (!value || Object.keys(value).some((key) => !allowed.includes(key)) || !completeConstraint(value) || value.budget > 10000000) fail('Required private input is incomplete or invalid');
  return Object.fromEntries(allowed.map((key) => [key, clone(value[key])]));
}

function dateRange(start, end) {
  if (!isExactDate(start) || !isExactDate(end)) fail('Valid exact dates are required');
  const span = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY) + 1;
  if (span < 1 || span > 31) fail('Trip length must be between 1 and 31 days');
  const result = [];
  for (let cursor = Date.parse(`${start}T00:00:00Z`), stop = Date.parse(`${end}T00:00:00Z`); cursor <= stop; cursor += DAY) result.push(new Date(cursor).toISOString().slice(0, 10));
  return result;
}

function passportSufficient(expiry, tripEnd, months) {
  const match = /^(\d{4})-(\d{2})$/.exec(expiry || '');
  if (!match) return null;
  const end = new Date(`${tripEnd}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + months);
  const expiryMonth = Number(match[1]) * 12 + Number(match[2]);
  const cutoffMonth = end.getUTCFullYear() * 12 + end.getUTCMonth() + 1;
  return expiryMonth === cutoffMonth ? null : expiryMonth > cutoffMonth;
}

function generatePlan(state, destinationId, options = {}) {
  const dest = destination(destinationId);
  const ids = approvedIds(state);
  if (ids.length !== state.expectedSize) fail('Roster is incomplete');
  ids.forEach((uid) => { if (!completeConstraint(state.constraints[uid])) fail('Required private input is incomplete'); });
  const dates = dateRange(state.startDate, state.endDate);
  const days = dates.length;
  const nights = Math.max(0, days - 1);
  const baseAllocations = Object.fromEntries(ids.map((uid) => [uid, 0]));
  const categories = { journeys: 0, lodging: 0, localTransport: 0, food: 0, insurance: 0, entryAllowance: 0, activities: 0, contingency: 0 };
  ids.forEach((uid) => {
    const constraint = state.constraints[uid];
    const journey = seeds.departureCities[constraint.departureCity][destinationId];
    if (!journey) fail('Unsupported departure route');
    if (passportSufficient(constraint.passportExpiry, state.endDate, dest.passportMonths) === false) fail('Known passport insufficiency');
    const personal = journey + dest.foodDay * days + dest.insurance + dest.entryAllowance;
    baseAllocations[uid] += personal;
    categories.journeys += journey; categories.food += dest.foodDay * days; categories.insurance += dest.insurance; categories.entryAllowance += dest.entryAllowance;
  });
  const lodging = Math.ceil(ids.length / dest.roomCapacity) * nights * dest.roomNight;
  const transport = Math.ceil(ids.length / dest.vehicleCapacity) * days * dest.vehicleDay;
  for (const [total, key] of [[lodging, 'lodging'], [transport, 'localTransport']]) {
    const split = allocateInteger(total, ids); ids.forEach((uid) => { baseAllocations[uid] += split[uid]; }); categories[key] += total;
  }
  const maxActivityCount = Math.min(dest.activities.length, Math.max(0, days - 2), options.maxActivities ?? Number.MAX_SAFE_INTEGER);
  let scheduledActivities = dest.activities.slice(0, maxActivityCount);
  let memberTotals;
  let activities;
  while (true) {
    activities = scheduledActivities.reduce((sum, item) => sum + item.costPerPerson * ids.length, 0);
    const activitySplit = allocateInteger(activities, ids);
    memberTotals = ids.map((uid) => {
      const subtotal = baseAllocations[uid] + activitySplit[uid]; const contingency = Math.ceil(subtotal / 10); const total = subtotal + contingency;
      return { uid, subtotal, contingency, total };
    });
    if (options.enforceBudgets === false || memberTotals.every((member) => member.total <= state.constraints[member.uid].budget)) break;
    if (scheduledActivities.length === 0) fail('One or more private budgets are exceeded');
    scheduledActivities = scheduledActivities.slice(0, -1);
  }
  categories.activities = activities;
  categories.contingency = memberTotals.reduce((sum, member) => sum + member.contingency, 0);
  const itinerary = dates.map((date, index) => {
    if (index === 0) return { day: index + 1, date, items: [{ id: `arrival-${date}`, title: 'Arrival and check-in', time: '16:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, costBasis: 'included', verificationAction: 'Confirm after flights are selected' }] };
    if (index === dates.length - 1) return { day: index + 1, date, items: [{ id: `departure-${date}`, title: 'Checkout and departure', time: '09:00', durationMinutes: 120, location: 'Hotel area', attendees: ids, estimatedCost: 0, costBasis: 'included', verificationAction: 'Confirm after flights are selected' }] };
    const activity = scheduledActivities[index - 1];
    const primary = activity
      ? { id: `${activity.id}-${date}`, templateId: activity.id, title: activity.title, time: '10:00', durationMinutes: activity.durationMinutes, location: activity.location, attendees: ids, estimatedCost: activity.costPerPerson * ids.length, costBasis: `${activity.costPerPerson} per traveller`, verificationAction: 'Verify opening hours and book if required' }
      : { id: `flex-${date}`, title: 'Free and flexible time', time: '10:00', durationMinutes: 180, location: 'Choose together', attendees: ids, estimatedCost: 0, costBasis: 'free', verificationAction: 'Agree as a group' };
    return { day: index + 1, date, items: [primary, { id: `meal-${date}`, title: 'Meal and transfer buffer', time: '13:30', durationMinutes: 120, location: primary.location, attendees: ids, estimatedCost: 0, costBasis: 'food allowance already included', verificationAction: 'Choose locally' }] };
  });
  const groupTotal = memberTotals.reduce((sum, item) => sum + item.total, 0);
  return { version: options.version || 1, revision: 1, seedVersion: seeds.version, destinationId, destinationName: dest.name, timeZone: dest.timeZone, startDate: state.startDate, endDate: state.endDate, status: 'ready', memberTotals, categories, groupTotal, itinerary, approvals: {} };
}

function validatePlan(plan) {
  const errors = [];
  if (!plan || !Array.isArray(plan.memberTotals) || !Array.isArray(plan.itinerary)) return ['Malformed plan'];
  const members = plan.memberTotals.reduce((sum, item) => sum + item.total, 0);
  const categories = Object.values(plan.categories || {}).reduce((sum, value) => sum + value, 0);
  if (members !== plan.groupTotal) errors.push('Member totals do not reconcile');
  if (categories !== plan.groupTotal) errors.push('Category totals do not reconcile');
  if (plan.itinerary.length !== dateRange(plan.startDate, plan.endDate).length) errors.push('Itinerary does not cover every date');
  if (plan.itinerary.some((day) => day.items.some((item) => !validScheduleItem(item)))) errors.push('Itinerary contains an invalid time or duration');
  if (hasScheduleConflict(plan)) errors.push('Itinerary contains overlapping items');
  const paidTemplates = plan.itinerary.flatMap((day) => day.items).filter((item) => item.templateId && item.estimatedCost > 0).map((item) => item.templateId);
  if (new Set(paidTemplates).size !== paidTemplates.length) errors.push('Paid activity templates repeat');
  return errors;
}

function winnerFor(state) {
  const ids = approvedIds(state); const candidates = seeds.destinations.filter((dest) => { try { generatePlan(state, dest.id); return true; } catch (_) { return false; } });
  if (!candidates.length) fail('No destination is feasible within every private budget');
  const totals = Object.fromEntries(candidates.map((dest) => [dest.id, 0]));
  ids.forEach((uid) => { const ballot = state.ballots[uid]; if (!ballot) fail('Every member must cast a ballot'); if (totals[ballot.destinationId] !== undefined) totals[ballot.destinationId] += 1; });
  const fit = (dest) => ids.reduce((sum, uid) => sum + [...new Set(state.constraints[uid].preferences || [])].filter((tag) => dest.tags.includes(tag)).length, 0);
  return candidates.sort((a, b) => totals[b.id] - totals[a.id] || fit(b) - fit(a) || seeds.destinations.findIndex((d) => d.id === a.id) - seeds.destinations.findIndex((d) => d.id === b.id))[0].id;
}

function applyCommand(input, command) {
  const state = clone(input); const now = command.now || Date.now();
  switch (command.type) {
    case 'requestJoin': {
      collecting(state); if (state.members[command.uid]) return state; if (state.pending[command.uid] && state.pending[command.uid].expiresAt > now) return state;
      if (Object.keys(state.pending).filter((uid) => state.pending[uid].expiresAt > now).length >= 20) fail('Pending queue capacity reached');
      const nickname = typeof command.nickname === 'string' ? command.nickname.trim() : '';
      if (!nickname || nickname.length > 40) fail('Nickname must be between 1 and 40 characters');
      state.pending[command.uid] = { uid: command.uid, nickname, requestedAt: now, expiresAt: now + 86400000, status: 'pending' }; return state;
    }
    case 'admitMember': {
      ownerOnly(state, command.uid); collecting(state); const request = state.pending[command.memberUid]; if (!request || request.status !== 'pending' || request.expiresAt <= now) fail('Join request expired or absent');
      if (approvedIds(state).length >= state.expectedSize) fail('Approved roster capacity reached');
      if (!request.nickname || Object.values(state.members).some((m) => m.nickname.toLowerCase() === request.nickname.toLowerCase())) fail('Nickname must be unique');
      state.members[command.memberUid] = { uid: command.memberUid, nickname: request.nickname, role: 'member', status: 'approved', joinOrder: approvedIds(state).length }; delete state.pending[command.memberUid]; invalidate(state); return state;
    }
    case 'rejectMember': ownerOnly(state, command.uid); delete state.pending[command.memberUid]; return state;
    case 'submitConstraints': memberOnly(state, command.uid); if (!['collecting', 'voting'].includes(state.phase)) fail('Trip is not accepting inputs'); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); state.constraints[command.uid] = validatedConstraint(command.constraints); invalidate(state); return state;
    case 'openVoting': ownerOnly(state, command.uid); collecting(state); if (command.expectedInputRevision !== state.inputRevision) fail('Stale input revision'); if (approvedIds(state).length !== state.expectedSize || approvedIds(state).some((uid) => !completeConstraint(state.constraints[uid]))) fail('Complete roster and inputs required'); state.phase = 'voting'; state.round += 1; state.ballots = {}; return state;
    case 'vote': memberOnly(state, command.uid); if (state.phase !== 'voting') fail('Voting is not open'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale ballot'); destination(command.destinationId); state.ballots[command.uid] = { destinationId: command.destinationId, round: command.round, inputRevision: command.inputRevision }; return state;
    case 'lock': {
      ownerOnly(state, command.uid); if (!command.idempotencyKey) fail('Lock idempotency key is required'); if (state.idempotency[command.idempotencyKey]?.kind === 'lock') return state; if (state.phase !== 'voting') fail('Voting is not open'); if ('destinationId' in command) fail('Organizer override is not allowed'); if (command.round !== state.round || command.inputRevision !== state.inputRevision) fail('Stale lock');
      const winner = winnerFor(state); const totals = {}; Object.values(state.ballots).forEach((b) => { totals[b.destinationId] = (totals[b.destinationId] || 0) + 1; });
      state.planVersion = Number.isSafeInteger(state.planVersion) ? state.planVersion + 1 : Math.max(0, ...state.supersededPlans.map((plan) => plan.version || 0), state.activePlan?.version || 0) + 1;
      state.activePlan = generatePlan(state, winner, { version: state.planVersion }); state.phase = 'locked'; state.lockedDestinationId = winner; state.publishedTotals = totals; state.idempotency[command.idempotencyKey] = { kind: 'lock', destinationId: winner }; return state;
    }
    case 'approvePlan': memberOnly(state, command.uid); if (!state.activePlan || command.planVersion !== state.activePlan.version || command.planRevision !== state.activePlan.revision) fail('Stale plan version or revision'); if (!['approved', 'changesRequested'].includes(command.decision)) fail('Invalid decision'); state.activePlan.approvals[command.uid] = command.decision; return state;
    case 'editPlanItem': {
      ownerOnly(state, command.uid); if (!state.activePlan || command.planVersion !== state.activePlan.version || command.planRevision !== state.activePlan.revision) fail('Stale plan version or revision');
      const allowed = new Set(['title', 'time', 'durationMinutes', 'location', 'estimatedCost', 'verificationAction']);
      if (Object.keys(command.patch || {}).some((key) => !allowed.has(key))) fail('Unsupported plan edit field');
      let found = false; let oldCost = 0; let newCost = 0;
      state.activePlan.itinerary.forEach((day) => { day.items = day.items.map((item) => {
        if (item.id !== command.itemId) return item; found = true; oldCost = item.estimatedCost;
        const next = { ...item, ...command.patch, id: item.id }; newCost = next.estimatedCost;
        if (!Number.isSafeInteger(newCost) || newCost < 0 || !validScheduleItem(next)) fail('Plan costs, local time, and duration are invalid');
        for (const key of ['title', 'location', 'verificationAction']) if (typeof next[key] !== 'string' || !next[key].trim() || next[key].length > 160) fail('Plan text fields must be 1–160 characters');
        return next;
      }); });
      if (!found) fail('Plan item not found');
      const ids = approvedIds(state); const oldSplit = allocateInteger(oldCost, ids); const nextSplit = allocateInteger(newCost, ids);
      state.activePlan.memberTotals = state.activePlan.memberTotals.map((member) => {
        const subtotal = member.subtotal - oldSplit[member.uid] + nextSplit[member.uid]; const contingency = Math.ceil(subtotal / 10); const total = subtotal + contingency;
        if (total > state.constraints[member.uid].budget) fail('One or more private budgets are exceeded');
        return { ...member, subtotal, contingency, total };
      });
      state.activePlan.categories.activities += newCost - oldCost;
      state.activePlan.categories.contingency = state.activePlan.memberTotals.reduce((sum, member) => sum + member.contingency, 0);
      state.activePlan.groupTotal = state.activePlan.memberTotals.reduce((sum, member) => sum + member.total, 0);
      state.activePlan.status = hasScheduleConflict(state.activePlan) ? 'needsReview' : 'ready';
      state.activePlan.revision += 1; state.activePlan.approvals = {}; return state;
    }
    case 'reopen': ownerOnly(state, command.uid); if (state.activePlan) state.supersededPlans.push(state.activePlan); state.activePlan = null; state.lockedDestinationId = null; invalidate(state); state.round += 1; return state;
    default: fail(`Unsupported command: ${command.type}`);
  }
}

function hasScheduleConflict(plan) {
  return plan.itinerary.some((day) => {
    const timed = day.items.map((item) => {
      const [hour, minute] = item.time.split(':').map(Number); return { start: hour * 60 + minute, end: hour * 60 + minute + item.durationMinutes };
    }).sort((a, b) => a.start - b.start);
    return timed.some((item, index) => index > 0 && item.start < timed[index - 1].end);
  });
}

function validScheduleItem(item) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time || '') || !Number.isSafeInteger(item.durationMinutes) || item.durationMinutes < 1 || item.durationMinutes > 1440) return false;
  const [hour, minute] = item.time.split(':').map(Number);
  return hour * 60 + minute + item.durationMinutes <= 1440;
}

function buildTripProjection(state, viewerUid, now = Date.now()) {
  const approved = state.members[viewerUid]?.status === 'approved';
  const pendingRequest = state.pending[viewerUid];
  const pending = pendingRequest?.status === 'pending' && pendingRequest.expiresAt > now;
  if (!approved && !pending) fail('Approved membership required');
  if (pending) return { schemaVersion: state.schemaVersion, id: state.id, name: state.name, startDate: state.startDate, endDate: state.endDate, expectedSize: state.expectedSize, membershipStatus: 'pending', pendingRequest: { nickname: pendingRequest.nickname, expiresAt: pendingRequest.expiresAt } };
  const base = { schemaVersion: state.schemaVersion, seedVersion: state.seedVersion, id: state.id, name: state.name, ownerUid: state.ownerUid, startDate: state.startDate, endDate: state.endDate, expectedSize: state.expectedSize, phase: state.phase, inputRevision: state.inputRevision, round: state.round, members: clone(state.members), submissionProgress: approvedIds(state).filter((uid) => completeConstraint(state.constraints[uid])).length, ballotProgress: Object.keys(state.ballots).length, publishedTotals: clone(state.publishedTotals), lockedDestinationId: state.lockedDestinationId, activePlan: clone(state.activePlan) };
  const myPrivateStatus = completeConstraint(state.constraints[viewerUid]) && approvedIds(state).length === state.expectedSize && approvedIds(state).every((uid) => completeConstraint(state.constraints[uid]))
    ? seeds.destinations.map((item) => {
      try { const plan = state.activePlan?.destinationId === item.id ? state.activePlan : generatePlan(state, item.id, { enforceBudgets: false }); const total = plan.memberTotals.find((member) => member.uid === viewerUid).total; const ceiling = state.constraints[viewerUid].budget; return { destinationId: item.id, total, fits: total <= ceiling, shortfall: Math.max(0, total - ceiling) }; }
      catch (_) { return { destinationId: item.id, total: null, fits: false, shortfall: null, action: 'Check passport or route assumptions' }; }
    }) : [];
  return { ...base, membershipStatus: 'approved', myConstraints: state.constraints[viewerUid] ? clone(state.constraints[viewerUid]) : null, myPrivateStatus, pendingRequests: viewerUid === state.ownerUid ? Object.values(state.pending).filter((request) => request.status === 'pending' && request.expiresAt > now).map(({ uid, nickname, expiresAt }) => ({ uid, nickname, expiresAt })) : undefined };
}

module.exports = { seeds, allocateInteger, createTripState, applyCommand, buildTripProjection, generatePlan, validatePlan };
