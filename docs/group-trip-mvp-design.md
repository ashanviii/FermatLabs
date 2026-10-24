# Collaborative group-trip MVP design

## Outcome

Fermat will take a group of 4–10 adult travellers with Indian passports from private constraint collection through a shared decision and a budgeted, day-by-day plan. The organizer creates a room, each traveller submits their own constraints, the group votes, Fermat atomically locks the eligible vote winner, and one deterministic engine produces an editable itinerary whose mandatory costs fit every traveller's private ceiling.

This is a planning and readiness product. It does not book travel, collect payments or identity documents, verify visas, or claim live prices or legal eligibility.

## User journey and lifecycle

1. An authenticated organizer enters a trip name, exact start and end dates, and an expected group size of 4–10.
2. Fermat creates a scoped invite. Guests authenticate anonymously, choose a unique nickname, and the organizer admits them while the room is collecting responses.
3. Each approved traveller privately enters a departure city, INR ceiling, passport-expiry month or explicit unknown, held-visa choices, date confirmation, and controlled preferences.
4. The shared comparison shows roster progress and coarse aggregate blockers without revealing raw private constraints.
5. Opening voting freezes the roster and captures the current input revision. Every approved traveller privately casts one destination vote.
6. When every ballot exists, the organizer requests a lock. A transaction rechecks membership, revisions, ballots, hard blockers, and affordability, selects the published winner, and creates the initial plan in the same commit.
7. The group reviews the exact-date itinerary and itemized budget. Organizer edits create a new plan revision and clear prior approvals. Every member approves or rejects the current revision.
8. The organizer may reopen the destination decision. The prior plan remains a superseded snapshot and a new collection round starts.

The authoritative shared lifecycle is `collecting -> voting -> locked`, plus `cancelled`. Plan status is `withinBudget` or `needsReview`; it is never silently kept green after an edit.

## Identity, invitation, and authorization

- The organizer must use the existing recoverable Google or email authentication before creating an invite.
- Participants may use Firebase anonymous authentication. The UI warns that access stays with that browser unless the account is linked. Signing into a different account does not transfer membership.
- Invitations use a cryptographically random 32-byte secret in the URL fragment. Only its digest is retained server-side. The fragment is exchanged after authentication and scrubbed before analytics or logging.
- An invite supports expiry, rotation, revocation, room-capacity checks, and idempotent rejoin for the same UID. Possessing it permits a request to join an open room; it never grants organizer authority.
- All shared mutations go through authenticated Next.js route handlers backed by `firebase-admin`. The server verifies the Firebase bearer token, derives the UID, validates the command, and performs a Firestore transaction.
- Clients cannot write authoritative trip, constraint, invite, ballot, aggregate, or plan documents directly. Rules are deny-by-default and reads follow the access matrix below.
- Commands never trust a client-supplied UID, owner role, eligibility result, vote total, budget total, or plan status.

## Privacy and storage

| Path | Contents | Read access | Write access |
| --- | --- | --- | --- |
| `trips/{tripId}` | owner UID, dates, public roster, phase, revisions, aggregates, ballot totals, lock | approved members | trusted command layer |
| `trips/{tripId}/constraints/{uid}` | raw budget, passport month, visas, departure, private feedback | that member | trusted command layer |
| `trips/{tripId}/plans/{version}` | pinned engine/template versions, itinerary, allocations, status, approvals | approved members | trusted command layer |
| `tripInvites/{tokenHash}` | trip link, expiry, active/revoked state | trusted command layer | trusted command layer |

The organizer cannot read another member's raw budget, passport month, held visas, or private rejection reason. Shared views may show nicknames, completion, ballot totals after voting closes, allocations, and coarse counts such as “2 members over budget.” Small-group aggregates can still permit inference; the product must not promise anonymity.

No passport numbers, legal names, dates of birth, document images, or payment details are collected. Private constraint documents do not use persistent web caching in this MVP.

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

Voting is private until the round closes. Every approved roster member casts exactly one vote. Hard constraints remain independent from preference voting and cannot be waived by votes.

Only destinations with zero hard blockers are eligible. The eligible candidate with the most votes wins. A tie is resolved by higher deterministic fit and then the fixed seed order `Bangkok`, `Dubai`, `Paris`. The rule is shown before voting, and the organizer cannot override it in this MVP.

Hard blockers are:

- unconfirmed shared dates;
- a missing or unsupported departure assumption;
- missing required private input;
- known passport insufficiency;
- a mandatory baseline plus contingency above any member's private ceiling.

A passport expiry recorded only as a month passes only when that entire month is beyond the destination cutoff. The cutoff month itself is unknown because the day is unavailable. Missing or reported visas remain visible official-verification actions; they are not proof of eligibility and do not become hard blockers merely because an application may be possible.

