const domain = require('../../collaborativeTrip');
const { fail } = require('../contracts');

const reasons = {
  cost: 'Keep more room in the budget by choosing a lower-cost catalog option or leaving an activity out.',
  pace: 'Leave more breathing room in this day instead of filling every available slot.',
  later: 'Start this activity later without changing its duration or overlapping another scheduled stop.',
  food: 'Swap a sightseeing slot for a food-focused catalog activity, keeping the group cost checks intact.',
};

function reviewChanges(state, uid, request, operations, provider) {
  const plan = state.activePlan;
  const baseline = { planVersion: plan.version, planRevision: plan.revision, inputRevision: state.inputRevision };
  const allowed = { cost: ['remove', 'replace'], pace: ['remove', 'replace'], later: ['reschedule'], food: ['replace'] };
  if (operations.some((operation) => !allowed[request.goal].includes(operation.kind))) fail('UNSAFE_PROPOSAL', 'The proposal does not match the requested goal.', 422);
  let next = state;
  try {
    if (operations.length) next = domain.applyCommand(state, { type: 'applyPlanSuggestion', uid, ...baseline, operations });
  } catch { fail('UNSAFE_PROPOSAL', 'This suggestion did not pass the budget, activity or schedule checks. No changes were made.', 422); }
  const changes = operations.map((operation) => {
    const day = plan.itinerary.find((entry) => entry.items.some((item) => item.id === operation.itemId));
    const before = day.items.find((item) => item.id === operation.itemId);
    const after = next.activePlan.itinerary.flatMap((entry) => entry.items).find((item) => item.id === operation.itemId);
    if (request.day && day.day !== request.day) fail('UNSAFE_PROPOSAL', 'The proposal changed a different day.', 422);
    if (request.goal === 'later' && after.time <= before.time) fail('UNSAFE_PROPOSAL', 'The suggestion did not move the activity later.', 422);
    if (request.goal === 'food' && !domain.catalogActivities(state).find((item) => item.templateId === after.templateId)?.tags?.includes('food')) fail('UNSAFE_PROPOSAL', 'The replacement is not a food activity.', 422);
    const summarize = (item) => item ? { title: item.title, time: item.time, durationMinutes: item.durationMinutes, estimatedCost: item.estimatedCost } : null;
    return { kind: operation.kind, day: day.day, before: summarize(before), after: summarize(after) };
  });
  const duration = (trip) => trip.activePlan.itinerary.flatMap((day) => day.items).reduce((sum, item) => sum + item.durationMinutes, 0);
  if (operations.length && request.goal === 'cost' && next.activePlan.groupTotal >= plan.groupTotal) fail('UNSAFE_PROPOSAL', 'This proposal would not reduce the estimated cost.', 422);
  if (operations.length && request.goal === 'pace' && duration(next) >= duration(state)) fail('UNSAFE_PROPOSAL', 'This proposal would not leave more free time.', 422);
  const ownTotal = (trip) => trip.activePlan.memberTotals.find((member) => member.uid === uid).total;
  return {
    ...baseline, mode: provider.mode, providerLabel: provider.label, goal: request.goal, day: request.day, changes,
    explanation: changes.length ? reasons[request.goal] : 'No compatible change was found in the current catalog. Your plan is unchanged.',
    currency: plan.currency, beforeGroupTotal: plan.groupTotal, afterGroupTotal: next.activePlan.groupTotal,
    beforeYourTotal: ownTotal(state), afterYourTotal: ownTotal(next),
    source: plan.provenance ? 'AI-generated destination draft; unverified estimates' : `Fermat catalog ${domain.seeds.version}`,
    warnings: [plan.provenance ? 'Prices are generated estimates, not live quotes.' : 'Prices are catalog estimates, not live quotes.', 'Opening hours, travel time and accessibility still need checking.', 'Applying changes asks everyone to approve again.'],
    checks: ['Private budget ceilings', 'Cost allocation and buffer', 'Same-day schedule overlaps', 'Allowed catalog activities'],
  };
}

module.exports = { reviewChanges };