# Fermat product demo - final QA

## Candidate reviewed

- Render: `video/out/fermat-product-demo-v1-final.mp4`
- Runtime: 31.979 seconds
- Picture: H.264, 1920x1080, 30 fps, BT.709 primaries with IEC 61966-2-1 transfer tag
- Audio: AAC soundtrack
- Review evidence: full contact sheet at 0.5-second intervals, five-frame strips around every scene cut, six-scene cut-frame sheet, and representative full-resolution scene stills
- Human playback: the 10.8-second checkpoint was approved; nobody has yet reported watching the complete 31.979-second master at normal speed with audio

## Automated and visual checks

- TypeScript typecheck passed.
- Timing dump passed: six scenes, 959 frames, all five scene boundaries on tracked backbeats.
- Copy check passed: 76 detected screen words, 2.38 words per second, no flagged writing tells.
- Jerk check found four abrupt frames, all planned scene cuts. No unplanned abrupt frames were found.
- The hook-to-private-details transition reads as a soft cut; the remaining four cuts read as intentional chapter changes.
- Every scene cut lands on a composed frame with a headline and at least one meaningful product object.
- No text clipping, card overflow or logo scaling issue was visible in sampled stills.

## Taste review

- **Specificity:** the film shows Fermat's private constraint collection, group eligibility, anonymous vote counts and locked Bali itinerary. It cannot be relabeled as a generic travel search product without changing the argument.
- **Clarity:** each shot adds one consequence: inputs become matches, matches become a private ballot, the winner becomes a usable plan.
- **Continuity:** repeated trip names, dates and costs preserve the Bali example across eligibility, voting and planning.
- **Contrast:** the dense chat problem opens on cream; the green eligibility and planning chapters carry the product proof; the close removes all UI and resolves on one CTA.
- **Finish:** the approved brand palette and Manrope typography remain consistent. UI settles between entrances instead of drifting.

## Remaining evidence

- A human should watch the full master once at normal speed with sound and confirm that the music level and scene cadence feel right. Measurements and stills cannot establish listening quality or perceived smoothness.
