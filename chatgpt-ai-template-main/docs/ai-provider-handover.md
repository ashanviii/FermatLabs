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

The deterministic application remains authoritative for dates, private budget
checks, votes, permissions, cost allocation, FX conversion and the 10% buffer.
Destination generation may supply low/high plausible cost estimates, explicitly
labelled unverified, but they are not live quotes or source-verified prices.
Canonical geography is the only grounding guaranteed by the city directory;
route availability, opening hours and door-to-door schedules are not verified.
AI must not silently replace budget calculations or invent verified visa rules,
prices or transport availability.

Destination generation additionally requires explicit consent from every real
member before sending coarse departure city/region, travel month, interests and
chosen bus/train/car/flight modes to Groq. Budgets, passport data, names and UIDs
are excluded, as are precise coordinates and exact travel dates. This consented
context is separate from the catalog-based itinerary editor's context below.

## Local setup

The API key is intentionally not stored in Git. Contact a Fermat maintainer for
development access, then create `.env.local` in the application root:

```env
GROQ_API_KEY=contact-a-maintainer-for-the-key
GROQ_MODEL=openai/gpt-oss-20b
```

Never prefix the key with `NEXT_PUBLIC_`, expose it to client components, paste
it into an issue, or commit `.env.local`. The current local setup already has a
server-only key in its ignored environment file and runs with
`FERMAT_AI_PROVIDER=groq`; this is real-provider configuration, not a simulator
or evidence of a successful live call.

The approved proxy is known to block `api.groq.com`; it was not retried in this
session. Obtain IT-approved access before live validation. Once access is
approved, verify the connection and JSON mode with:

```bash
npm run test:groq
```

The test makes one very small completion request and never prints the API key.
It is a connectivity check, not an end-to-end destination-generation check.

## Implementation

- `src/lib/ai/groq.ts` contains the server-only Groq JSON client.
- `scripts/test-groq.mjs` is the standalone connection test.
- `.env.example` documents the required environment variables.
- `package.json` exposes the test as `npm run test:groq`.

Production deployment must receive `GROQ_API_KEY` through the hosting
platform's encrypted environment-variable settings. Rotate the key immediately
if it is ever exposed.

## Guarded Trip Assistant

The authenticated shared planner now has an organizer-only Trip assistant in the
Plan step. The first release works on a locked itinerary: reduce estimated cost,
leave more free time, start an activity later, or choose a food experience. It
previews removals, same-day rescheduling and compatible catalog replacements.
This edit workflow does not create arbitrary new destinations, scrape Reddit,
book travel or claim that a catalog price is a live quote. Dynamic destination
drafting during input collection is a separate workflow described below.

### Provider Selection

`FERMAT_AI_PROVIDER` is server-controlled and defaults to `disabled`:

| Value | Itinerary edits | Destination drafts |
| --- | --- | --- |
| `disabled` | Fail closed; no inference or proposal application | Reject; no fallback |
| `development` | Explicitly labelled deterministic simulation; no network/model call | Reject; no simulated fallback |
| `groq` | One bounded edit request to the fixed Groq endpoint | One bounded destination request to the same fixed endpoint |

Optional server-only `FERMAT_DESTINATION_PROVIDER` overrides destination
generation only; when omitted it inherits `FERMAT_AI_PROVIDER`. It does not
change the itinerary edit provider. The current local runtime uses
`FERMAT_AI_PROVIDER=groq`, although the unset default remains `disabled`.

Development mode requires a non-production Node environment and both Firebase
emulator hosts set to loopback addresses. It is not a connection to VS Code
Copilot or a substitute model hidden behind an AI label. There is no runtime
API for calling the current editor chat, no automatic provider fallback, and no
attempt to bypass a company network restriction. Live Groq access is currently
blocked by the approved company proxy and has not been validated locally.

Set `FERMAT_APP_ORIGIN` to the exact browser origin, such as
`http://127.0.0.1:3000` locally or the canonical HTTPS origin in production.
Next.js can normalize its internal request URL to localhost; this explicit
setting avoids trusting an arbitrary incoming Host header for origin checks.

Local itinerary-edit simulator example, alongside the existing local Firebase
configuration (not the current runtime and not a destination simulator):

```sh
FERMAT_AI_PROVIDER=development FERMAT_APP_ORIGIN=http://127.0.0.1:3000 npm run dev -- --hostname 127.0.0.1
```

For approved live access, set `FERMAT_AI_PROVIDER=groq` on the server and retain
the key in the ignored local environment file or hosting secret store. Never use
`NEXT_PUBLIC_` for the provider flag or key. The standalone `test:groq` script is
a separate explicit connectivity test; it is not part of offline test suites.

### Module Boundaries

