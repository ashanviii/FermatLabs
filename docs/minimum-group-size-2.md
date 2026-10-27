# Minimum group size: two travellers

## Decision

Lower Fermat's supported group-size boundary from 4–10 travellers to 2–10 travellers everywhere the product exposes or enforces that boundary:

- shared-trip domain validation and allocation coverage;
- the shared trip creation form and its default;
- the offline demo's initial travellers and removal floor;
- landing-page and contributor documentation.

The maximum remains 10.

## Why this is safe

Trip membership, voting, plan generation, cost allocation, and room counts already derive their behavior from the actual member count. Integer cost allocation works for any non-empty member list, and room counts use ceiling division, so two travellers do not require a new algorithm or data shape. Shared costs may produce higher per-person estimates for a smaller group; existing budget-eligibility checks continue to reject plans that exceed either traveller's ceiling.

This is not a stateful schema change. `expectedSize` is stored as ordinary trip data, and no persisted field, transition, retry, or recovery contract changes. Existing trips remain valid and unchanged.

## Acceptance criteria

1. A trip with two expected travellers can be created, collect both submissions, vote, and lock a valid plan.
2. A trip with one expected traveller is rejected with a 2–10 boundary message.
3. Allocation and plan validation remain covered for every group size from 2 through 10.
4. The shared form offers 2 and 3 and defaults to 2; the offline demo starts with two travellers and cannot remove below two.
5. Product and contributor copy no longer claim that four is the minimum group size.

## Verification

- Run the focused collaborative-trip tests, including the two-person end-to-end domain case and one-person rejection.
- Run the complete group-trip test suite.
- Run TypeScript checking and the production build.
- Record a browser dry run that verifies the shared `/plan` create form defaults to 2, offers every size from 2 through 10, and can create a two-person trip; then verify the offline demo starts with two traveller rows and keeps both remove actions disabled at that floor.
- Inspect the final diff for stale 4–10 minimums in the landing page, README, handover, and canonical design/plan docs, plus unrelated changes.

## Residual exposure

A live cross-account Firebase test still requires two distinct signed-in identities. This code change can prove the shared workflow in domain tests and the build, but deployment configuration and identity-provider behavior remain environmental concerns.
