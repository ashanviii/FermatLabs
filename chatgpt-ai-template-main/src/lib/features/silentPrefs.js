// Silent private preferences: diet, alcohol and activities to skip.
// The plan quietly works around them; nobody sees whose they are, only anonymous notes.
const DIETS = ['any', 'vegetarian', 'vegan', 'jain', 'halal'];
const DIET_LABELS = { vegetarian: 'vegetarian', vegan: 'vegan', jain: 'Jain', halal: 'halal' };
const ALCOHOL = ['fine', 'avoid'];
const DEFAULT_PREFS = { diet: 'any', alcohol: 'fine', skipTags: [] };

const tagVocabulary = (ctx) => new Set(ctx.seeds.destinations.flatMap((dest) => dest.tags));
const prefsFor = (state, uid) => (state.privatePrefs || {})[uid] || DEFAULT_PREFS;
const joinWords = (words) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function setPrivatePreferences(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  if (state.phase === 'locked') ctx.fail('Preferences can be changed only before the plan is locked; they are not allowed after lock');
  const { diet, alcohol, skipTags } = command;
  if (!DIETS.includes(diet)) ctx.fail(`A diet of ${DIETS.join(', ')} is required`);
  if (!ALCOHOL.includes(alcohol)) ctx.fail('An alcohol choice of fine or avoid is required');
  const vocabulary = tagVocabulary(ctx);
  if (!Array.isArray(skipTags) || skipTags.length > vocabulary.size || new Set(skipTags).size !== skipTags.length || !skipTags.every((tag) => vocabulary.has(tag))) {
    ctx.fail('Skipped activities must be distinct known tags; other values are not allowed');
  }
  state.privatePrefs = { ...(state.privatePrefs || {}), [command.uid]: { diet, alcohol, skipTags: [...skipTags] } };
  return state;
}

// templateId is '<activityId>' for single-city trips or '<stopId>/<activityId>' for multi-city routes.
function activityTags(dest, templateId, ctx) {
  const [stopId, activityId] = templateId.includes('/') ? templateId.split('/') : [null, templateId];
  let activities = dest.activities || [];
  if (stopId !== null) {
    const stop = (dest.stops || []).find((item) => item.id === stopId);
    activities = stop?.activities || (stop?.fromDestination ? ctx.destination(stop.fromDestination).activities : []) || [];
  }
  return activities.find((activity) => activity.id === activityId)?.tags || [];
}

function skips(prefs, tags) {
  return prefs.skipTags.some((tag) => tags.includes(tag)) || (prefs.alcohol === 'avoid' && tags.includes('nightlife'));
}

const flexItem = (date, attendees) => ({ id: `flex-${date}`, title: 'Free and flexible time', time: '10:00', durationMinutes: 180, location: 'Choose together', attendees, estimatedCost: 0, costBasis: 'free', verificationAction: 'Agree as a group' });

// Removes a skipper's share of one activity from their totals, refreshing forex and contingency.
function refund(member, perPerson, dest, ctx) {
  const inDestination = member.inDestination - perPerson; const forex = ctx.forexFor(dest, inDestination);
  const subtotal = member.subtotal - perPerson - member.forex + forex; const contingency = Math.ceil(subtotal / 10);
  return { ...member, inDestination, forex, subtotal, contingency, total: subtotal + contingency };
}

function adjustPlan(plan, state, ctx) {
  const uids = plan.memberTotals.map((member) => member.uid);
  const prefs = Object.fromEntries(uids.map((uid) => [uid, prefsFor(state, uid)]));
  const skippers = uids.filter((uid) => prefs[uid].alcohol === 'avoid' || prefs[uid].skipTags.length);
  const diets = DIETS.filter((diet) => diet !== 'any' && uids.some((uid) => prefs[uid].diet === diet));
  if (!skippers.length && !diets.length) return plan;

  const next = ctx.clone(plan); const dest = ctx.destination(plan.destinationId);
  const totals = Object.fromEntries(next.memberTotals.map((member) => [member.uid, member]));
  let optional = 0; let freed = 0;
  next.itinerary.forEach((day) => { day.items = day.items.map((item) => {
    if (!item.templateId || !item.estimatedCost) return item;
    const tags = activityTags(dest, item.templateId, ctx);
    const out = item.attendees.filter((uid) => skippers.includes(uid) && skips(prefs[uid], tags));
    const perPerson = item.estimatedCost / item.attendees.length;
    if (!out.length || !Number.isSafeInteger(perPerson)) return item;
    out.forEach((uid) => { if (totals[uid]) totals[uid] = refund(totals[uid], perPerson, dest, ctx); });
    const remaining = item.attendees.filter((uid) => !out.includes(uid));
    if (!remaining.length) { freed += 1; return flexItem(day.date, item.attendees); }
    optional += 1;
    return { ...item, attendees: remaining, estimatedCost: perPerson * remaining.length };
  }); });

  next.memberTotals = next.memberTotals.map((member) => totals[member.uid]);
  const items = next.itinerary.flatMap((day) => day.items);
  next.categories.activities = items.filter((item) => item.templateId).reduce((sum, item) => sum + item.estimatedCost, 0);
  next.categories.forex = next.memberTotals.reduce((sum, member) => sum + member.forex, 0);
  next.categories.contingency = next.memberTotals.reduce((sum, member) => sum + member.contingency, 0);
  next.groupTotal = next.memberTotals.reduce((sum, member) => sum + member.total, 0);

  const notes = [];
  if (diets.length) {
    const labels = diets.map((diet) => DIET_LABELS[diet]);
    items.filter((item) => item.id.startsWith('meal-')).forEach((item) => { item.verificationAction = `Choose places with ${joinWords(labels)} options`; });
    notes.push(`${capitalize(joinWords(labels))}-friendly meals`);
  }
  if (optional) notes.push(`${plural(optional, 'activity is', 'activities are')} optional for some travellers`);
  if (freed) notes.push(`${plural(freed, 'activity was', 'activities were')} swapped for free time`);
  next.inclusions = [...(next.inclusions || []), ...notes];
  return next;
}

// Private only: the viewer's own preferences, never anyone else's.
function project(state, viewerUid) {
  return { myPreferences: { ...DEFAULT_PREFS, ...prefsFor(state, viewerUid), skipTags: [...prefsFor(state, viewerUid).skipTags] } };
}

module.exports = { name: 'silentPrefs', commands: { setPrivatePreferences }, adjustPlan, project, DIETS, ALCOHOL };
