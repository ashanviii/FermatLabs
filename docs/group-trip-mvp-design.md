# Collaborative group-trip MVP design

## Outcome

Fermat will take a group of 2–10 adult travellers with Indian passports from private constraint collection through a shared decision and a budgeted, day-by-day plan. The organizer creates a room, each traveller submits their own constraints, the group votes, Fermat atomically locks the eligible vote winner, and one deterministic engine produces an editable itinerary whose mandatory costs fit every traveller's private ceiling.

This is a planning and readiness product. It does not book travel, collect payments or identity documents, verify visas, or claim live prices or legal eligibility.

## User journey and lifecycle

1. An authenticated organizer enters a trip name, exact start and end dates, and an expected group size of 2–10.
2. Fermat creates a scoped invite. Guests authenticate anonymously, choose a unique nickname, and the organizer admits them while the room is collecting responses.
3. Each approved traveller privately enters a departure city, INR ceiling, passport-expiry month or explicit unknown, held-visa choices, date confirmation, controlled preferences, and an unselected self-attestation that they will be at least 18 on the start date and travel on an Indian passport. Missing or false attestation leaves the submission incomplete; no birth date, numeric age, nationality field, or document proof is collected.
4. The shared comparison shows roster progress and coarse aggregate blockers without revealing raw private constraints.
5. Opening voting freezes the roster and captures the current input revision. Every approved traveller privately casts one destination vote.
6. When every ballot exists, the organizer requests a lock. A transaction rechecks membership, revisions, ballots, hard blockers, and affordability, selects the published winner, and creates the initial plan in the same commit.
7. The group reviews the exact-date itinerary and itemized budget. Organizer edits create a new plan revision and clear prior approvals. Every member approves or rejects the current revision.
8. The organizer may reopen the destination decision. The prior plan remains a superseded snapshot and a new collection round starts.

The authoritative shared lifecycle is `collecting -> voting -> locked`, plus `cancelled`. Plan status is `withinBudget` or `needsReview`; it is never silently kept green after an edit.

## Identity, invitation, and authorization

- The organizer must use the existing recoverable Google or email authentication before creating an invite.
- Participants may use Firebase anonymous authentication. The UI warns that access stays with that browser unless the account is linked. Signing into a different account does not transfer membership.
- Invitations use a cryptographically random 32-byte secret in the URL fragment. Only its digest is retained server-side. The earliest invite-entry bootstrap captures the fragment in memory and removes it with `history.replaceState` before Analytics, error reporting, replay, or other telemetry initializes. The secret is exchanged only in an authenticated non-URL request body and is never persisted in browser storage.
- An invite supports expiry, rotation, revocation, admission-capacity checks, and idempotent rejoin for the same UID. Possessing it permits a request to join an open room; it never grants organizer authority.
- Pending requests are stored separately from the approved roster, are visible only to the applicant and organizer, expire after 24 hours by server time, and do not consume approved group capacity or reserve a nickname. Same-UID retries are idempotent and do not extend expiry. The organizer can reject a request; nickname uniqueness and remaining capacity are checked atomically at admission. A bounded pending queue and backend limits per invite, UID, and short-lived trusted-proxy IP bucket reduce abuse without claiming Sybil resistance.
- All shared mutations go through authenticated Next.js route handlers backed by `firebase-admin`. The server verifies the Firebase bearer token, derives the UID, validates the command, and performs a Firestore transaction.
- Clients cannot write authoritative trip, constraint, invite, ballot, aggregate, or plan documents directly. Rules are deny-by-default and reads follow the access matrix below.
- Commands never trust a client-supplied UID, owner role, eligibility result, vote total, budget total, or plan status.

## Privacy and storage

| Path | Contents | Read access | Write access |
| --- | --- | --- | --- |
| `trips/{tripId}` | owner UID, dates, public roster, phase, revisions, aggregates, ballot totals, lock | approved members | trusted command layer |
| `trips/{tripId}/constraints/{uid}` | raw budget, passport month, visas, departure, private feedback | that member | trusted command layer |
| `trips/{tripId}/rounds/{round}/ballots/{uid}` | destination choice, round, input revision | that approved ballot owner only; no client listing | trusted command layer |
| `trips/{tripId}/plans/{version}` | pinned engine/template versions, itinerary, allocations, status, approvals | approved members | trusted command layer |
| `tripJoinRequests/{tripId}_{uid}` | pending nickname and server expiry | that applicant and organizer | trusted command layer |
| `tripInvites/{tokenHash}` | trip link, expiry, active/revoked state | trusted command layer | trusted command layer |

