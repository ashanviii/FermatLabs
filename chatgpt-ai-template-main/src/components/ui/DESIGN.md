# Fermat design system

Live showcase: **http://127.0.0.1:3005/design** (add `?only=forms,cards` to show only some sections).
Source: `app/(marketing)/design/page.tsx`. Copy patterns from there.

## Principles

1. **One job per step, one primary button.** Each /plan step has a single `variant="primary"` action. Everything else is `secondary`, `outline` or `ghost`.
2. **Hierarchy over boxes.** Group content with `<Section>` headings straight on the canvas. Use a `<Card>` only for the one or two things a step is about. No card per paragraph ("card soup").
3. **Private looks private.** Anything only the viewer can see uses the private treatment (lock icon + "Only you see this" + violet `private` tint). Nothing else uses that colour.
4. **Status = icon + words.** Never colour alone. Use `<StatusPill>`.
5. **Real icons, one per idea.** Import from `@/components/ui/icons`. No emoji anywhere in the UI (they render as empty boxes without an emoji font).
6. **Short, plain copy.** Sentence case, one helper line per section max. Disclaimers appear once (footer or one inline "Estimates" note), not on every card.
7. **Mobile first.** Design at 390px, then widen to 1280px. Tap targets are at least 36px (buttons `sm` = 36px, `md` = 44px).
8. **Accessible by default.** Every control has a visible label (`<Field>`), focus rings are visible (`ring-brand-500`), and text meets 4.5:1.

## Font and type

- One family: **Plus Jakarta Sans** (variable, 200-800), loaded in `app/(marketing)/layout.tsx` as `--font-sans`. `--font-display` points to it too.
- Tailwind: `font-sans` (body, default) and `font-display` (headings).
- The type scale is a set of **classes**, not `text-*` sizes. They set size, line height, weight and tracking; headings also set `text-ink`. Add a colour class next to them for anything else.

| Class | Size / weight | Use |
|---|---|---|
| `type-display` | 34px (48px md+) / 800 | Landing hero, the locked plan's hero title |
| `type-h1` | 26px (32px md+) / 700 | Page title (one per page) |
| `type-h2` | 20px (22px md+) / 700 | Section titles (`<Section>` uses it) |
| `type-h3` | 17px / 650 | Card titles, list group titles |
| `type-lead` | 17px / 400 | Intro paragraph under a page title |
| `type-body` | 15px / 400 | Default reading text |
| `type-small` | 13px / 400 | Helper text, meta, labels |
| `type-caption` | 12px / 500 | Timestamps, tiny meta |
| `type-overline` | 11px / 700, caps | Eyebrows ("Step 3 of 5") |
| `type-num` | tabular numbers | Money and counts in columns |

Why classes: `tailwind-merge` (used by `cn()`) would treat a custom `text-h1` as a colour and silently drop it when combined with `text-ink`.

Headings: Chakra's reset removes heading margins, but always add `m-0` on `<h*>`/`<p>` you style yourself (Tailwind preflight is off in this app).

## Colour tokens

Never write hex in screens. Use these Tailwind names (`bg-*`, `text-*`, `ring-*`, `border-*`).

| Token | Value | Use |
|---|---|---|
| `brand-50 … brand-950` (`brand` = 900) | `#EEF6F1` … `#153524` … `#0C2116` | Primary actions (`bg-brand-900`), selected states, links (`text-brand-700`), soft fills (`bg-brand-50`). `brand-500` `#3D9163` is the leaf green: icons and accents, not text on white |
| `warm-50 … warm-800` (`warm` = 400) | marigold `#F4B740` | **The one warm accent.** Use rarely: "Your pick", hero highlight, money collected bar. Never for status |
| `ink` | `#16201B` | Headings, primary text |
| `ink-soft` | `#3A4540` | Body copy |
| `ink-muted` | `#5E6862` | Helper text, labels (5.3:1 on canvas) |
| `ink-faint` | `#8A938D` | Icons, placeholders, disabled only. Not for readable text |
| `canvas` | `#F7F6F2` | Page background (the /plan shell sets `bg-canvas`) |
| `surface` / `surface-muted` / `surface-strong` | `#FFF` / `#F2F1EC` / `#E9E7E0` | Cards and inputs / sunken wells, chips / tracks, pressed |
| `line` / `line-subtle` / `line-strong` | `#E4E2DA` / `#EEEDE7` / `#CFCCC2` | Input rings, dividers, hover rings |
| `success`, `warning`, `danger`, `info`, `private` | each has `DEFAULT`, `soft`, `ink`, `line` | `bg-success-soft text-success-ink` for pills/notices, `text-success` for icons, `ring-success-line` for outlines |
| `whatsapp` (`DEFAULT`, `hover`, `ink`) | `#25D366` | WhatsApp button only |

