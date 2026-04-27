# Restaurant POS — Product & Software Requirements Document

**Project:** CS431 Restaurant POS (Tab-based ordering, expediter, and management)
**Stack:** React + Vite + TypeScript (frontend) · Node.js + Express + Prisma + TypeScript (backend) · MySQL (database)
**Document type:** Combined PRD + SRD
**Audience:** Implementation agents performing refactor and feature build-out
**Status:** Draft v1

---

## 1. Purpose & Context

This document specifies the product vision and software requirements for a restaurant point-of-sale (POS) web application. The database schema is already designed and partially implemented; the backend (Express + Prisma over MySQL) exposes working transactional endpoints. The frontend (React + Vite) is partially functional but missing major user-facing surfaces. This document defines what the finished product looks like, the contracts the frontend depends on, and the work required to get there.

The goal is **not** to redesign the schema. The goal is to build the user experience on top of the existing schema, adding only the backend endpoints, view models, and frontend surfaces required to realize the product vision.

---

## 2. Product Vision

A single-restaurant-location POS where:

- **Servers** keep open *tabs* for customers, add items to the tab over time, and send batches of items ("rounds" or "fires") to the kitchen as the meal progresses. A tab stays open until paid and closed.
- **Cooks and support staff** work off an **expediter screen** that shows each fired batch, the time elapsed since fire, the customer name, and the items to prepare. They advance status as items move through the kitchen.
- **Managers** work off a management console that exposes order history, inventory adjustments, and the employee schedule.

Everything runs locally on a laptop for the CS431 deliverable, but the product should feel like a real POS to the grader and to anyone using it.

---

## 3. Glossary

| Term | Definition |
|---|---|
| **Tab** | A persistent, server-owned `ORDER` row in `preparation_status = 'open'` that accumulates `ORDER_ITEM` rows over the course of a customer's visit. One tab per customer/party. |
| **Fire / Round** | A batch of newly-added `ORDER_ITEM` rows on an open tab that the server sends to the kitchen at one time. |
| **Ticket** | The kitchen-facing view of a single fired round on the expediter screen. |
| **Orderable Item** | Either a `PRODUCT` (single item) or a `PACKAGE` (bundle), modeled via `ORDERABLE_ITEM` supertype. |
| **Expediter** | The kitchen-side display that lists active tickets with elapsed time and status controls. |
| **Close out** | Settle all payments on a tab, mark it `completed`, and free the customer/table. |

---

## 4. Roles & Personas

The schema supports many-to-many `EMPLOYEE_ROLE`. For this build, three role categories drive UI access:

| Role category | Source `ROLE.name` values | Sees |
|---|---|---|
| **Server / Cashier** | `server`, `cashier` | Server console (tabs, ordering, payment) |
| **Kitchen / Support** | `cook`, `prep`, `expo`, `support` | Expediter screen |
| **Manager** | `manager`, `gm` | Manager console (orders, inventory, schedule) + all of the above |

Auth is **role-based, not identity-based** for this deliverable: on login, the employee selects their `employee_id` and the app routes them based on the roles attached to that employee.

---

## 5. Major Use Cases

### UC-1: Server opens a tab and takes an order
1. Server logs in, lands on the **Tabs** view.
2. Server taps "New Tab", enters a customer name (optional but recommended).
3. The system creates an `ORDER` row with `preparation_status = 'open'`, `store_number` set, and `employee_id` = the server.
4. Server adds items by browsing the menu (products + packages). Each tap appends an `ORDER_ITEM` to the tab in a **staged / not-yet-fired** state.
5. Server taps "Fire" on the tab. All staged items become **fired** and appear on the expediter screen as a single ticket.

### UC-2: Server adds a second round
1. Server reopens the tab from the **Tabs** list.
2. Server adds more items (staged).
3. Server taps "Fire". A *new* ticket appears on the expediter, distinct from the first round.

### UC-3: Cook works the expediter
1. Kitchen staff opens the expediter screen.
2. Tickets are sorted by fire time, oldest first. Each ticket shows:
   - Customer name
   - Elapsed time since fire (live ticking)
   - Item lines (name, quantity, modifiers if present)
   - Current status (`fired → preparing → ready`)
