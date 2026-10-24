# Group trip MVP design

## Outcome and acceptance criteria

Fermat will provide an organizer-on-one-device dry run for a group of 4–10 Indian travellers. The experience is intentionally a decision and readiness prototype, not a booking or visa-submission product.

The change is complete when:

1. `/plan` collects a trip name, travel month, duration, and a clearly labelled per-traveller total budget in INR.
2. The organizer can enter 4–10 traveller rows using nicknames, departure cities, passport expiry months, and relevant held visas. The app never asks for passport numbers, legal names, dates of birth, or documents.
3. The app deterministically ranks exactly three seeded destinations. Feasibility takes precedence over preference score; every result exposes cost assumptions, hard blockers, actions, reasons, and the data review date.
4. Selecting a destination shows a readiness dashboard with visible text statuses (`Ready`, `Action needed`, or `Unknown`) for departure, budget, passport, and visa for every traveller. Another traveller's exact budget is not displayed.
5. The draft and selected destination survive reloads in a versioned, namespaced browser-storage record. Editing inputs recomputes recommendations and readiness. Reset removes only Fermat's group-trip record after confirmation.
6. The flow works at mobile and desktop widths, is keyboard-labelled, never relies on colour alone, and clearly states that the seeded estimates are informational rather than legal advice.
7. The landing-page primary calls to action open `/plan`, and the changed positioning is reflected in repository documentation.

Executable gates are the domain/storage unit tests and the production build. A real multi-user invite, live travel data, and actual bookings are deliberately deferred.

## Decision

Build the first proof as a local-first organizer workflow with deterministic seeded data. The UI moves through trip basics, a compact traveller grid, a three-destination comparison, and a selected-destination readiness dashboard. Ranking is a pure function with published components and a stable tie break, so identical input always produces identical output.

The recommendation engine separates feasibility from fit. Passport and minimum-budget failures are hard blockers and sort behind destinations without those blockers. A missing destination visa is an action, not a hard blocker, because the traveller may still apply; it affects fit and readiness but does not make the destination impossible by itself. The remaining score explains budget comfort, passport readiness, existing visa readiness, and seasonal fit. Unknown information produces an explicit warning and never silently becomes `Ready`.

The browser stores only nicknames and planning statuses. It does not store identity-document numbers or files. The UI says that local storage is not encrypted and offers a confirmed one-click deletion.

## Trade-off

The prototype can be tested without authentication, a backend, or third-party APIs, but it cannot support real invitations or cross-device collaboration. Seeded costs and entry assumptions make the interaction testable; they are labelled as demo estimates and must not be presented as current legal or booking advice.

## Residual exposure

- Destination data will become stale and must be replaced by sourced, monitored feeds before production use.
- Local storage is readable by other code running on the same origin and is unsuitable for passport documents.
- Simultaneous tabs use last-write-wins semantics.
- The fixed INR budget model does not handle room sharing, children, loyalty points, or multiple currencies.
- An organizer must enter each traveller's answers in this MVP; participants cannot privately submit their own data yet.

## State transitions

The draft outlives a render and browser process, so this is a stateful change.

| State | Event | Outcome | Kind | Evidence |
|---|---|---|---|---|
| no saved draft | load | clean version-1 draft returned; storage unchanged | introduced | `returns a clean draft when storage is empty` |
| no saved draft | first save | version-1 draft written under only the Fermat group-trip key | introduced | `saves only the namespaced group-trip record` |
| saved draft | reload | same stage, selection, inputs, and travellers restored | introduced | `restores a valid saved draft` |
| saved draft | later save or another tab saves | newest complete draft replaces the prior value; no other key changes | introduced | `uses last-write-wins for repeated saves` |
| malformed or unsupported record | load | bad record removed; clean draft returned; unrelated storage unchanged | introduced | `recovers from corrupt and unsupported records` |
| saved draft | confirmed reset | only the Fermat group-trip key is removed; clean start is shown | introduced | `reset deletes only the group-trip record` |
| saved draft | reset cancelled | draft and storage remain unchanged | introduced | component interaction; covered by production dry run |

Invariant: writes are synchronous whole-record `localStorage.setItem` operations. There is no notification, retry, partial durable write, remote effect, or recovery step to interleave.

## Red evidence

Against base commit `49ac447`, `npm run test:group-trip` fails because `src/lib/groupTrip` does not exist. This is the expected absent-feature failure: the unchanged application has no recommendation or readiness contract.