- `src/lib/ai/agents/catalog.js`: trusted catalog lookup and anonymous model context.
- `src/lib/ai/agents/planner.js`: calls the selected provider and validates/translates references.
- `src/lib/ai/agents/reviewer.js`: deterministic budget/schedule checks and source-labelled preview.
- `src/lib/ai/orchestrator.js`: bounded sequence of those agents, with at most one inference call.
- `src/lib/ai/providers/`: isolated development and Groq adapters.
- `src/lib/ai/proposals.js`: transactional quota reservation, leases, expiring proposals and atomic Apply.
- `app/api/group-trips/assistant/route.ts`: authenticated capabilities, proposal and confirmation endpoints.
- `src/components/group-trip/TripAssistant.tsx`: goal/day controls, before/after preview, discard and confirmation.
- `src/lib/ai/agents/destination.js`: consent-gated destination context and generated draft validation.
- `src/lib/ai/destinations.js`: canonical city/scope checks, shared quotas, saved destination previews and confirmed Add.
- `app/api/group-trips/destinations/route.ts`: authenticated destination workflow endpoints.
- `src/components/group-trip/DynamicDestinationPlanner.tsx`: city selection, destination preview and confirmation.

The catalog and validation agents are deterministic code, not additional LLM
calls. This is intentional: budget enforcement, permissions and arithmetic do not
depend on model judgment, although dynamic cost inputs are unverified model
estimates. Existing uncommitted `applyPlanSuggestion` work was retained and
extended with no-op protection and catalog replacements.

### Dynamic Destination Workflow

- The new-trip UI sends `planningMode: 'ai'`; the create service defaults to `ai` when omitted. There is no automatic 33-catalog restriction for new trips. Explicit `catalog` remains supported for legacy clients, the offline demo and tests.
- An approved organizer selects a city during input collection using the existing global GeoNames search. The server resolves canonical city names and region labels, enforces trip scope and controls currency; the model cannot choose a different identity or currency.
- All real members must explicitly consent to the coarse context described above. Groq receives anonymous traveller references and permitted interests/modes, not private budgets or identifying member data.
- The separate fixed `generateDestination` policy returns activities and low/high cost ranges. Bus, train, car and flight are supported preferences, not verified routes. Unknown travel fare or duration fails pricing assessment, with no silent flight default.
- Model costs are plausible estimates only, not live quotes or source-verified prices. Upper ends feed deterministic per-member budget checks with FX conversion and a 10% buffer. The UI uses travel-neutral headings and unverified-estimate labels.
- Generation saves a server-owned draft and returns a preview without adding a choice. Add requires a proposal ID and explicit confirmation; only the stored draft can be added, never destination fields supplied by the browser. Fingerprint, expiry, ownership, scope and capacity checks apply; replay does not add twice.
- A trip may have at most 12 active dynamic choices, not 12 destinations worldwide or verified worldwide coverage. Replaced/stale dynamic data is pruned; trip-input changes invalidate choices. Historical plans retain their own destination snapshot.
- The resulting itinerary still uses deterministic schedule layout with generated activities. It is not a free-form autonomous complete itinerary. Multi-leg transport, automatic global AI destination recommendations without city selection, user-entered quotes and live providers are not implemented.

### Security and Privacy

- Only authenticated, approved organizers of locked trips can generate or apply itinerary edits. Destination drafting and adding require the organizer and the input-collection phase, with idempotent replay of an already-added draft.
- Edit requests accept an exact schema with a goal and day; destination generation accepts a city ID and request ID. Neither accepts arbitrary prompts, provider names, URLs or model credentials.
- Edit model context contains catalog text, anonymous activity/candidate references, relative day numbers, durations and group estimates. No names, emails, UIDs, private budget ceilings, passport data, payment handles, exact travel dates or user-edited itinerary text are sent.
- For itinerary edits, private preference filtering happens server-side: the model receives compatible candidates, not underlying per-member preferences. Destination generation instead uses the explicitly consented coarse context described above.
- The edit model cannot supply costs, attendees, vote results, approvals, new places or arbitrary text fields. The destination model may supply bounded estimate ranges and generated activities, but not canonical identity, currency or member authorization. Unknown keys and references fail validation; prompt instructions are not the security boundary.
- For itinerary edits, actual private budget ceilings, cost allocation, forex, contingency, current revision and schedule overlaps are checked by the existing domain engine before preview and again before commit.
- Proposals are server-owned and scoped to requester/trip. Apply/Add accept only a proposal ID plus explicit confirmation, not browser-supplied operations or destination data.
- Model calls run outside retryable Firestore transactions. Generation reserves a distributed per-trip lease and usage counters first; only the later validated result is persisted.
- A fingerprint of the complete trip state invalidates proposals after intervening changes, including approvals. It is conservative by design.
- Applying itinerary edits is idempotent while its receipt remains stored, increments the plan revision once and clears real-member approvals. Existing synthetic demo members may automatically approve again through the preexisting demo behavior. Destination additions use the separate collection-stage workflow above.
- AI response bodies, prompts, keys and private contexts are not logged. Errors returned to the browser are bounded, generic and contain stable codes.
- Firestore rules deny browser access to AI proposals, leases and usage counters. Only the authenticated server controls them.

