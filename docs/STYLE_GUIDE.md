# Restaurant POS — Frontend Style Guide

**Project:** CS431 Restaurant POS
**Stack:** React + Vite + TypeScript + Tailwind CSS
**Theme:** Dark only
**Aesthetic:** Dense, utilitarian POS — Toast / Square / Lightspeed lineage
**Audience:** Implementation agents
**Status:** Draft v1

---

## 1. Design Philosophy

This is a working tool, not a showpiece. The grader and any test user should look at the screen and immediately know where to tap. Servers, cooks, and managers all operate it under time pressure — sometimes one-handed, sometimes on a phone, sometimes while looking at a customer rather than the screen.

Three principles, in order:

1. **Glanceability beats elegance.** Every screen has one obvious primary action and one obvious primary piece of information. If you have to explain a screen, redesign the screen.
2. **Density is a feature.** Real POS screens pack information tightly because operators want to see everything at once. Whitespace is a tool, not a default.
3. **No surprises.** Buttons look like buttons. Destructive actions are red. Money is right-aligned. The same component looks the same everywhere.

What this means concretely: no decorative gradients, no hero animations, no playful micro-interactions, no clever typography. Every visual choice has to earn its place by making information easier to read or actions faster to take.

---

## 2. Color System

Defined as Tailwind theme tokens (in `tailwind.config.ts`) and CSS variables for runtime use. **Always reference tokens, never raw hex.**

### 2.1 Surface scale (dark, neutral-cool)

```
bg-canvas       #0B0F14   — app background
bg-surface      #121822   — cards, panels, table rows
bg-surface-2    #1A2230   — elevated surfaces (modals, popovers)
bg-surface-3    #232D3D   — hover states on surface-2
bg-input        #0F1620   — form inputs (recessed, darker than canvas)

border-subtle   #1F2A38   — dividers between rows, low-contrast separators
border-default  #2D3B4F   — card borders, input borders
border-strong   #45576F   — focused inputs, emphasized borders
```

### 2.2 Text scale

```
text-primary    #E6EDF5   — headings, primary content
text-secondary  #A8B5C7   — labels, secondary content
text-muted      #6B7A90   — placeholders, timestamps, metadata
text-disabled   #4A5668   — disabled state
text-inverse    #0B0F14   — text on light/accent backgrounds
```

### 2.3 Semantic colors

Used for status, not decoration. Each has a `-bg` (subtle fill, ~10% opacity) and `-fg` (text/icon) variant.

```
accent          #3B82F6   — primary actions (Fire, Submit, Add)
accent-hover    #2563EB
accent-bg       #3B82F61A — translucent fill for active/selected states

success         #10B981   — ready, completed, paid
success-bg      #10B9811A

warning         #F59E0B   — preparing, getting close to threshold
warning-bg      #F59E0B1A

danger          #EF4444   — voided, late tickets, destructive actions
danger-hover    #DC2626
danger-bg       #EF44441A

info            #06B6D4   — neutral notifications, badges
info-bg         #06B6D41A
```

### 2.4 Expediter time bands

These are the only place loud color is allowed, because it's the entire point of the screen:

```
ticket-fresh    border-l-4 border-success      — < 5 min since fired
ticket-warning  border-l-4 border-warning      — 5–10 min
ticket-late     border-l-4 border-danger       — > 10 min, also bg-danger-bg
```

Thresholds live in `src/lib/expediter.ts` as constants — never hard-coded in components.

### 2.5 What NOT to do

- No purple. No teal-to-pink gradients. No "AI assistant" aesthetic.
- No semantic color outside its semantic meaning. Don't use red for emphasis on a non-destructive button.
- No more than one accent color visible per screen at a time. If everything is highlighted, nothing is.
- No translucent glass / backdrop-blur effects. They cost performance and look out of place in a POS.

---

## 3. Typography

### 3.1 Fonts

Two fonts only. Both system-available or via `@fontsource`.

