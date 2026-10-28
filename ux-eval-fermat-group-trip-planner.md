# UX Heuristic Evaluation Report

**Evaluated:** Fermat group-trip planner journey: create, invite, private details, destination choice, voting, generated plan, and post-plan coordination
**Input:** Live UI at `fermatlabs.org/plan`, responsive browser previews, and React/TypeScript component code on `codex/planner-back-edit`
**User profile:** Friends planning a shared domestic or international trip, usually first-time or occasional users; the organizer needs to move the group from rough constraints to a bookable plan
**Date:** 2026-10-28

---

## Executive Summary

This evaluation covers the end-to-end consumer journey for creating and coordinating a group trip.

Fermat passes the majority of heuristics and has no critical usability blocker: its strongest qualities are plain-language privacy cues, visible group progress, and unusually complete empty/status states. The main risk is that the product becomes less forgiving and more cognitively demanding as the trip progresses: trip basics cannot be corrected after creation, invalid create inputs are caught too late, and the locked page presents planning, approvals, money collection, pledges, expenses, tasks, and sharing in one very long surface. These are high-priority issues before broad consumer launch, especially on mobile.

**Rating tally:** 0 Critical, 6 Major, 2 Minor, 12 Good, 1 N/A, 0 Manual Review
**Modules applied:** Core 10 · Data Visualization · Accessibility (WCAG AAA target)

### Implementation coverage — 2026-10-29

The remediation branch implements every Major and Minor finding in this report:

- a persistent **Home / All trips** escape path and signed-in trip list;
- organizer-only setup editing with transactional revision checks, roster protection, explicit member reconfirmation for semantic changes, and plan/money-history guards;
- create-time field validation, native date bounds, actionable inline errors, first-invalid focus, and a fiat-first advanced currency override;
- genuinely separate Plan and Go steps, with Go workflows progressively disclosed;
- deterministic top-three destination recommendations, Show all, and a private three-option comparison;
- an AAA secondary-text token and 44px coarse-pointer hit targets for compact controls.

The existing back/edit navigation from PR #6 remains intact. Good-rated observations and recommendations remain design guidance rather than separate required scope.

---

## Findings

### #1 Visibility of System Status
**Rating:** Good

**Finding:** The five-step progress indicator, phase labels such as “Planning” and “Trip locked,” numeric progress such as “4 of 4 joined,” button loading states, offline notice, and `role="alert"` error notice consistently show what the system and group are doing. Progress bars pair graphics with text rather than relying on color.

**Recommendation:** Preserve this system-status vocabulary and the numeric labels when simplifying later screens.

---

### #2 Match Between System and Real World
**Rating:** Good

**Finding:** Labels such as “Where’s the group based?”, “What works for you,” “Everyone’s details are in,” and “Who pays whom” use the language of friends planning a trip. Dates, nights, local currency, leave days, visas, and per-person costs match the user’s mental model and are presented in a natural sequence.

**Recommendation:** Preserve the current plain-language tone. Prefer this vocabulary over engine terms in all future error messages.

---

### #3 User Control and Freedom
**Rating:** Major

**Finding:** The current branch restores control over Invite and private Details with explicit “Back to invite,” “Back to your details,” “Edit details,” and “Cancel” actions. However, after room creation the organizer still cannot edit the trip name, dates, expected group size, home country, currency, or domestic/international scope. A changed date or wrong group size requires abandoning the room, creating another one, and reinviting everyone.

**Recommendation:** Add an organizer-only “Edit trip setup” action during collection. Show the consequences before saving, then invalidate/recalculate destination results and ballots through the existing revision model. Keep identity-changing fields locked once money activity begins unless a safe migration path exists.

---

### #4 Consistency and Standards
**Rating:** Minor

**Finding:** Components, spacing, terminology, and action hierarchy are internally consistent. The main exception is the step model: the header presents “Plan” and “Go” as separate steps, but the locked page renders both full sections together. The current indicator can say “Step 4 of 5” while Step 5 controls are already available far below.

**Recommendation:** Make the content boundary match the stepper. Either show one active step at a time or relabel the navigation as sections rather than sequential steps.

---

### #5 Error Prevention
**Rating:** Major

**Finding:** `CreateRoomCard` leaves “Create trip” enabled for an empty name, an end date before the start date, and trips outside the server’s 2–31-day limit. The domain correctly rejects these states, but only after submission. Country and currency are also exposed as enormous native lists; the currency list includes crypto and metal codes that are not sensible defaults for ordinary travel budgets.