### Resource Limits and Retention

- Itinerary edits allow at most 8 changes per proposal; 40 editable activities, 100 busy intervals and 3 replacement candidates per activity in model context. Destination drafts allow at most 12 generated activities.
- Destination drafts and itinerary edits share 10 new attempts per user per hour and 100 globally per 24-hour window. Reusing an eligible ready request ID returns the saved preview rather than dispatching again; stale, expired or already-used requests are rejected as applicable.
- Both workflows share one active generation per trip with a 30-second lease. The fixed edit policy has a 12-second deadline and 1,600 output-token cap; the separate fixed `generateDestination` policy has a 20-second deadline and 6,000-token cap. Neither automatically retries.
- Request bodies are limited to 2 KiB with a 5-second read deadline. Provider requests are bounded to 32 KiB and responses to 64 KiB, including streamed reads.
- Preview expiry is 10 minutes and checked synchronously before reuse or Apply/Add. Both workflows reuse the existing browser-denied AI collections. Firestore TTL declarations are included for `_aiProposals.deleteAfter`, `_aiLeases.expiresAt`, and `_aiUsage.expiresAt`.
- TTL is asynchronous cleanup, not authorization. The TTL policies must be deployed and verified separately before production; this work has not deployed them or activated billing. Expiry denial works without TTL, but physical deletion requires the policy.
- A failed dispatch still consumes an attempt. These operation limits bound inference volume, not total hosting/database spend or every possible account-creation abuse scenario. Production account admission/attestation and project quotas remain release requirements.

### Validation and Limits

```sh
npm run test:ai
npm run test:group-trip
npm run test:geo
npm run test:firestore-rules
npm run build
```

The implementation reports these test suites, production build and typecheck
passing with the approved proxy. The final aggregate test count is left to the
main implementation report. The build configuration skips lint. Browser checks
are still in progress, and no live Groq validation is claimed. These checks were
not rerun for this documentation-only update.

The older assistant smoke test is **development-provider only**, with local
Auth/Firestore emulators and a local app URL:

```sh
APP_URL=http://127.0.0.1:3000 npm run dry-run:group-trip -- 4 --assistant
```

It uses synthetic identities and tests auth, provider override rejection,
preview without mutation, explicit confirmation, replay, stale rejection and
private response boundaries. It does not validate dynamic destinations and
must not be claimed to work against the current `groq` runtime.

### Manual Verification

Use synthetic trips and local Firebase emulators. Live generation steps remain
blocked until IT approves access through the approved proxy; do not retry or
bypass that restriction. Configuration alone is not a passed check.

1. Create a trip in the UI and confirm `planningMode: 'ai'` and no automatic catalog restriction. Separately check an explicit `catalog` test client still uses the legacy path.
2. Select a destination through GeoNames search; check canonical city/region labels, scope rejection, trip currency, travel-neutral headings and bus/train/car/flight preferences.
3. With one real member's consent absent, confirm destination generation is rejected. After everyone consents and access is approved, verify only allowlisted coarse context is sent, never budgets, passport data, names or UIDs; do not log secrets or raw private contexts.
4. Generate a draft and inspect low/high unverified estimates and upper-bound budget assessment with FX and the 10% buffer. Use controlled test fixtures for unknown fares/durations: pricing must fail without a flight fallback. Check route/hours/timing caveats remain visible.
5. Confirm preview alone adds nothing, Add requires confirmation and saves the server draft, and replay does not duplicate it. Check stale/expired rejection, input-change invalidation, the 12-active-choice limit and historical snapshot retention.
6. Generate a plan from an added choice and check the deterministic activity layout and unverified labels. Record desktop/mobile browser results separately; these checks have not yet been declared complete.

Known limitations: opening hours, route travel time, accessibility, live prices,
external community research and arbitrary natural-language editing are not yet
validated/supported. Multi-leg transport, automatic global AI destination
recommendations without selecting a city, user-entered quotes and live providers
are not implemented. Neither model-selected catalog edits nor generated
destination estimates guarantee real trip feasibility. Explicit catalog mode
retains its deterministic baseline; AI destination generation fails closed when
its provider is `disabled`, `development` or unavailable, with no catalog fallback.

The legacy `groqJsonCompletion` wrapper now uses the bounded proposal transport:
its `user` value must be JSON context, caller-supplied system prose is ignored,
and the server provider flag must explicitly be `groq`.