```
font-sans   "Inter", system-ui, sans-serif       — UI, body, labels
font-mono   "JetBrains Mono", ui-monospace, ...  — money, IDs, timers, tabular data
```

Inter is the right choice here despite being "common" — it's optimized for UI legibility at small sizes, has tabular figure variants built in, and that's exactly the job. This is one of the few places where the safe choice is the correct choice.

### 3.2 Type scale

Tailwind defaults are too generous for a dense POS. Override:

```
text-xs    11px / 16px   — metadata, timestamps, badge labels
text-sm    13px / 18px   — table cells, dense lists, secondary labels  ← default body
text-base  15px / 20px   — primary content, button labels
text-lg    18px / 24px   — section headers
text-xl    22px / 28px   — page titles, prominent totals
text-2xl   28px / 32px   — running totals on tab detail, expediter timer
text-3xl   36px / 40px   — splash totals at close-out, ticket time-since
```

`text-sm` is the workhorse. Most table rows and list items use it.

### 3.3 Tabular numerics — required

Every place a number is displayed in a list, table, or running total **must** use tabular figures. This prevents money columns from jittering as digits change.

```tsx
<span className="font-mono tabular-nums">$24.50</span>
<span className="tabular-nums">12:34</span>  // also fine on Inter
```

### 3.4 Font weights

```
font-normal     400  — body text
font-medium     500  — labels, button text, table headers
font-semibold   600  — section headers, emphasized values
font-bold       700  — page titles, totals at close-out
```

Skip weights below 400 and above 700. No italic except for "(no name)" placeholders.

---

## 4. Spacing & Layout

### 4.1 Spacing scale

Tailwind's default 4px scale, but with a strong preference for the dense end:

```
gap-1   4px    — between icon and label inside a button
gap-2   8px    — between elements in a row, between adjacent buttons
gap-3   12px   — between table rows, list items
gap-4   16px   — between cards in a grid, default form field gap
gap-6   24px   — between sections on a page
gap-8   32px   — between major regions (rare)
```

Anything larger than 32px should be questioned. POS screens earn their density.

### 4.2 Padding conventions

```
Buttons:        px-3 py-2 (sm), px-4 py-2.5 (md, default), px-5 py-3 (lg)
Inputs:         px-3 py-2
Card body:      p-4
Modal body:     p-6
Table cells:    px-3 py-2
List items:     px-4 py-3
```

### 4.3 Layout primitives

Three top-level layouts, one per role:

- **ServerLayout** — left rail (tab list, persistent), main panel (current tab detail or menu browser).
- **ExpediterLayout** — full-width grid of tickets, no chrome. Header is minimal: store name, current time, employee.
- **ManagerLayout** — left nav (Orders / Inventory / Schedule), main content area.

All three share a top bar (40px tall) showing role, employee name, and a logout button.

### 4.4 Mobile

Per NFR-6, Server console and Expediter must work on a phone. Concretely:

- **ServerLayout** collapses the left rail to a sheet that slides in from the left, triggered by a tab list button in the header.
- **ExpediterLayout** becomes a single column of full-width ticket cards.
- Touch targets are **44×44px minimum**, even when the visual button is smaller. Use padding to reach the target if needed.
- No hover-only affordances. Anything important must work on tap.

Manager console can be desktop-first. It's not a phone use case.

---

## 5. Component Patterns

A small, opinionated set. Build these once in `src/components/`, use them everywhere. **Do not let agents one-off styles inside route components.**

### 5.1 Button

Variants by intent, sizes by context.

```tsx
<Button intent="primary" size="md">Fire</Button>
<Button intent="secondary">Cancel</Button>
<Button intent="danger">Void</Button>
<Button intent="ghost" size="sm">Edit</Button>
```

| intent | bg | text | border | use |
|---|---|---|---|---|
| `primary` | `accent` → `accent-hover` | `text-inverse` | none | The one main action per screen |
| `secondary` | `surface-2` → `surface-3` | `text-primary` | `border-default` | Most actions |
| `danger` | `danger` → `danger-hover` | `text-inverse` | none | Destructive only |
| `ghost` | transparent → `surface-2` | `text-secondary` | none | Inline / table-row actions |

