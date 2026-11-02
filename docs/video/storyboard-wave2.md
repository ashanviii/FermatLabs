# Fermat product demo - wave 2 storyboard

Status: approved and implemented. Minor implementation copy differences are recorded in `docs/video/notes.md`; the shipped scene copy is authoritative in `docs/video/brief.md`.

## Proposed output

- **Format:** 16:9, 1920x1080, 30 fps
- **Runtime:** 49.667 seconds, extended from the accepted 31.979-second v1
- **Pacing authority:** the existing "Talent in the Air" soundtrack and its tracked backbeats
- **Voice:** music and on-screen copy, no voiceover
- **Visual continuity:** preserve v1's cream canvas, deep green, Manrope and JetBrains Mono, large reconstructed product UI and editorial cuts
- **Story change:** add the shared room, anonymous blocker logic, post-lock vote explanation and the coordination tools that follow the plan

## Storyboard

All copy below is exact proposed on-screen copy. Sample names, dates and amounts are UI data, not product claims.

| # | Time | Exact on-screen text | Picture and change | Viewer takeaway | Source and claim boundary | Handoff |
|---|---|---|---|---|---|---|
| 1 | 0.000-4.900s | **Trips die in the group chat**<br>`15-19 Dec works`<br>`₹45k max`<br>`Visa?`<br>`Flying from Delhi` | Keep the accepted v1 opening. Conflicting message chips gather toward one Fermat room card. The headline is stable before the chips move. | Group-trip planning starts as scattered private constraints. | Accepted v1 scene. No capability claim yet. | The converged card becomes the trip-room surface. |
| 2 | 4.900-10.800s | **Start one trip room**<br>`Friends escape`<br>`15-19 Dec`<br>`4 travellers`<br>`Home or abroad`<br>`Invite friends`<br>`4 of 4 joined`<br>`Everyone is in` | A new trip is created, the invite action lands, then an avatar stack and progress bar fill to four. Motion stops for the joined state. | One organizer gives the group a shared place to plan. | Current create and invite flow in `CollaborativeTripPlanner`, `InvitePanel` and the collaborative trip engine. | The joined avatars compress into four private-input tiles. |
| 3 | 10.800-16.467s | **Everyone adds what works for them**<br>`Your trip details`<br>`Only you see this`<br>`Delhi`<br>`₹1,50,000`<br>`Indian passport`<br>`Dec 2027`<br>`Update your budget anytime` | Preserve the accepted private-details composition. Location, budget and passport settle in sequence; the budget value updates once without exposing another traveller's value. | Each traveller controls their own constraints and can revise their own budget. | Current private-input form, `updateBudget` command and privacy projection tests. The film shows only the viewer's data. | Four private tiles collapse into anonymous status pills. |
| 4 | 16.467-22.367s | **See what works and what doesn't**<br>`Bali`<br>`Everyone can go`<br>`Tokyo`<br>`1 budget short`<br>`Dubai`<br>`Visa timing`<br>`The group sees the blocker, never whose budget it is.` | Three destination rows resolve one at a time. Bali turns green; Tokyo gets an anonymous budget warning; Dubai gets a visa-timing warning. No avatar or name appears beside a blocker. | The group understands feasibility without exposing the person behind a constraint. | Current `destinationBoard`, `FermatExtras` and the product's own blocker copy. The reasons are anonymous counts, not identities or raw budgets. | The same destination rows become selectable ballot cards. |
| 5 | 22.367-28.133s | **Vote in private**<br>`Your vote is secret. A place someone can't afford or enter can't win.`<br>`Bali`<br>`Tokyo`<br>`Dubai`<br>`Voted`<br>`4 of 4 voted`<br>`No names. No numbers. Votes stay hidden until the trip is locked.` | The viewer selects Bali. The card confirms, then only the overall progress moves to 4 of 4. Per-option counts stay absent. | Voting is private while it is open; the group sees progress, not choices. | Current voting UI, `ballots` privacy projection and verbatim landing-page copy. | The organizer's lock action turns the ballot into the public result. |
| 6 | 28.133-33.933s | **The winner has to work for everyone**<br>`Why Bali won`<br>`Everyone sees this`<br>`Tokyo`<br>`3 votes`<br>`Most votes, but 1 budget short`<br>`Bali`<br>`1 vote`<br>`Won: top pick that fits everyone` | The post-lock tally appears. Tokyo's longer bar leads on votes but cannot win; Bali receives the winner treatment because it fits everyone. Hold after both reasons are visible. | Fermat chooses the most-voted feasible trip and explains why a more popular option missed out. | Current lock algorithm, `VoteResults`, `VoteResultsPreview` and landing-page explanation. Vote totals appear only after lock and never include voter names. | The winning Bali row expands into the plan card. |
| 7 | 33.933-39.833s | **The winning trip becomes a real plan**<br>`Bali`<br>`10-15 Dec`<br>`4 travellers`<br>`₹82,873 each`<br>`₹3.5L group total`<br>`Day 1`<br>`Arrival and Seminyak`<br>`Day 2`<br>`Ubud` | Preserve v1's winner-to-plan expansion. The day list and cost summary settle, then remain still for reading. | The decision turns into an itinerary with personal and group costs. | Accepted v1 plan reconstruction and preview fixture data. Values are illustrative sample data. | The plan card shifts left while its next-step controls open on the right. |
| 8 | 39.833-45.733s | **Keep the trip moving**<br>`Money`<br>`2 of 4 paid the advance`<br>`Commitments`<br>`3 firmly in`<br>`Tasks`<br>`2 of 4 done`<br>`Sharing`<br>`Send the plan and useful trip cards.` | Four compact coordination rows appear as one workspace. Money opens first, then collapses as Tasks and Sharing receive a short focus. Only one region changes at a time. | Planning continues after the destination is chosen. | Current `Get going` section, settle-up, pledges, tasks and share-card surfaces. Counts are illustrative sample data. | The four rows compress into the Fermat mark on a deep-green field. |
| 9 | 45.733-49.667s | **Plan the trip everyone can actually take**<br>`fermatlabs.org`<br>`Start a group trip` | Keep the accepted v1 closing field and CTA. Logo and line land, hold, then music and picture resolve together. | Remember the promise and know what to do next. | Accepted v1 CTA and current product positioning. | Fade out. |