3. Cook advances status. When all tickets on a tab are `ready`, the tab status surfaces on the server's view as "Ready to deliver" but the tab itself remains `open` until paid.

### UC-4: Server closes out a tab
1. Server taps "Close out" on the tab.
2. System shows running subtotal, applicable discounts, tax, and total.
3. Server applies one or more `PAYMENT` rows (cash and/or electronic). Total of payments must equal `ORDER.total`.
4. On full payment, system sets `preparation_status = 'completed'` and the tab leaves the active tabs list.

### UC-5: Manager reviews orders
1. Manager opens **Orders** in the management console.
2. Filterable by date range, store, employee, status. Defaults to today.
3. Each row drilldownable to full order detail (items, payments, discounts, timestamps).

### UC-6: Manager adjusts inventory
1. Manager opens **Inventory**.
2. Sees current on-hand per `PRODUCT` (computed from `INVENTORY_TRANSACTION` rolling sum).
3. Submits a new `INVENTORY_TRANSACTION` (restock / waste / adjustment) with reason and signed quantity.

### UC-7: Manager edits the schedule
1. Manager opens **Schedule**.
2. Calendar view of `SHIFT` rows for the upcoming week, by employee.
3. Manager can create, edit, or cancel shifts (insert / update on `SHIFT`).
4. Clock-in / clock-out fields are read-only in this view (those are written by employees, out of scope for v1 if not already implemented).

---

## 6. Schema Reconciliation

The existing schema (per the data dictionary and ERD) is sufficient for the vision, with **two small extensions** required to support the tab-and-fire workflow cleanly. Both are additive — no destructive migration.

### 6.1 `ORDER.preparation_status` — value set
Lock the column to a known enum-like set:

```
'open'        — tab is active, server still adding items
'completed'   — tab paid and closed
'voided'      — tab was cancelled before payment
```

`ORDER.preparation_status` describes the **tab lifecycle**, not the kitchen state. Kitchen state lives on the line items (see 6.2).

### 6.2 `ORDER_ITEM` — add `fired_at` and `kitchen_status`
Add two columns to `ORDER_ITEM`:

| Column | Type | Constraints | Description |
|---|---|---|---|
| `fired_at` | TIMESTAMP | NULL | When this line was sent to the kitchen. NULL means staged/not yet fired. |
| `kitchen_status` | VARCHAR | NN, default `'staged'` | One of: `staged`, `fired`, `preparing`, `ready`, `delivered`, `voided`. |

A "round" / "ticket" is implicitly defined as `ORDER_ITEM` rows on the same `order_id` that share the same `fired_at` timestamp (rounded to the second). The frontend groups them; no separate ticket table is required for v1.

> **Optional v2:** introduce an explicit `TICKET` table (`ticket_id`, `order_id`, `fired_at`, `expo_status`) and FK from `ORDER_ITEM`. Not required for v1; flagged here so agents don't over-engineer.

### 6.3 Everything else
The rest of the schema (RESTAURANT, ADDRESS, EMPLOYEE, ROLE, EMPLOYEE_ROLE, SHIFT, ORDERABLE_ITEM, PRODUCT, PRODUCT_TYPE, PACKAGE, PACKAGE_PRODUCT, DISCOUNT, ORDER_DISCOUNT, PAYMENT, ELECTRONIC_PAYMENT, CARD, INVENTORY_TRANSACTION) is used as-is. Refer to the data dictionary as the source of truth.

---

## 7. Functional Requirements

Each requirement has an ID. Agents should reference these in commits and PRs.

### 7.1 Authentication & role routing

- **FR-AUTH-1** — Login screen lets the user pick an `employee_id` from a list of active employees at the current store (or enter it).
- **FR-AUTH-2** — On login, the server returns the employee's roles (joined from `EMPLOYEE_ROLE` → `ROLE`).
- **FR-AUTH-3** — The frontend routes to Server console, Expediter, or Manager console based on roles. If the employee has multiple role categories, show a chooser.
- **FR-AUTH-4** — Session is stored client-side only (localStorage). No password handling required for the deliverable; this is a class project.

### 7.2 Server console — Tabs

