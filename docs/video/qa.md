# Fermat product demo - wave 2 QA

## Candidate reviewed

- Render: `video/out/fermat-product-demo-wave2-final.mp4`
- Delivery copy: `docs/assets/fermat-product-demo-wave2.mp4`
- Picture: H.264, 1920x1080, 30 fps, 1490 frames
- Audio: AAC stereo, 48 kHz
- Runtime: 49.667 seconds of picture; 49.685 seconds at the container level
- Color: BT.709 primaries and space with IEC 61966-2-1 transfer metadata
- Size: 3,927,301 bytes
- Human playback: nobody has yet reported watching this complete wave 2 master at normal speed with audio

## Automated checks

- TypeScript typecheck passed.
- Timing dump passed: nine scenes, 1490 frames, all eight boundaries on tracked backbeats.
- Copy check passed: 147 detected screen words, 2.96 words per second, zero copy warnings and zero banned punctuation matches.
- Jerk report found five abrupt frames. All five are planned scene cuts at frames 494, 671, 1018, 1195 and 1372.
- No unplanned abrupt frame was found.
- Three planned boundaries read as soft: room, private details and vote results.
- Maximum abrupt changes inside any three-second window: one.

## Visual checks

- Reviewed a 19-frame composition sheet spanning every scene and both ends of the master.
- Reviewed the 100-frame encoded-video contact sheet.
- Reviewed five-frame strips around all eight scene boundaries.
- Reviewed both click frames at full resolution. The cursor tip lands inside the target and away from its label in both the invite and vote scenes.
- Every cut lands on a composed frame with a headline and a meaningful product surface.
- No sampled frame shows clipped display copy, card overflow, an empty cut frame or a missing logo/font.
- The voting options finish entering before the vote click.
- The result scene does not reveal voter names or raw private constraints.

## Taste review from available evidence

- **Specificity:** the film now shows Fermat's actual room, private inputs, anonymous blockers, private vote progress, post-lock explanation, itinerary and coordination surfaces.
- **Clarity:** each scene adds one consequence. The central proof is the visible Tokyo-to-Bali result: raw popularity does not override group feasibility.
- **Continuity:** Delhi, four travellers, 10-15 December, Bali and the plan costs remain consistent through the product sequence.
- **Contrast:** the white input and voting chapters sit between deep-green feasibility, planning and coordination chapters; the close removes the UI entirely.
- **Finish:** the accepted palette, typography and card language remain intact, and the original v1 remains available for comparison.

## Missing evidence

- A person still needs to watch the full render once at normal speed with audio and confirm the perceived cadence, music level and click timing. Measurements and stills do not establish those qualities.
- A 4K archival export should be made only after the owner accepts this HD render.