Legacy shadcn names (`primary`, `muted-foreground`, `accent`, `card`, `background`, `foreground`, `border`) still resolve to the landing CSS variables so old markup renders. Don't use them in new code: `text-muted-foreground` → `text-ink-muted`, `bg-[#153524]` → `bg-brand-900`, `bg-[#F4FBF6]` → `bg-brand-50`, `accent-[#3D9163]` → use `<Checkbox>`.

## Radius, shadow, layout

- Radius: `rounded-xl` inputs and small tiles, `rounded-2xl` cards, `rounded-3xl` hero panels, `rounded-full` buttons, pills, chips, avatars.
- Shadow instead of borders: `shadow-card` (default card), `shadow-raised` (hover, selected, hero), `shadow-pop` (menus, sheets). `ring-1 ring-inset ring-line` when a hairline is needed inside another surface.
- Widths: `max-w-page` (72rem / 1152px) outer page, `max-w-content` (48rem) single-column flows and forms, `max-w-prose` (38rem) paragraphs. Use `<PageContainer>` for the outer column (`px-4 sm:px-6 lg:px-8`).
- Spacing scale (Tailwind units): 1.5 / 2 / 3 / 4 / 5 / 6 / 8 / 12 / 16. Inside a card: `p-5 sm:p-6`, gaps of `gap-3` (tight lists) to `gap-5` (form fields). Between sections: `gap-12 sm:gap-16`. Between a section title and its content: `gap-4` (built into `<Section>`).
- Grids: stat rows `grid-cols-2 lg:grid-cols-4`; destination cards `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`; form fields `grid gap-5 sm:grid-cols-2`.
- Mobile: single column, full-width primary button at the bottom of a step (`<Button block size="lg">`), horizontal chip rows wrap (never scroll sideways except the section nav). On desktop, /plan can use a two-column layout: main step (`lg:col-span-8`) + sidebar (`lg:col-span-4`) for Tasks / members.

## Private-info treatment

Use exactly one of these, always with the lock icon and the words "Only you see this" (or a specific variant like "Only you see your budget"):

| Situation | Use |
|---|---|
| A whole block of private inputs (Your details, SilentPrefs) | `<Card>` with `<CardHeader icon={icons.private} iconTone="private" action={<PrivateBadge size="sm" />} />` |
| A private figure inside a shared card (destination fit, your share) | A row `rounded-xl bg-private-soft px-3 py-2.5 text-private-ink` with `icons.private`, or `<Badge tone="private">Fits ~₹42k</Badge>` |
| A private number tile | `<StatTile tone="private" … />` |
| A private explanation | `<Notice tone="private">` |
| A big private panel | `<Card variant="private">` |

Anonymous group information (what everyone sees) never uses the private colour.

## Status treatment

`<StatusPill status="ok|warning|blocked|pending|info|done|private">Label</StatusPill>`, optionally with a concept icon:

| Meaning | Markup |
|---|---|
| Everyone can go | `<StatusPill status="ok">Everyone can go</StatusPill>` |
| 2 budgets short | `<StatusPill status="warning" icon={icons.budget}>2 budgets short</StatusPill>` |
| Visa timing | `<StatusPill status="warning" icon={icons.visa}>Visa timing</StatusPill>` |
| Trip too short | `<StatusPill status="blocked" icon={icons.duration}>Trip too short</StatusPill>` |
| Waiting on people | `<StatusPill status="pending">Waiting on 2</StatusPill>` |
| Paid / done | `<StatusPill status="done">Paid</StatusPill>` |

