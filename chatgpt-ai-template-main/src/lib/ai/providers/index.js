const { createDevelopmentProvider } = require('./development');
const { AIConfigurationError, AIProviderError, createGroqProvider, readProviderMode } = require('./groq');
const { createOpenAIProvider } = require('./openai');

function createProvider(env = process.env, deps = {}) {
  const mode = readProviderMode(env);
  if (mode === 'development') return createDevelopmentProvider(env);
  return mode === 'openai' ? createOpenAIProvider(env, deps) : createGroqProvider(env, deps);
}

module.exports = { createProvider, AIConfigurationError, AIProviderError };
