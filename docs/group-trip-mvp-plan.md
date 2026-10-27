# Collaborative group-trip MVP implementation plan

Deliver the approved outcome as two implementation contracts in one coherent extension to PR #1. The first ticket establishes the trusted shared-state boundary; the second consumes that boundary to generate and approve a reconciled plan. Do not release an intermediate collaborative room that cannot produce a plan.

## Ticket 1 — Secure collaborative room and destination lock

1. Add shared domain schemas for trip, member, private constraints, invite, ballot, revisions, aggregate comparison, and destination lock. Preserve the existing local v1 draft and expose deliberate basics-only import.
2. Add Firebase Admin initialization that fails closed when server configuration is absent. Add bearer-token verification and a reusable server-derived command context.
3. Implement transactional create, join/admit, submit answers, open voting, vote, lock, reopen, and invite rotate/revoke commands with validation, role checks, revision preconditions, and idempotency where required.
4. Commit deny-by-default Firestore rules, emulator configuration, indexes if required, and access-matrix/integration tests. Clients receive only the allowed shared/member-private reads and cannot write authoritative documents directly.
5. Replace organizer-entered traveller constraints with a collaborative UI: authenticated organizer setup, fragment-based invitation, guest join/rejoin states, roster progress, each member's private form, aggregate comparison, private ballot, and atomic lock result.
6. Add explicit full-room, revoked/expired invite, unauthorized, stale, offline, expired-session, and missing-configuration states. Never report an unacknowledged command as saved.

Runnable gates: domain tests, command/API integration tests, Firestore emulator rules tests, production build, and a two-/ten-identity browser journey through atomic lock.

## Ticket 2 — N-person itinerary, budget, and approvals

1. Replace duration-scaled totals with versioned seeded route, lodging, transport, food, insurance, entry allowance, activity, and contingency templates for Bangkok, Dubai, and Paris.
2. Implement one deterministic engine for candidate feasibility and locked-plan generation. Model room/vehicle capacity, individual departure costs, stable integer allocation, private ceiling checks, mandatory baseline, 10% contingency, and optional-activity selection.
3. Generate a destination-local itinerary for every exact trip date with arrival/departure limits, meal breaks, transfer buffers, geographic grouping, flexible time, and reconcilable costs.
4. Extend atomic lock to persist the initial plan with pinned algorithm/template versions. Implement organizer-only plan edits, conflict/cost recalculation, optimistic plan revisions, superseded snapshots, and reopen behavior.
5. Add member approval/rejection for the current plan revision. Any edit clears approvals; private ceilings and reasons remain private while shared readiness is coarse.
6. Build itemized group/per-person budget, daily itinerary editor, private shortfall view, shared plan-status/approval dashboard, and print-friendly summary.

Runnable gates: deterministic N=2..10 and boundary-budget tests, exact reconciliation, schedule validation, stale-edit/API integration tests, production build, and responsive browser verification at 390px and desktop widths.

## Delivery and review

1. Read both GitHub issues and design records back before implementation and stop at the mandatory implementation checkpoint.
2. Implement ticket 1 and ticket 2 in separable commits on `codex/group-trip-mvp` while keeping PR #1 as the single coherent release vehicle.
3. Run the full executable definition of done and reconcile any review findings within the initiative review budget.
4. Update PR #1's title and body to describe collaboration, voting, destination lock, deterministic planning, exact test evidence, Firebase rollout dependencies, and both issue links.
5. Push the verified head and read back the remote branch and PR. Do not merge, deploy production, change Firebase Console state, or close issues without separate authorization.
