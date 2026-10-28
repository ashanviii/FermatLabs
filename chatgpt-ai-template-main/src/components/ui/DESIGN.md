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

## Look and feel

Editorial and calm, in the spirit of Nuvio, with ASCII art as the signature:

- **White canvas, faint grid.** Hero and feature bands sit on `.bg-grid` (graph paper that fades at the edges). Alternate bands use `surface-muted`.
- **Hairline cards.** White cards with a 1px border (built into `shadow-card`) and a soft low shadow. Big panels are `rounded-3xl`.
- **Floating pill nav.** Marketing and /plan both use a frosted pill bar (`.material-bar rounded-full shadow-raised`) that floats below the top edge.
- **One accent.** Fermat green (`brand-600`) for actions, links and selection. Deep green (`brand-900`) for brand panels. Marigold (`warm`) only for the route in ASCII art and the odd highlight.
- **Type with three voices.** Manrope headlines (medium, set tight), one italic serif phrase per headline (`type-accent`), and small mono caps for labels (`type-overline`).
- **ASCII art.** Hand-drawn pieces, dividers and a few animated scenes. See "ASCII art" below.
- **Kept from the Apple pass.** Press-to-shrink feedback (`active:scale-[0.97]`, `ease-apple`), 17px inputs (no iOS zoom on focus), soft focus halo (`ring-4 ring-brand-500/35`), solid bars under Reduce Transparency, no motion under Reduce Motion.

## Font and type

- Three families, loaded in `app/(marketing)/layout.tsx`: **Manrope** (`--font-sans`, `--font-display`), **Instrument Serif** (`--font-serif`, italic accent only) and **JetBrains Mono** (`--font-mono`, labels and ASCII).
- Tailwind: `font-sans` (body, default), `font-display` (headings), `font-serif`, `font-mono`.
- The type scale is a set of **classes**, not `text-*` sizes. They set size, line height, weight and tracking; headings also set `text-ink`. Add a colour class next to them for anything else.

| Class | Size / weight | Use |
|---|---|---|
| `type-display` | 38px (64px md+) / 500 | Landing hero, the locked plan's hero title |
| `type-h1` | 30px (42px md+) / 500 | Page and section titles |
| `type-h2` | 22px (26px md+) / 600 | Section titles inside /plan (`<Section>` uses it) |
| `type-h3` | 17px / 600 | Card titles, list group titles |
| `type-lead` | 19px / 400 | Intro paragraph under a title |
| `type-body` | 16px / 400 | Default reading text |
| `type-small` | 14px / 400 | Helper text, meta, labels |
| `type-caption` | 12px / 500 | Timestamps, tiny meta |
| `type-overline` | 11px mono caps / 500 | Eyebrows and labels ("STEP 3 OF 5", "LIVE EXAMPLE") |
| `type-accent` | serif italic, 1.08em, green | The one accent phrase in a headline: `One trip everyone can <span className="type-accent">actually take.</span>`. Max one per heading; on dark panels add `text-warm-300` |
| `type-num` | tabular numbers | Money and counts in columns |

Why classes: `tailwind-merge` (used by `cn()`) would treat a custom `text-h1` as a colour and silently drop it when combined with `text-ink`.

Headings: Chakra's reset removes heading margins, but always add `m-0` on `<h*>`/`<p>` you style yourself (Tailwind preflight is off in this app).

## Colour tokens

Never write hex in screens. Use these Tailwind names (`bg-*`, `text-*`, `ring-*`, `border-*`).

