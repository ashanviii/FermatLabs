# Fermat product demo - brief

## Inputs

- **Format:** 16:9 (1920x1080), about 32 seconds
- **Logo:** `video/public/fermat-mark.png`, 383x455 RGBA raster; keep below native dimensions
- **Colors:** primary `#2E7650`, deep green `#153524`, canvas `#FAFAF8`, surface `#FFFFFF`, ink `#131316`, marigold `#F4B740`
- **Fonts:** display and UI `Manrope 400-800`; overlines `JetBrains Mono 500-600`
- **Soundtrack:** `video/public/soundtrack.mp3`, "Talent in the Air" by Diego Nava, 122.52 BPM, 114.1 seconds, grid reliability good
- **Beat sync:** yes, scene cuts land on detected backbeats. The detector heard a variable grid, so events use tracked frames rather than an even BPM calculation.
- **References:** `references/linear-for-agents.md`

## Look

Warm, precise and optimistic. Fermat's cream canvas and deep green carry the film, with the real product rebuilt large enough to read in a feed. Display copy rises by word, while UI moves as a single physical surface and then settles completely for reading. The opening is intentionally dense, the product scenes become progressively calmer, and the close releases into a clean brand field.

- **Transitions in use:** hard editorial cut, shared rounded-card push, restrained pull-back into product UI
- **Signature moves:** private constraints compress into one anonymous eligibility bar; the winning destination card expands into a day-by-day plan
- **Pacing:** dense, medium, medium, medium, deliberate, resolved; average scene about 5.3 seconds
- **Visual argument:** four private constraints collapse into a shared set of viable trips, making Fermat's fairness and coordination value visible without exposing anyone's numbers.

## Script and scenes

| # | Ends on | On screen (exact words) | What moves | Transition out |
|---|---|---|---|---|
| 1 | backbeat 5 (4.9s) | "Trips die in the group chat"; "15-19 Dec works"; "₹45k max"; "Visa?"; "Flying from Delhi" | The headline is present on the cut. Conflicting message chips arrive around it, then gather toward one private-details card. | shared rounded-card push |
| 2 | backbeat 11 (10.8s) | "Everyone adds what works for them"; "Budget. Dates. Passport. All private." | A faithful private-details form pulls back into view. Location, budget and passport fields settle one at a time. | hard cut |
| 3 | backbeat 17 (16.5s) | "Only trips that work for everyone make the ballot" | Destination cards resolve from uncertain to eligible; only truthful all-traveller matches remain. | hard cut |
| 4 | backbeat 23 (22.4s) | "Vote in private"; "The group sees counts. Never names." | Ballot choices enter, a vote confirms, and only aggregate counts update. | match on winning card |
| 5 | backbeat 29 (28.1s) | "The winning trip becomes a real plan"; "Bali"; "₹82,873 each" | The Bali winner expands into the real day-by-day plan and group cost summary. | deep-green field wipe |
| 6 | backbeat 33 (32.0s) | "Plan the trip everyone can actually take"; "fermatlabs.org"; "Start a group trip" | Logo and line land, hold, then music and picture resolve together. | fade out |

## Product UI shown

- **Private details:** faithful reconstruction of the current Fermat form with Delhi, ₹150,000 and passport expiry; sample data from the public preview.
- **Eligible trips:** rebuilt destination cards using current product vocabulary; capability claim is limited to group eligibility.
- **Private vote:** rebuilt ballot showing aggregate counts only, matching the current privacy model.
- **Locked plan:** faithful reconstruction of the Bali preview, 10-15 Dec, four travellers, ₹82,873 each and ₹3.5L group total.

## Assumptions

### Story and output

- Chose 32 seconds because the strongest product story fits six musical phrases without rushing the real UI.
- Chose text and music with no voiceover because none was supplied and the film must work muted in a feed.
- Chose the CTA "Plan your next trip together" as the intent, expressed on screen as "Plan the trip everyone can actually take" to match Fermat's existing positioning.
- Chose one 16:9 master, one thumbnail and an editable Remotion project. Vertical adaptation is out of scope until the master is approved.

### Brand and product

- Rebuilt product UI in code rather than screen-recording so labels remain sharp and private fields can be staged truthfully.
- Used the live public preview and repository source captured on 1 Nov 2026 as the product reference.
- Used only sample data already visible in Fermat's preview fixtures or public preview.
- Kept the supplied raster logo below its native size. A vector or higher-resolution mark should replace it before a 4K export.

### Music and motion

- Picked "Talent in the Air" by Diego Nava from Mixkit because no track was supplied. It is covered by the Mixkit Stock Music Free License.
- Chose the opening 32 seconds because its energy falls under the private-input explanation and lifts again into the result and close.
- Used a clean, editorial product cadence inspired by Linear's official "Linear for Agents" reel; no audio from that reference was reviewed or copied.
- Sounds: none in checkpoint v1. The music-only master makes the interaction understandable without requiring audio.

## Open questions

The checkpoint asks only whether the look, words and movement with music feel right. All assumptions above are vetoable there.
