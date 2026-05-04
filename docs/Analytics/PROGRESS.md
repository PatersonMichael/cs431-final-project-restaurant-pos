# Analytics Dashboard — Progress Tracker

**Workstream spec:** `docs/Analytics/PRD_ANALYTICS_DASHBOARD.md`  
**Companion rules:** `ANALYTICS_WORKSTREAM.md`  
**Main app progress:** `docs/PROGRESS.md`

---

## Current Phase: 1 Complete — Ready for Phase 2

---

## Phase 1 — Seed Data + Analytics Backend

**Status:** Complete  
**Date:** 2026-04-30  
**Checkpoint:** All 7 endpoints verified working by human.

### What shipped

**Seed data** (`server/src/seed.ts`):
- 120 completed + paid orders across Apr 1–30, 2026 (4/day)
- 6 cancelled orders for realism
- Employee distribution: Carol 50% / David 35% / Emma 15%
- Weighted item selection — burgers + sodas most common; desserts + breakfast rare
- Time distribution: lunch rush (11am–2pm) and dinner rush (5pm–9pm)
- 20% of orders carry a discount; pool: Happy Hour, Senior, Student, Military, Birthday Special, $5 Off, $10 Off, Loyalty Reward
- 70% card / 30% cash; card orders include `card` + `electronic_payment` rows with brand (Visa / Mastercard / Amex / Discover)
- Tip rates 0–25% with realistic weighting; `tip = null` for zero-tip orders
- Seeded PRNG (xorshift32, seed = 42) — deterministic across re-runs

**Analytics types** added to both `server/src/types/api.ts` and `client/src/types/api.ts`:

| Interface | FR |
|---|---|
| `AnalyticsSummaryResponse` | FR-ANALYTICS-1 |
| `SalesByEmployeeResponse`, `EmployeeSalesRow` | FR-ANALYTICS-2 |
| `TopProductsResponse`, `TopProductRow` | FR-ANALYTICS-3 |
| `RevenueOverTimeResponse`, `RevenueDataPoint` | FR-ANALYTICS-4 |
| `SalesByCategoryResponse`, `CategoryRow` | FR-ANALYTICS-5 |
| `PaymentMethodsResponse`, `PaymentMethodRow`, `CardBrandRow` | FR-ANALYTICS-6 |
| `DiscountUsageResponse`, `DiscountUsageRow` | FR-ANALYTICS-7 |

**Analytics router** (`server/src/routes/analytics.ts`, mounted at `/api/analytics`):

| Endpoint | FR | Notes |
|---|---|---|
| `GET /api/analytics/summary` | FR-ANALYTICS-1 | |
| `GET /api/analytics/sales-by-employee` | FR-ANALYTICS-2 | |
| `GET /api/analytics/top-products` | FR-ANALYTICS-3 | `?limit=` supported |
| `GET /api/analytics/revenue-over-time` | FR-ANALYTICS-4 | Auto granularity: `hour` ≤1 day, `day` otherwise |
| `GET /api/analytics/sales-by-category` | FR-ANALYTICS-5 | |
| `GET /api/analytics/payment-methods` | FR-ANALYTICS-6 | DB `electronic` mapped → `card` in response |
| `GET /api/analytics/discounts` | FR-ANALYTICS-7 | |

All endpoints accept `?from=&to=&store_number=`. Default window: last 30 days. All aggregation in SQL (`prisma.$queryRaw` + `Prisma.sql`/`Prisma.empty`) — no JS-side aggregation (NFR-A1).

**Known fix applied:** `revenue-over-time` split into two literal-format queries to satisfy MySQL `only_full_group_by` mode. Using a parameterized `${fmt}` string in both `SELECT` and `GROUP BY` produces two separate `?` placeholders, which MySQL treats as unrelated expressions.

**`tsc --noEmit` passes clean** on both client and server packages.

---

## Phase 2 — Analytics Frontend

**Status:** Complete
**Date:** 2026-05-04

### Open questions — answered

| # | Answer |
|---|--------|
| 1 | **Manager-only.** Existing `RequireRole role="manager"` guard covers `/manager/analytics`. |
| 2 | **Yes — period comparison implemented.** `DateRangeFilter` has a "Compare to prior period" toggle. When enabled, `Analytics.tsx` fires a second `getRevenueOverTime` + `getSummary` call for the prior period (same length, shifted back) and shows delta % on KPI cards and a second dashed series on the revenue chart. |
| 3 | **Deferred.** No CSV export in this release. |
| 4 | **Single-store only.** No multi-store query or selector. |

### What shipped

**New dependency:** `recharts` installed in `client/` (NFR-A5).

**New API client** (`client/src/api/analytics.ts`):
- `getSummary`, `getSalesByEmployee`, `getTopProducts`, `getRevenueOverTime`, `getSalesByCategory`, `getPaymentMethods`, `getDiscountUsage`
- All accept `(from, to, storeNumber?)` and delegate to `api.get<T>`

**New components (`client/src/components/analytics/`):**

| Component | FR | Notes |
|---|---|---|
| `DateRangeFilter.tsx` | FR-ANALYTICS-1 | Today / Last 7d / Last 30d presets + custom ISO date inputs + "Compare to prior period" toggle |
| `KpiCard.tsx` | FR-ANALYTICS-1 | Headline metric card; optional `change`/`changePositive` props for delta vs prior period |
| `SalesTable.tsx` | FR-ANALYTICS-2, FR-ANALYTICS-3 | Generic sortable table; `columns` + `rows` props; column-level `render` callbacks |
| `RevenueChart.tsx` | FR-ANALYTICS-4 | `AreaChart` (Recharts); `data` + optional `comparisonData` for two-series overlay; auto period label formatting |
| `CategoryChart.tsx` | FR-ANALYTICS-5 | `PieChart` donut (Recharts) + inline summary table with color swatches |
| `PaymentBreakdown.tsx` | FR-ANALYTICS-6 | Proportional bar rows per method + card brand table |
| `DiscountReport.tsx` | FR-ANALYTICS-7 | Table + total discount value footer |

**New page** (`client/src/routes/Manager/Analytics.tsx`):
- Parallel `Promise.all` fetch of all 7 endpoints on mount and on filter change
- When compare enabled: additional `getSummary` + `getRevenueOverTime` for prior period; KPI change % shown; second chart series rendered
- Loading spinner (centered), error banner (`bg-danger-bg`), empty-state messages per section
- `topBy` toggle ("By Qty" / "By Revenue") on Top Products card
- Layout: KPI row (2×2 → 4×1 on md+), Revenue chart full-width, Employee + Category side-by-side (stacked on mobile), Products full-width, Payment + Discount side-by-side

**Routing and nav:**
- `App.tsx`: `<Route path="analytics" element={<Analytics />} />` added under manager tree
- `ManagerLayout.tsx`: `Analytics` + `BarChart2` icon added to `NAV_ITEMS`

**`tsc --noEmit` passes clean** on both client and server packages (NFR-A6).
