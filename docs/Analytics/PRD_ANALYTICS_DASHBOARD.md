# Restaurant POS — Analytics Dashboard

**Project:** CS431 Restaurant POS — Feature Expansion  
**Author:** Claude (drafted for human review)  
**Status:** Draft v1  
**Date:** April 29, 2026

---

## 1. Executive Summary

A new analytics section within the Manager Console that surfaces business intelligence: sales by employee, top-selling products, revenue trends over time, and payment method breakdowns. All queries run against existing tables — no schema changes required.

---

## 2. What We Have Today (Baseline)

### 2.1 Data Model (relevant tables)

| Table | Analytics Value |
|-------|----------------|
| `order` | `total`, `subtotal`, `tip`, `timestamp`, `employeeId`, `paymentStatus`, `preparationStatus` |
| `order_item` | `quantity`, `priceAtPurchase`, `itemId`, `firedAt`, `kitchenStatus` |
| `orderable_item` → `product` | `name`, `basePrice`, `typeId` |
| `product_type` | Category grouping (Burger, Beverage, etc.) |
| `payment` | `type` (cash/card), `amount` |
| `employee` | `firstName`, `lastName`, `employeeId` |
| `shift` | `startTimestamp`, `endTimestamp`, `clockInTimestamp`, `clockOutTimestamp` |
| `discount` / `order_discount` | Discount usage tracking |

### 2.2 Existing API Surface

The `/api/orders` endpoint already supports `from`, `to`, `status`, `employee_id`, and `store_number` filters. However, it returns full order summaries rather than aggregated analytics — every analytics query today would require fetching all orders and aggregating client-side, which doesn't scale.

### 2.3 Current Frontend

Three role-based consoles (Server, Expediter, Manager) with a shared dark theme. The Manager Console has left-nav with Orders, Inventory, and Schedule tabs. The analytics dashboard will be a fourth tab.

### 2.4 Seed Data Limitation

The seed script creates only **1 completed order**. Analytics are meaningless without volume. The seed must be expanded significantly (see §8).

---

## 3. Feature Requirements — Analytics Dashboard

### FR-ANALYTICS-1: Sales Summary Cards

**What:** A top-row of KPI cards showing headline numbers for the selected time range.

**Metrics:**
- Total Revenue (sum of `order.total` where `paymentStatus = 'paid'`)
- Total Orders (count)
- Average Order Value (revenue ÷ orders)
- Total Tips (sum of `order.tip`)

**Filters:** Date range picker (today / last 7 days / last 30 days / custom range). All analytics views share this filter.

**API:** `GET /api/analytics/summary?from=&to=&store_number=`

**Response:**
```json
{
  "total_revenue": "4523.50",
  "total_orders": 127,
  "average_order_value": "35.62",
  "total_tips": "589.25",
  "period": { "from": "2026-04-01", "to": "2026-04-29" }
}
```

---

### FR-ANALYTICS-2: Sales by Employee

**What:** A ranked table showing each server's total sales, order count, average ticket size, and total tips earned for the selected period.

**API:** `GET /api/analytics/sales-by-employee?from=&to=&store_number=`

**Response:**
```json
{
  "employees": [
    {
      "employee_id": 3,
      "name": "Carol Martinez",
      "total_sales": "1842.30",
      "order_count": 52,
      "average_ticket": "35.43",
      "total_tips": "231.50"
    }
  ]
}
```

**Frontend:** Sortable table. Default sort: total sales descending. Optional bar chart visualization alongside the table.

---

### FR-ANALYTICS-3: Top-Selling Products

**What:** Ranked list of products by quantity sold and by revenue generated.

**API:** `GET /api/analytics/top-products?from=&to=&store_number=&limit=10`

**Response:**
```json
{
  "by_quantity": [
    {
      "product_id": 1,
      "name": "Classic Burger",
      "category": "Burger",
      "quantity_sold": 89,
      "revenue": "800.11"
    }
  ],
  "by_revenue": [
    {
      "product_id": 4,
      "name": "Mushroom Swiss Burger",
      "category": "Burger",
      "quantity_sold": 34,
      "revenue": "441.66"
    }
  ]
}
```

**Frontend:** Two-column layout or toggle between "by quantity" and "by revenue." Horizontal bar chart with product names on the y-axis.

---

### FR-ANALYTICS-4: Revenue Over Time

**What:** A time-series chart showing revenue per day (or per hour if range ≤ 1 day).

