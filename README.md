# Fermat Labs

Fermat helps small groups choose and plan a trip everyone can actually take. The collaborative MVP gives each traveller a private input form, runs a private ballot, locks one feasible destination, and produces an itemized itinerary and budget that fits every private ceiling.

## Group trip MVP

The default `/plan` flow is designed for 4–10 adult Indian-passport travellers planning together:

- create an authenticated room and share a fragment-secret invitation;
- admit members without exposing their private budget, passport month, preferences, or ballot;
- collect exact-date confirmations and private constraints from each identity;
- vote privately across deterministic Bangkok, Dubai, and Paris seed data;
- atomically publish the winner and a reconciled N-person itinerary/budget;
- edit the plan with optimistic revisions and collect fresh member approvals.

The original organizer-only browser draft remains available through **Use local demo**. Shared planning never silently falls back to that local record.

Visa claims are intentionally conservative. A traveller-reported visa is still shown as **Unknown** until its validity is independently verified, and every destination card links to an official source.

## Run locally

The web application lives in `chatgpt-ai-template-main`.

```bash
cd chatgpt-ai-template-main
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/plan](http://localhost:3000/plan) for the planner.

## Verify

```bash
cd chatgpt-ai-template-main
npm run test:group-trip
npm run test:firestore-rules
npm run build
```

Use Node 20 or newer. The checks cover the legacy local flow, N=4–10 deterministic allocation, private projections, revisions, create/lock idempotency, invite rotation/revocation, command authorization, and the Firestore access matrix.

For a full local multi-identity journey, start the Auth and Firestore emulators plus the app with the emulator variables from `.env.example`, then run:

```bash
npm run dry-run:group-trip -- 4
npm run dry-run:group-trip -- 10
```

These journeys exercise the authenticated HTTP API and real Firestore emulator transactions from room creation through unanimous approval without printing identity tokens or invite secrets.

## Shared-planning configuration

Copy [`chatgpt-ai-template-main/.env.example`](chatgpt-ai-template-main/.env.example) to `.env.local` and provide the Firebase web values. The server also requires `FIREBASE_PROJECT_ID` and either `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`. Enable Anonymous Authentication in the selected Firebase project and deploy the committed Firestore rules before a multi-device test.

Invite secrets are returned once, placed after the URL fragment, removed from the address bar before telemetry can initialize, and stored only as a SHA-256 digest. Direct browser access to trip, ballot, constraint, and idempotency documents is denied; every shared mutation crosses the verified-ID server transaction boundary.

## MVP boundaries

This is a product-validation build, not a booking or legal-advice service. It uses versioned seeded upper-bound estimates and does not include document uploads, payments, bookings, live availability, live fares, or live visa decisions. Official entry checks remain visible actions. Production deployment and Firebase Console configuration are intentionally outside the PR.

The product and scoring decisions are documented in [`docs/group-trip-mvp-design.md`](docs/group-trip-mvp-design.md), with the implementation sequence in [`docs/group-trip-mvp-plan.md`](docs/group-trip-mvp-plan.md).

## Contributing

Create a focused branch, include tests for behavior changes, and open a pull request with the problem, approach, and verification evidence.
