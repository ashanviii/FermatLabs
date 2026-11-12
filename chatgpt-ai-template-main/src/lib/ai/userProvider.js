const { createHash } = require('node:crypto');
const { createProvider } = require('./providers');

function safetyIdentifier(uid) {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9:_-]{1,256}$/.test(uid)) {
    throw new TypeError('A verified user ID is required for AI requests.');
  }
  return `fermat_${createHash('sha256').update(`openai-user\0${uid}`).digest('hex')}`;
}

function createUserProvider(uid, env = process.env, deps = {}) {
  return createProvider(env, { ...deps, safetyIdentifier: safetyIdentifier(uid) });
}

module.exports = { safetyIdentifier, createUserProvider };