Loading state: spinner replaces text, button stays the same width (compute width before, lock it). Disabled state: 50% opacity, `cursor-not-allowed`, no hover change.

### 5.2 Input / Select / Textarea

```
Default:   bg-input, border-default, text-primary, px-3 py-2, rounded-md
Focus:     border-strong, ring-2 ring-accent/30, no outline
Error:     border-danger, helper text in danger-fg below
Disabled:  opacity-60, cursor-not-allowed
```

Always pair with a `<Label>` component. Always show error helper text below the input — never as a tooltip.

### 5.3 Card

The default container. Use everywhere a region of related content needs separation.

```tsx
<Card>
  <CardHeader>{/* optional, has bottom border */}</CardHeader>
  <CardBody>{/* p-4 default */}</CardBody>
  <CardFooter>{/* optional, has top border, right-aligned actions */}</CardFooter>
</Card>
```

Style: `bg-surface`, `border border-default`, `rounded-md`. No shadows on the dark theme — borders do the separation work. Shadows on dark themes look muddy.

### 5.4 Table

For lists of structured records (orders, employees, inventory). Not for tab item lists — those are visually richer (see 5.7).

```
Header row: bg-surface-2, text-secondary, text-xs, uppercase, tracking-wide, sticky top-0
Body rows:  border-b border-subtle, hover:bg-surface-2
Cells:      px-3 py-2, text-sm
Numeric:    text-right, font-mono, tabular-nums
Action col: w-px (collapses to content width), right-aligned
```

Empty state: row spanning all columns, centered, `text-muted`, with a single suggested action if appropriate ("No tabs open. Create one.").

### 5.5 Badge / Status pill

For kitchen status, tab status, payment status. Compact, semantic, never decorative.

```tsx
<Badge tone="success">Ready</Badge>
<Badge tone="warning">Preparing</Badge>
<Badge tone="info">Fired</Badge>
<Badge tone="danger">Voided</Badge>
<Badge tone="neutral">Staged</Badge>
```

Style: `px-2 py-0.5`, `text-xs`, `font-medium`, `rounded`, `bg-{tone}-bg`, `text-{tone}-fg`. No icons inside badges in v1 — adds noise.

### 5.6 Modal

Used for confirm-destructive, payment dialog, shift create/edit. Not for navigation, not for forms with > 6 fields.

```
Overlay:  bg-black/60
Panel:    bg-surface-2, border border-default, rounded-lg, max-w-md (sm) / max-w-lg (md)
Header:   px-6 py-4, border-b, title in text-lg font-semibold
Body:     p-6
Footer:   px-6 py-4, border-t, flex justify-end gap-2
```

Always: clicking the overlay or pressing Escape closes the modal. Always: focus trapped inside. Always: focus returns to the triggering element on close.

### 5.7 TabItemRow (custom, server console)

The line-item row inside an open tab. Custom because it's the central UI of the server's job.

Layout:

```
[ qty stepper ]  [ item name + type ]  ........  [ price ]  [ action ]
   shrink            grow                            shrink     shrink
```

Visual state by `kitchen_status`:

- `staged` — full opacity, qty stepper enabled, action is trash icon
- `fired` / `preparing` — full opacity, qty stepper disabled, action is "void"
- `ready` — `success` left border (4px), full opacity
- `voided` — 50% opacity, line-through on item name, no action

Grouped under a section header per round: "Round 1 · Fired 12:34 · 6m ago". Staged items live under a header that just reads "Staged".

### 5.8 TicketCard (expediter)

The ticket on the kitchen-side board. Custom because it's the central UI of the cook's job.

```
Header:    customer name (font-semibold text-base), elapsed time (text-2xl font-mono on the right)
Body:      one row per item — qty (font-mono w-8), name (grow), per-item status control on the right
Footer:    "Bump All Ready" button (full width, secondary intent)
```

Whole card has the colored left border from §2.4. When all items are `ready`, card dims to 60% opacity for the 60-second cooldown before disappearing.

