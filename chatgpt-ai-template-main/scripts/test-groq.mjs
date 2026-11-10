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

const apiKey = process.env.GROQ_API_KEY?.trim();
const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

if (!apiKey) {
  console.error('Missing GROQ_API_KEY. Add it to .env.local first.');
  process.exit(1);
}

try {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: 'Return only a JSON object with the property "ok" set to true.',
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_completion_tokens: 256,
      }),
    },
  );

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Groq returned ${response.status}: ${body?.error?.message || 'unknown error'}`,
    );
  }

  const content = body?.choices?.[0]?.message?.content;
  const result = JSON.parse(content);
  if (result.ok !== true) throw new Error('Groq returned an unexpected response.');

  console.log(`Groq connection works. Model: ${body.model || model}; JSON mode: OK`);
} catch (error) {
  console.error(
    'Groq connection failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