**Recommendation:** Validate the name and date range as the fields change, set native `min`/`max` relationships, disable Create until valid, and show a concise inline reason. Default currency from the home country and place “Change currency” behind an advanced disclosure with a searchable fiat-only list.

---

### #6 Recognition Rather Than Recall
**Rating:** Good

**Finding:** The UI keeps the trip name, dates, group count, scope, currency, phase, and current step visible. Destination cards expose country, route, tags, group feasibility, and private affordability together. The plan includes jump-to-day links, explicit vote results, and “Only you see this” labels. The new back/edit controls remove reliance on remembering or discovering desktop-only stepper behavior.

**Recommendation:** Preserve the explicit back/edit labels when the branch is merged; do not replace them with icon-only controls.

---

### #7 Flexibility and Efficiency of Use
**Rating:** Good

**Finding:** The date finder accelerates a difficult planning task, quick-add task buttons support organizers, prior completed steps are clickable on desktop, and the plan offers jump links, WhatsApp sharing, printing, and reusable payout details. These shortcuts remain understandable to novices.

**Recommendation:** Add search/typeahead to the two longest selectors (country and currency) and retain smart defaults for occasional users.

---

### #8 Aesthetic and Minimalist Design
**Rating:** Major

**Finding:** Entry and destination-choice screens have clear hierarchy and restrained decoration. The locked journey becomes substantially denser: vote explanation, budget KPIs, approvals, six-day itinerary, member approval list, plan actions, cost breakdown, money collection, pledge rules, expense settlement, payout details, sharing, roster progress, tasks, reminders, and leave guidance all appear on one page. On mobile this becomes a very long sequence with several competing “next” actions.

**Recommendation:** Apply progressive disclosure. Keep Step 4 focused on reviewing/approving the plan, then make Step 5 a separate coordination hub with summary cards for Money, Commitments, Tasks, and Sharing. Expand only the chosen workflow and use one contextual primary action per screen.

---

### #9 Help Users Recognize, Diagnose, and Recover from Errors
**Rating:** Major

**Finding:** Offline and request failures are visually distinct and drafts are retained, which is strong recovery behavior. Create-time validation failures, however, surface through one page-level notice using server/domain language such as “Valid exact dates are required” or “Trip length must be between 2 and 31 days.” The message does not identify the field, move focus there, or preserve a nearby explanation.

**Recommendation:** Map domain errors to field-level messages, focus the first invalid field, keep a short summary at the top, and state the recovery action in user language—for example, “Choose a last day after the first day; trips can be 2–31 days.”

---

### #10 Help and Documentation
**Rating:** Good

**Finding:** Most complex concepts are explained in context: privacy boundaries, visa timing, leave-day suggestions, vote anonymity, budget buffers, payout visibility, TCS, forex fees, and legal limitations all have nearby microcopy. The journey generally explains the next group action without requiring a separate help center.

**Recommendation:** Keep contextual help close to the relevant decision. Add a short “How this works” disclosure on the create screen for users who want the full five-step overview before signing in.

---

### Data Visualization Heuristics

### DV-1 Control Ordering Follows Cognitive Flow
**Rating:** Good

**Finding:** The hierarchy moves from trip scope and group readiness to destination feasibility, then vote outcomes, plan costs, approvals, and operational progress. High-level group status precedes detailed rows and controls.

**Recommendation:** Preserve this broad-to-specific order when splitting the locked page into smaller surfaces.

---

### DV-2 Interdependent Controls Are Visually and Logically Linked
**Rating:** Good

**Finding:** Country updates currency and trip-scope availability; trip dates update leave-day suggestions; voting actions live on their destination cards; pledge thresholds and current share are grouped; expense payer/split controls share one form. Dependent controls are spatially grouped and usually update automatically.

**Recommendation:** Add a brief confirmation when changing country automatically changes currency or invalidates the selected scope.

---

### DV-3 Chart Type Matches Data Semantics
**Rating:** Good

**Finding:** Completion is shown with labeled progress bars, categorical spend uses a sorted table with values and percentages, and vote outcomes use counts rather than a decorative chart. Each representation matches the task and remains readable to assistive technology.

**Recommendation:** Keep exact values adjacent to every micro-visualization; do not replace the spend table with an unlabeled chart.

---

### DV-4 Data Density Is Appropriate
**Rating:** Major

