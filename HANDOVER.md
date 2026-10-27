# Fermat handover: where things stand (25 October 2026)

**Fermat** helps a group of 2–10 friends pick one trip everyone can actually take.

- Each person privately enters a budget, departure city, passport and visas.
- The group sees only anonymous summaries ("2 budgets short").
- Votes are private. Locking picks the top-voted option that fits **everyone**.
- After lock you get a day-by-day plan with per-person costs, plus pledges, settle-up, share cards and tasks.

It works for a group from any country, with India as the launch market. Everything runs on free data and free tiers.

To push this folder to GitHub from another machine, see **[PUSH.md](PUSH.md)**.

---

## 1. Status at a glance

| Area | State |
|---|---|
| Core flow (invite → details → choose → plan → go) | Done, tested end to end on real Firebase |
| Redesigned UI (design system, 5-step flow, real icons) | Done. Showcase at `/design` |
| Global support (home country, currency, passport country, worldwide cities, trip scope) | Done; India and US journeys verified live |
| "Why did X win and not my pick?" vote breakdown | Done ("How the vote went" card after lock) |
| Plugin features: pledges, settle-up, share cards, private preferences, tasks and nudges | Done |
| Destinations | 33, including 5 multi-city routes. 14 came from the free city-pack pipeline |
| Legal pages + consent before sign-in | Done (template; not reviewed by a lawyer) |
| Tests | **117 passing** (`npm run test:group-trip`), typecheck clean, production build clean |
| Hosting | **Not deployed publicly yet.** Runs only inside the dev container (see §5). Vercel is the next step |
| GitHub | Not pushed yet; this zip is the latest code (see PUSH.md) |

## 2. What the product does today

- **Accounts:** Google or email/password for organizers. Invited friends join as guests from a WhatsApp link. A consent checkbox (18+, Terms, Privacy) must be ticked before any sign-in.
- **Create a trip:**
  - Name, dates and group size.
  - **Home country and currency.**
  - Trip type: **In your country / Abroad / Open to both**.
  - A long-weekend finder that uses that country's public holidays.
- **Your details (private):**
  - Departure city (97 worldwide) and budget in the trip currency.
  - Passport country and expiry (month and year, or "no passport yet").
  - Visas held, interests and confirmations.
  - Private preferences (diet, alcohol, activities to skip) that the plan quietly works around.
- **Choose:**
  - Each option shows the group status ("Everyone can go", "1 budget short", "visa timing") next to your private fit ("Fits your budget ~$1,240" / "Short by $53").
  - Private vote. Options that can't work for someone can't win.
- **Lock:** picks the top-voted option that fits everyone. Ties go to shared interests, then to a fixed order. The **"How the vote went"** card shows the tally and the reasons, and tells you privately why your pick didn't win.
- **Plan:**
  - Hero card, cost tiles, day-by-day timeline (multi-city transfers, optional activities), organizer edits and approvals.
  - Where the money goes, including the card FX fee. India-only extras (TCS note, forex + GST) appear only for Indian groups.
  - Your private drop-out impact.
- **Go:**
  - Private pledges ("I'm in if ≥N go and my share ≤ X").
  - Payment collection and settle-up with links for UPI, PayPal, Venmo, Revolut, Monzo and Cash App, by country.
  - Countdown and "Wrapped" share images, WhatsApp share.
  - Who's-doing-what tasks with anonymous reminders, a leave/time-off email and a share-with-family message.
- **Testing helper:** the organizer can click **"Add demo travellers"** to fill empty seats with demo friends who vote, approve and pledge automatically.

## 3. How it's built

- **App:** Next.js 15 + React 19 + Tailwind in `chatgpt-ai-template-main/`. Firebase Auth plus a Firestore `(default)` database (Standard edition, `asia-south1`) in project **`fermat-9e38d`**.
- **Trip engine:** `src/lib/collaborativeTrip.js`.
  - The whole trip lives in one Firestore document, `groupTrips/{id}`.
  - Browsers never read it directly. The firestore rules deny all client access.
  - Every action goes through `POST /api/group-trips` (a server transaction).
  - Each person receives a **per-viewer projection** containing only their own private data plus anonymous aggregates.