| Token | Value | Use |
|---|---|---|
| `brand-50 … brand-950` (`brand` = 900) | `#EEF6F1` … `#153524` … `#0C2116` | **The accent.** Actions and selected states use `brand-600` `#2E7650` (5.4:1 with white). Links `text-brand-700`, soft fills `bg-brand-50`. `brand-900` for brand panels and the wordmark. `brand-500` `#3D9163` for icons and accents, not text on white |
| `warm-50 … warm-800` (`warm` = 400) | marigold `#F4B740` | **The one warm accent.** Routes in ASCII art, "Your pick", accents on dark panels. Never for status |
| `ink` | `#131316` | Headings, primary text |
| `ink-soft` | `#3F3F46` | Body copy |
| `ink-muted` | `#6B6B76` | Helper text, labels (5.2:1 on white) |
| `ink-faint` | `#A1A1AA` | Icons, placeholders, dividers, disabled only. Not for readable text |
| `canvas` | `#FAFAF8` | Page background, a soft off-white so white cards lift off it (the /plan shell sets `bg-canvas`) |
| `surface` / `surface-muted` / `surface-strong` | `#FFF` / `#F3F3F0` / `#EDEDF0` | Cards and inputs / alternate bands, wells / tracks, pressed |
| `fill` / `fill-strong` / `fill-subtle` | translucent ink (6% / 10% / 4%) | Grey buttons (`outline`), unselected chips, segmented tracks. Works on any surface |
| `line` / `line-subtle` / `line-strong` | `#DCDCE3` / `#EFEFF2` / `#CFCFD6` | Card and input borders, dividers inside cards, hover borders |
| `success`, `warning`, `danger`, `info`, `private` | each has `DEFAULT`, `soft`, `ink`, `line` | `bg-success-soft text-success-ink` for pills/notices, `text-success` for icons, `ring-success-line` for outlines |
| `whatsapp` (`DEFAULT`, `hover`, `ink`) | `#25D366` | WhatsApp button only |

Legacy shadcn names (`primary`, `muted-foreground`, `accent`, `card`, `background`, `foreground`, `border`) still resolve to the landing CSS variables so old markup renders. Don't use them in new code: `text-muted-foreground` → `text-ink-muted`, `bg-[#153524]` → `bg-brand-900`, `bg-[#F4FBF6]` → `bg-brand-50`, `accent-[#3D9163]` → use `<Checkbox>`.

## Radius, shadow, layout

- Radius: `rounded-xl` inputs and small tiles, `rounded-2xl` cards, `rounded-3xl` hero panels and bands, `rounded-full` buttons, pills, chips, avatars, the nav.
- Elevation: `shadow-card` = 1px border + soft low shadow (default card), `shadow-raised` (hover, the nav pill, hero panels), `shadow-pop` (menus, sheets). `ring-1 ring-inset ring-line-subtle` for a hairline inside another surface.
- Backgrounds: `.bg-grid` (graph paper; put it on an `absolute inset-0 -z-10` layer inside an `isolate` section), `.bg-hatch` (diagonal stripes in `currentColor`, for blocked or lost time in bars).
- Motion: `ease-apple` (`cubic-bezier(0.32, 0.72, 0, 1)`) with 200–300ms for state changes. Press feedback is `active:scale-[0.97]`.
- Widths: `max-w-page` (72rem / 1152px) outer page, `max-w-content` (48rem) single-column flows and forms, `max-w-prose` (38rem) paragraphs. Use `<PageContainer>` for the outer column (`px-4 sm:px-6 lg:px-8`).
- Spacing scale (Tailwind units): 1.5 / 2 / 3 / 4 / 5 / 6 / 8 / 12 / 16. Inside a card: `p-5 sm:p-6`, gaps of `gap-3` (tight lists) to `gap-5` (form fields). Between sections: `gap-12 sm:gap-16`. Between a section title and its content: `gap-4` (built into `<Section>`).
- Grids: stat rows `grid-cols-2 lg:grid-cols-4`; destination cards `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`; form fields `grid gap-5 sm:grid-cols-2`.
- Mobile: single column, full-width primary button at the bottom of a step (`<Button block size="lg">`), horizontal chip rows wrap (never scroll sideways except the section nav). On desktop, /plan can use a two-column layout: main step (`lg:col-span-8`) + sidebar (`lg:col-span-4`) for Tasks / members.

## ASCII art

The signature detail. Static pieces in `@/components/ui/ascii`, animated ones in `@/components/ui/ascii-motion` (client).