**Finding:** “Where you could go” can show 11 eligible cards plus blocked options without sort, filter, shortlist, or comparison controls. On mobile, users must scroll through the full catalog while remembering earlier options. The locked page then adds several independent progress and financial datasets to the same long surface.

**Recommendation:** Rank and show a small recommended set first, let users shortlist or compare 2–3 destinations, and collapse the rest behind “Show all.” On the locked journey, scope each progress dataset to its dedicated coordination section.

---

### DV-5 Filter and Display Controls Are Distinguishable
**Rating:** N/A

**Finding:** The current visualizations do not expose separate query filters and display-only controls. Inputs either change trip data or trigger a direct workflow action.

**Recommendation:** If destination sorting/filtering is added, distinguish filters that change eligibility from display controls that only reorder cards.

---

### DV-6 Empty and Edge States Are Handled
**Rating:** Good

**Finding:** The code provides explicit loading, empty-board, no-result, offline, incomplete-group, pending-approval, and zero-vote states. Progress values retain numeric labels, preventing zero from being confused with missing data.

**Recommendation:** Preserve these states and add an inline invalid-date state before create submission.

---

### Accessibility Heuristics

### A11Y-1 Color Contrast
**Rating:** Minor

**Finding:** Primary text and controls have strong contrast, and status meaning is reinforced with icons and text. The `text-ink-muted` token is documented at approximately 5.3:1 on canvas—passing AA but below the 7:1 AAA target—and it is used extensively for helper text, dates, metadata, and instructions.

**Recommendation:** Introduce an AAA secondary-text token at 7:1 or greater and use it for all meaningful instructions and metadata. Reserve the current muted color for truly supplementary text.

---

### A11Y-2 Text and Target Sizing
**Rating:** Major

**Finding:** Primary controls are comfortably sized, but the shared `sm` button is 36px high, `icon-sm` is 32px, desktop step circles are 28px, and several compact inline actions use these sizes. They miss the 44×44px AAA target, especially for mobile users with motor impairments. Caption and overline text are legible but should not carry essential meaning alone.

**Recommendation:** Give compact actions a minimum 44px hit area on touch viewports without necessarily increasing their visible chrome. Increase spacing between adjacent compact actions such as “New link” and “Turn off.”

---

### A11Y-3 Keyboard Navigation
**Rating:** Good

**Finding:** The inspected components use native buttons, inputs, selects, radios, checkboxes, links, and forms; custom selection buttons expose `aria-pressed`; focus-visible rings are consistently defined; and no modal or custom focus trap is present in the core journey.

**Recommendation:** Add automated keyboard smoke tests for create, private details, destination vote, plan approval, and expense entry so future custom components preserve this baseline.

---

### A11Y-4 Labels and Descriptions
**Rating:** Good

**Finding:** Form fields have visible labels, groups use legends or accessible names, icon-only destructive actions have descriptive labels, decorative icons are `aria-hidden`, images include descriptions, and private information is labeled in both visible and screen-reader text.

**Recommendation:** Preserve visible labels when adding search/typeahead selectors; do not rely on placeholders.

---

### A11Y-5 State Communication
**Rating:** Good

**Finding:** Current step uses `aria-current`, selectable cards use `aria-pressed`, disclosure states expose expanded/collapsed state, progress elements have accessible labels, busy controls expose loading/disabled states, errors use `role="alert"`, and saved form status uses a live region. State is not conveyed by color alone.

**Recommendation:** When automatic field dependencies are added, announce the changed value in a polite live region—for example, “Currency changed to GBP based on United Kingdom.”

---

## Priority Actions

1. **[Major] #3 User Control and Freedom** — Add organizer-safe editing for trip name, dates, group size, location, currency, and scope during collection, with explicit downstream invalidation.
2. **[Major] #8 Aesthetic and Minimalist Design** — Separate Plan review from Go/coordination and progressively disclose Money, Commitments, Tasks, and Sharing.
3. **[Major] #5 + #9 Error Prevention and Recovery** — Validate create fields before submission and map domain failures to actionable inline errors with focus management.

## Coverage Note

The evaluation combined the live production entry page with the current branch’s deterministic collecting, voting, and locked previews plus component-code inspection. It is a heuristic evaluation, not a conformance audit; a formal WCAG audit should additionally test screen readers, zoom/reflow, reduced motion, high-contrast mode, and keyboard behavior across supported browsers.