- **Plugins:** `src/lib/features/*` (registry in `index.js`). They add commands, projection fields and plan adjusters without editing the engine.
- **Data:**
  - `src/lib/groupTripSeeds.v1.json`: destinations, routes, activities and the Indian fare table. Costs are in each destination's `costCurrency`.
  - `src/lib/geo/*.json`: dated snapshots of exchange rates, countries, departure cities, visa rules and holidays. Each file records its source and license.
- **UI:**
  - `src/components/ui/` is the design system (read `DESIGN.md`).
  - `src/components/group-trip/` holds the planner (`shell/`, `results/`, `features/`, `PlanView.tsx`, `FermatExtras.tsx`).
  - `src/components/landing/` is the landing page.
- **Preview mode (no login):** `/plan?preview=<state>` renders sample trips generated by the real engine.
  - India: `signin`, `create`, `collecting`, `ready`, `voting`, `voted`, `locked`, `lockedMember`
  - US: `usReady`, `usVoting`, `usLocked`, `usLockedMember`
  - Regenerate them with `node tools/make_preview_fixtures.cjs chatgpt-ai-template-main`.

## 4. Running and testing

```bash
cd chatgpt-ai-template-main
npm install                 # .npmrc sets legacy-peer-deps
npm run test:group-trip     # 117 tests
npx tsc --noEmit -p tsconfig.json
npm run build && npm start  # or: npm run dev
```

**Real trips need server credentials** in `.env.local` (git-ignored):

- `FIREBASE_PROJECT_ID=fermat-9e38d`
- `FIREBASE_SERVICE_ACCOUNT_JSON=<one-line JSON>`, or `GOOGLE_APPLICATION_CREDENTIALS=<path to key file>`

**Live checks against a running app** (each takes the Firebase web API key from `src/lib/firebase.ts` and the app URL):

- `node tools/feature_smoke.mjs <apiKey> http://localhost:3000` checks all the features.
- `node tools/us_smoke.mjs <apiKey> <appUrl>` runs a US group in USD, abroad-only, through lock and the vote breakdown.
- `scripts/emulator-group-trip-dry-run.mjs 4` runs the full 4-person journey. Set `AUTH_EMULATOR_URL='https:/'` and `APP_URL=...` to point it at real Firebase.

**Firestore rules tests** need Java: `npm run test:firestore-rules`.

**Free data:**

- `tools/geo_*.mjs` regenerate the geo snapshots.
- `python3 -I tools/places/city_pack.py "Lisbon" --country PT` builds a new city pack.
- `python3 -I tools/import_city_packs.py` adds packs to the seeds. See `docs/places-pipeline.md`.

## 5. Where it runs right now (dev container, corporate network)

- **Live:** http://spaces-docker-rr-752.dxspda.rr1.bcc.bloomberg.com:3320, which maps to `next start` on port 8080. Port 3000 is a separate server for the ECC Nova deck; leave it alone.
- **Dev server for screenshots:** port 3005, started with `NEXT_DIST_DIR=.next-dev npx next dev -p 3005`.
- **Starting the server:** inside this container, Node only reaches Google through the proxy if you start it with `NODE_USE_ENV_PROXY=1`.

  ```bash
  NODE_USE_ENV_PROXY=1 GOOGLE_APPLICATION_CREDENTIALS=<key> FIREBASE_PROJECT_ID=fermat-9e38d npx next start -p 8080 -H 0.0.0.0
  ```

- **Restarting:** stop the server by port with `python3 -I tools/pid_on_port.py 8080`. Never use a `pkill` pattern that also matches your own command line; that has killed both servers before.
- **Gmail sign-in is blocked** on the corporate network. Use email/password there.
- **Container restarts:** both servers stop. **Not a production host.**
- **Two Claude sessions** (`meta-spaces-b7` and `meta-spaces-ee`) edited Fermat on 25 October. b7 was paused. Let only one session work on Fermat at a time.

## 6. Known gaps

### Must fix before real users

- **Not deployed:** push to GitHub, then Vercel (PUSH.md §5). Then add the Vercel domain to Firebase Auth's authorized domains.
- **Polling cost:** the planner re-reads the trip **every 3 seconds per open tab** (`CollaborativeTripPlanner.tsx`).
  - Firestore's free tier allows 50k reads a day, which is only about 10 room-hours with 4 people.
  - Fix: switch to a Firestore realtime listener on a server-filtered view, or poll every 15–30 s with a refresh button.