| Piece | Where it's used |
|---|---|
| `<AsciiArt art={asciiArt.envelope / passport / ballot / route} />` | The four "How it works" steps |
| `<AsciiArt art={asciiArt.suitcase} />` | Closing CTA panel, the /plan loading screen |
| `<AsciiArt art={asciiArt.wordmark} />` | Footer signature |
| `<EmptyState art={asciiArt.pin / lock / clipboard} … />` | Empty states in /plan |
| `<AsciiRoute from="YOU" to="BALI" />` | The locked plan's hero: the route draws itself, then lands |
| `<AsciiSpinner />` | Loading states, next to a visible status message |

Rules:
- **Plain ASCII only** in art (no emoji or box-drawing characters), so columns stay aligned in any monospace fallback.
- **Decorative by default** (`aria-hidden`). Pass `label` only when the art carries meaning, and say the same thing in visible text too.
- **Size with `text-*`, colour with `text-*`.** The `.ascii` class sets the mono font, line height and no wrapping. Green (`text-brand-600/700`) on light, `text-brand-300` or `text-warm-300` on dark.
- **Motion** only in `ascii-motion`: each piece draws a finished still frame first, animates only while on screen and in a visible tab, and stays still under Reduce Motion.
- **One showpiece per screen.** The landing's showpiece is the hero globe (below); the route is the plan's. Everything else is small and quiet.

## Hero globe

`src/components/landing/HeroGlobe.tsx`: real country shapes (Natural Earth via `world-atlas`, drawn with `d3-geo` on a canvas) on a soft grey sphere. The landing uses it as a dome (`<HeroGlobe dome />`, top half only) centred above the hero copy.

- **Motion, GitHub-globe style.** A steady turn (`BASE_SPEED`, 3°/s). Several group flights (`FLIGHTS`) are in the air at once: each is a glowing streak with a fading tail, arcs higher the longer the trip, and lands with a ripple on the surface. Drag to spin; the flick's momentum eases back into the steady turn.
- **Pins.** Cities with a photo get a Google Maps-style red pin that drops in with a bounce as it turns into view. Cities without one (trip origins) get a quiet white dot.
- **Place cards.** A compact map-preview card (square thumbnail, name, "country · tag", and a "From <city>" chip after a landing) on a frosted surface springs up from a pin when a flight lands there, and on hover or tap. Cards near the top edge open below the pin. The spin slows while a card is up and pauses while you hover a pin.
- **Bubbles.** iMessage-style bubbles carry a word per city (`tag`): they pop out above the pin, show typing dots for a beat (`TYPING_MS`), then the text.
- **Smoothness.** Everything is time-based; the sphere shading and the pin and glow sprites are pre-rendered once per resize; no per-frame canvas blurs; the loop pauses off screen and in background tabs.
- **Reduce Motion.** No spin, flights, drops or springs; one route is drawn still. Dragging and cards still work.
- **Content.** Edit `CITIES` (position, `photo` = Unsplash id, `tag`, bubble `side`) and `FLIGHTS` (example trips). Photos are hotlinked from Unsplash and preloaded on mount. Canvas colours mirror the tokens (canvas can't read Tailwind), so update both together.

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
Variants: `primary` (= `default`) filled green, `secondary` tinted green, `outline` grey fill (no border, despite the name), `ghost` plain green text, plus `danger`, `whatsapp`, `link`. Sizes `sm` (36px), `md` (= `default`, 44px, the minimum comfortable tap target), `lg` (50px), `icon`, `icon-sm`. Props `icon`, `iconRight` (pass the component), `loading`, `block`, `asChild`.
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

### Segmented control — `@/components/ui/segmented`
Class helpers for the iOS segmented look (grey track, white raised thumb). Styles only: keep `role="tablist"`/`role="tab"` + `aria-selected` when it switches a panel, or `aria-pressed` buttons when it picks an option.
```tsx
<div role="group" aria-label="Card style" className={segmentedTrack}>
  {styles.map((s) => <button key={s.value} type="button" aria-pressed={style === s.value} onClick={() => setStyle(s.value)} className={segmentedItem(style === s.value)}>{s.label}</button>)}
</div>
```

### EmptyState — `@/components/ui/empty-state`
Pass `art={asciiArt.pin}` (or `lock`, `clipboard`) to show ASCII art instead of the icon tile.
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