## Copy rules

- Voice: a friendly, capable friend. Short sentences, second person ("you", "your group"), active verbs.
- Sentence case everywhere (buttons, titles, tabs): "Open voting", not "Open Voting".
- Buttons say what happens: "Save my details", "Lock and make the plan", "Share on WhatsApp". Avoid "Submit", "OK".
- Numbers: `formatINR` / `formatINRCompact` (`₹42k`, `₹1.5L`); estimates get `~`. Dates via `formatDate` / `formatDateRange` ("24–28 Dec").
- Banned words: **constraints, reconciled, server-validated, leverage, seamless**, "utilize", "robust", "AI-powered". Say "your details", "updated", "checked", "use".
- No emoji in the UI, ever. (WhatsApp share text built for other apps may keep a few, but not in rendered UI.)
- One helper line per section. Legal and estimate disclaimers live once, in the footer or one `<Notice variant="inline" tone="neutral" title="Estimates.">`.
- Empty states say what will appear and what to do: "No tasks yet. Add one, like booking the airport cab."

## Primitives

All files are in `src/components/ui/`. Import from the file or the barrel `@/components/ui`.

### Button — `@/components/ui/button`
Variants `primary` (= `default`), `secondary`, `outline`, `ghost`, `danger`, `whatsapp`, `link`. Sizes `sm` (36px), `md` (= `default`, 44px), `lg` (48px), `icon`, `icon-sm`. Props `icon`, `iconRight` (pass the component), `loading`, `block`, `asChild`.
```tsx
<Button icon={icons.vote} onClick={openVoting}>Open voting</Button>
<Button variant="outline" size="sm" iconRight={ChevronRight}>See plan</Button>
<Button asChild variant="ghost"><a href="/terms">Terms</a></Button>
```
Gotcha: `type` defaults to `"button"`. Pass `type="submit"` inside forms.

### Card, CardHeader, CardBody, CardFooter — `@/components/ui/card`
Variants `default` (white + shadow-card), `raised`, `flat` (hairline, for nested), `sunken` (grey well), `brand` (deep green hero, one per page), `private`. `interactive` adds hover lift. Card has no padding by default (`className="p-5 sm:p-6"` for free content).
```tsx
<Card>
  <CardHeader icon={icons.plan} title="Your plan" description="5 days in Goa" action={<Button size="sm" variant="outline">Share</Button>} />
  <CardBody>…</CardBody>
  <CardFooter><span className="type-caption text-ink-muted">Updated just now</span><Button>Save</Button></CardFooter>
</Card>
```
`CardTitle`, `CardDescription`, `CardContent` (= CardBody) still exist for old code.

### Section, PageContainer — `@/components/ui/section`
Titled group on the canvas (h2 by default). Props `title`, `description`, `icon`, `action`, `eyebrow`, `as`.
```tsx
<Section eyebrow="Step 3 of 5" title="Choose where to go" description="Everyone sees the same list. Only you see your fit.">
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">…</div>
</Section>
```

### Badge, StatusPill, PrivateBadge — `@/components/ui/badge`
Badge tones `neutral` (tags), `brand`, `warm`, `success`, `warning`, `danger`, `info`, `private` (auto lock icon), `solid`, `outline`; sizes `sm|md|lg`; `icon` prop. Legacy `variant="outline|secondary|default"` still works.
```tsx
<Badge size="sm">Beach</Badge>
<Badge tone="warm" icon={icons.check}>Your pick</Badge>
<PrivateBadge size="sm" />
```

### Field, Input, Select, Textarea — `@/components/ui/field`
`<Field label hint error aside htmlFor hideLabel>` wires `id`, `aria-describedby` and `aria-invalid` into the control inside it. `Input` has `leading` / `trailing` slots. `Select` is native with a chevron and optional `placeholder`.
```tsx
<Field label="Your budget" hint="Per person, all in" aside={<PrivateBadge size="sm" />}>
  <Input type="number" inputMode="numeric" leading="₹" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
</Field>
```

