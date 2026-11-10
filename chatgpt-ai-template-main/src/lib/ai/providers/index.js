const { createDevelopmentProvider } = require('./development');
const { AIConfigurationError, AIProviderError, createGroqProvider, readProviderMode } = require('./groq');

function createProvider(env = process.env, deps = {}) {
  return readProviderMode(env) === 'development'
    ? createDevelopmentProvider(env)
    : createGroqProvider(env, deps);
}

module.exports = { createProvider, AIConfigurationError, AIProviderError };