The organizer cannot read another member's raw budget, passport month, held visas, ballot, or private rejection reason. Shared views may show nicknames, completion, ballot totals only after a successful lock, allocations, and coarse counts such as “2 members over budget.” Member-private means raw constraints, individual shortfalls, ballots, and private reasons are not directly accessible; it does not mean anonymous. Shared allocations, aggregate affordability, selected activities, and repeated organizer edits can allow participants to infer or bound another member's ceiling. The UI discloses this before collecting ceilings. Shared responses, exports, failure paths, and stored shared documents never include affected member IDs, exact ceilings/shortfalls, suggested ceiling changes, or detailed affordability errors.

No passport numbers, legal names, dates of birth, document images, or payment details are collected. Private constraint documents do not use persistent web caching in this MVP.

Application-controlled logging and telemetry use structured allowlisted fields: event code, opaque request ID, outcome code, and non-sensitive operational metadata. Sensitive routes do not capture raw URLs/fragments, request/response bodies, authorization headers, provider errors, token digests, private constraints, ballots, or feedback. Validation errors contain controlled codes rather than interpolated values. Leakage tests inject sentinels through success, authentication/validation failure, and unexpected-error paths and assert absence from every captured application log, browser console/analytics event, shared payload, trace, and configured monitoring sink. The intended one-time owner-only create/rotate response and authenticated invite exchange are the only payloads allowed to contain the raw invite secret; unmanaged browser extensions and user-copied links are outside this application guarantee.

The existing local version-1 organizer draft remains local. The organizer may deliberately import trip basics into a new shared trip, but Fermat never uploads constraints previously entered for other people.

## Revisions, transactions, and offline behavior

- Roster, date, candidate, or constraint changes during collection increment `inputRevision` and invalidate ballots.
- Ballots include the expected `round` and `inputRevision`. It is impossible to vote for an absent candidate or a stale round.
- Lock rechecks a complete frozen roster, all ballots, the current input revision, and feasibility inside one transaction. There is no durable “locked without a plan” state.
- Plan edits include an expected `planRevision`; stale edits return a visible conflict while retaining the unsaved form.
- Create and lock commands accept idempotency keys. Retrying after a committed-but-lost response cannot create duplicate trips or plans.
- Transaction callbacks have no external side effects because Firestore may retry them.
- Shared commands are online-only. Cached or in-memory views carry a visible stale/offline state, and no join, answer, ballot, lock, edit, or approval is labelled saved before server acknowledgment.
- Missing Firebase client configuration, server credentials, deployed rules, or required authentication disables sharing with a clear error. The product never simulates success or silently falls back to local-only persistence.

## Voting and destination lock

Voting is private until the round closes. Every approved roster member casts exactly one vote. Shared state exposes only submission progress before lock. A successful atomic lock publishes destination totals and the winner alongside the initial plan; failed locks, invalidated rounds, and cancellation never publish totals. Reopen clears active-round totals while a superseded plan may retain its historical published totals. Hard constraints remain independent from preference voting and cannot be waived by votes.

Only destinations with zero hard blockers are eligible. The eligible candidate with the most votes wins. For tied ballot counts, `fit(d)` is the sum, across the frozen roster, of the number of unique controlled preference tags shared by that member and destination. Each match is one integer point; empty preferences contribute zero. Budget headroom, passport/visa data, time, randomness, and client-provided scores never contribute. A remaining tie resolves by fixed seed order `Bangkok`, `Dubai`, `Paris`. The pinned seed version defines the vocabulary and destination tags; comparison and lock use the same frozen input revision. This rule is shown before voting, and the organizer cannot override it.

Hard blockers are:

- unconfirmed shared dates;
- a missing or unsupported departure assumption;
- missing required private input or adult/Indian-passport self-attestation;
- known passport insufficiency;
- a mandatory baseline plus contingency above any member's private ceiling.

A passport expiry recorded only as a month passes only when that entire month is beyond the destination cutoff. The cutoff month itself is unknown because the day is unavailable. Missing or reported visas remain visible official-verification actions; they are not proof of eligibility and do not become hard blockers merely because an application may be possible.

## Deterministic budget engine

One versioned, seeded engine both previews destination feasibility and generates the locked plan. It never lowers assumptions to force a fit.

For every traveller, individual mandatory costs include a departure-specific seeded return journey, food, insurance, and an explicitly estimated entry/visa allowance. Shared lodging costs are:

`ceil(travellerCount / roomCapacity) * nights * roomRate`

Shared transport uses the same capacity rule for vehicles. `nights` is `tripDays - 1`. Shared integer-INR costs are divided equally, with remainder rupees allocated in stable join order. Larger personal budgets do not subsidize smaller ones.

After all individual and shared line items are allocated as integer INR, member `i` has subtotal `S_i`. Their contingency is `C_i = ceil(S_i / 10)` rupees and total is `T_i = S_i + C_i`; contingency is calculated separately per member, never as a rounded group amount that is redistributed. The mandatory baseline uses mandatory allocations only. Every tentative optional activity and accepted edit recomputes `S_i`, `C_i`, and `T_i`, and is included only while every `T_i` fits the private ceiling. Equality passes; one rupee below fails. Group contingency is exactly `sum(C_i)` and reconciles as its own category.