### Checkbox — `@/components/ui/field`
`label`, `description`, `variant="plain|tile"`, plus every native input prop (`checked`, `onChange`, `disabled`).
```tsx
<Checkbox variant="tile" label="These dates work for me" description="24–28 Dec" checked={ok} onChange={(e) => setOk(e.target.checked)} />
```

### RadioCards — `@/components/ui/field`
Pick one of a few rich options. 1 column on mobile, `columns` from `sm` up.
```tsx
<RadioCards legend="Trip length" name="len" value={len} onChange={setLen}
  options={[{ value: 'weekend', label: 'Long weekend', description: '3 nights', icon: icons.calendar }]} />
```

### ToggleChip, ChipGroup — `@/components/ui/field`
Multi-select (preferences, visas held). `aria-pressed` toggle buttons; shows a tick when selected.
```tsx
<ChipGroup label="Visas you already have">
  {visaOptions.map(([v, label]) => <ToggleChip key={v} selected={visas.includes(v)} onSelectedChange={() => toggle(v)}>{label}</ToggleChip>)}
</ChipGroup>
```

### MonthYearSelect — `@/components/ui/month-year-select`
Passport expiry as two native dropdowns. Value `'YYYY-MM'`; partial `'YYYY-'` / `'-MM'` round-trip while the user is midway; `''` when cleared. It keeps the picked month/year locally, so **each dropdown moves immediately even if the parent stores only complete values**; a different value from the parent always wins. Out-of-range years in the value are added to the list so they stay visible. "No passport" is the caller's state: pass `'none'` (selects show empty and disabled) and render a Checkbox.
```tsx
<Field label="Passport expires" aside={<PrivateBadge size="sm" />}>
  <MonthYearSelect value={input.passportExpiry} onChange={(passportExpiry) => update({ passportExpiry })} />
</Field>
<Checkbox label="I don't have a passport yet" checked={input.passportExpiry === 'none'} onChange={(e) => update({ passportExpiry: e.target.checked ? 'none' : '' })} />
```
Don't clear it from a parent effect on every render (e.g. re-syncing server state into the form while the user is typing); that is what makes a select look stuck.

### Notice — `@/components/ui/notice`
Tones `info|success|warning|danger|private|neutral`; `title`, `action`, `icon`; `variant="inline"` for the single quiet "Estimates" line.
```tsx
<Notice tone="warning" title="2 budgets short" action={<Button size="sm" variant="outline">See options</Button>}>Try a shorter trip.</Notice>
<Notice variant="inline" tone="neutral" title="Estimates.">Prices and entry rules change. Check before you book.</Notice>
```

### StatTile — `@/components/ui/stat-tile`
`label`, `value`, `hint`, `icon`, `tone="default|private|inverse"` (inverse sits on `bg-brand-900`).
```tsx
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
  <StatTile icon={icons.money} label="Per person" value={formatINRCompact(41800)} hint="incl. 10% buffer" />
</div>
```

### Progress — `@/components/ui/progress`
`value`, `max`, `label` (required, accessible name), `tone`, `size`. Pair with a visible "3 of 5".
```tsx
<Progress label="Votes in" value={3} max={5} />
```

### Stepper — `@/components/ui/stepper`
`current` (index or id), `steps` (defaults to `PLAN_STEPS`: invite, details, choose, plan, go), optional `onStepClick` for done steps. Mobile shows "Your details · Step 2 of 5" + segment bar.
```tsx
<Stepper current="choose" />
```

### Avatar, AvatarStack — `@/components/ui/avatar`
Initials + stable colour from the nickname. Sizes `xs|sm|md|lg`, optional `status="ready|pending"` dot (decorative; say it in text too).
```tsx
<AvatarStack names={members.map((m) => m.nickname)} max={5} />
```

### EmptyState — `@/components/ui/empty-state`
```tsx
<EmptyState icon={icons.tasks} title="No tasks yet" description="Add one, like booking the airport cab." action={<Button size="sm" variant="outline" icon={Plus}>Add a task</Button>} />
```

