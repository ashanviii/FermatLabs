const { AIConfigurationError, readProviderMode, providerError } = require('./groq');

function isLoopbackAddress(value) {
  if (typeof value !== 'string') return false;
  const match = /^(localhost|127\.0\.0\.1|\[::1\]):([0-9]{1,5})$/i.exec(value);
  return Boolean(match && Number(match[2]) > 0 && Number(match[2]) <= 65535);
}

function assertDevelopment(env) {
  if (readProviderMode(env) !== 'development' || env.NODE_ENV === 'production'
    || !isLoopbackAddress(env.FIRESTORE_EMULATOR_HOST)
    || !isLoopbackAddress(env.FIREBASE_AUTH_EMULATOR_HOST)) {
    throw new AIConfigurationError('Fermat AI is unavailable.', 'AI_DEVELOPMENT_UNAVAILABLE');
  }
}

function minutes(time) {
  if (typeof time !== 'string' || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) return NaN;
  const [hours, minute] = time.split(':').map(Number);
  return hours * 60 + minute;
}

function validDuration(value) {
  return Number.isInteger(value) && value > 0 && value <= 1440;
}

function validInterval(item) {
  return item && Number.isInteger(item.day) && item.day > 0
    && validDuration(item.durationMinutes) && Number.isFinite(minutes(item.time))
    && minutes(item.time) + item.durationMinutes <= 1440;
}

function validChoice(item) {
  return item && typeof item.ref === 'string' && item.ref.length > 0
    && typeof item.title === 'string' && item.title.trim().length > 0
    && validDuration(item.durationMinutes) && Number.isFinite(item.groupCost) && item.groupCost >= 0
    && Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === 'string');
}

function assertContext(context) {
  if (!context || !['cost', 'pace', 'later', 'food', 'custom', 'itinerary'].includes(context.goal)
    || !Number.isInteger(context.day) || context.day < 0
    || !Array.isArray(context.activities) || !Array.isArray(context.busy)
    || !context.busy.every(validInterval)
    || !context.activities.every((activity) => validInterval(activity) && validChoice(activity)
      && Array.isArray(activity.candidates) && activity.candidates.every(validChoice))) {
    throw providerError('AI_INVALID_CONTEXT', 400);
  }
}

function byRef(left, right) {
  return left.ref < right.ref ? -1 : left.ref > right.ref ? 1 : 0;
}

function normalizedTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fits(context, activity, start, duration) {
  if (start < 0 || start + duration > 1440) return false;
  return [...context.activities, ...context.busy].every((other) => {
    if (other === activity || other.day !== activity.day) return true;
    const otherStart = minutes(other.time);
    return start + duration <= otherStart || start >= otherStart + other.durationMinutes;
  });
}

function generateDevelopment(context) {
  assertContext(context);
  const eligible = context.activities.filter((activity) => context.day === 0 || activity.day === context.day).sort(byRef);
  const scheduledTitles = new Set(context.activities.map((activity) => normalizedTitle(activity.title)));
  const scheduledRefs = new Set(context.activities.map((activity) => activity.ref));
  const availableCandidates = (activity) => activity.candidates.filter((candidate) =>
    !scheduledTitles.has(normalizedTitle(candidate.title)) && !scheduledRefs.has(candidate.ref)
    && fits(context, activity, minutes(activity.time), candidate.durationMinutes)).sort(byRef);
  let operation;

  if (context.goal === 'cost') {
    let best;
    for (const activity of eligible) {
      for (const candidate of availableCandidates(activity)) {
        const saving = activity.groupCost - candidate.groupCost;
        if (saving > 0 && (!best || saving > best.saving)) best = { activity, candidate, saving };
      }
    }
    if (best) {
      operation = { kind: 'replace', activityRef: best.activity.ref, candidateRef: best.candidate.ref };
    } else {
      const costly = eligible.filter((activity) => activity.groupCost > 0)
        .sort((left, right) => right.groupCost - left.groupCost || byRef(left, right))[0];
      if (costly) operation = { kind: 'remove', activityRef: costly.ref };
    }
  } else if (context.goal === 'pace') {
    const longest = eligible.sort((left, right) => right.durationMinutes - left.durationMinutes || byRef(left, right))[0];
    if (longest) operation = { kind: 'remove', activityRef: longest.ref };
  } else if (context.goal === 'later') {
    for (const activity of eligible) {
      const original = minutes(activity.time);
      const boundaries = [...context.activities, ...context.busy]
        .filter((other) => other !== activity && other.day === activity.day)
        .map((other) => minutes(other.time) + other.durationMinutes).sort((left, right) => left - right);
      const start = [original + 30, original + 1, ...boundaries].find((candidate) =>
        candidate > original && fits(context, activity, candidate, activity.durationMinutes));
      if (start !== undefined) {
        const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
        operation = { kind: 'reschedule', activityRef: activity.ref, time };
        break;
      }
    }
  } else if (context.goal === 'food') {
    for (const activity of eligible) {
      const candidate = availableCandidates(activity).find((choice) => choice.tags.includes('food'));
      if (candidate) {
        operation = { kind: 'replace', activityRef: activity.ref, candidateRef: candidate.ref };
        break;
      }
    }
  } else if (context.goal === 'custom' || context.goal === 'itinerary') {
    const activity = eligible[0];
    const candidate = activity && availableCandidates(activity)[0];
    if (activity && candidate) operation = { kind: 'replace', activityRef: activity.ref, candidateRef: candidate.ref };
    else if (activity && fits(context, activity, minutes(activity.time) + 30, activity.durationMinutes)) {
      const start = minutes(activity.time) + 30;
      operation = { kind: 'reschedule', activityRef: activity.ref, time: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}` };
    }
  }

  return { operations: operation ? [operation] : [] };
}

function createDevelopmentProvider(env = process.env) {
  assertDevelopment(env);
  return {
    mode: 'development',
    label: 'Development simulation (deterministic, not live inference)',
    async generate(context) {
      assertDevelopment(env);
      return generateDevelopment(context);
    },
  };
}

module.exports = { createDevelopmentProvider };