## Deterministic budget engine

One versioned, seeded engine both previews destination feasibility and generates the locked plan. It never lowers assumptions to force a fit.

For every traveller, individual mandatory costs include a departure-specific seeded return journey, food, insurance, and an explicitly estimated entry/visa allowance. Shared lodging costs are:

`ceil(travellerCount / roomCapacity) * nights * roomRate`

Shared transport uses the same capacity rule for vehicles. `nights` is `tripDays - 1`. Shared integer-INR costs are divided equally, with remainder rupees allocated in stable join order. Larger personal budgets do not subsidize smaller ones.

A visible 10% contingency is calculated for every member. The mandatory baseline plus contingency must fit each private ceiling. Equality passes; one rupee below fails. Optional activities are added in deterministic preference and seed order only while every traveller continues to fit.

The shared view shows group and per-person allocations but not ceilings or private shortfalls. Each affected traveller sees their own shortfall. Member totals, category totals, itinerary items, contingency, and group total must reconcile exactly.

## Itinerary contract

The plan covers every requested date in destination local time. Arrival and departure days remain light until flights are known. Activities are grouped geographically, have bounded daily load, contain meal breaks and transfer buffers, and never repeat a paid template visit. Spare capacity is labelled free or flexible time.

Every editable item stores day/date, local time or a flexible window, duration, location, attendees, cost basis, estimated cost, and a verification or booking action. The organizer may edit itinerary items; members cannot edit another person's budget. Server-side recalculation detects schedule conflicts and changes the plan status. Any edit creates a new revision and clears approvals.

## Seeded scope

The current three illustrative destinations remain Bangkok, Dubai, and Paris. Exact seeded flight routes, accommodation/transport capacities, cost tiers, activities, and template versions will be committed with the engine and exercised through deterministic tests. All values remain clearly labelled estimates with official entry-rule links and a review date.

## Non-goals

- live airfare, hotel, weather, visa, or availability feeds;
- bookings, payments, deposits, refunds, or reservation holds;
- passport or visa verification and document uploads;
- mixed-nationality, child, room-preference, loyalty-point, subsidy, or multi-currency optimization;
- flexible-date optimization, maps/routing, or an LLM-generated itinerary;
- participant itinerary editing or organizer access to private constraints.

## Stateful transitions and evidence

The collaborative room, invitations, ballots, plans, retries, and approvals outlive one request, so this is a stateful change. The evidence names below are executable tests to be filled during implementation.

| State | Event | Outcome | Kind | Evidence |
| --- | --- | --- | --- | --- |
| no trip | create, first accepted request | one collecting trip, owner membership, and active invite are written; secret returned once | introduced | `create_trip_is_idempotent_after_lost_response` |
| trip already created for idempotency key | create replay | existing trip returned; no second trip or invite | introduced | `create_trip_is_idempotent_after_lost_response` |
| collecting, capacity available | join request with active invite | one pending membership request; private constraints remain absent | introduced | `join_is_capacity_bounded_and_idempotent` |
| collecting, same UID already pending/member | join replay | existing membership returned; no duplicate roster entry | introduced | `join_is_capacity_bounded_and_idempotent` |
| collecting, final slot contested | concurrent joins | at most expected-size approved/pending identities; loser receives full-room error | introduced | `concurrent_join_never_exceeds_capacity` |
| collecting | owner admits pending member | member becomes approved; other state unchanged | introduced | `only_owner_can_admit_members` |
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
2. Eleven concurrent join attempts never exceed capacity, and retrying with the same UID never creates a second membership.
3. An authenticated outsider or ordinary member cannot read another member's constraints, spoof a UID/role, write authoritative documents, alter derived totals, or execute owner-only commands.
4. Expired or revoked invites fail, rotation preserves existing membership, and invite secrets/private answers never appear in shared responses or logs.
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

- Deterministic domain tests cover N=4..10, budget boundaries, reconciliation, tie breaks, passport boundaries, schedule validity, revisions, and idempotency.
- Firestore emulator/rules tests prove the complete read matrix and direct-write denial.
- API integration tests cover authentication, roles, invite lifecycle, validation, transaction races, stale conflicts, and failure responses.
- The production build passes.
- A recorded two-device browser dry run covers the four-member journey, ten-member boundary, mobile layout, desktop keyboard flow, offline status, and outsider denial.
- The branch, issues, design records, and PR description agree on scope and limitations.

Code and emulator-verified PR delivery are in scope. Live staging remains deferred until a named Firebase project has required auth providers enabled, server credentials configured, scoped rules deployed, and the two-device outsider-denial journey passes. Production deployment, merge, and release require separate authorization.
