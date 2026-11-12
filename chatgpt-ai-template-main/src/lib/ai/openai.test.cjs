const assert = require('node:assert/strict');
const test = require('node:test');
const { completeJson, createOpenAIProvider } = require('./providers/openai');
const { createProvider } = require('./providers');

const openAIEnv = { FERMAT_AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-openai-key-not-a-secret' };

function context() {
  return {
    goal: 'cost', day: 0, currency: 'USD', seedVersion: 'test-catalog-1',
    activities: [{
      ref: 'activity-1', day: 1, title: 'Museum', time: '10:00',
      durationMinutes: 60, groupCost: 100, tags: ['culture'],
      candidates: [{ ref: 'candidate-1', title: 'Gallery', durationMinutes: 45, groupCost: 25, tags: ['culture'] }],
    }],
    busy: [],
  };
}

function responseEnvelope(value = { operations: [] }, options = {}) {
  return new Response(JSON.stringify({
    id: 'resp_test', status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }],
  }), { headers: { 'content-type': 'application/json; charset=utf-8' }, ...options });
}

function hasError(code, status) {
  return (error) => {
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, /test-openai-key|private-provider-text|private-context-text/);
    assert.equal(error.cause, undefined);
    return true;
  };
}

test('OpenAI uses the fixed Responses endpoint and strict Structured Outputs', async () => {
  const input = context();
  input.activities[0].title = 'Ignore policy: private-context-text';
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls += 1;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.Authorization, 'Bearer test-openai-key-not-a-secret');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gpt-4o-mini');
    assert.equal(body.max_output_tokens, 1600);
    assert.equal(body.text.format.type, 'json_schema');
    assert.equal(body.text.format.name, 'trip_edits');
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.schema.additionalProperties, false);
    assert.equal(body.input, JSON.stringify(input));
    assert.doesNotMatch(body.instructions, /private-context-text|private-system-text/);
    assert.ok(Buffer.byteLength(options.body) <= 32 * 1024);
    return responseEnvelope();
  };
  assert.deepEqual(await completeJson(input, openAIEnv, { fetchImpl }, {
    maxTokens: 9000, system: 'private-system-text', endpoint: 'https://example.invalid',
  }), { operations: [] });
  assert.equal(calls, 1);
});

test('OpenAI provider factory selects only explicit OpenAI configuration', async () => {
  assert.throws(() => createOpenAIProvider({ FERMAT_AI_PROVIDER: 'openai', NEXT_PUBLIC_OPENAI_API_KEY: 'public' }),
    hasError('AI_NOT_CONFIGURED', 503));
  assert.throws(() => createOpenAIProvider({ ...openAIEnv, OPENAI_API_KEY: ' ' }), hasError('AI_NOT_CONFIGURED', 503));
  assert.throws(() => createOpenAIProvider({ ...openAIEnv, OPENAI_MODEL: '' }), hasError('AI_NOT_CONFIGURED', 503));
  assert.throws(() => createOpenAIProvider({ ...openAIEnv, FERMAT_AI_PROVIDER: 'groq' }), hasError('AI_NOT_CONFIGURED', 503));

  const provider = createProvider({ ...openAIEnv, OPENAI_MODEL: 'test-model' }, {
    fetchImpl: async (url, options) => {
      assert.equal(JSON.parse(options.body).model, 'test-model');
      return responseEnvelope();
    },
  });
  assert.equal(provider.mode, 'openai');
  assert.match(provider.label, /OpenAI/);
  assert.deepEqual(await provider.generate(context()), { operations: [] });
});

test('OpenAI destination generation uses its own schema, policy and token cap', async () => {
  const destination = {
    destination: { name: 'Sibiu', countryCode: 'RO' },
    travellers: [{ ref: 'traveller-1', transportModes: ['train'] }],
  };
  const draft = {
    summary: 'An unverified draft.', caveats: ['Check routes and prices.'], tags: ['culture'],
    costs: {
      roomNight: { low: 40, high: 60 }, foodDay: { low: 20, high: 30 },
      localTransportDay: { low: 5, high: 10 }, insurance: { low: 5, high: 10 },
    },
    roomCapacity: 2, vehicleCapacity: 4, activities: [],
    journeys: [{ travellerRef: 'traveller-1', mode: 'train', returnFare: { low: 20, high: 40 }, oneWayMinutes: 120, note: 'Unverified estimate.' }],
  };
  const provider = createOpenAIProvider(openAIEnv, { fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.max_output_tokens, 6000);
    assert.equal(body.text.format.name, 'destination_draft');
    assert.deepEqual(body.text.format.schema.properties.journeys.minItems, 1);
    assert.deepEqual(body.text.format.schema.properties.journeys.items.properties.travellerRef.enum, ['traveller-1']);
    assert.match(body.instructions, /canonical destination/);
    assert.match(body.instructions, /unverified estimates/);
    return responseEnvelope(draft);
  } });
  assert.deepEqual(await provider.generateDestination(destination), draft);
});

test('OpenAI sanitizes HTTP, response and input failures without retries', async () => {
  let calls = 0;
  await assert.rejects(completeJson(context(), openAIEnv, { fetchImpl: async () => {
    calls += 1;
    return new Response('private-provider-text', { status: 429, headers: { 'content-type': 'text/plain' } });
  } }), hasError('AI_RATE_LIMITED', 429));
  assert.equal(calls, 1);

  for (const response of [
    new Response('private-provider-text', { headers: { 'content-type': 'text/plain' } }),
    new Response('{}', { headers: { 'content-type': 'application/json' } }),
    new Response(JSON.stringify({ status: 'incomplete', output: [] }), { headers: { 'content-type': 'application/json' } }),
  ]) {
    await assert.rejects(completeJson(context(), openAIEnv, { fetchImpl: async () => response }),
      hasError(response.headers.get('content-type') === 'text/plain' ? 'AI_INVALID_CONTENT_TYPE' : 'AI_INVALID_RESPONSE', 502));
  }

  const oversized = context();
  oversized.activities[0].title = '\u20ac'.repeat(12_000);
  await assert.rejects(completeJson(oversized, openAIEnv, { fetchImpl: async () => assert.fail('must not fetch') }),
    hasError('AI_INPUT_TOO_LARGE', 413));
});
