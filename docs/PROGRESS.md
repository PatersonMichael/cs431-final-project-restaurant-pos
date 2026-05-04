# Restaurant POS — Progress Tracker

## Current Phase: 4 — Server Console Complete

---

## Phase 0 — Inventory & Gap Analysis

**Status:** Complete  
**Date:** 2026-04-27

### Summary

Catalogued all existing code against the PRD (docs/PRD_SRD.md), style guide, and data dictionary. No code was written in this phase.

---

### 1. Naming / File Path Discrepancy

`CLAUDE.md` references `docs/PRD.md` but the actual file is `docs/PRD_SRD.md`. All agent work uses `docs/PRD_SRD.md` as the authoritative spec. The CLAUDE.md reference should be treated as `docs/PRD_SRD.md`.

---

### 2. Schema Gaps (vs. data dictionary + PRD §6)

| Issue | Details | Priority |
|---|---|---|
| `ORDER_ITEM` missing `fired_at` | PRD §6.2 requires `fired_at DateTime?` — not present in schema | **Phase 1** |
| `ORDER_ITEM` missing `kitchen_status` | PRD §6.2 requires `kitchen_status String @default("staged")` — not present | **Phase 1** |
| `Order.preparationStatus` wrong default | Schema defaults to `'pending'`; PRD §6.1 requires `'open'` as the active-tab status | **Phase 1** |
| `Order.discount` column | Extra column (`Decimal?`) not in data dictionary; discounts are computed via `ORDER_DISCOUNT` join | Needs resolution |
| `Order.paymentStatus` column | Extra column not in data dictionary; payment state should be derived from `PAYMENT` rows | Needs resolution |
| `InventoryTransaction.packagePackageId` | Extra FK to `Package` not in data dictionary (data dict links only to `PRODUCT`) | Needs resolution |
| `Shift` missing role relation | Schema has `roleId Int` field but no `@relation` to `Role` model | **Phase 1** |

### 3. Seed Data Gaps (PRD §13 — minimum row counts)

| Table | Current | Required | Gap |
|---|---|---|---|
| `ADDRESS` | 4 | 10+ | Need 6+ more |
| `ROLE` | 3 (`Manager`, `Cashier`, `Cook`) | 10+ | Need 7+ more (`server`, `prep`, `expo`, `support`, `gm`, `host`, `dishwasher`, `runner`) |
| `EMPLOYEE` | 3 | 10+ | Need 7+ more |
| `PRODUCT_TYPE` | 2 (`Food`, `Beverage`) | 10+ | Need 8+ more (`burger`, `sandwich`, `salad`, `side`, `dessert`, `breakfast`, `kids`, `alcohol`, `special`) |
| `PRODUCT` | 5 | 20+ | Need 15+ more |
| `PACKAGE` | 2 | 5+ | Need 3+ more |
| `DISCOUNT` | 2 | 10+ | Need 8+ more (employee, happy hour, senior, student, comp, military, etc.) |

---

### 4. Backend API Gaps (vs. PRD §9)

#### Existing routes
- `GET /orders` — returns all orders (no filter params) ✓ partial
- `GET /orders/:id` — order detail ✓
- `POST /orders` — creates order with all items at once (not a tab flow) ✓ partial
- `PUT /orders/:id/status` — status update (non-standard verb; PRD uses `POST /tabs/:id/close`) ⚠️ needs replacement
- `GET /products` — all products ✓
- `GET /packages` — all packages ✓
- `GET /employees` — all employees ✓
- `POST /employees/:id/roles` — add role ✓
- `GET /inventory` — inventory levels ✓
- `GET /inventory/:product_id/history` — transaction history ✓
- `POST /inventory/:product_id/adjust` — insert transaction ✓
- `GET /payments` — payments for order ✓
- `POST /payments` — create payment ✓