**API:** `GET /api/analytics/revenue-over-time?from=&to=&store_number=&granularity=day`

**Response:**
```json
{
  "granularity": "day",
  "data": [
    { "period": "2026-04-01", "revenue": "342.50", "order_count": 12 },
    { "period": "2026-04-02", "revenue": "518.75", "order_count": 18 }
  ]
}
```

**Frontend:** Line chart or area chart. Hover tooltip shows exact values. granularity auto-selects: `hour` for single-day ranges, `day` for multi-day ranges.

---

### FR-ANALYTICS-5: Sales by Category

**What:** Revenue and quantity breakdown by product type (Burger, Beverage, Side, etc.).

**API:** `GET /api/analytics/sales-by-category?from=&to=&store_number=`

**Response:**
```json
{
  "categories": [
    {
      "type_id": 1,
      "category": "Burger",
      "quantity_sold": 156,
      "revenue": "1623.44",
      "percentage_of_revenue": 35.8
    }
  ]
}
```

**Frontend:** Donut or pie chart showing revenue share, plus a summary table.

---

### FR-ANALYTICS-6: Payment Method Breakdown

**What:** How customers are paying — cash vs. card split, with card brand breakdown.

**API:** `GET /api/analytics/payment-methods?from=&to=&store_number=`

**Response:**
```json
{
  "methods": [
    { "type": "card", "count": 89, "total": "3241.50", "percentage": 71.6 },
    { "type": "cash", "count": 38, "total": "1282.00", "percentage": 28.4 }
  ],
  "card_brands": [
    { "brand": "Visa", "count": 52, "total": "1920.00" },
    { "brand": "Mastercard", "count": 37, "total": "1321.50" }
  ]
}
```

---

### FR-ANALYTICS-7: Discount Usage Report

**What:** Which discounts are being applied, how often, and total dollar impact.

**API:** `GET /api/analytics/discounts?from=&to=&store_number=`

**Response:**
```json
{
  "discounts": [
    {
      "discount_id": 1,
      "name": "Employee Discount",
      "times_used": 14,
      "total_value": "126.30",
      "type": "percent"
    }
  ],
  "total_discount_value": "342.80"
}
```

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-A1 | All analytics queries must execute server-side using SQL aggregation (Prisma raw queries or `groupBy`). No fetching all rows and aggregating in JS. |
| NFR-A2 | Analytics endpoints should respond in < 500ms for datasets up to 10,000 orders. |
| NFR-A3 | Date range filters use ISO 8601 strings. The server normalizes timezone handling. |
| NFR-A4 | All new endpoints follow the existing snake_case JSON contract convention. |
| NFR-A5 | New dependencies limited to: `recharts` (charting). No other UI framework additions. |
| NFR-A6 | All new components must be TypeScript strict-mode compliant. |

---

## 5. Schema Changes

**None required.** All analytics queries can be built from existing tables. The data model already captures everything needed: order totals, item-level pricing, employee assignments, payment types, and timestamps.

---

## 6. New API Endpoints (Summary)

| Method | Path | FR |
|--------|------|----|
| GET | `/api/analytics/summary` | FR-ANALYTICS-1 |
| GET | `/api/analytics/sales-by-employee` | FR-ANALYTICS-2 |
| GET | `/api/analytics/top-products` | FR-ANALYTICS-3 |
| GET | `/api/analytics/revenue-over-time` | FR-ANALYTICS-4 |
| GET | `/api/analytics/sales-by-category` | FR-ANALYTICS-5 |
| GET | `/api/analytics/payment-methods` | FR-ANALYTICS-6 |
| GET | `/api/analytics/discounts` | FR-ANALYTICS-7 |

All endpoints accept `?from=&to=&store_number=` query parameters.

---

## 7. Seed Data Expansion

The current seed has 1 completed order. Analytics need volume. The seed script should be expanded to generate:

- **100+ completed orders** spread across the past 30 days
- Orders distributed across multiple employees (Carol, David, and others with server roles)
- Realistic product mix (burgers and beverages ordered more than desserts)
- A blend of cash and card payments with various card brands
- Several discount applications
- Varying tip amounts (0–25% of subtotal)
- Timestamps spread across lunch and dinner rush periods
- A few voided/cancelled orders for realism

This is a prerequisite for Phase 1. Without seed data, there's nothing to visualize.

---

## 8. Frontend Architecture

### 9.1 New Route Structure

