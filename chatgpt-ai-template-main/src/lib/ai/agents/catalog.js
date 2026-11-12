const domain = require('../../collaborativeTrip');
const { createHash } = require('node:crypto');
const { fail, ALL_GOALS } = require('../contracts');

function assertOrganizer(state, uid) {
  if (!state || state.ownerUid !== uid || state.members?.[uid]?.status !== 'approved') fail('FORBIDDEN', 'Only the trip organizer can use the assistant.', 403);
  if (state.phase !== 'locked' || !state.activePlan) fail('PLAN_REQUIRED', 'Lock a trip plan before requesting changes.', 409);
}

const fingerprint = (state) => createHash('sha256').update(JSON.stringify(state)).digest('hex');

function collectContext(state, uid, request) {
  assertOrganizer(state, uid);
  if (!ALL_GOALS.includes(request.goal) || !Number.isInteger(request.day) || request.day < 0 || request.day > state.activePlan.itinerary.length) fail('INVALID_REQUEST', 'Choose an existing day and a supported goal.');
  const catalog = domain.catalogActivities(state);
  const references = new Map();
  const activities = []; const busy = [];
  let candidateIndex = 0;
  for (const day of state.activePlan.itinerary) {
    for (const item of day.items) {
      const trusted = catalog.find((activity) => activity.templateId === item.templateId);
      if (!trusted) { busy.push({ day: day.day, time: item.time, durationMinutes: item.durationMinutes }); continue; }
      const ref = `activity-${activities.length + 1}`;
      const baseline = {
        planVersion: state.activePlan.version,
        planRevision: state.activePlan.revision,
        inputRevision: state.inputRevision,
      };
      const isGoalMatch = (candidate) => {
        if (request.goal === 'cost') return candidate.groupCost < item.estimatedCost;
        if (request.goal === 'pace') return candidate.durationMinutes < item.durationMinutes;
        if (request.goal === 'food') return candidate.tags?.includes('food');
        return true;
      };
      const passesPlanChecks = (candidate) => {
        try {
          domain.applyCommand(state, {
            type: 'applyPlanSuggestion', uid, ...baseline,
            operations: [{ kind: 'replace', itemId: item.id, templateId: candidate.templateId }],
          });
          return true;
        } catch {
          return false;
        }
      };
      const options = domain.planActivityOptions(state, item).filter((candidate) =>
        isGoalMatch(candidate) && passesPlanChecks(candidate)).sort((left, right) =>
        (request.goal === 'food' ? Number(right.tags?.includes('food')) - Number(left.tags?.includes('food')) : 0) || left.groupCost - right.groupCost).slice(0, 3);
      const candidates = options.map((candidate) => ({
        ref: `candidate-${++candidateIndex}`, title: candidate.title, durationMinutes: candidate.durationMinutes,
        groupCost: candidate.groupCost, tags: candidate.tags || [],
      }));
      references.set(ref, { itemId: item.id, day: day.day, durationMinutes: item.durationMinutes, candidates: new Map(candidates.map((candidate, index) => [candidate.ref, options[index]])) });
      activities.push({ ref, day: day.day, title: trusted.title, time: item.time, durationMinutes: item.durationMinutes,
        groupCost: item.estimatedCost, tags: trusted.tags || [], candidates });
    }
  }
  const context = { goal: request.goal, day: request.day, currency: state.activePlan.currency, activities, busy,
    seedVersion: state.activePlan.seedVersion || domain.seeds.version,
    ...(request.goal === 'custom' ? { instruction: request.instruction.trim() } : {}) };
  if (activities.length > 40 || busy.length > 100 || Buffer.byteLength(JSON.stringify(context)) > 32 * 1024) fail('CONTEXT_TOO_LARGE', 'This plan is too large for the assistant. Edit it manually for now.', 413);
  return { context, references, fingerprint: fingerprint(state) };
}

module.exports = { collectContext, assertOrganizer, fingerprint };