#### Missing routes
- `GET /api/employees?store_number=` — filter by store (currently no store filter)
- `GET /api/employees/:id/roles` — list roles for one employee
- `GET /api/restaurants` — list stores (currently only CRUD)
- `GET /api/menu` — combined product + package list with type info
- `GET /api/product-types` — list all product types
- `GET /api/tabs?store_number=` — **core tab workflow** — not present
- `POST /api/tabs` — create new tab (open order)
- `GET /api/tabs/:order_id` — tab detail with items grouped by round
- `PATCH /api/tabs/:order_id` — update customer_name, tip
- `POST /api/tabs/:order_id/items` — add staged item
- `PATCH /api/tabs/:order_id/items/:item_id` — update quantity (staged only)
- `DELETE /api/tabs/:order_id/items/:item_id` — remove staged / void fired
- `POST /api/tabs/:order_id/fire` — **fire transaction** (atomic, updates inventory)
- `POST /api/tabs/:order_id/discounts` — apply discount
- `POST /api/tabs/:order_id/payments` — add payment (cash or electronic)
- `POST /api/tabs/:order_id/close` — close-out when paid
- `GET /api/kitchen/tickets` — active tickets for expediter
- `PATCH /api/kitchen/items/:item_id` — update single item kitchen status
- `PATCH /api/kitchen/tickets/:order_id/:fired_at` — bump entire ticket to ready
- `GET /api/orders?from=&to=&status=&employee_id=&store_number=` — filtered order list for manager
- `GET /api/schedule?from=&to=&store_number=` — shifts in window
- `POST /api/schedule` — create shift
- `PATCH /api/schedule/:shift_id` — edit shift
- `DELETE /api/schedule/:shift_id` — cancel shift

#### Missing backend architecture
- No services layer (`src/services/`) — business logic is in routes
- No zod validation schemas (`src/schemas/`)
- No `src/types/api.ts` or `src/types/domain.ts`
- No `employeeContext` middleware (for `X-Employee-Id` header)
- No global error handler middleware
- No Express request augmentation (`src/types/express.d.ts`)
- Fire, close-out, and electronic payment are **not transactional** yet

---

### 5. Frontend Gaps (vs. PRD §10 + Style Guide)

#### Directory structure divergence
Current structure (`client/src/`) vs. PRD-specified structure:

| PRD expects | Current state |
|---|---|
| `types/api.ts` + `types/domain.ts` | `types/index.ts` (monolith, no API contract alignment) |
| `api/client.ts` + per-resource files (fetch-based) | `api/*.ts` (axios-based, different resource split) |
| `auth/AuthContext.tsx` + `auth/Login.tsx` | ❌ Missing entirely |
| `routes/ServerConsole/` (4 components) | ❌ Missing entirely |
| `routes/Expediter/ExpediterBoard.tsx` | ❌ Missing entirely |
| `routes/Manager/` (4 components) | ❌ Missing entirely |
| `components/` shared library | ❌ Missing (no Button, Card, Modal, Badge, Money, ElapsedTime) |
| `hooks/usePolling.ts`, `hooks/useElapsed.ts` | ❌ Missing entirely |
| `lib/money.ts`, `lib/time.ts` | ❌ Missing entirely |

#### Styling
- **No Tailwind CSS** installed or configured
- **No dark theme** — app uses default light styling
- **No design tokens** from STYLE §2
- Missing approved deps: `tailwind-merge`, `lucide-react`, `@tailwindcss/forms`, `zod`

#### Existing pages (partial functionality only)
- `MenuPage.tsx` — shows products/packages, basic UI
- `OrderPage.tsx` — shows order details
- `CheckoutPage.tsx` — payment flow (cash/card, but no tab lifecycle)
- `OrdersManagementPage.tsx` — order list for staff

These pages will be replaced/refactored in Phases 3–6.

---

### 6. Open Questions to Resolve Before Phase 2

Per PRD §18 defaults (no action needed unless overridden):

1. Multiple servers per tab → **No** (default)
2. Discount per-item or per-order → **Per-order** (default, matches schema)
3. Tax rate source → **`ORDER.tax_percent` constant set at tab creation** (default: 8.75%)
4. Tip required for electronic payment → **Optional** (default)
5. Voiding a fired item — manager approval → **No, server can void** (default)
6. Inventory decrement on fire → **Yes** (default — write `INVENTORY_TRANSACTION` with `reason='sale'`)

Additional open question: should the extra `Order.discount` and `Order.paymentStatus` columns be removed from the schema (not in data dictionary), or retained for backward compatibility with existing seed data? **Recommend: remove `discount`, retain `paymentStatus` as a derived cache column.**

---

---

## Phase 1 — Schema Additions & Seed

**Status:** Complete  
**Date:** 2026-04-27

### What shipped

