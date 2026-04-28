---
name: Phase 0 Gap Analysis
description: Key findings from Phase 0 inventory — what exists, what's missing, what conflicts with the spec
type: project
---

Completed 2026-04-27. Full detail in docs/PROGRESS.md.

**Schema gaps requiring Phase 1 migration:**
- `OrderItem` missing `fired_at DateTime?` and `kitchen_status String @default("staged")`
- `Order.preparationStatus` defaults to `'pending'`; PRD requires `'open'`
- `Shift` model has `roleId` field but no `@relation` to `Role`
- Extra columns not in data dictionary: `Order.discount`, `Order.paymentStatus`, `InventoryTransaction.packagePackageId`

**Seed data well below PRD §13 minimums:** ADDRESS(4/10), ROLE(3/10), EMPLOYEE(3/10), PRODUCT_TYPE(2/10), PRODUCT(5/20), PACKAGE(2/5), DISCOUNT(2/10)

**Backend missing entirely:** services layer, zod schemas, types/api.ts, employeeContext middleware, error handler, all `/tabs/*` routes, all `/kitchen/*` routes, all `/schedule/*` routes, `/menu`, `/product-types`

**Frontend missing entirely:** Tailwind CSS, dark theme, auth/login, role-based routing, all three role surfaces (Server/Expediter/Manager), shared component library (Button, Card, Modal, Badge, Money, ElapsedTime), hooks/, lib/, proper api/ structure

**Why:** Project was in early scaffolding state — backend has basic CRUD, frontend has placeholder pages. The PRD describes the full POS vision that needs to be built on top.

**How to apply:** Before starting any phase, check PROGRESS.md for what's done. Each phase in PRD §16 addresses a specific layer of this gap.
