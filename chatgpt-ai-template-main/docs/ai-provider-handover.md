# AI provider handover

## Decision

Fermat is using **Groq** for the first server-side AI integration.

The initial model is `openai/gpt-oss-20b`. It is called through Groq's
OpenAI-compatible chat completions endpoint, with JSON mode enabled for
responses that application code can validate before use.

## Why Groq

We evaluated the free options available in November 2026, including Gemini,
Cloudflare Workers AI, Cerebras, Mistral, OpenRouter, Hugging Face Inference,
Alibaba Model Studio and GitHub Models.

Groq was selected for the MVP because it offered the best combination of:

- a recurring free API allowance instead of a short promotional trial;
- an API that can be swapped with minimal application changes;
- structured JSON output;
- no payment method required for the free tier;
- an inference-specific Zero Data Retention control; and
- enough throughput for early product testing.

Cloudflare Workers AI remains the preferred fallback if Fermat needs a second
provider. Gemini and Mistral free modes were not selected for private trip data
because their free-mode data policies were less suitable. OpenRouter's free
request allowance was too small for production use, Hugging Face's free credit
was negligible, Alibaba's offer was time-limited, and GitHub Models had been
retired.

Free-tier limits and provider terms can change. Re-check them before relying on
this setup for production traffic.

## Privacy and product boundaries

Inference API Zero Data Retention is enabled in the Groq organization.

Even with that control, Fermat must not send names, email addresses, passport
numbers, uploaded documents or other unnecessary identifiers to the model.
Use anonymous member labels and only the minimum trip context needed for the
request.

The deterministic application remains the source of truth for dates, budgets,
votes, permissions, visa rules, prices and transport availability. AI may
explain or format verified results and generate suggestions, but it must not
silently replace those calculations.

## Local setup

The API key is intentionally not stored in Git. Contact a Fermat maintainer for
development access, then create `.env.local` in the application root:

```env
GROQ_API_KEY=contact-a-maintainer-for-the-key
GROQ_MODEL=openai/gpt-oss-20b
```

Never prefix the key with `NEXT_PUBLIC_`, expose it to client components, paste
it into an issue, or commit `.env.local`.

Verify the connection and JSON mode with:

```bash
npm run test:groq
```

The test makes one very small completion request and never prints the API key.

## Implementation

- `src/lib/ai/groq.ts` contains the server-only Groq JSON client.
- `scripts/test-groq.mjs` is the standalone connection test.
- `.env.example` documents the required environment variables.
- `package.json` exposes the test as `npm run test:groq`.

Production deployment must receive `GROQ_API_KEY` through the hosting
platform's encrypted environment-variable settings. Rotate the key immediately
if it is ever exposed.
