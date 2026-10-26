// Feature modules plug into the trip engine without editing collaborativeTrip.js.
// Each module exports { name, commands?: { [type]: (state, command, ctx) => state }, project?: (state, viewerUid, ctx, now) => any, adjustPlan?: (plan, state, ctx) => plan }.
// `state` passed to commands is already a private clone; `command.uid` is the verified caller and `command.now` the server time.
// ctx.settings is the trip's { homeCountry, currency, scope }; all amounts are whole units of ctx.settings.currency, capped at
// ctx.maxAmount. ctx.forexFor and ctx.documentBlocker are already bound to the trip's settings.
const modules = [require('./pledges'), require('./settleUp'), require('./shareCards'), require('./silentPrefs'), require('./tasks')];

const commands = {};
modules.forEach((mod) => Object.entries(mod.commands || {}).forEach(([type, handler]) => {
  if (commands[type]) throw new Error(`Duplicate feature command: ${type}`);
  commands[type] = handler;
}));

function project(state, viewerUid, ctx, now) {
  return Object.fromEntries(modules.filter((mod) => mod.project).map((mod) => [mod.name, mod.project(state, viewerUid, ctx, now)]));
}

function adjustPlan(plan, state, ctx) {
  return modules.reduce((current, mod) => (mod.adjustPlan ? mod.adjustPlan(current, state, ctx) : current), plan);
}

module.exports = { modules, commands, commandTypes: Object.keys(commands), project, adjustPlan };