- **FR-TAB-1** — List all `ORDER` rows for the current store with `preparation_status = 'open'`, ordered by `timestamp` ascending.
- **FR-TAB-2** — Each tab card shows: customer name, server name, elapsed time since open, item count, running subtotal, an indicator if any line is `ready` (cue to deliver).
- **FR-TAB-3** — "New Tab" button creates a new `ORDER` (status `open`, employee = current server, store = current store, timestamp = now, subtotal/total/tax_percent initialized to defaults).
- **FR-TAB-4** — Tapping a tab opens the **Tab Detail** view.

### 7.3 Server console — Tab Detail

- **FR-TAB-5** — Shows all line items grouped by round: **Staged** at top, then each fired round labeled by fire time and status.
- **FR-TAB-6** — Menu browser: products and packages, filterable by `PRODUCT_TYPE`. Only items where `ORDERABLE_ITEM.is_available = true` are selectable.
- **FR-TAB-7** — Adding an item creates an `ORDER_ITEM` with `kitchen_status = 'staged'`, `fired_at = NULL`, `quantity = 1`, `price_at_purchase` snapshotted from `PRODUCT.base_price` or `PACKAGE.bundle_price`.
- **FR-TAB-8** — Quantity stepper updates `quantity` on staged items only. Fired items are immutable from the server screen (must be voided).
- **FR-TAB-9** — Remove (trash) on a staged item deletes the `ORDER_ITEM`. On a fired item, sets `kitchen_status = 'voided'` (no row deletion — preserves audit trail).
- **FR-TAB-10** — "Fire" button is enabled when at least one staged item exists. Pressing it sets `fired_at = NOW()` and `kitchen_status = 'fired'` on all staged items in one transaction.
- **FR-TAB-11** — Subtotal recomputes as Σ(`quantity × price_at_purchase`) across all non-voided lines. Total = subtotal × (1 + tax_percent) − discounts. The recompute happens on the server on every mutation.

### 7.4 Server console — Close out

- **FR-PAY-1** — "Close out" opens a payment screen showing subtotal, applied discounts, tax, total, and amount paid so far.
- **FR-PAY-2** — Apply discount: pick from `DISCOUNT` list → insert `ORDER_DISCOUNT`. Recompute total.
- **FR-PAY-3** — Add cash payment: insert `PAYMENT` with `type = 'cash'`, `amount`, `order_id`.
- **FR-PAY-4** — Add electronic payment: insert `PAYMENT` (`type = 'electronic'`) plus a `CARD` row plus an `ELECTRONIC_PAYMENT` link row, all in one transaction. **Card data is faked for v1** (free-text last four, brand picker) — no real PCI handling.
- **FR-PAY-5** — When Σ payments ≥ total, "Close tab" is enabled. Pressing it sets `preparation_status = 'completed'`.
- **FR-PAY-6** — Add tip: updates `ORDER.tip` and recomputes total.

### 7.5 Expediter screen

- **FR-EXP-1** — Pulls all `ORDER_ITEM` where `kitchen_status IN ('fired', 'preparing')`, joined to their parent `ORDER`.
- **FR-EXP-2** — Groups lines by (`order_id`, `fired_at`) into **tickets**. Each ticket displays:
  - Customer name (or "Tab #{order_id}" if null)
  - Elapsed time since `fired_at`, ticking live (computed client-side, refreshed every second)
  - Color band by elapsed time: green < 5 min, yellow 5–10 min, red > 10 min (thresholds configurable as a frontend constant)
  - Each line: quantity, item name, item type
  - Per-line status control: `fired → preparing → ready`
  - Per-ticket "Bump" button that marks all lines `ready` at once
- **FR-EXP-3** — Tickets are sorted oldest-fired first.
- **FR-EXP-4** — Auto-refresh every 5 seconds (polling is acceptable for v1; no websockets required).
- **FR-EXP-5** — When all lines on a ticket reach `ready`, the ticket dims but stays visible for 60 seconds (so kitchen can confirm), then disappears.

### 7.6 Manager console — Orders

- **FR-MGR-1** — Searchable, filterable list of all orders. Filters: date range, status, employee, store.
- **FR-MGR-2** — Drilldown to order detail page showing items, payments, discounts, full timestamps, and the responsible server.
- **FR-MGR-3** — Read-only in v1. (Future: manager void / refund.)