### 5.9 Money

A tiny component. Use it everywhere money displays.

```tsx
<Money value="24.50" />          // $24.50
<Money value="0.00" muted />     // $0.00 in text-muted
<Money value="-5.00" />          // -$5.00, automatically in danger-fg
```

Why: locks formatting (currency symbol, decimal places, comma separators), enforces tabular-nums + font-mono, handles negatives consistently. Frontend never does its own toFixed.

### 5.10 ElapsedTime

Live-ticking duration since a timestamp. Used on the expediter and on tab cards.

```tsx
<ElapsedTime since={ticket.firedAt} />        // "6m 23s"
<ElapsedTime since={tab.openedAt} compact />  // "6m"
```

Implemented with `useElapsed(timestamp)` hook (one global ticker, not one per component — important for performance when there are 20 tickets on screen).

---

## 6. Iconography

Use **lucide-react**. One library, consistent stroke weight, plenty of icons.

Rules:

- Default size: 16px (`size={16}`) inside text, 20px standalone, 24px in buttons that are icon-only.
- Default stroke width: 2 (lucide default). Don't fiddle.
- Icons inherit `currentColor` — set color via Tailwind text classes on the parent.
- Never decorative. Every icon either replaces a label (icon-only button with `aria-label`) or accompanies one.

Common mappings:

```
plus            — add item, new tab
trash-2         — remove staged item
ban             — void fired item
flame           — fire button (the one place an icon adds personality, deliberately)
check           — mark ready, confirm
clock           — elapsed time, timestamps
chevron-right   — drilldown into a row
x               — close modal, dismiss
```

---

## 7. Motion

Minimal. Motion in a POS is a distraction unless it conveys state.

Allowed:

- **State transitions** — 150ms ease-out on color/border/opacity changes (button hover, row hover, badge color change).
- **Modal appearance** — 150ms fade + 8px translate-y on enter, instant on close.
- **Toast/banner** — 200ms slide in from top, 200ms fade out.
- **Ticket dim on ready** — 300ms opacity transition.

Not allowed:

- Page transitions / route animations.
- Skeleton shimmer animations (use a static muted skeleton instead).
- Spring physics on anything.
- Anything > 300ms.
- Animating layout changes (causes reflow under load).

Tailwind: rely on `transition-colors`, `transition-opacity`, `duration-150`. No `framer-motion` or `motion` libraries — overkill for what's needed and another dep to maintain.

---

## 8. Forms

### 8.1 Layout

- Labels above inputs, never inline. Inline labels lose context on small viewports.
- Required fields marked with `*` after the label, in `text-danger`.
- One column on mobile, two columns on desktop only when fields are clearly paired (start time / end time, first name / last name).
- Submit button right-aligned in the form footer. Cancel to its left. Destructive (delete) far-left if present.

### 8.2 Validation

- Validate on blur, not on every keystroke. Mid-typing errors are noise.
- Validate the whole form on submit, scroll-into-view the first error.
- Error message lives directly under the input it describes. One sentence. No "Please" or "Sorry" — say what's wrong.
- Server-side errors are returned by the API per NFR-7 and shown the same way as client-side errors. Reuse the same component.

### 8.3 Specific patterns

- Money inputs: prefix `$`, right-aligned text, allow only digits and one decimal.
- Quantity steppers: `−` and `+` buttons flanking the number, min 1 max 99 default. Tap-and-hold to repeat is nice-to-have, not required.
- Time inputs: native `<input type="time">` for shifts. It's not pretty but it's reliable across devices.
- Date ranges: two date inputs side by side, validate `to >= from` on blur.

---

## 9. Empty States, Loading, Errors

### 9.1 Empty states

Every list view has one. Three parts:

1. One line of explanation: "No open tabs." / "No orders match these filters."
2. (Optional) one suggested action button: "Create a tab".
3. No illustrations. No icons. No "We'd love for you to..." copy.

### 9.2 Loading