```
/manager/analytics              → AnalyticsDashboard (new)
```

Added to the Manager Console's left-nav, between Schedule and a potential future "Reports" section.

### 9.2 New Components

```
client/src/routes/Manager/
  Analytics.tsx                  — Dashboard page (layout + filter bar + panels)

client/src/components/analytics/
  DateRangeFilter.tsx            — Shared date range picker
  KpiCard.tsx                    — Summary metric card
  SalesTable.tsx                 — Sortable table for employee/product data
  RevenueChart.tsx               — Line/area chart (Recharts)
  CategoryChart.tsx              — Donut chart (Recharts)
  PaymentBreakdown.tsx           — Payment method visualization
  DiscountReport.tsx             — Discount usage table
```

### 9.3 New API Client Functions

```
client/src/api/analytics.ts      — All 7 analytics endpoints
```

---

## 9. Implementation Plan

### Phase 1: Seed Data + Analytics Backend (Backend-First)

**Goal:** Robust seed data and all 7 analytics API endpoints, tested with real queries.

| Step | Task | FR |
|------|------|----|
| 1.1 | Expand `seed.ts` to generate 100+ realistic orders with payments, discounts, tips | §7 |
| 1.2 | Create `server/src/routes/analytics.ts` with the summary endpoint | FR-ANALYTICS-1 |
| 1.3 | Add sales-by-employee endpoint | FR-ANALYTICS-2 |
| 1.4 | Add top-products endpoint | FR-ANALYTICS-3 |
| 1.5 | Add revenue-over-time endpoint | FR-ANALYTICS-4 |
| 1.6 | Add sales-by-category endpoint | FR-ANALYTICS-5 |
| 1.7 | Add payment-methods endpoint | FR-ANALYTICS-6 |
| 1.8 | Add discounts endpoint | FR-ANALYTICS-7 |
| 1.9 | Register analytics router in `routes/index.ts` | — |
| 1.10 | Manually test all endpoints against seeded data | — |

**Checkpoint:** All 7 endpoints return correct data against the expanded seed. Human reviews before frontend work begins.

---

### Phase 2: Analytics Frontend

**Goal:** The analytics dashboard is visible and functional in the Manager Console.

| Step | Task | FR |
|------|------|----|
| 2.1 | Install `recharts`, add `client/src/api/analytics.ts` | — |
| 2.2 | Build `DateRangeFilter` component with preset ranges + custom picker | FR-ANALYTICS-1 |
| 2.3 | Build `KpiCard` and the summary row | FR-ANALYTICS-1 |
| 2.4 | Build sales-by-employee table with sort | FR-ANALYTICS-2 |
| 2.5 | Build top-products chart (horizontal bars) | FR-ANALYTICS-3 |
| 2.6 | Build revenue-over-time line chart | FR-ANALYTICS-4 |
| 2.7 | Build category donut chart | FR-ANALYTICS-5 |
| 2.8 | Build payment methods breakdown | FR-ANALYTICS-6 |
| 2.9 | Build discount usage report | FR-ANALYTICS-7 |
| 2.10 | Compose `Analytics.tsx` page, add route + nav item | — |
| 2.11 | TypeScript check (`tsc --noEmit`), visual QA | — |

**Checkpoint:** Dashboard works end-to-end. Human reviews.

---

## 10. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should analytics be accessible only to the "manager" role, or should a read-only view be available to other roles? | Routing/auth guards |
| 2 | Should the revenue-over-time chart support comparing two periods (e.g., this week vs. last week)? | FR-ANALYTICS-4 scope |
| 3 | Is there interest in an "export to CSV" feature for any of the analytics tables? | Potential FR addition |
| 4 | The seed data currently hardcodes one restaurant (store 100). Should analytics support multi-store comparison, or is single-store sufficient? | Query scope |

---

## 11. Dependencies & Risk

| Risk | Mitigation |
|------|------------|
| Prisma raw SQL is needed for complex aggregations (GROUP BY with JOINs). Prisma's `groupBy` is limited. | Use `$queryRaw` with tagged template literals for type safety. Test each query against the seed data. |
| Recharts adds ~45KB gzipped to the bundle. | Only import specific chart components, not the whole library. This is a manager-only route, so it won't affect Server/Expediter load times. |
| Seed data randomization could produce unrealistic distributions. | Use weighted random selection — burgers and sodas sell more than desserts. Lunch rush (11am–2pm) and dinner (5pm–9pm) get more volume. |