### 7.7 Manager console — Inventory

- **FR-INV-1** — List all `PRODUCT` rows with computed on-hand = Σ `INVENTORY_TRANSACTION.quantity_change` for that product.
- **FR-INV-2** — Filter by `PRODUCT_TYPE`. Highlight products with on-hand ≤ 0 or below a configurable threshold.
- **FR-INV-3** — "Adjust" action opens a form: signed quantity, reason (dropdown: `restock`, `waste`, `adjustment`, `correction`), optional note. Submit inserts a new `INVENTORY_TRANSACTION` with `timestamp = NOW()`.
- **FR-INV-4** — History tab on each product shows the last N transactions.

### 7.8 Manager console — Schedule

- **FR-SCH-1** — Week grid view: rows = employees, columns = days of the week. Cells contain that employee's shift(s) for that day.
- **FR-SCH-2** — Click empty cell → create shift form (employee preselected, date preselected, pick role, start time, end time).
- **FR-SCH-3** — Click existing shift → edit or cancel. Cancel deletes the row if no `clock_in_timestamp` is set; otherwise, this is blocked in v1 (don't destroy worked-shift records).
- **FR-SCH-4** — Validation: `end_timestamp > start_timestamp`; employee must have the chosen `role_id` in `EMPLOYEE_ROLE`.

---

## 8. Non-Functional Requirements

| ID | Requirement |
|---|---|
| **NFR-1** | All write paths use transactions. The "Fire" action, the "Close out" action, and the "Add electronic payment" action each touch multiple tables and must be atomic. |
| **NFR-2** | All entity and referential integrity enforced at the DB layer. The frontend never assumes a relationship — it relies on FKs. |
| **NFR-3** | All bulk processing happens in SQL. The frontend never pulls full tables to compute aggregates (per assignment rule 6). |
| **NFR-4** | Input validation runs on the client *and* on the server. Client validation is UX; server validation is correctness. |
| **NFR-5** | The app runs locally from `npm run dev` on the frontend and `npm run dev` on the backend. README documents the steps. |
| **NFR-6** | The UI is responsive enough to be usable on a phone-sized viewport (per assignment bonus). Server console and expediter must work on touch. |
| **NFR-7** | Errors surface in the UI as user-readable banners. No silent failures. No raw stack traces shown to users. |
| **NFR-8** | All money values stored as `DECIMAL`, never `FLOAT`. All money math done in SQL or a decimal library — never with JS floats directly. |
| **NFR-9** | Both packages compile under `strict: true`. CI / pre-commit runs `tsc --noEmit` on both `frontend` and `backend`. No `any`; use `unknown` at boundaries and narrow. |
| **NFR-10** | Frontend and backend share request/response type definitions via a hand-copied `types/api.ts` in each package. The backend is the source of truth — when an API contract changes, the backend file is updated first and the frontend file is updated to match in the same PR. Drift between the two is a bug. |

---

## 9. API Contracts

REST conventions, JSON in/out. Base path `/api`. All write endpoints require a header `X-Employee-Id` (the active employee for the session) — used for `ORDER.employee_id` defaulting and audit.

### Auth & lookup
```
GET    /api/employees?store_number=:n        → list active employees at store
GET    /api/employees/:id/roles              → list roles for one employee
GET    /api/restaurants                      → list of all stores
```

### Menu
```
GET    /api/menu                             → all available orderable items
                                                (joined product + package + type info)
GET    /api/product-types                    → list of all product types
```

### Tabs (Orders)
```
GET    /api/tabs?store_number=:n             → all open tabs at store
POST   /api/tabs                             → create new tab
                                                body: { customer_name?, store_number, employee_id }
GET    /api/tabs/:order_id                   → tab detail (items grouped by round, totals)
PATCH  /api/tabs/:order_id                   → update tab metadata (customer_name, tip)
POST   /api/tabs/:order_id/items             → add a staged line item
                                                body: { item_id, quantity }
PATCH  /api/tabs/:order_id/items/:item_id    → update staged item quantity
DELETE /api/tabs/:order_id/items/:item_id    → remove staged item OR void fired item
POST   /api/tabs/:order_id/fire              → fire all staged items (atomic)
POST   /api/tabs/:order_id/discounts         → apply a discount
                                                body: { discount_id }
POST   /api/tabs/:order_id/payments          → add a payment
                                                body: { type, amount, card?: {...} }
POST   /api/tabs/:order_id/close             → close tab when paid in full
```

### Expediter
```
GET    /api/kitchen/tickets                  → all active tickets across the store
                                                (kitchen_status in fired/preparing)
PATCH  /api/kitchen/items/:item_id           → update kitchen_status of one line
PATCH  /api/kitchen/tickets/:order_id/:fired_at → bump entire ticket to ready
```

### Manager: orders
```
GET    /api/orders?from=&to=&status=&employee_id=&store_number=
GET    /api/orders/:id                       → full order detail
```

### Manager: inventory
```
GET    /api/inventory?product_type_id=       → on-hand per product (computed)
GET    /api/inventory/:product_id/history    → recent transactions for one product
POST   /api/inventory/:product_id/adjust     → insert INVENTORY_TRANSACTION
                                                body: { quantity_change, reason, note? }
```

### Manager: schedule
```
GET    /api/schedule?from=&to=&store_number= → shifts in window
POST   /api/schedule                         → create shift
                                                body: { employee_id, role_id,
                                                        start_timestamp, end_timestamp }
PATCH  /api/schedule/:shift_id               → edit shift (only if not clocked in)
DELETE /api/schedule/:shift_id               → cancel shift (only if not clocked in)
```

---

## 10. Frontend Architecture

```
src/
├── main.tsx
├── App.tsx                       — top-level router
├── types/                        — shared domain types (mirror API contracts)
│   ├── api.ts                    — request/response DTOs
│   └── domain.ts                 — Tab, Ticket, MenuItem, etc.
├── api/                          — thin fetch wrappers, one file per resource
│   ├── client.ts                 — base fetch + error normalization
│   ├── tabs.ts
│   ├── kitchen.ts
│   ├── menu.ts
│   ├── inventory.ts
│   ├── schedule.ts
│   └── orders.ts
├── auth/
│   ├── AuthContext.tsx           — current employee + roles
│   └── Login.tsx
├── routes/
│   ├── ServerConsole/
│   │   ├── TabsList.tsx
│   │   ├── TabDetail.tsx
│   │   ├── MenuBrowser.tsx
│   │   └── Closeout.tsx
│   ├── Expediter/
│   │   └── ExpediterBoard.tsx
│   └── Manager/
│       ├── OrdersList.tsx
│       ├── OrderDetail.tsx
│       ├── Inventory.tsx
│       └── Schedule.tsx
├── components/                   — shared UI (Button, Modal, Money, ElapsedTime…)
├── hooks/
│   ├── usePolling.ts             — for expediter auto-refresh
│   └── useElapsed.ts             — live-ticking elapsed time
└── lib/
    ├── money.ts                  — decimal-safe formatting
    └── time.ts
```

State management: React Context for auth + current store. Per-route data fetching via a small `useResource<T>` hook (loading / error / data). No Redux. **No localStorage abuse for shared state** — the source of truth is the API.

**TypeScript conventions for the frontend:**
- `strict: true` in `tsconfig.json` (and `noUncheckedIndexedAccess: true` recommended).
- API response shapes are declared as `interface` in `src/types/api.ts` and **must match** the backend's response types. When the backend changes a contract, both sides update in the same PR.
- No `any`. Use `unknown` at API boundaries and narrow before use.
- Money values cross the wire as `string` (not `number`) to preserve decimal precision; the `Money` component and `lib/money.ts` parse on render.

---

## 11. Backend Architecture

```
src/
├── index.ts                      — Express app + middleware
├── prisma/                       — schema, migrations, seed (seed.ts)
├── types/
│   ├── api.ts                    — request/response DTOs (shared shape with frontend)
│   └── domain.ts                 — service-layer types
├── middleware/
│   ├── employeeContext.ts        — reads X-Employee-Id, attaches to req
│   └── errorHandler.ts           — normalizes errors into JSON
├── routes/
│   ├── employees.ts
│   ├── menu.ts
│   ├── tabs.ts
│   ├── kitchen.ts
│   ├── orders.ts
│   ├── inventory.ts
│   └── schedule.ts
├── services/                     — business logic, called by routes
│   ├── tabService.ts             — create/fire/close, totals recompute
│   ├── kitchenService.ts
│   ├── inventoryService.ts
│   └── scheduleService.ts
└── schemas/                      — zod schemas for request validation
    ├── tab.ts
    ├── inventory.ts
    └── schedule.ts
```

Key implementation rules for agents:

- **Recompute totals server-side** after every mutation that affects them (item add/remove/quantity change, discount apply, tip change). Don't trust client-supplied totals.
- **Wrap multi-step writes in `prisma.$transaction`.** Especially: fire, close-out, electronic payment.
- **Use SQL aggregates** for inventory on-hand and order totals — `SUM`, `GROUP BY`. No row-by-row JS computation.
- **Validate at the route layer** with zod schemas in `src/schemas/`. Infer the request type with `z.infer<typeof Schema>` and pass the typed value into the service layer — services should never see raw `req.body`.

**TypeScript conventions for the backend:**
- `strict: true` in `tsconfig.json`. Same `noUncheckedIndexedAccess` recommendation.
- Prisma generates its own types — use them. `Prisma.OrderGetPayload<{ include: ... }>` is the right way to type joined queries; don't hand-roll.
- Augment `Express.Request` (in `src/types/express.d.ts`) so `req.employeeId` from the middleware is typed throughout.
- Money: store as Prisma `Decimal`, convert to `string` at the API boundary. Never serialize `Decimal` directly — JSON drops precision. Either use `.toString()` or a global Prisma extension.
- Dev runtime: `tsx` or `ts-node-dev` for `npm run dev`. Build to `dist/` for any production-style run.

---

## 12. Migration Plan

The two schema additions in §6 are the only DDL changes. As Prisma migrations:

```prisma
model OrderItem {
  // ...existing fields...
  fired_at         DateTime?
  kitchen_status   String   @default("staged")
}
```

Backfill for any existing data: set `kitchen_status = 'delivered'` and `fired_at = order.timestamp` for line items on completed orders. This keeps historical data consistent without inventing fire times.

---

## 13. Seed Data Requirements

Per assignment rule 3, lookup tables need ≥10 rows each. Concretely:

| Table | Min rows | Notes |
|---|---|---|
| `RESTAURANT` | 1 | Single store is fine for v1 |
| `ADDRESS` | 10+ | Mix of restaurant, employee, future use |
| `ROLE` | 10+ | server, cashier, cook, prep, expo, manager, gm, host, dishwasher, runner |
| `EMPLOYEE` | 10+ | Spread across roles via `EMPLOYEE_ROLE` |
| `PRODUCT_TYPE` | 10+ | sandwich, burger, salad, side, beverage, dessert, breakfast, kids, alcohol, special |
| `PRODUCT` | 20+ | Several per type |
| `PACKAGE` | 5+ | Combos referencing real products |
| `DISCOUNT` | 10+ | Employee discount, happy hour, senior, student, comp, etc. |

`ORDER`, `ORDER_ITEM`, `PAYMENT`, `INVENTORY_TRANSACTION`, `SHIFT` are the **frequently-modified** tables (per assignment rule 3, "at least 2 tables that require modification" — we have five).

---

## 14. Out of Scope (v1)

To keep the agent work bounded:

- Real authentication (passwords, sessions, JWT). Login is employee-id selection.
- Real payment processor integration. Card details are faked for the demo.
- Multi-store routing. The app assumes one active store per session.
- Modifiers and item customization (e.g., "no onions"). Items are atomic for v1.
- Splitting checks across multiple tabs.
- Printer / receipt integration.
- Live websockets. Polling every 5s is the contract.
- Employee clock-in / clock-out UI (the `SHIFT` columns exist but managers don't edit them).

---

## 15. Acceptance Criteria

The build is "done" for grading when:

1. A grader can log in as a server, open a new tab, add 3+ items, fire them, and see them appear on the expediter screen on a second browser tab within 5 seconds.
2. The expediter can advance the ticket through `preparing → ready`, and the server's tab view reflects "Ready to deliver".
3. The server can close out the tab with a mix of cash and electronic payment, and the tab leaves the active list.
4. A manager can view the just-closed order in the orders list with full detail.
5. A manager can adjust inventory and see on-hand recompute.
6. A manager can create and edit a shift.
7. All listed tables in §13 are populated with the minimum rows. At least five tables are demonstrably mutated by the app (orders, order_items, payments, inventory_transactions, shifts).
8. The app runs from `npm run dev` on a fresh machine with documented setup steps.
9. The app is usable at a phone-sized viewport for at least Server console and Expediter (per bonus criteria).

---

## 16. Suggested Agent Work Plan

Phased so each phase produces a runnable app. Each phase ends with a checkpoint where the human verifies before moving on.

**Phase 0 — Inventory the existing code.**
Catalog what's already implemented: which routes exist, which React pages render, what the current schema in `schema.prisma` actually contains vs. the data dictionary. Output: a written gap analysis. *Don't write code in this phase.*

**Phase 1 — Schema additions and seed.**
Apply the §6 migration. Write/refresh the seed script to satisfy §13. Verify with raw SQL queries that totals roll up.

**Phase 2 — Backend API completion.**
Implement every endpoint in §9 that doesn't already exist. Service layer with transactions for fire / close / electronic payment. Server-side total recompute. zod (or similar) validation. Integration tests for the three transactional flows are highly recommended.

**Phase 3 — Frontend foundations.**
Auth context, route guards, API client, shared components (Money, ElapsedTime, Button, Modal). Login screen.

**Phase 4 — Server console.**
Tabs list → tab detail → menu browser → fire → closeout. The largest single chunk of UI work.

**Phase 5 — Expediter screen.**
Polling, ticket grouping, elapsed time, color bands, status controls.

**Phase 6 — Manager console.**
Orders list/detail, inventory adjust, schedule grid. Lower priority than server + expediter for the demo, but required for the grade.

**Phase 7 — Polish & demo prep.**
Error states, empty states, loading skeletons. Mobile viewport check. README. Demo video script.

---

## 17. Notes for the Agent

A few places where agents tend to over-build or under-build this kind of project:

- **Don't introduce a state library.** React Context + per-route fetches is enough. Redux/Zustand will outweigh the project.
- **Don't model "tickets" as a separate table.** Group `ORDER_ITEM` rows by `fired_at` in the API response. The `TICKET` table is a v2 idea explicitly deferred in §6.2.
- **Don't compute totals on the client.** The client *displays* totals returned by the server. This protects against rounding drift and matches assignment rule 6 (bulk processing in SQL).
- **Don't skip transactions.** "Fire" and "Close out" each touch multiple rows; partial failure must roll back.
- **Don't recreate the schema.** The dictionary and ERD are authoritative. Only the §6 additions are new.
- **Don't reach for `any` to silence the type checker.** If a Prisma query result feels untypeable, it usually means the include/select shape is wrong. Fix the query, not the type.
- **Don't duplicate Prisma types by hand.** Use `Prisma.OrderGetPayload<...>` for joined shapes and `z.infer<typeof Schema>` for validated request bodies.
- **Do read the data dictionary before designing each endpoint.** Field names, nullability, and FK directions are already decided.
- **Do cite the FR ID** in the PR/commit that implements it. This makes review against this document trivial.
- **Do keep frontend and backend types in sync.** When an API contract changes, update both type definitions in the same PR.

---

## 18. Open Questions

These are decisions the human owner should make before or during Phase 2. Each one has a defaulted answer that an agent can use if not told otherwise.

1. **Multiple servers per tab?** Default: no. `ORDER.employee_id` is set at creation and never changes.
2. **Discount applied per-item or per-order?** Default: per-order only (matches `ORDER_DISCOUNT` schema).
3. **Tax rate source?** Default: a constant on the restaurant or a per-order field set at tab creation. The schema already has `ORDER.tax_percent` so we use that.
4. **Tip required for electronic payment?** Default: optional, single field on the tab, applied at close-out.
5. **Voiding a fired item — manager approval?** Default: no, server can void. Audit is preserved via `kitchen_status = 'voided'`.
6. **Inventory decrement on fire?** Default: yes. When items fire, also write `INVENTORY_TRANSACTION` rows with `reason = 'sale'` and negative quantity. This keeps inventory honest and gives the demo a second auto-mutated table.
