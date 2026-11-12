# Fermat web app

See the [repository README](../README.md) for product scope, setup, and verification commands.

## Global Departure Search

The authenticated planner searches a server-side GeoNames city directory instead
of limiting departure selection to a hand-maintained list. The same search now
supports selecting destinations with canonical city names and region labels.
New trips have no preselected city, budget, name or fixed dates. The UI sends
`planningMode: 'ai'`; the create service also defaults to `ai` when it is omitted.
New trips are not automatically restricted to the 33-option catalog. Explicit
`planningMode: 'catalog'` remains supported for legacy clients, the offline demo
and tests; in that mode, scope-compatible catalog entries remain available unless
the trip explicitly narrows them.

Generate or refresh the directory before running a full build/deployment:

```sh
npm run data:cities
npm run test:geo
npm run build
```

The refresh command downloads the [GeoNames cities1000 extract](https://download.geonames.org/export/dump/)
and administrative labels using the approved network route. It validates records
and replaces the local index atomically. GeoNames publishes daily extracts; this
app refreshes only when the command is run, not automatically on every search.
The November 10, 2026 extract produced 171,818 records (~43 MiB). Coverage is
cities/towns above the provider's population threshold and administrative seats,
not every village or address.

Data is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with
[GeoNames attribution](https://www.geonames.org/) shown in results and saved
private details. Search runs locally: search queries are not sent to an external
geocoder or LLM. Requesting a destination draft is a separate, consent-gated
AI operation described below. No public Nominatim endpoint or paid place API
is used.

The generated `data/cities.json` is Git-ignored and server-only. Next.js file
tracing includes it in the places and trip-command server routes; the dataset is
not bundled into the browser. Ensure the refresh step runs in the deployment
pipeline before `next build`. If the file is absent/unreadable, the service
exposes an explicitly labelled limited OurAirports fallback. That fallback cannot
resolve GeoNames IDs until the full directory is restored.

Clients select an ID; the server resolves the canonical label and coordinates.
Client-supplied coordinates are rejected. The departure record is pinned in the
traveller's private constraint snapshot so later fare calculations do not depend
on a network lookup. Only that traveller can read the full snapshot; it is not
sent to the model. Destination generation requires every real member's explicit
consent to sending coarse departure city/region, travel month, interests and
transport modes to the configured AI provider. Budgets, passport data, names and UIDs are not sent.
The stored coordinates are public city centers, not personal GPS or street
addresses, and are excluded from model context.

City search requires authentication, accepts bounded same-origin JSON requests,
returns at most 12 results, and has distributed limits of 30 searches/person/minute
and 300 searches/application/minute. Search counters have a TTL declaration;
production TTL deployment remains a separate operator action.

Catalog-mode resolved-city fares remain labelled distance-band estimates;
existing saved legacy city names remain compatible with prior tables. Catalog,
visa and FX snapshots remain provisional. Dynamic destination costs may instead
be model-generated low/high plausible estimates, explicitly labelled unverified,
not live quotes or source-verified prices. Deterministic budget arithmetic and
permissions remain authoritative; model estimates must not masquerade as
verified prices, visa rules or transport availability.

## Dynamic Destinations and Transport

While collecting trip inputs, the organizer selects a GeoNames city and requests
a destination draft. The configured server-side AI provider generates activities and estimated cost ranges for
that city, with journey suggestions respecting each member's selected **bus,
train, car or flight** modes. Unknown fare or duration fails pricing assessment;
there is no silent flight default. The interface uses travel-neutral headings
and unverified-estimate labels.

The server controls canonical destination identity, scope and trip currency. It
uses the upper end of cost ranges, deterministic FX conversion and a 10% buffer
to check each member's private budget. Only canonical geography is grounded by
the city directory: model-generated costs, activities, route availability,
opening hours and door-to-door timing are not verified.

A preview does not add a destination. Explicit confirmation adds only the saved
server draft, never browser-supplied destination data. Each trip supports up to
12 active dynamic choices; this is a shortlist limit, not worldwide destination
coverage. Replaced/stale data is pruned and trip-input changes invalidate dynamic
choices. Historical plans retain their own destination snapshot.

After destination selection and voting, the plan still uses a deterministic
schedule layout with generated activities. This is not a free-form autonomous
complete itinerary. Multi-leg transport, automatic global AI destination
recommendations without selecting a city, user-entered quotes and live price or
availability providers are not implemented.

The recommended runtime uses `FERMAT_AI_PROVIDER=openai`, `OPENAI_API_KEY` and
`OPENAI_MODEL=gpt-4o-mini`, all as server-only environment variables. Optional `FERMAT_DESTINATION_PROVIDER` overrides destination
generation only; otherwise it inherits `FERMAT_AI_PROVIDER`. Destination
generation rejects `disabled` and `development` with no fallback. OpenAI uses
the Responses API with strict Structured Outputs, capped at 6,000 output tokens
and 25 seconds for destinations and 1,600 tokens and 15 seconds for edits.
Groq remains available as an explicit fallback; there is no automatic failover.

Both flows share limits of 10 attempts per user/hour and 100 globally/day, a
30-second per-trip generation lease and 10-minute preview expiry. Existing
server-only AI collections deny browser access; TTL cleanup still requires
deployment. API keys must remain in the deployment secret store and must never
use the `NEXT_PUBLIC_` prefix.

## Assistant Entry Points

Organizers can open the assistant in Step 4, or use **Intelligent trip planner**
in Step 5 and choose **Review trip changes**. The shortcut opens the existing Plan
view and focuses the assistant without changing the trip or duplicating editors.
This bounded itinerary editor is separate from collecting destination drafts.

For an emulator-only city and assistant check with the **development** edit
provider, not a live AI runtime:

```sh
APP_URL=http://127.0.0.1:3000 npm run dry-run:group-trip -- 4 --dynamic-city --assistant
```

This uses synthetic accounts and requires the city index, local Firebase
emulators, and development assistant provider. It does not validate live
destination generation and must not be presented as a provider connectivity test.
See [AI provider handover](docs/ai-provider-handover.md)
for flags, safeguards and manual verification steps.

## Verification Status

The implementation reports passing planning, AI, geography and Firestore-rules
tests, plus production build and typecheck. The build configuration skips lint.
Live provider validation requires a valid server-side key and available API
billing or credits.
