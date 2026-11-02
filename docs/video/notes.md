# Fermat product demo - decision log

## Wave 1 - accepted baseline

Status: accepted visual direction and checkpoint; complete master still needs one owner playback at normal speed with audio.

Locked decisions:

- Warm cream canvas, deep Fermat green and white product surfaces.
- Manrope for display and UI; JetBrains Mono for small overlines.
- 16:9 at 1920x1080 and 30 fps.
- Music-led edit using "Talent in the Air" and the tracked beat grid.
- No voiceover and no required sound effects.
- Large faithful UI reconstructions instead of a small desktop screencast.
- Editorial hard cuts, shared-card pushes and settled reading holds.
- India-to-Bali sample story and the closing line `Plan the trip everyone can actually take`.
- `docs/assets/fermat-product-demo.mp4` remains the comparison baseline and must not be overwritten.

Accuracy correction for wave 2:

- Wave 1 implies per-option aggregate counts update during open voting. The current product keeps all vote totals hidden until the organizer locks the trip. Wave 2 will show only `4 of 4 voted` during voting, then reveal anonymous totals in the post-lock explanation.
- Wave 1 says only feasible trips make the ballot. The current product can show and accept votes for in-scope options, then prevents an infeasible option from winning. Wave 2 will show the anonymous blocker board and explain the lock result directly.

## Wave 2 - proposed deeper cut

Status: storyboard approved by the owner and implemented; wave 2 render awaits owner playback and acceptance.

Proposal:

- Extend runtime from 31.979 to 49.667 seconds.
- Preserve v1's opening, private-details scene, plan expansion and close where possible.
- Add a shared-room and invite scene.
- Replace the old eligibility claim with anonymous blocker reasons.
- Keep votes hidden until lock.
- Add a post-lock result scene showing why the highest raw vote count may not win.
- Add a coordination scene for money, commitments, tasks and sharing.
- Export as a new wave 2 candidate; do not overwrite v1.

Implementation record:

- Candidate: `video/out/fermat-product-demo-wave2-final.mp4`.
- Delivery copy: `docs/assets/fermat-product-demo-wave2.mp4`.
- Runtime: 49.667 seconds of picture, 49.685 seconds at the container level.
- Nine scene boundaries use tracked backbeats. Five read as hard cuts and three read as soft cuts in the frame-change report.
- The proposed private-details rewrite was not used. The accepted v1 reconstruction and its on-screen wording remain intact, including `You can change this later` and the existing sample dates.
- The room scene uses `One link for the dates, the group and every decision after.` as its explanatory line.
- The voting scene publishes only `3 of 4 voted` and `4 of 4 voted` before the lock. No per-option count appears until the result scene.
- The coordination scene uses the current product's `Get going` language and the Money, Commitments, Tasks and Sharing rows.

Source of product truth:

- Current Fermat repository source and preview surfaces reviewed on 2 Nov 2026.
- Lock behavior comes from `src/lib/collaborativeTrip.js`.
- Privacy behavior comes from the shared projection and its tests.
- Product wording comes from `CollaborativeTripPlanner.tsx`, `LandingPage.tsx`, `HeroPreview.tsx`, `VoteResults.tsx` and `VoteResultsPreview.tsx`.

Sample data that differs from the current landing page:

- The film keeps Bali, Delhi and INR from the accepted v1 instead of the landing page's New York, Lisbon and USD vote-result example.
- The vote explanation uses Tokyo 3 votes and Bali 1 vote for the four-person film story. The landing preview uses Tokyo 3, Lisbon 2 and Cancun 1 for a six-person example.
- Coordination counts such as `2 of 4 paid` and `2 of 4 done` are illustrative staged data.
