# Fermat Labs

Fermat helps small groups choose a trip everyone can actually take. The current MVP turns a few shared constraints—budget, departure city, passport validity, and reported visa status—into an explainable destination comparison and a traveller-by-traveller readiness plan.

## Group trip MVP

The `/plan` flow is designed for an organizer planning for 4–10 Indian-passport travellers on one device:

- capture trip dates, duration, and per-person budget;
- add each traveller's departure city, passport expiry, and reported visas;
- compare Bangkok, Dubai, and Paris with deterministic fit scores and visible blockers;
- select a destination and review cost, passport, and visa readiness for every traveller;
- keep the draft in the browser with a versioned `localStorage` record.

Visa claims are intentionally conservative. A traveller-reported visa is still shown as **Unknown** until its validity is independently verified, and every destination card links to an official source.

## Run locally

The web application lives in `chatgpt-ai-template-main`.

```bash
cd chatgpt-ai-template-main
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/plan](http://localhost:3000/plan) for the planner.

## Verify

```bash
cd chatgpt-ai-template-main
npm run test:group-trip
pnpm build
```

The domain tests cover recommendation ordering, blocker explanations, readiness states, persistence failures, and confirmed/cancelled reset behavior.

## MVP boundaries

This is a product-validation build, not a booking or legal-advice service. It uses seeded destination estimates and rules; it does not include accounts, invitations, live collaboration, document uploads, payments, bookings, or live visa/price APIs. Drafts stay in the current browser.

The product and scoring decisions are documented in [`docs/group-trip-mvp-design.md`](docs/group-trip-mvp-design.md), with the implementation sequence in [`docs/group-trip-mvp-plan.md`](docs/group-trip-mvp-plan.md).

## Contributing

Create a focused branch, include tests for behavior changes, and open a pull request with the problem, approach, and verification evidence.
