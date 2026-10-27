# Planner back and edit navigation

## Decision

Add explicit navigation controls to the shared planner while a trip is collecting:

- the Choose step shows **Back to your details**;
- returning to Your details opens the editable private-details form immediately;
- saved details show a visible **Edit details** button instead of a collapsed disclosure;
- organizers can use **Back to invite** even after every spot is filled;
- the organizer's Invite section remains rendered while the trip is collecting, so that back action always has a real destination.

The controls use the existing private-details form and `submitConstraints` command. Voting and locked trips keep details read-only.

## Trade-off

Keeping earlier sections mounted makes the collecting page slightly longer, but it gives every navigation control a stable target and avoids introducing a second client-side step state that could disagree with the server-derived lifecycle.

## UI state and server state

This change does not alter persisted fields, server commands, retries, recovery, or lifecycle transitions. It does add an ephemeral client-side edit mode with the following transitions:

| UI state | Event | Result | Server effect |
| --- | --- | --- | --- |
| saved summary, collecting | Back to your details / Edit details | open the form with the latest saved values | none |
| form open, collecting | Cancel | restore the latest `trip.myConstraints`, clear dirty state, close the form | none |
| form open, collecting | Save succeeds | accept the returned trip, clear dirty state, close the form | existing `submitConstraints` command |
| form open, collecting | Save fails | keep the draft and form open; show the existing error notice | none acknowledged |
| form open | trip advances to voting or locked | discard edit mode and hide the editable form | none |
| form already open | Back/Edit repeated | remain open and scroll to the same stable section anchor | none |

While the form is dirty, the existing polling guard continues to prevent a refresh from overwriting the draft. Cancel restores the most recent saved snapshot currently present in `trip.myConstraints`.

## Acceptance criteria

1. At the collecting-phase Choose step, a visible **Back to your details** button scrolls to Your details and opens the form.
2. A member with saved details sees an explicit **Edit details** button and can cancel back to the saved summary without persisting draft changes.
3. An organizer can navigate from Your details back to Invite after the roster is full.
4. Voting and locked phases do not expose an editable private-details form.
5. Navigation works at mobile and desktop widths without relying on the desktop-only clickable stepper.

## Verification

- Record the missing controls against the unchanged `?preview=ready` page.
- Run a browser dry run at mobile and desktop widths covering Choose → Your details → Invite and edit/cancel.
- Check `?preview=voting` and `?preview=locked` explicitly: neither may expose Edit/Back-to-details controls or an editable private-details form.
- Run the complete group-trip suite, TypeScript checking, and a production build.
- Review the final diff for lifecycle or privacy regressions.

## Residual exposure

Trip basics such as name, dates, group size, home country, currency, and scope are still immutable after room creation. This change addresses navigation and editing of each member's private trip constraints only.