### Icons — `@/components/ui/icons`
```tsx
import { icons } from '@/components/ui/icons';
<icons.budget className="size-4" strokeWidth={1.75} aria-hidden />
```
16px (`size-4`) inline with text, 20px (`size-5`) in headers, stroke 1.75 (2 inside buttons/pills). Decorative icons get `aria-hidden`; icon-only buttons need `aria-label`.

| Concept | Key | Lucide |
|---|---|---|
| Private | `private` | Lock |
| Budget | `budget` | Wallet |
| Passport | `passport` | IdCard |
| Visa | `visa` | Stamp |
| Departure / arrival | `departure` / `arrival` | PlaneTakeoff / PlaneLanding |
| Invite / members / organizer | `invite` / `members` / `organizer` | UserPlus / Users / Crown |
| Vote | `vote` | Vote |
| Plan / destination / route | `plan` / `destination` / `route` | Map / MapPin / Route |
| Calendar / duration / waiting | `calendar` / `duration` / `pending` | CalendarDays / Clock / Hourglass |
| Flight / road transfer / stay | `flight` / `roadTransfer` / `stay` | Plane / CarFront / BedDouble |
| Activity / meal / free time | `activity` / `meal` / `freeTime` | Compass / Utensils / Sun |
| Money / pledge | `money` / `pledge` | Banknote / Handshake |
| Share / WhatsApp / copy / link | `share` / `whatsapp` / `copy` / `link` | Share2 / custom WhatsAppIcon / Copy / Link2 |
| Tasks / nudge | `tasks` / `nudge` | ListChecks / Bell |
| Success / warning / blocked / info / tick | `success` / `warning` / `danger` / `info` / `check` | CircleCheck / TriangleAlert / CircleX / Info / Check |

### Formatting helpers — `@/lib/format`
`formatINR(150000)` → ₹1,50,000 · `formatINRCompact(42000)` → ₹42k · `formatApproxINR(x, compact?)` → ~₹42k · `formatINRRange(a, b)` · `formatNumber` · `formatDate(iso, 'short'|'medium'|'long'|'weekday')` · `formatDateRange(start, end)` → 24–28 Dec · `nightsBetween` · `formatMonthYear('2031-12')` → Dec 2031 · `monthNames()` · `plural(2, 'budget')` → 2 budgets · `formatList(['A','B','C'])` → A, B and C · `initials('Ravi Kumar')` → RK · `formatProgress(3, 5)` → 3 of 5.

## /plan information architecture

The shell renders `<Stepper>`; the current step comes from trip state.

1. **Invite** — room created, members joining. Organizer admits people; share the invite (copy link, WhatsApp).
2. **Your details** — private inputs: departure city, budget, passport month + year (or "no passport yet"), visas, preferences, confirmations; plus the private preferences panel (SilentPrefs). All in the private treatment.
3. **Choose** — ONE merged destination list (`DestinationPicker`). Each card: name, route/country, tags, anonymous group status (StatusPill), the viewer's private fit (private row: fits ~₹X / short ₹Y / blocked by your passport), and a vote/selected state while voting is open. Organizer actions: Open voting, Lock and make the plan. See the "Putting it together" section of /design.
4. **Plan** — PlanView (hero, stats, day timeline, approvals) + PlanMoney.
5. **Go** — Pledges, UpiPanel (collect), SettleUp, ShareCards.

**Tasks** ("Who's doing what" + nudges) is available throughout: a desktop sidebar or a secondary section below the step on mobile.

## Gotchas

- Tailwind **preflight is off** (Chakra owns the reset). Buttons/inputs you build by hand need `border-0`, `bg-transparent`, `font-sans`, `m-0` on text; borders need `border-solid`. The primitives already do this.
- Tailwind only scans `app/(marketing)`, `src/components/{landing,group-trip,auth,ui}`. Classes written elsewhere won't exist.
- Don't build class names dynamically (`bg-${tone}-soft`); write the full class or use a lookup object.
- `cn()` merges conflicting classes, so a className override like `bg-brand-700` on `<Button>` replaces the variant colour.
- `type-*` classes live in the components layer, so a utility like `text-sm` next to them wins.