- **Migration `20260427212949_phase1_schema_additions`** applied:
  - Added `firedAt DateTime?` and `kitchenStatus String @default("staged")` to `OrderItem` (PRD §6.2)
  - Changed `Order.preparationStatus` default from `'pending'` to `'open'` (PRD §6.1)
  - Made `Order.customerName` nullable (PRD — customer name is optional)
  - Dropped `Order.discount` (derived from `ORDER_DISCOUNT` joins)
  - Dropped `InventoryTransaction.packagePackageId` (not in data dictionary)
  - Added `Shift → Role` FK relation
  - Cleaned up stale `employeeEmployeeId` and `addressAddressId` columns from prior migrations
- **Seed data** expanded to meet all PRD §13 minimums:
  - Addresses: 13 | Roles: 10 | Employees: 10 | Product types: 10 | Products: 22 | Packages: 5 | Discounts: 10
- **DB name**: `restaurantpos` (hyphen-free, avoids SQL syntax issues)
- **`.env` pattern** established: `DATABASE_URL` for Prisma CLI, individual vars for runtime MariaDB adapter; password quoted to preserve `#` character
- **SQL `SUM` aggregation** verified working correctly for inventory on-hand

---

## Phase 2 — Backend API Completion

**Status:** Complete
**Date:** 2026-04-27

### What shipped

**Architecture (NFR-1, NFR-4, NFR-9, NFR-10)**
- `src/types/express.d.ts` — augments `req.employeeId`
- `src/types/api.ts` — all request/response DTOs
- `src/middleware/employeeContext.ts` — parses `X-Employee-Id` header
- `src/middleware/errorHandler.ts` — ZodError → 400, Prisma not-found → 404, domain errors → 422

**Zod schemas** (`src/schemas/`) — validation for tab, inventory, schedule bodies

**Service layer** (`src/services/`):
- `tabService.ts` — getOpenTabs, createTab, getTabDetail, patchTab, addItem, updateItemQuantity, removeItem, fireItems (atomic tx with inventory decrement), applyDiscount, addPayment (atomic tx for electronic), closeTab (atomic tx with payment check). `recomputeTotals` uses SQL `SUM(quantity * price_at_purchase)` (NFR-3).
- `kitchenService.ts` — getActiveTickets (grouped by order+firedAt), updateItemStatus, bumpTicket
- `inventoryService.ts` — getInventory (SQL SUM GROUP BY, NFR-3), getProductHistory (SQL SUM), adjustInventory
- `scheduleService.ts` — getShifts (date/store filter), createShift (validates employee has role per FR-SCH-4), updateShift (blocks if clocked in), deleteShift (blocks if clocked in)

**New routes registered in `/api`:**
- `POST /api/tabs`, `GET /api/tabs?store_number=` — FR-TAB-1, FR-TAB-3
- `GET/PATCH /api/tabs/:id` — FR-TAB-4, FR-TAB-5
- `POST/PATCH/DELETE /api/tabs/:id/items` — FR-TAB-7, FR-TAB-8, FR-TAB-9
- `POST /api/tabs/:id/fire` — FR-TAB-10
- `POST /api/tabs/:id/discounts` — FR-PAY-2
- `POST /api/tabs/:id/payments` — FR-PAY-3, FR-PAY-4
- `POST /api/tabs/:id/close` — FR-PAY-5
- `GET /api/kitchen/tickets` — FR-EXP-1, FR-EXP-2, FR-EXP-3
- `PATCH /api/kitchen/items/:id`, `PATCH /api/kitchen/tickets/:order_id/:fired_at`
- `GET /api/menu`, `GET /api/menu/product-types`
- `GET/POST/PATCH/DELETE /api/schedule` — FR-SCH-1 – FR-SCH-4

**Updated routes:**
- `GET /api/employees` — adds `?store_number=` filter + active-only (FR-AUTH-1)
- `GET /api/employees/:id/roles` — new (FR-AUTH-2)
- `GET /api/inventory` — rebuilt on SQL SUM + `?product_type_id=` filter (FR-INV-1, FR-INV-2, NFR-3)
- `GET /api/inventory/:id/history`, `POST /api/inventory/:id/adjust` — path now matches PRD §9
- `GET /api/orders` — adds `?from=&to=&status=&employee_id=&store_number=` filters (FR-MGR-1)

