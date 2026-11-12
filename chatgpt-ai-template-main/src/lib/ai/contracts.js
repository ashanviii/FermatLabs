const { readJsonBody, RequestError } = require('../server/jsonRequest');

class AIWorkflowError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'AIWorkflowError';
    this.code = code;
    this.status = status;
  }
}

const GOALS = ['cost', 'pace', 'later', 'food'];
const LAB_GOALS = ['custom', 'itinerary'];
const ALL_GOALS = [...GOALS, ...LAB_GOALS];
const fail = (code, message, status) => { throw new AIWorkflowError(code, message, status); };
const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value, keys) => plainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

function parseRequest(body) {
  if (!plainObject(body) || typeof body.tripId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.tripId)) fail('INVALID_REQUEST', 'A valid trip ID is required.');
  const proposalKeys = body.goal === 'custom'
    ? ['action', 'tripId', 'requestId', 'goal', 'day', 'instruction']
    : ['action', 'tripId', 'requestId', 'goal', 'day'];
  if (body.action === 'propose' && exactKeys(body, proposalKeys)) {
    if (typeof body.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId) || !ALL_GOALS.includes(body.goal) || !Number.isInteger(body.day) || body.day < 0 || body.day > 31) fail('INVALID_REQUEST', 'Choose a supported goal and day.');
    if (body.goal === 'itinerary' && body.day !== 0) fail('INVALID_REQUEST', 'A day-by-day refresh must consider the whole trip.');
    if (body.goal === 'custom' && (typeof body.instruction !== 'string' || body.instruction.trim().length < 5 || body.instruction.length > 400 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(body.instruction))) {
      fail('INVALID_REQUEST', 'Describe the itinerary change in 5–400 characters.');
    }
  } else if (body.action === 'apply' && exactKeys(body, ['action', 'tripId', 'proposalId', 'confirmed'])) {
    if (!/^[a-f0-9]{64}$/.test(body.proposalId || '') || body.confirmed !== true) fail('CONFIRMATION_REQUIRED', 'Confirm the preview before applying it.');
  } else fail('INVALID_REQUEST', 'Unsupported assistant request.');
  return body;
}

async function readRequest(request, appOrigin = process.env.FERMAT_APP_ORIGIN || new URL(request.url).origin) {
  try {
    return parseRequest(await readJsonBody(request, appOrigin));
  } catch (error) {
    if (error instanceof RequestError) throw new AIWorkflowError(error.code, error.message, error.status);
    throw error;
  }
}

module.exports = { AIWorkflowError, GOALS, LAB_GOALS, ALL_GOALS, fail, plainObject, exactKeys, parseRequest, readRequest };
