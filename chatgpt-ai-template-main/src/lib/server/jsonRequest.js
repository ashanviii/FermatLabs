class RequestError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
  }
}

async function readJsonBody(request, appOrigin = process.env.FERMAT_APP_ORIGIN || new URL(request.url).origin, maxBytes = 2048) {
  const reject = (code, message, status) => { throw new RequestError(code, message, status); };
  const origin = request.headers.get('origin');
  if (origin && origin !== appOrigin) reject('ORIGIN_DENIED', 'This origin is not allowed.', 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') reject('INVALID_CONTENT_TYPE', 'Send a JSON request.', 415);
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) reject('PAYLOAD_TOO_LARGE', 'Request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) reject('INVALID_REQUEST', 'Request body is required.');
  const chunks = []; let size = 0; let timeout;
  const deadline = new Promise((resolve, rejectTimeout) => {
    timeout = setTimeout(() => {
      rejectTimeout(new RequestError('REQUEST_TIMEOUT', 'Request body timed out.', 408));
      reader.cancel().catch(() => {});
    }, 5000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); reject('PAYLOAD_TOO_LARGE', 'Request is too large.', 413); }
      chunks.push(Buffer.from(value));
    }
  } finally { clearTimeout(timeout); reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { reject('INVALID_REQUEST', 'Request must contain valid JSON.'); }
}

module.exports = { readJsonBody, RequestError };