- **Demo travellers button is visible in production.** Hide it behind a flag or a `?demo=1` URL.
- **Visa and price data are estimates.**
  - Visa rules are a snapshot of the free passport-index dataset (dated Feb 2026; the source may be stale).
  - Fares are distance-based bands where there's no curated table.
  - Card FX fees and entry fees are typical values.
  - All of this is labelled in the UI, but it needs spot-checking.

### Product decisions pending

- **Indian groups still default to the original 13 options** (`seeds.defaultShortlists.IN`). The new places (Rishikesh, Pondicherry, Hampi, Tokyo, Lisbon, Istanbul…) are hidden from them until added. Recommendation: add them.
- **There's no default shortlist for US or other countries.** A US group on "Open to both" also sees Indian domestic trips (Goa, Kerala…). Recommendation: a curated default list per country.
- **"Any city on demand"** (generate a pack when a group types a city) is designed in `docs/places-pipeline.md` but not built.

### Data quality

- City packs need a ~5-minute human review each.
  - Prices are scaled estimates; the Sagrada Família came out at €14, against about €26 in reality.
  - Some icons are missing (Hoover Dam, Teotihuacan; Seoul's Myeongdong/Hongdae).
- For a US group, New York comes out pricier than Bali. That comes from the seed costs, not the screens.
- The OpenStreetMap-based place APIs (Overpass, Nominatim, OpenTripMap, Geoapify, GeoNames) are blocked from the corporate machine and untested.
- Holidays cover 29 countries for 2026–27. The data is CC BY 3.0 from date-holidays, credited in the UI.

### Feature limits

| Feature | Limit |
|---|---|
| Pledges | Decide-by dates aren't enforced; the earliest deadline is visible to the group (anonymously); resolution recomputes plans on every poll |
| Settle-up | No cap on expenses (a huge trip could hit Firestore's 1 MB document limit); transfers are close to minimal but not guaranteed optimal; Revolut links can't carry an amount; Cash App works for collecting but not as a settle-up payout method |
| Share cards | Latin-script text only (other scripts and emoji are dropped); WhatsApp gets text plus a link, not the image |
| Private preferences | Skips are hidden, but per-person totals can still let a friend guess (disclosed in the Privacy Policy) |
| Local demo | The old organizer-only "Use local demo" still has its own 3 destinations |

### Polish

- Copy uses British spelling ("travellers") and "10 Dec" date style everywhere, including US screens.
- Some states are only covered by typecheck, not screenshots:
  - "Short by $X" and "Blocked by your passport" cards
  - the settle-up Pay button
  - the organizer edit form
  - the invite step while members are joining
- There are no browser end-to-end tests. ESLint doesn't start in the dev container.
- Leftover template code: old chatbot components under `src/components/*.tsx`, and unused dependencies such as `react-router-dom` and Chakra pieces. All harmless; clean up later.

### Security and legal (deferred on purpose for the MVP)

- The Firebase service-account key was shared in a chat during setup. Generate a new key before public launch and delete the old one in the Firebase console.
- There's no rate limiting on the API or invite endpoints.
- The legacy `users` collection rules let users edit their own `queryCount`. It's unused by the planner; remove it later.
- Privacy Policy and Terms are a solid template, governed by Indian law, with contact `ashanviyadav08@gmail.com` (in `src/lib/legal.ts`). **Have a lawyer review them** before collecting real users' data, especially for the DPDP Act and GDPR.

## 7. Suggested next steps (in order)

1. **Push to GitHub and deploy to Vercel** (PUSH.md). Share the link with 2–3 real friend groups.
2. **Cut polling cost** (realtime listener or slower poll) and **hide the demo button** in production.
3. **Decide the shortlists** for India and the US (§6) and review the 14 auto-generated city packs.
4. **Watch real groups** and fix what confuses them, before adding features.
5. Then: more cities via the pipeline, a US/global copy pass, "any city on demand", and cached flight prices from a free affiliate source.

## 8. Research and docs

- `docs/places-pipeline.md`: which free place-data sources work, the pipeline, licenses, and how to add a city.
- `docs/group-trip-mvp-design.md`, `docs/group-trip-mvp-plan.md`: the original MVP design.
- Market research (competitors, top pains, why private budgets are unique) was produced as an HTML report outside this repo (`fermat-mvp-research.html` in the dev container's `meta.spaces` folder).