- For initial route loads: a centered spinner (16px, `text-muted`) with no text. ≤ 200ms target so spinner barely flashes.
- For data inside a loaded route: a static skeleton — `bg-surface-2` blocks roughly the shape of the incoming content. No shimmer.
- Optimistic updates where safe: adding a staged item to a tab updates the UI immediately, rolls back on API failure with a toast.

### 9.3 Errors

Three error surfaces:

1. **Field-level** — under a form input, `text-danger`, `text-xs`.
2. **Banner** — at the top of the affected region, `bg-danger-bg`, `border-l-4 border-danger`, dismissible. Used for action failures: "Could not fire tab. Try again."
3. **Toast** — bottom-right corner, auto-dismiss after 4s. Used for confirmations and non-blocking errors.

Never: `alert()`. Never: a full-page error for a recoverable failure. Never: a stack trace shown to the user (per NFR-7).

---

## 10. Accessibility (Baseline)

This is a class project, not an enterprise audit, but the basics matter for the demo and for the grade:

- All interactive elements are reachable by Tab, in logical order.
- Focus ring is visible — `focus-visible:ring-2 focus-visible:ring-accent` on every interactive element. Don't `outline: none` without replacing it.
- Buttons that are icon-only have `aria-label`.
- Color is never the only signal. Status pills have text labels, not just color. The expediter time bands have the elapsed time as text *and* the colored border.
- Modals trap focus and restore it on close.
- Form inputs have `<label htmlFor>` associations.

Don't go beyond this for v1 — full ARIA-live-regions and screen reader testing are out of scope.

---

## 11. Tailwind Configuration Notes

A few specific config decisions agents should make once and not revisit:

- **Custom theme tokens** — define every color in §2 in `tailwind.config.ts` under `theme.extend.colors`. Use semantic names (`accent`, `danger`) not raw scales.
- **Disable hover on touch** — Tailwind v3+ has `@media (hover: hover)` baked in; verify it's working so hover states don't stick on mobile.
- **Container queries** — not needed for v1. Standard breakpoints (`sm`, `md`, `lg`) are enough.
- **Plugin: @tailwindcss/forms** — install it. Resets ugly default form styles, lets you start clean.
- **Plugin: tailwind-merge** — install it. Use a `cn()` helper everywhere classes are composed conditionally.

---

## 12. What "Done" Looks Like

A frontend page is finished when:

1. It uses only tokens from this guide. No raw hex, no one-off pixel values.
2. It uses only components from `src/components/`. If a route needs something new, the component is built in `src/components/` first, with the same conventions, and *then* used.
3. It works at desktop, tablet (768px), and phone (390px) widths if the role requires mobile per §4.4.
4. Loading, empty, and error states are all implemented and visible (test them by throttling the network).
5. The first action a user would take on the screen is the most visually prominent button on the screen.
6. A reviewer can describe what the screen does in one sentence after looking at it for two seconds.

---

## 13. Notes for the Agent

- **Don't reach for inspiration sites.** Don't copy patterns from Dribbble. The reference points are Toast, Square Restaurants, Lightspeed, and Clover — open them, screenshot them, and match that density and that visual language. They look "boring" because they work.
- **Don't introduce a UI library** beyond what's listed (lucide-react, @tailwindcss/forms, tailwind-merge). No shadcn/ui, no Radix, no Headless UI for v1. The component set in §5 is small enough to build by hand and you'll learn more.
- **Don't decorate.** No gradient text, no animated backgrounds, no glow effects on hover. Every effect is a tax on the user's attention.
- **Don't fight the density.** When in doubt, tighter padding wins. POS users want to see more, not breathe more.
- **Do build the components in §5 first.** Before any route. The route work goes 3x faster once Button, Input, Card, Modal, Badge, and Money exist.
- **Do test on a phone-sized window.** Resize the browser to 390px wide while developing the server console and expediter. Most dev-surface bugs are caught here.
- **Do reference this doc in PRs.** "Per §5.1" or "per §9.3" makes review fast and keeps the conventions enforced.
