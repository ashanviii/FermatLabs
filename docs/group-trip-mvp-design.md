# Group trip MVP design

## Outcome and acceptance criteria

Fermat will provide an organizer-on-one-device dry run for a group of 4–10 travellers who all hold Indian passports. The UI states that mixed-nationality groups are unsupported in this MVP. The experience is intentionally a decision and readiness prototype, not a booking or visa-submission product.

The change is complete when:

1. `/plan` collects a trip name, travel month, duration, and a clearly labelled per-traveller total budget in INR.
2. The organizer can enter 4–10 traveller rows using nicknames, departure cities, passport expiry months, and controlled held-visa options (`UAE` and `Schengen`). A claimed held visa remains `Unknown — verify validity` because the MVP does not collect expiry, entry count, or conditions. The app never asks for passport numbers, legal names, dates of birth, or documents.
3. The app deterministically ranks exactly three seeded destinations. Feasibility takes precedence over preference score; every result exposes cost assumptions, hard blockers, actions, reasons, and the data review date.
4. Selecting a destination shows a readiness dashboard with visible text statuses (`Ready`, `Action needed`, or `Unknown`) for the shared budget, passport, and visa for every traveller. Departure cities are shown as context but not scored because the seeded data has no route-level price or availability contract.
5. When browser storage is available, the draft and selected destination survive reloads in a versioned, namespaced record. Editing inputs recomputes recommendations and readiness. Reset removes only Fermat's group-trip record after confirmation. If storage is unavailable, full, blocked, corrupt, or unsupported, the app continues in the current tab, shows a persistence warning, and does not claim that the draft was saved. If storage is cleared externally, the open tab receives no notification; without a later autosave recreating the record, the next reload starts clean.
6. The flow works at mobile and desktop widths, is keyboard-labelled, never relies on colour alone, and clearly states that the seeded estimates are informational rather than legal advice.
7. The landing-page primary calls to action open `/plan`, and the changed positioning is reflected in repository documentation.

Executable gates are the domain/storage unit tests and the production build. The acceptance gate also includes a recorded browser dry run at 390px and 1440px widths covering keyboard-labelled progression, visible text statuses, landing-page CTA navigation, reload restoration, edit/recalculation, cancelled reset, and confirmed reset. A real multi-user invite, live travel data, and actual bookings are deliberately deferred.

## Decision

Build the first proof as a local-first organizer workflow with deterministic seeded data. The UI moves through trip basics, a compact traveller grid, a three-destination comparison, and a selected-destination readiness dashboard.

Ranking is a pure function. Each destination receives 40 budget points, 20 passport points, 20 visa points, and 20 seasonal-fit points. Seeded estimates are for six days; for a duration `d`, both range bounds are multiplied by `0.5 + 0.5 × d / 6` before scoring. If budget is `b`, the adjusted estimate floor is `min`, and the adjusted ceiling is `max`, budget points are `40` when `b >= max`, `25 + 15 × (b - min) / (max - min)` when `min <= b < max`, and `20 × b / min` when `b < min`, clamped at zero. Each traveller contributes an equal share of the passport and visa components: a passport valid through the trip end plus the destination's required validity earns its share, unknown earns 40% of its share, and a failure earns zero; the matching controlled held-visa key earns 60% of its share pending validity verification, while no matching key or a destination with no seeded visa key earns 25%. The latter always produces an official-rules warning rather than a readiness claim. A preferred travel month earns 20 seasonal points and another month earns 10. The four components are summed and rounded with JavaScript `Math.round` semantics, so an exact positive half point rounds upward.

For date arithmetic, travel starts on the first day of the selected month and ends `durationDays - 1` days later. A passport expiry entered as a month is treated as the last day of that month. To add required validity months, advance the trip end's calendar year/month by the requirement and preserve its day-of-month, clamping that day to the target month's final day.

The fixed seed data is:

| Seed | Destination | Six-day estimate/person | Preferred months | Passport validity after trip | Visa key | Official verification | Review/provenance |
|---|---|---:|---|---:|---|---|---|
| 1 | Bangkok, Thailand | ₹65k–₹85k | Nov–Feb | 6 months | none; official entry check required | `https://www.thaievisa.go.th/` | 2026-10-24; illustrative Fermat demo assumption |
| 2 | Dubai, UAE | ₹80k–₹110k | Nov–Mar | 6 months | `uae` | `https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visas` | 2026-10-24; illustrative Fermat demo assumption |
| 3 | Paris, France | ₹130k–₹175k | Apr–Jun, Sep–Oct | 3 months | `schengen` | `https://france-visas.gouv.fr/en/` | 2026-10-24; illustrative Fermat demo assumption |

These values are intentionally static and not represented as government, airline, or live fare data. Each result links users to an official-rules verification step before booking.

Destinations sort first by ascending hard-blocker count, then descending score, then by the fixed seed order `Bangkok`, `Dubai`, `Paris`. Each traveller with a passport-validity failure contributes one hard blocker. A shared-budget shortfall below the duration-adjusted minimum contributes exactly one group-level hard blocker, regardless of group size. These published components, thresholds, and tie break ensure identical input produces identical output.

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
