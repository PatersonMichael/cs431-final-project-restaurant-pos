# Analytics Dashboard — Workstream Guide

**Read `CLAUDE.md` first.** This file supplements it for the analytics dashboard feature. When they conflict, `CLAUDE.md` wins on conventions; this file wins on scope.

---

## Feature PRD

**`docs/PRD_ANALYTICS_DASHBOARD.md`** is the spec for this workstream. Read it in full before starting any phase.

## Scope

You are implementing **FR-ANALYTICS-1 through FR-ANALYTICS-7**: seven read-only analytics endpoints and a dashboard UI in the Manager Console. You are also expanding the seed data to make analytics meaningful.

**In scope:**
- Expanding `server/src/seed.ts` with 100+ realistic orders
- Seven new `GET /api/analytics/*` endpoints
- A new `Analytics.tsx` route in the Manager Console
- New chart/table components under `client/src/components/analytics/`
- A new API client module at `client/src/api/analytics.ts`
- Installing `recharts` on the frontend

**Out of scope (do not build):**
- Any schema changes. The analytics queries use existing tables only.
- UI/UX restyling, theme changes, or brand identity work. That is a separate workstream.
- Authentication or role-based access guards beyond what already exists.
- Export-to-CSV or any reporting features not listed in the PRD.
- WebSocket or real-time push for analytics data.

## Approved Additional Dependencies

| Package | Side | Purpose |
|---------|------|---------|
| `recharts` | Client | Charting (bar, line, area, donut) |

No other new dependencies. If you think you need one, ask.

## Key Technical Rules (Additive to CLAUDE.md)

1. **All aggregation happens in SQL.** Use Prisma's `$queryRaw` with tagged template literals for complex queries (GROUP BY with JOINs). Prisma's `groupBy` is acceptable for simple cases. Never fetch rows and aggregate in JavaScript — this is both a code quality rule and an explicit assignment requirement.

2. **Decimal values return as strings.** Revenue, averages, and tip totals come back as `"1234.56"` strings, consistent with the existing API contract convention (see `TabSummary.total`, `TabSummary.subtotal`).

3. **Date filtering.** All analytics endpoints accept `from` and `to` as ISO 8601 date strings. If omitted, default to the last 30 days. Always filter on `order.timestamp` and only include orders where `paymentStatus = 'paid'` (unless the endpoint's spec says otherwise).

4. **Response shapes are defined in the PRD.** Follow them exactly. Add the corresponding TypeScript interfaces to both `server/src/types/api.ts` and `client/src/types/api.ts`.

5. **Chart components are thin wrappers.** Each Recharts component (`RevenueChart`, `CategoryChart`, etc.) receives pre-fetched data as props. Data fetching lives in the parent `Analytics.tsx` page, not inside chart components.

6. **Seed data must be deterministic enough to verify.** Use seeded randomness (a fixed seed for `Math.random` or a simple PRNG) so that running the seed twice produces the same dataset. This makes it possible to write assertions against the analytics endpoints.

## Phases

### Phase 1: Seed Data + Analytics Backend
- Steps 1.1–1.10 in PRD §9
- **Checkpoint:** All 7 endpoints return correct data. Human reviews before frontend work.

### Phase 2: Analytics Frontend
- Steps 2.1–2.11 in PRD §9
- **Checkpoint:** Dashboard works end-to-end. Human reviews.

## File Locations

New files go here:

```
server/src/routes/analytics.ts        — All analytics endpoints
server/src/types/api.ts               — Add analytics response interfaces

client/src/routes/Manager/Analytics.tsx — Dashboard page
client/src/components/analytics/       — Chart and table components
client/src/api/analytics.ts            — API client functions
client/src/types/api.ts                — Mirror backend interfaces
```

The analytics router gets registered in `server/src/routes/index.ts` alongside the existing routers.

## Commit Convention

Prefix commits with the phase and cite FR-IDs:

```
[Phase 1] FR-ANALYTICS-1: Add summary analytics endpoint
[Phase 1] Seed: Expand to 120 orders with realistic distributions
[Phase 2] FR-ANALYTICS-4: Add revenue-over-time line chart
```
