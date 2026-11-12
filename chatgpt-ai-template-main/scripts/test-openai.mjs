import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnvironment() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!(name in process.env)) process.env[name] = value;
  }
}

loadLocalEnvironment();

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

if (!apiKey) {
  console.error('Missing OPENAI_API_KEY. Add it to .env.local or the deployment secret store first.');
  process.exit(1);
}

try {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input: 'Return a successful connectivity check.',
      max_output_tokens: 32,
      text: {
        format: {
          type: 'json_schema', name: 'connection_check', strict: true,
          schema: {
            type: 'object', additionalProperties: false, required: ['ok'],
            properties: { ok: { type: 'boolean', enum: [true] } },
          },
        },
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}: ${body?.error?.message || 'unknown error'}`);
  const text = body?.output?.find((item) => item?.type === 'message')?.content
    ?.find((item) => item?.type === 'output_text')?.text;
  const result = JSON.parse(text);
  if (result.ok !== true) throw new Error('OpenAI returned an unexpected response.');
  console.log(`OpenAI connection works. Model: ${body.model || model}; Structured Outputs: OK`);
} catch (error) {
  console.error('OpenAI connection failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
