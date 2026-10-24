# Group trip MVP design

## Outcome and acceptance criteria

Fermat will provide an organizer-on-one-device dry run for a group of 4–10 Indian travellers. The experience is intentionally a decision and readiness prototype, not a booking or visa-submission product.

The change is complete when:

1. `/plan` collects a trip name, travel month, duration, and a clearly labelled per-traveller total budget in INR.
2. The organizer can enter 4–10 traveller rows using nicknames, departure cities, passport expiry months, and relevant held-visa names. A claimed held visa remains `Unknown — verify validity` because the MVP does not collect expiry, entry count, or conditions. The app never asks for passport numbers, legal names, dates of birth, or documents.
3. The app deterministically ranks exactly three seeded destinations. Feasibility takes precedence over preference score; every result exposes cost assumptions, hard blockers, actions, reasons, and the data review date.
4. Selecting a destination shows a readiness dashboard with visible text statuses (`Ready`, `Action needed`, or `Unknown`) for the shared budget, passport, and visa for every traveller. Departure cities are shown as context but not scored because the seeded data has no route-level price or availability contract.
5. When browser storage is available, the draft and selected destination survive reloads in a versioned, namespaced record. Editing inputs recomputes recommendations and readiness. Reset removes only Fermat's group-trip record after confirmation. If storage is unavailable, full, blocked, corrupt, unsupported, or cleared externally, the app continues in the current tab, shows a persistence warning, and does not claim that the draft was saved.
6. The flow works at mobile and desktop widths, is keyboard-labelled, never relies on colour alone, and clearly states that the seeded estimates are informational rather than legal advice.
7. The landing-page primary calls to action open `/plan`, and the changed positioning is reflected in repository documentation.

Executable gates are the domain/storage unit tests and the production build. A real multi-user invite, live travel data, and actual bookings are deliberately deferred.

## Decision

Build the first proof as a local-first organizer workflow with deterministic seeded data. The UI moves through trip basics, a compact traveller grid, a three-destination comparison, and a selected-destination readiness dashboard.

Ranking is a pure function. Each destination receives 40 budget points, 20 passport points, 20 visa points, and 20 seasonal-fit points. Budget earns 40 at or above the estimate ceiling, 25–39 within the range, and 0–20 below the estimate floor. Each traveller contributes an equal share of the passport and visa components: a passport valid through the trip end plus the destination's required validity earns its share, unknown earns 40% of its share, and a failure earns zero; a self-reported held visa earns 60% of its share pending validity verification, no held visa earns 25%, and a destination with no seeded visa key earns 80% pending an official-rules check. A preferred travel month earns 20 seasonal points and another month earns 10. Scores are rounded to whole numbers.

Destinations sort first by ascending hard-blocker count, then descending score, then by the fixed seed order `Bangkok`, `Dubai`, `Paris`. A hard blocker is recorded once per affected traveller for a passport-validity failure or when the shared budget is below the destination's minimum estimate. These published components, thresholds, and tie break ensure identical input produces identical output.

The recommendation engine separates feasibility from fit. Passport and minimum-budget failures are hard blockers and sort behind destinations without those blockers. A missing destination visa is an action, not a hard blocker, because the traveller may still apply; it affects fit and readiness but does not make the destination impossible by itself. The remaining score explains budget comfort, passport readiness, existing visa readiness, and seasonal fit. Unknown information produces an explicit warning and never silently becomes `Ready`.

The browser record stores the trip name, month, duration, shared per-traveller budget, current stage, selected destination, and each traveller's nickname, departure city, passport-expiry month, and self-reported held-visa names. It does not store identity-document numbers or files. The UI says that local storage is not encrypted and offers a confirmed one-click deletion.

## Trade-off

The prototype can be tested without authentication, a backend, or third-party APIs, but it cannot support real invitations or cross-device collaboration. Seeded costs and entry assumptions make the interaction testable; they are labelled as demo estimates and must not be presented as current legal or booking advice.

## Residual exposure

- Destination data will become stale and must be replaced by sourced, monitored feeds before production use.
- Local storage is readable by other code running on the same origin and is unsuitable for passport documents.
- Simultaneous tabs are not coordinated. A later save can overwrite another tab's newer work; the MVP provides no cross-tab ordering guarantee.
- The fixed INR budget model does not handle room sharing, children, loyalty points, or multiple currencies.
- An organizer must enter each traveller's answers in this MVP; participants cannot privately submit their own data yet.

## State transitions

The draft outlives a render and browser process, so this is a stateful change.

| State | Event | Outcome | Kind | Evidence |
|---|---|---|---|---|
| no saved draft | load | clean version-1 draft returned; storage unchanged | introduced | `returns a clean draft when storage is empty` |
| no saved draft | first save succeeds | version-1 draft written under only the Fermat group-trip key; UI may show saved | introduced | `saves only the namespaced group-trip record` |
| no saved draft | first save throws because storage is blocked or full | in-memory draft remains usable; warning shown; no saved claim | introduced | `reports unavailable storage without losing the in-memory draft` |
| saved draft | reload | same stage, selection, inputs, and travellers restored | introduced | `restores a valid saved draft` |
| saved draft | later save in the same tab | complete draft replaces the prior value; no other key changes | introduced | `uses last-write-wins for repeated saves` |
| saved draft | another tab saves before or after this tab | whichever whole-record `setItem` executes last remains; ordering is not guaranteed; no other key changes | introduced | same synchronous storage contract; cross-tab coordination deliberately untested |
| malformed, unsupported, or unreadable record | load | clean in-memory draft returned; existing storage left unchanged; warning shown; unrelated storage unchanged | introduced | `recovers from corrupt, unsupported, and unavailable storage` |
| saved draft | confirmed reset succeeds | only the Fermat group-trip key is removed; clean start is shown | introduced | `confirmed reset deletes only the group-trip record` |
| saved draft | reset cancelled | draft and storage remain unchanged | introduced | `cancelled reset preserves the draft and storage` |
| saved draft | confirmed reset throws | in-memory draft remains; warning shown; storage may remain unchanged | introduced | `reports reset failure without claiming deletion` |

Invariant: successful writes are synchronous whole-record `localStorage.setItem` operations under one namespaced key. The MVP has no notification, retry, remote effect, cross-tab reconciliation, or destructive recovery-on-read.

## Red evidence

Against base commit `49ac447` plus only the new test harness (`package.json` script and `src/lib/groupTrip.test.cjs`), `npm run test:group-trip` fails with `Cannot find module './groupTrip'`. This is the expected absent-feature failure: the unchanged application has no recommendation, readiness, or persistence contract.
