const { collectContext } = require('./agents/catalog');
const { proposeChanges } = require('./agents/planner');
const { reviewChanges } = require('./agents/reviewer');

async function runTripAgents(state, uid, request, provider) {
  const research = collectContext(state, uid, request);
  const operations = await proposeChanges(provider, research);
  const preview = reviewChanges(state, uid, request, operations, provider);
  return { operations, preview, fingerprint: research.fingerprint };
}

module.exports = { runTripAgents };