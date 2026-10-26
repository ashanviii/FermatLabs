// Private conditional pledges: "I'm in if at least N people go and my share is at most X".
// Conditions never leave the server; members only see counts plus their own pledge and outcome.
const MAX_SHARE = 10000000;

function isExactDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function requirePlanMember(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  if (!state.activePlan) ctx.fail('A locked plan is required before pledging');
}

function currentPledges(state, ctx) {
  const approved = new Set(ctx.approvedIds(state)); const version = state.activePlan?.version;
  return Object.fromEntries(Object.entries(state.pledges || {}).filter(([uid, pledge]) => approved.has(uid) && pledge.planVersion === version));
}

// Each member's share if only `uids` travel, holding the locked plan's destination and activity count. null = no viable plan.
function sharesIfOnly(state, uids, ctx) {
  const plan = state.activePlan;
  const maxActivities = plan.itinerary.flatMap((day) => day.items).filter((item) => item.templateId).length;
  const members = Object.fromEntries(uids.map((uid) => [uid, state.members[uid]]));
  try {
    const subset = ctx.generatePlan({ ...state, members, expectedSize: uids.length }, plan.destinationId, { enforceBudgets: false, skipDocumentChecks: true, maxActivities });
    return Object.fromEntries(subset.memberTotals.map((member) => [member.uid, member.total]));
  } catch (_) { return null; }
}

// Shrinks the pledger set until every remaining member's conditions hold; the fixed point is "firmly in".
function resolvePledges(state, ctx) {
  const none = { firm: [], shares: {} };
  if (!state.activePlan) return none;
  const pledges = currentPledges(state, ctx); let firm = Object.keys(pledges);
  while (true) {
    if (firm.length < 2) return none;
    const shares = sharesIfOnly(state, firm, ctx); if (!shares) return none;
    const next = firm.filter((uid) => pledges[uid].minGoing <= firm.length && shares[uid] <= pledges[uid].maxShare);
    if (next.length === firm.length) return { firm, shares };
    firm = next;
  }
}

function setPledge(state, command, ctx) {
  requirePlanMember(state, command, ctx);
  const { minGoing, maxShare } = command; const deadline = command.deadline == null || command.deadline === '' ? null : command.deadline;
  if (!Number.isInteger(minGoing) || minGoing < 2 || minGoing > state.expectedSize) ctx.fail(`A minimum group size of 2–${state.expectedSize} is required`);
  if (!Number.isSafeInteger(maxShare) || maxShare < 1 || maxShare > (ctx.maxAmount || MAX_SHARE)) ctx.fail((ctx.settings?.currency || 'INR') === 'INR' ? 'A whole-rupee maximum share is required' : 'A whole-number maximum share is required');
  if (deadline !== null && !isExactDate(deadline)) ctx.fail('A decide-by date in YYYY-MM-DD format is required');
  if (deadline !== null && deadline > state.startDate) ctx.fail('A decide-by date after the trip starts is not allowed');
  state.pledges = { ...(state.pledges || {}), [command.uid]: { minGoing, maxShare, deadline, planVersion: state.activePlan.version, at: command.now } };
  return state;
}

function clearPledge(state, command, ctx) {
  requirePlanMember(state, command, ctx);
  const pledges = { ...(state.pledges || {}) }; delete pledges[command.uid]; state.pledges = pledges;
  return state;
}

function project(state, viewerUid, ctx) {
  if (!state.activePlan) return null;
  const pledges = currentPledges(state, ctx); const { firm, shares } = resolvePledges(state, ctx);
  const deadlines = Object.values(pledges).map((pledge) => pledge.deadline).filter(Boolean).sort();
  const own = (state.pledges || {})[viewerUid]; const iAmFirmlyIn = firm.includes(viewerUid);
  return {
    pledgedCount: Object.keys(pledges).length,
    firmlyInCount: firm.length,
    everyoneIn: firm.length === ctx.approvedIds(state).length,
    earliestDeadline: deadlines[0] || null,
    myPledge: own ? { minGoing: own.minGoing, maxShare: own.maxShare, deadline: own.deadline, stale: own.planVersion !== state.activePlan.version } : null,
    iAmFirmlyIn,
    myShareIfFirm: iAmFirmlyIn ? shares[viewerUid] : null,
  };
}

module.exports = { name: 'pledges', commands: { setPledge, clearPledge }, project, resolvePledges };
