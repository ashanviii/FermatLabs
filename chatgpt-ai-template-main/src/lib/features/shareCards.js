// Shareable trip cards + "Fermat Wrapped": exposes only shared timing facts; the image is built client-side from the shared plan.
const DAY_MS = 86400000;

const validTime = (value) => Number.isSafeInteger(value) && value > 0;

function decisionDays(createdAt, lockedAt, day) {
  if (!validTime(createdAt) || !validTime(lockedAt)) return null;
  return Math.max(1, Math.ceil((lockedAt - createdAt) / day));
}

function project(state, _viewerUid, ctx) {
  const createdAt = validTime(state.createdAt) ? state.createdAt : null;
  const lockedAt = validTime(state.lockedAt) ? state.lockedAt : null;
  return { createdAt, lockedAt, decisionDays: decisionDays(createdAt, lockedAt, (ctx && ctx.DAY) || DAY_MS) };
}

module.exports = { name: 'shareCards', commands: {}, project, decisionDays };
