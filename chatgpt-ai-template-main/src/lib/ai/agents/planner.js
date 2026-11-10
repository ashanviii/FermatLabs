const { exactKeys, fail } = require('../contracts');

async function proposeChanges(provider, research) {
  const response = await provider.generate(research.context);
  if (!exactKeys(response, ['operations']) || !Array.isArray(response.operations) || response.operations.length > 8) fail('INVALID_PROPOSAL', 'The assistant returned an unsupported proposal.', 502);
  const seen = new Set();
  return response.operations.map((operation) => {
    const keys = operation?.kind === 'remove' ? ['kind', 'activityRef'] : operation?.kind === 'replace' ? ['kind', 'activityRef', 'candidateRef'] : ['kind', 'activityRef', 'time'];
    if (!exactKeys(operation, keys) || !['remove', 'replace', 'reschedule'].includes(operation.kind)) fail('INVALID_PROPOSAL', 'The assistant returned an unsupported operation.', 502);
    const reference = research.references.get(operation.activityRef);
    if (!reference || seen.has(operation.activityRef) || (research.context.day && reference.day !== research.context.day)) fail('INVALID_PROPOSAL', 'The proposal refers to an unavailable activity or day.', 502);
    seen.add(operation.activityRef);
    if (operation.kind === 'remove') return { kind: 'remove', itemId: reference.itemId };
    if (operation.kind === 'reschedule') {
      if (typeof operation.time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(operation.time)) fail('INVALID_PROPOSAL', 'The assistant returned an invalid time.', 502);
      return { kind: 'reschedule', itemId: reference.itemId, time: operation.time, durationMinutes: reference.durationMinutes };
    }
    const candidate = reference.candidates.get(operation.candidateRef);
    if (!candidate) fail('INVALID_PROPOSAL', 'The replacement is not an available catalog option.', 502);
    return { kind: 'replace', itemId: reference.itemId, templateId: candidate.templateId };
  });
}

module.exports = { proposeChanges };