The shared view shows group and per-person allocations but not ceilings or private shortfalls. Each affected traveller sees their own shortfall. Member totals, category totals, itinerary items, contingency, and group total must reconcile exactly.

## Itinerary contract

The plan covers every requested date in destination local time. Arrival and departure days remain light until flights are known. Activities are grouped geographically, have bounded daily load, contain meal breaks and transfer buffers, and never repeat a paid template visit. Spare capacity is labelled free or flexible time.

Every editable item stores day/date, local time or a flexible window, duration, location, attendees, cost basis, estimated cost, and a verification or booking action. The organizer may edit itinerary items; members cannot edit another person's budget. Server-side recalculation detects schedule conflicts and changes the plan status. Any edit creates a new revision and clears approvals.

## Seeded scope

The current three illustrative destinations remain Bangkok, Dubai, and Paris. The committed canonical manifest `src/lib/groupTripSeeds.v1.json` is the sole source of supported departure IDs, destination identity/order/time zones, preference tags, route upper bounds, room/vehicle capacities and upper rates, individual mandatory costs, activity cost/tags/duration/location/order, and verification provenance. Missing routes are unsupported; there is no averaged-fare fallback. Schema validation must pass before calculations consume it. Preview, voting snapshot, and locked plan pin the same immutable seed version and content digest; a seed change creates a new version. All values remain clearly labelled illustrative upper-bound estimates with official entry-rule links and a review date.

## Non-goals

- live airfare, hotel, weather, visa, or availability feeds;
- bookings, payments, deposits, refunds, or reservation holds;
- passport or visa verification and document uploads;
- mixed-nationality, child, room-preference, loyalty-point, subsidy, or multi-currency optimization;
- flexible-date optimization, maps/routing, or an LLM-generated itinerary;
- participant itinerary editing or organizer access to private constraints.

## Stateful transitions and evidence

The collaborative room, invitations, ballots, plans, retries, and approvals outlive one request, so this is a stateful change. The final column contains planned regression-test identifiers, not claims of existing or passing evidence. At delivery each row must map to an actual test file/selector, reproducible command, result, and tested commit; until then its evidence status is `planned`.

| State | Event | Outcome | Kind | Evidence |
| --- | --- | --- | --- | --- |
| no trip | create, first accepted request | one collecting trip, owner membership, and active invite are written; secret returned once | introduced | `create_trip_is_idempotent_after_lost_response` |
| trip already created for idempotency key | create replay | existing trip returned; no second trip or invite | introduced | `create_trip_is_idempotent_after_lost_response` |
| collecting, capacity available | join request with active invite | one pending membership request; private constraints remain absent | introduced | `join_is_capacity_bounded_and_idempotent` |
| collecting, same UID already pending/member | join replay | existing membership returned; no duplicate roster entry | introduced | `join_is_capacity_bounded_and_idempotent` |
| collecting, pending queue available | join request | pending request written with 24-hour server expiry; approved capacity and nicknames unchanged | introduced | `pending_request_does_not_consume_capacity` |
| collecting, final approved slot contested | concurrent admissions | at most expected-size approved identities; loser receives full-room error | introduced | `concurrent_admission_never_exceeds_capacity` |
| collecting | owner admits live pending member | capacity and nickname uniqueness rechecked atomically; member becomes approved | introduced | `only_owner_can_admit_members` |
| collecting, request expired/rejected | admit attempt | error; approved roster unchanged | introduced | `expired_or_rejected_request_cannot_be_admitted` |
| collecting | member submits complete constraints at current revision | private document replaces that member's answer, input revision increments, ballots remain empty | introduced | `constraint_edit_increments_revision_and_stays_private` |
| collecting | stale constraint edit | conflict returned; durable answers and revision unchanged | introduced | `stale_constraint_edit_preserves_state` |
| collecting, complete frozen-size roster | owner opens voting | phase becomes voting, roster snapshot and input revision freeze | introduced | `open_voting_requires_complete_roster` |
| collecting, incomplete roster/input | owner opens voting | validation error; phase remains collecting | introduced | `open_voting_requires_complete_roster` |
| voting | member casts/replaces ballot at current round/revision | one private ballot for that member; shared progress changes only | introduced | `ballots_are_private_and_one_per_member` |
| voting | stale/outsider ballot | conflict/authorization error; ballots unchanged | introduced | `stale_and_outsider_ballots_fail_closed` |
| voting, complete ballots and eligible winner | owner locks | phase, winner, aggregate totals, and initial plan commit atomically | introduced | `lock_is_atomic_and_uses_published_winner` |
| voting, incomplete/ineligible/stale | owner locks | error; phase remains voting and no plan exists | introduced | `lock_rejects_incomplete_or_ineligible_round` |
| locked for idempotency key | lock replay | existing lock and plan returned; no duplicate plan | introduced | `lock_replay_returns_one_plan` |
| collecting/voting | constraint, roster, date, or candidate change | phase returns/remains collecting, revision increments, ballots invalidate | introduced | `input_change_invalidates_ballots` |
| locked, current plan revision | owner edits item | validated new plan revision written, totals/status recalculate, approvals clear | introduced | `plan_edit_recalculates_and_clears_approvals` |
| locked, stale plan revision | owner edits item | conflict returned; active plan and approvals unchanged | introduced | `stale_plan_edit_preserves_active_plan` |
| locked, current plan revision | member approves/rejects | that member's current-revision decision stored; private reason stays private | introduced | `approval_is_bound_to_current_revision` |
| locked | owner reopens | old plan becomes superseded; round/revision increment and phase becomes collecting | introduced | `reopen_preserves_superseded_plan` |
| any room | invite rotated/revoked/expired | new joins with old secret fail; existing members retain access | introduced | `invite_lifecycle_preserves_membership` |
| shared command pending locally | network loss before acknowledgment | UI keeps unsent form, displays offline/unsaved, and creates no success claim | introduced | `offline_command_never_claims_saved` |
| persisted room | browser reload/restart | authorized identity reads the same shared state; unauthorized identity is denied | introduced | `authorized_reload_and_outsider_denial` |
| legacy local v1 draft | explicit basics import | only trip name/date-derived basics copy into an unsaved create form; traveller constraints stay local | changed | `legacy_import_excludes_other_people_constraints` |
| legacy local v1 draft | no import | existing organizer workflow and local record remain unchanged | unchanged | existing `groupTrip.test.cjs` persistence suite |

