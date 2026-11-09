# Local outings and affordable travel

## Product decision

Fermat should answer one broader question: **What can this group do together that works for everyone?**

The creation flow should eventually offer three honest modes:

1. **In my city** — a same-day outing with cafes, activities and neighbourhoods.
2. **Nearby getaway** — a day trip or short stay reached by train, bus or car.
3. **Destination trip** — a longer domestic or international trip, including flights where useful.

This keeps Fermat's privacy, feasibility and voting advantage while making it useful to students, office teams and larger friend groups.

## P0 — completed foundation

- Support groups of 2–20 across the UI and domain validation.
- Replace flight-only interface language with transport-neutral language.
- Make the creation CTA describe planning together instead of implying only a flight-based holiday.

## P1 — transport preferences

Add a private `transportModes` constraint per person:

- Train
- Bus
- Car / cab
- Flight
- Open to anything

The option engine must calculate door-to-door cost and duration for each allowed mode. A mode is only shown when Fermat has a real estimate; it must never relabel a flight estimate as train or bus.

Acceptance criteria:

- A member can privately exclude a mode.
- A destination only says “works for everyone” when at least one allowed route fits every member’s budget and dates.
- Results show the selected mode, total travel time and estimated return cost.
- Voting remains private.

## P2 — local outing mode

Add `planKind: 'local' | 'nearby' | 'trip'` to trip setup. Local mode needs a separate catalogue because the current destination seeds model multi-day travel.

Local place data should include:

- city and neighbourhood
- category (cafe, food, activity, park, culture, nightlife)
- price band and estimated per-person spend
- opening hours and suitable group size
- coordinates and approximate travel time
- age and accessibility notes

Local mode behaviour:

- Allow a single date and groups of 2–20.
- Ask for current area, per-person outing budget, time window and interests.
- Do not ask for passport, visa, hotel or airport details.
- Recommend 3–5 mini-plans, not isolated venues (for example activity → cafe → dinner).
- Keep budgets private and let the group vote exactly as it does for trips.

## P3 — mobile-first polish

- Keep one decision per screen on narrow phones.
- Use full-width 48px+ controls and a sticky bottom primary action.
- Collapse long explanations behind “Why this works”.
- Show lightweight progress: Group → Private details → Vote → Plan.
- Test at 320px, 375px and 430px widths, with a 20-person room and long city names.

## Positioning copy

**Short:** Private group planning for outings, getaways and trips.

**Expanded:** Everyone privately adds their dates, budget, starting point and preferences. Fermat finds plans that work for the whole group—from a day in your city to a train getaway or a flight abroad—then lets everyone vote.

Do not use the expanded promise publicly until local and ground-transport estimates ship.
