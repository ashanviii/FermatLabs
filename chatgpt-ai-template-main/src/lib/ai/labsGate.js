const { AIWorkflowError } = require('./contracts');

function values(input) {
  return new Set(String(input || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function labsEnabled(user, env = process.env) {
  if (env.FERMAT_AI_LABS_ENABLED !== 'true' || !user || typeof user.uid !== 'string') return false;
  const uids = values(env.FERMAT_AI_LABS_UIDS);
  const emails = values(env.FERMAT_AI_LABS_EMAILS);
  return uids.has(user.uid.toLowerCase()) || (typeof user.email === 'string' && emails.has(user.email.trim().toLowerCase()));
}

function assertLabsEnabled(user, env = process.env) {
  if (!labsEnabled(user, env)) {
    throw new AIWorkflowError('AI_LABS_FORBIDDEN', 'This AI Labs preview is not enabled for this account.', 403);
  }
}

module.exports = { labsEnabled, assertLabsEnabled };