Invariant: every shared write is server-authoritative and transactionally checks identity, role, lifecycle, capacity, and expected revision. A state in which a destination is locked without an initial plan is ruled out.

## Acceptance criteria

1. Four and ten independent browser identities can create, join, submit, vote, lock, reload, and see the same saved itinerary.
2. Eleven concurrent admissions never exceed approved capacity, pending requests neither consume capacity nor reserve nicknames, expired/rejected requests cannot be admitted, and retrying with the same UID never creates a second membership.
3. An authenticated outsider or ordinary member cannot read another member's constraints, spoof a UID/role, write authoritative documents, alter derived totals, or execute owner-only commands.
4. Expired or revoked invites fail, rotation preserves existing membership, the fragment is removed before telemetry initialization, and sentinel invite/private values are absent from every application-controlled log/telemetry sink and shared payload.
5. Missing submissions, ballots, stale revisions, hard blockers, and unaffordable mandatory baselines prevent lock. Tied eligible ballots always produce the published winner.
6. Racing an answer edit with lock either locks the accepted complete revision or invalidates that lock attempt; stale constraints never silently lock.
7. Retrying create or lock after a simulated committed-but-lost response produces exactly one trip and one locked plan.
8. For every group size from 4 through 10 and boundary budgets, rooms and seats cover the group, allocations are nonnegative integer INR, and member totals equal the group total exactly.
9. A ceiling equal to baseline plus contingency passes; one rupee less fails. A high group average never hides one member's shortfall.
10. The itinerary covers the exact dates with valid times, buffers, no overlapping required activities, no duplicate paid templates, and costs matching all totals.
11. Editing an item recalculates costs and conflicts, creates a revision, and clears approvals; concurrent stale edits conflict visibly.
12. Passport cutoff-month uncertainty, held-visa uncertainty, and official verification actions remain visible; no route claims verified entry eligibility.
13. Offline, denied-write, expired-session, full-room, and missing-configuration states preserve unsent form input and never claim a command succeeded.
14. The complete journey works at 390px and desktop widths with keyboard-labelled controls and statuses that do not rely on colour.

## Definition of done and release boundary

- Deterministic domain tests cover N=2..10, all ten contingency remainder classes, budget boundaries, reconciliation, preference-only tie breaks, passport boundaries, schedule validity, revisions, and idempotency.
- Firestore emulator/rules tests prove the complete read matrix and direct-write denial.
- API integration tests cover authentication, roles, invite lifecycle, validation, transaction races, stale conflicts, and failure responses.
- The production build passes.
- A recorded two-device browser dry run covers the four-member journey, ten-member boundary, mobile layout, desktop keyboard flow, offline status, and outsider denial.
- The branch, issues, design records, and PR description agree on scope and limitations.

Code and emulator-verified PR delivery are in scope. Live staging remains deferred until a named Firebase project has required auth providers enabled, server credentials configured, scoped rules deployed, and the two-device outsider-denial journey passes. Production deployment, merge, and release require separate authorization.