**`tsc --noEmit` passes clean** (`strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).

---

## Phase 3 — Frontend Foundations

**Status:** Complete
**Date:** 2026-04-27

### What shipped

**Dependencies installed (all approved per CLAUDE.md):**
- `tailwindcss` v4, `@tailwindcss/vite`, `@tailwindcss/forms`, `tailwind-merge`, `lucide-react`, `zod`
- `strict: true` added to `tsconfig.app.json` — `tsc --noEmit` passes clean

**Tailwind v4 configuration (STYLE §2):**
- `vite.config.ts` updated with `@tailwindcss/vite` plugin
- `src/index.css` — `@import "tailwindcss"` + `@plugin "@tailwindcss/forms"` + full `@theme {}` block with all surface, text, border, and semantic color tokens from STYLE §2

**Lib utilities:**
- `src/lib/cn.ts` — `tailwind-merge` helper
- `src/lib/money.ts` — `formatMoney`, `isNegative` (Intl.NumberFormat, no float math)
- `src/lib/time.ts` — `elapsedSeconds`, `formatElapsed`, `getTimeBand`, expediter thresholds (STYLE §2.4)

**Types & API client:**
- `src/types/api.ts` — all frontend DTOs mirroring backend `server/src/types/api.ts` (NFR-10)
- `src/api/client.ts` — fetch-based, injects `X-Employee-Id` from localStorage, `ApiError` class
- Per-resource files: `tabs.ts`, `menu.ts`, `kitchen.ts`, `employees.ts`, `inventory.ts`, `orders.ts`, `schedule.ts`

**Auth (FR-AUTH-1, FR-AUTH-2, FR-AUTH-3, FR-AUTH-4):**
- `src/auth/AuthContext.tsx` — `Session` type, `AuthProvider`, `useAuth` hook, `getRoleCategories` (maps role names → `server | kitchen | manager` categories), localStorage persistence
- `src/auth/Login.tsx` — store selector → employee picker → role chooser (shown only when employee has >1 category) → sign-in

**Shared components (STYLE §5):**
- `Button` — 4 intents (primary, secondary, danger, ghost), 3 sizes, loading spinner (§5.1)
- `Input`, `Select` — error state, focus ring (§5.2)
- `Label` — required `*` marker (§5.2)
- `Card`, `CardHeader`, `CardBody`, `CardFooter` (§5.3)
- `Badge` + `statusTone` helper — 5 tones (§5.5)
- `Modal` — overlay, Escape/click-outside close, focus trap, focus restore (§5.6)
- `Money` — `formatMoney`, negative → `text-danger` (§5.9)
- `ElapsedTime` — uses `useElapsed` (§5.10)

**Hooks:**
- `src/hooks/useElapsed.ts` — single global 1-second ticker (§5.10 note)
- `src/hooks/usePolling.ts` — `enabled` flag, cleans up on unmount

**Layouts (stubs, content in Phases 4–6):**
- `src/layouts/ServerLayout.tsx` — top bar + `<Outlet />` (STYLE §4.3)
- `src/layouts/ExpediterLayout.tsx` — minimal header + full-width main
- `src/layouts/ManagerLayout.tsx` — top bar + left nav (Orders / Inventory / Schedule) + `<Outlet />`

**App shell:**
- `src/App.tsx` — `RequireAuth` / `RequireRole` guards, role-based routing (`/server`, `/expediter`, `/manager`), stub `ComingSoon` placeholders for Phase 4–6 routes
- `src/main.tsx` — wraps with `<AuthProvider>`

---

## Phase 4 — Server Console

**Status:** Complete
**Date:** 2026-04-28

### What shipped

**New components (`client/src/components/`):**
- `Select.tsx` — select input matching Input style (STYLE §5.2)
- `TabItemRow.tsx` — line-item row with qty stepper / trash / void per kitchen_status (STYLE §5.7)

**New routes (`client/src/routes/ServerConsole/`):**
- `TabsList.tsx` — persistent left rail: open tabs list with elapsed time, subtotal, ready indicator, "New Tab" modal (FR-TAB-1, FR-TAB-2, FR-TAB-3)
- `TabDetail.tsx` — main panel: staged items + round sections + menu browser side-by-side; Fire button; qty stepper on staged; void on fired; mobile Order/Menu tab toggle (FR-TAB-4, FR-TAB-5, FR-TAB-6, FR-TAB-7, FR-TAB-8, FR-TAB-9, FR-TAB-10, FR-TAB-11)
- `MenuBrowser.tsx` — product type filter chips, item grid with add buttons (FR-TAB-6, FR-TAB-7)
- `Closeout.tsx` — totals summary, tip input, discount picker, cash/electronic payment form, Close Tab button (FR-PAY-1, FR-PAY-2, FR-PAY-3, FR-PAY-4, FR-PAY-5, FR-PAY-6)

**Layout update:**
- `ServerLayout.tsx` — two-panel: 288px collapsible left rail + `<Outlet />` main panel; mobile hamburger toggle (STYLE §4.3, §4.4)

**Backend fix:**
- `GET /api/menu/product-types` — corrected field name from `type_id` → `product_type_id` (NFR-10 contract alignment)
- `GET /api/menu/discounts` — new endpoint returning all discounts for close-out UI (FR-PAY-2)
- `ProductTypeResponse` + `DiscountListItem` types added to `server/src/types/api.ts` and `client/src/types/api.ts`

**App.tsx:** routes updated; `/server/tabs/:orderId` → TabDetail, `/server/tabs/:orderId/closeout` → Closeout

**`tsc --noEmit` passes clean** on both client and server packages.

**Post-checkpoint fixes (also Phase 4):**
- Vite dev proxy added (`/api` → `http://localhost:3000`) — frontend/backend were not connected
- `GET /api/restaurants` — Login now fetches store list dynamically instead of hardcoded
- `GET /api/employees` — DTO mapped to snake_case `EmployeeResponse` (was returning raw Prisma camelCase)
- Raw SQL column names fixed throughout `tabService.ts` and `inventoryService.ts` (`camelcase_relations` migration renamed all columns)
- `DELETE /api/tabs/:id/discounts/:discount_id` — new endpoint; delete discount before close (FR-PAY-2)
- `DELETE /api/tabs/:id/payments/:payment_id` — new endpoint; delete payment before close
- Closeout UX: integer-cents keypad, denomination buttons, exact/overpayment handling, change-due display and confirmation modal, trash icons on payments and discounts
- Tax calculation fixed to apply after discounts (`taxableAmount = subtotal − discounts`, matches displayed tax line)

---

## Phase 5 — Expediter Screen

**Status:** Complete
**Date:** 2026-04-28

### What shipped

**Board (`ExpediterBoard.tsx`)** (FR-EXP-1 – FR-EXP-4)
- Ticket-level view: no per-item status controls; tickets are "in progress" as soon as they appear
- `TicketCard`: order #, customer name, item list, live elapsed time, left-border color band (green/yellow/red)
- **Double-tap / double-click to bump** — optimistic removal immediately, no linger
- `usePolling` at 5 s (FR-EXP-4); oldest-fired first (FR-EXP-3)

**Archive (`ExpediterArchive.tsx`)**
- `GET /api/kitchen/archive?store_number=` — today's `ready` tickets, polled every 10 s
- Reopen: `POST /api/kitchen/tickets/:order_id/:fired_at/reopen` sets items back to `preparing`

**Backend additions**
- `getArchiveTickets(storeNumber?)` — items with `kitchenStatus = 'ready'` + today's UTC date range
- `reopenTicket(orderId, firedAt)` — `updateMany` back to `preparing`
- `GET /api/kitchen/tickets` now filters by `store_number`
- `GET /api/kitchen/archive` and `POST .../reopen` new routes

**Layout / routing**
- `ExpediterLayout.tsx` — Board / Archive tab nav in header
- `App.tsx` — `/expediter/archive` route added

**`tsc --noEmit` passes clean** on both client and server packages.

**Post-checkpoint fix (also Phase 5)**
- `closeTab` now auto-fires any staged items atomically inside the close transaction — inventory transactions written, `firedAt` stamped — so items are never silently dropped from the kitchen when a tab is closed without an explicit Fire
- `Closeout.tsx` shows a yellow warning banner when staged items are present ("X unfired items will be sent to the kitchen on close")

---

## Phase 6 — Manager Console

**Status:** Complete
**Date:** 2026-04-28

### What shipped

**Backend fixes**
- `GET /api/orders` — now maps Prisma output to `OrderSummary[]` DTOs (snake_case, `employee_name` resolved) (FR-MGR-1)
- `GET /api/orders/:id` — now maps to `OrderDetail` DTO: staged items, rounds grouped by `fired_at`, discounts, payments (FR-MGR-2)
- `OrderSummary`, `OrderDetail`, `RoleResponse`, `ShiftResponse` (with `clock_in/out_timestamp`), `InventoryHistoryResponse` added to `server/src/types/api.ts` (NFR-10)

**Frontend type fixes (NFR-10)**
- `ShiftResponse` updated with `clock_in_timestamp` / `clock_out_timestamp`
- `OrderDetail`, `InventoryHistoryResponse` added to `client/src/types/api.ts`
- `getOrderDetail` added to `client/src/api/orders.ts`
- `getInventoryHistory` return type corrected to `InventoryHistoryResponse`
- `Badge.statusTone`: added `'completed' → success`, `'cancelled' → danger`

**New routes (`client/src/routes/Manager/`)**
- `OrdersList.tsx` — date range + status + employee filters, defaults to today, click row → detail (FR-MGR-1)
- `OrderDetail.tsx` — read-only: header, staged/rounds sections, discounts, payments, totals summary (FR-MGR-2, FR-MGR-3)
- `Inventory.tsx` — type-filter chips, table with on-hand (SQL SUM), danger highlight for ≤ 0, Adjust modal (signed qty, reason, note), History modal (last 50 transactions) (FR-INV-1, FR-INV-2, FR-INV-3, FR-INV-4)
- `Schedule.tsx` — week grid (employees × Mon–Sun), prev/next/today navigation, click empty cell → create shift modal (employee+date preselected, role dropdown filtered to employee's roles, time pickers, FR-SCH-4 validation), click shift → edit/cancel modal (blocked with warning if clocked in) (FR-SCH-1, FR-SCH-2, FR-SCH-3, FR-SCH-4)

**App.tsx** — ComingSoon stubs replaced; `/manager/orders/:orderId` route added

**`tsc --noEmit` passes clean** on both client and server packages.

---

## Post-Phase 6 Fixes & Features

**Date:** 2026-04-29

### Bug fixes (from checkpoint testing)

- **Orders — payment status visible**: Added `payment_status` badge column to `OrdersList.tsx` (`unpaid` → warning, `paid` → success)
- **Orders — filter persistence**: Filters (`from`, `to`, `status`, `employee_id`) now live in URL query params via `useSearchParams`. Back-navigating from order detail restores filters exactly.
- **Inventory — manual disable**: Added `PATCH /api/inventory/:id/availability` + Enable/Disable toggle button per row — allows marking items unavailable regardless of stock level.
- **Schedule — role selection broken**: `GET /api/employees/:id/roles` was returning raw Prisma `{ roleId }` (camelCase) instead of `{ role_id }`. The select `value` was always `undefined`, so selection had no visible effect and `NaN` was sent to the backend. Fixed route mapping.

### New features (requested post-checkpoint)

**Inventory auto-disable on zero stock**
- `tabService.fireItems` now runs SQL SUM for each decremented product after writing its `INVENTORY_TRANSACTION`. If `on_hand ≤ 0` and the item is not infinite, `isAvailable` is set to `false` inside the same transaction.
- `inventoryService.adjustInventory` already had this check; now also skips infinite items.
- `addItem` already validates `isAvailable` — no change needed there.

**Infinite availability flag**
- Migration `20260429015133`: added `isInfinite BOOLEAN DEFAULT FALSE` to `orderable_item`.
- `PATCH /api/inventory/:id/infinite` toggles the flag.
- `getInventory` and `getProductHistory` return `is_infinite` in their DTOs.
- Inventory table shows `∞` instead of a number for infinite items; danger highlight suppressed; `∞ Infinite` toggle button per row.
- Auto-disable skips infinite items in both `adjustInventory` and `fireItems`.

**Schedule — shift overlap validation (FR-SCH-4 extension)**
- `createShift` and `updateShift` now reject if any existing shift for the employee overlaps `[start, end)`. Error message includes the conflicting shift's time range. `updateShift` excludes the shift being edited from the query so saving without changes never self-conflicts.

---

## Phase 7 — Polish & Demo Prep

**Status:** Complete
**Date:** 2026-04-28

### Scope (PRD §16)

| Area | Work |
|---|---|
| Error states | User-visible error messages for all failure paths (network, 4xx, 5xx) — no raw stack traces (NFR-7) |
| Empty states | Meaningful zero-data messages on all list views |
| Loading states | Loading indicators / skeletons on initial fetches |
| Mobile viewport | Verify all three surfaces work at 375 px wide; fix any critical layout breaks |
| README | Accurate top-level README: prerequisites, env setup, seed, dev server commands |
| Demo prep | Verify full golden path end-to-end: login → open tab → order → fire → expediter → close out → manager review |

### What shipped

**Shared `Spinner` component** (`client/src/components/Spinner.tsx`) — sm/md/lg sizes; replaces inline `animate-spin` divs and "Loading…" text across all views.

**Loading states added** (NFR-7):
- `ExpediterBoard` and `ExpediterArchive`: spinner shown until first poll completes (previously showed empty state or nothing)
- `OrderDetail`, `OrdersList`, `Inventory`, `Schedule`: upgraded from plain "Loading…" text to spinner; history modal in Inventory also uses spinner

**Error feedback plugged** (NFR-7):
- `ExpediterBoard.bumpTicket` failure: inline `text-danger` message (previously silent, state was restored but user saw nothing)
- `ExpediterArchive.reopenTicket` failure: inline `text-danger` message (previously silent)
- `Inventory.toggleAvailability` / `toggleInfinite` failure: inline `text-danger` message (previously silent)

**Empty state**: `OrderDetail` returns "Order not found." instead of `null` when `order` is missing after load.

**Mobile (375px)**:
- `ManagerLayout`: fixed 176px left nav hidden on mobile; hamburger + slide-in drawer overlay added (mirrors `ServerLayout` pattern exactly); nav links close drawer on click
- `ExpediterLayout` and `ManagerLayout`: employee name hidden on xs screens (`hidden sm:inline`) to prevent header overflow

**README** written from scratch: prerequisites, `.env` setup, `prisma migrate deploy`, seed command, dev server commands, demo golden path (all three surfaces), and project structure tree.

**`tsc --noEmit` passes clean** on both client and server packages.

---

## Analytics Phase 1 — Seed Data + Analytics Backend

**Status:** Complete
**Date:** 2026-04-30

### What shipped

**Seed data expanded** (`server/src/seed.ts`):
- 120 completed + paid orders spread across Apr 1–30, 2026 (4 per day)
- 6 cancelled orders for realism
- Orders distributed across server employees: Carol (50%), David (35%), Emma (15%)
- Weighted item selection — burgers and sodas ordered most; desserts and breakfast items rare
- Lunch rush (11am–2pm) and dinner rush (5pm–9pm) period distribution
- 20% of orders have a discount (Happy Hour, Senior, Student, Military, Birthday, $5/$10 Off, Loyalty Reward)
- 70% card / 30% cash payments; card orders include `card` and `electronic_payment` records with brand (Visa/Mastercard/Amex/Discover)
- Tip rates (0–25%) with realistic distribution; `tip=null` for no-tip orders
- Seeded PRNG (xorshift32, seed=42) — re-running seed produces identical dataset (NFR-A6 testability)

**New analytics types** added to both `server/src/types/api.ts` and `client/src/types/api.ts` (NFR-A4, NFR-A6):
- `AnalyticsSummaryResponse` (FR-ANALYTICS-1)
- `SalesByEmployeeResponse`, `EmployeeSalesRow` (FR-ANALYTICS-2)
- `TopProductsResponse`, `TopProductRow` (FR-ANALYTICS-3)
- `RevenueOverTimeResponse`, `RevenueDataPoint` (FR-ANALYTICS-4)
- `SalesByCategoryResponse`, `CategoryRow` (FR-ANALYTICS-5)
- `PaymentMethodsResponse`, `PaymentMethodRow`, `CardBrandRow` (FR-ANALYTICS-6)
- `DiscountUsageResponse`, `DiscountUsageRow` (FR-ANALYTICS-7)

**New analytics router** (`server/src/routes/analytics.ts`, registered at `/api/analytics`):
- All 7 endpoints: `summary`, `sales-by-employee`, `top-products`, `revenue-over-time`, `sales-by-category`, `payment-methods`, `discounts`
- All aggregation in SQL via `prisma.$queryRaw` + `Prisma.sql`/`Prisma.empty` (NFR-A1)
- Optional `?from=&to=&store_number=` on every endpoint; defaults to last 30 days
- Only `paymentStatus = 'paid'` orders counted in revenue metrics
- `payment.type = 'electronic'` mapped to `"card"` in FR-ANALYTICS-6 response
- Granularity auto-selects `hour` for ≤1-day range, `day` otherwise (FR-ANALYTICS-4)
- Revenue/monetary values returned as 2-decimal strings (consistent with existing API contract)

**`tsc --noEmit` passes clean** on both client and server packages.