## Energy curve

1. **Dense problem:** overlapping chat fragments.
2. **Orient:** one shared room and one group.
3. **Private input:** focused form interaction.
4. **Reveal:** anonymous feasibility becomes visible.
5. **Operate:** one private vote and a quiet progress hold.
6. **Proof:** the decisive vote-result explanation gets the strongest accent.
7. **Resolve:** the result expands into a real plan.
8. **Extend:** coordination tools show the product continues after planning.
9. **Release:** clean brand field and CTA.

## Shot contracts for the new scenes

### Shared room

- **Starting attention:** trip name and dates.
- **Meaningful object:** invite progress and the four-person avatar stack.
- **Change and consequence:** the room fills from one organizer to four joined travellers.
- **Reading hold:** joined state settles before the next cut.

### Anonymous blockers

- **Starting attention:** the Bali row already marked viable.
- **Meaningful object:** the blocker pills on Tokyo and Dubai.
- **Change and consequence:** feasibility changes from abstract options into plain anonymous reasons.
- **Reading hold:** all three rows stop before the ballot cut.

### Why the winner won

- **Starting attention:** Tokyo's longest vote bar.
- **Meaningful object:** `Most votes, but 1 budget short` followed by Bali's winner pill.
- **Change and consequence:** the viewer first expects Tokyo to win, then understands why Bali is the valid result.
- **Reading hold:** both vote counts and both reasons remain fully visible for at least 1.2 seconds.

### Coordination

- **Starting attention:** the existing plan card.
- **Meaningful object:** Money, Commitments, Tasks and Sharing rows.
- **Change and consequence:** the trip changes from a static itinerary into an active group workspace.
- **Reading hold:** all four summaries settle before the close.

## Assumptions requiring owner approval

- Extend the master to 49.667 seconds rather than slowing the existing 32-second cut.
- Keep the current soundtrack and use its backbeats at 4.900, 10.800, 16.467, 22.367, 28.133, 33.933, 39.833, 45.733 and 49.667 seconds.
- Keep the accepted India-to-Bali sample story instead of switching to the landing page's New York-to-Lisbon example.
- Show a four-person result where Tokyo gets three votes but one private budget blocks it, while Bali gets one vote and is the feasible winner. This is valid under the current lock algorithm and makes the product's fairness logic explicit.
- Reuse the v1 scenes where they remain accurate, then rebuild the old eligibility and vote sections so votes stay hidden until lock.
- Keep v1 intact and export wave 2 as a separate candidate for side-by-side review.
