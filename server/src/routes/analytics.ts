import { Router, type Request, type Response } from "express";
import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../db.ts";
import type {
  AnalyticsSummaryResponse,
  SalesByEmployeeResponse,
  TopProductsResponse,
  RevenueOverTimeResponse,
  SalesByCategoryResponse,
  PaymentMethodsResponse,
  DiscountUsageResponse,
} from "../types/api.ts";

const router = Router();

// ── Shared helpers ────────────────────────────────────────────────────────────

function parseDateRange(req: Request): { from: Date; to: Date; fromStr: string; toStr: string } {
  const now = new Date();
  const toStr   = typeof req.query["to"]   === "string" ? req.query["to"]   : now.toISOString().slice(0, 10);
  const fromStr = typeof req.query["from"] === "string" ? req.query["from"] : (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  })();

  // End of to-day (23:59:59.999)
  const to   = new Date(`${toStr}T23:59:59.999Z`);
  const from = new Date(`${fromStr}T00:00:00.000Z`);
  return { from, to, fromStr, toStr };
}

function storeFilter(req: Request): number | undefined {
  const sn = req.query["store_number"];
  return typeof sn === "string" && sn !== "" ? Number(sn) : undefined;
}

function r2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

// ── FR-ANALYTICS-1: Summary ───────────────────────────────────────────────────

router.get("/summary", async (req: Request, res: Response) => {
  const { from, to, fromStr, toStr } = parseDateRange(req);
  const sn = storeFilter(req);

  const rows = await prisma.$queryRaw<
    Array<{ total_revenue: string | null; total_orders: string; total_tips: string | null }>
  >`
    SELECT
      SUM(total)   AS total_revenue,
      COUNT(*)     AS total_orders,
      SUM(tip)     AS total_tips
    FROM \`order\`
    WHERE paymentStatus = 'paid'
      AND timestamp >= ${from}
      AND timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND storeNumber = ${sn}` : Prisma.empty}
  `;

  const row      = rows[0] ?? { total_revenue: null, total_orders: "0", total_tips: null };
  const revenue  = parseFloat(row.total_revenue ?? "0");
  const count    = parseInt(String(row.total_orders), 10);
  const tips     = parseFloat(row.total_tips ?? "0");

  const body: AnalyticsSummaryResponse = {
    total_revenue:       r2(revenue),
    total_orders:        count,
    average_order_value: r2(count > 0 ? revenue / count : 0),
    total_tips:          r2(tips),
    period: { from: fromStr, to: toStr },
  };
  res.json(body);
});

// ── FR-ANALYTICS-2: Sales by employee ────────────────────────────────────────

router.get("/sales-by-employee", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn = storeFilter(req);

  const rows = await prisma.$queryRaw<
    Array<{
      employee_id: number;
      first_name:  string;
      last_name:   string;
      total_sales: string | null;
      order_count: string;
      total_tips:  string | null;
    }>
  >`
    SELECT
      e.employeeId         AS employee_id,
      e.firstName          AS first_name,
      e.lastName           AS last_name,
      SUM(o.total)         AS total_sales,
      COUNT(o.orderId)     AS order_count,
      SUM(o.tip)           AS total_tips
    FROM \`order\` o
    JOIN employee e ON o.employeeId = e.employeeId
    WHERE o.paymentStatus = 'paid'
      AND o.timestamp >= ${from}
      AND o.timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
    GROUP BY e.employeeId, e.firstName, e.lastName
    ORDER BY total_sales DESC
  `;

  const body: SalesByEmployeeResponse = {
    employees: rows.map((r) => {
      const sales = parseFloat(r.total_sales ?? "0");
      const cnt   = parseInt(String(r.order_count), 10);
      return {
        employee_id:    Number(r.employee_id),
        name:           `${r.first_name} ${r.last_name}`,
        total_sales:    r2(sales),
        order_count:    cnt,
        average_ticket: r2(cnt > 0 ? sales / cnt : 0),
        total_tips:     r2(parseFloat(r.total_tips ?? "0")),
      };
    }),
  };
  res.json(body);
});

// ── FR-ANALYTICS-3: Top products ─────────────────────────────────────────────

router.get("/top-products", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn    = storeFilter(req);
  const limit = typeof req.query["limit"] === "string" ? Math.max(1, parseInt(req.query["limit"], 10)) : 10;

  const rows = await prisma.$queryRaw<
    Array<{
      product_id:    number;
      name:          string;
      category:      string;
      quantity_sold: string;
      revenue:       string | null;
    }>
  >`
    SELECT
      p.productId                           AS product_id,
      p.name                                AS name,
      pt.name                               AS category,
      SUM(oi.quantity)                      AS quantity_sold,
      SUM(oi.quantity * oi.priceAtPurchase) AS revenue
    FROM order_item oi
    JOIN \`order\` o      ON oi.orderId  = o.orderId
    JOIN orderable_item i ON oi.itemId   = i.itemId
    JOIN product p        ON i.itemId    = p.productId
    JOIN product_type pt  ON p.typeId    = pt.typeId
    WHERE o.paymentStatus = 'paid'
      AND oi.kitchenStatus != 'voided'
      AND o.timestamp >= ${from}
      AND o.timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
    GROUP BY p.productId, p.name, pt.name
  `;

  const mapped = rows.map((r) => ({
    product_id:    Number(r.product_id),
    name:          r.name,
    category:      r.category,
    quantity_sold: parseInt(String(r.quantity_sold), 10),
    revenue:       r2(parseFloat(r.revenue ?? "0")),
  }));

  const body: TopProductsResponse = {
    by_quantity: [...mapped].sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, limit),
    by_revenue:  [...mapped].sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue)).slice(0, limit),
  };
  res.json(body);
});

// ── FR-ANALYTICS-4: Revenue over time ────────────────────────────────────────

router.get("/revenue-over-time", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn = storeFilter(req);

  // Auto granularity: hour for ≤1 day, day otherwise
  const granularity: "hour" | "day" = (to.getTime() - from.getTime()) <= 86_400_000 ? "hour" : "day";

  // Split into two queries with literal format strings so MySQL's only_full_group_by
  // mode recognises the SELECT and GROUP BY expressions as identical.
  type TimeRow = Array<{ period: string; revenue: string | null; order_count: string }>;
  const rows: TimeRow = granularity === "day"
    ? await prisma.$queryRaw<TimeRow>`
        SELECT
          DATE_FORMAT(timestamp, '%Y-%m-%d') AS period,
          SUM(total)                         AS revenue,
          COUNT(*)                           AS order_count
        FROM \`order\`
        WHERE paymentStatus = 'paid'
          AND timestamp >= ${from}
          AND timestamp <= ${to}
          ${sn !== undefined ? Prisma.sql`AND storeNumber = ${sn}` : Prisma.empty}
        GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d')
        ORDER BY period ASC
      `
    : await prisma.$queryRaw<TimeRow>`
        SELECT
          DATE_FORMAT(timestamp, '%Y-%m-%dT%H:00:00') AS period,
          SUM(total)                                  AS revenue,
          COUNT(*)                                    AS order_count
        FROM \`order\`
        WHERE paymentStatus = 'paid'
          AND timestamp >= ${from}
          AND timestamp <= ${to}
          ${sn !== undefined ? Prisma.sql`AND storeNumber = ${sn}` : Prisma.empty}
        GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%dT%H:00:00')
        ORDER BY period ASC
      `;

  const body: RevenueOverTimeResponse = {
    granularity,
    data: rows.map((r) => ({
      period:      r.period,
      revenue:     r2(parseFloat(r.revenue ?? "0")),
      order_count: parseInt(String(r.order_count), 10),
    })),
  };
  res.json(body);
});

// ── FR-ANALYTICS-5: Sales by category ────────────────────────────────────────

router.get("/sales-by-category", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn = storeFilter(req);

  const rows = await prisma.$queryRaw<
    Array<{
      type_id:       number;
      category:      string;
      quantity_sold: string;
      revenue:       string | null;
    }>
  >`
    SELECT
      pt.typeId                             AS type_id,
      pt.name                               AS category,
      SUM(oi.quantity)                      AS quantity_sold,
      SUM(oi.quantity * oi.priceAtPurchase) AS revenue
    FROM order_item oi
    JOIN \`order\` o      ON oi.orderId  = o.orderId
    JOIN orderable_item i ON oi.itemId   = i.itemId
    JOIN product p        ON i.itemId    = p.productId
    JOIN product_type pt  ON p.typeId    = pt.typeId
    WHERE o.paymentStatus = 'paid'
      AND oi.kitchenStatus != 'voided'
      AND o.timestamp >= ${from}
      AND o.timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
    GROUP BY pt.typeId, pt.name
    ORDER BY revenue DESC
  `;

  const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.revenue ?? "0"), 0);

  const body: SalesByCategoryResponse = {
    categories: rows.map((r) => {
      const rev = parseFloat(r.revenue ?? "0");
      return {
        type_id:               Number(r.type_id),
        category:              r.category,
        quantity_sold:         parseInt(String(r.quantity_sold), 10),
        revenue:               r2(rev),
        percentage_of_revenue: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 1000) / 10 : 0,
      };
    }),
  };
  res.json(body);
});

// ── FR-ANALYTICS-6: Payment method breakdown ─────────────────────────────────

router.get("/payment-methods", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn = storeFilter(req);

  const [methodRows, brandRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{ type: string; count: string; total: string | null }>
    >`
      SELECT
        p.type        AS type,
        COUNT(*)      AS count,
        SUM(p.amount) AS total
      FROM payment p
      JOIN \`order\` o ON p.orderId = o.orderId
      WHERE o.paymentStatus = 'paid'
        AND o.timestamp >= ${from}
        AND o.timestamp <= ${to}
        ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
      GROUP BY p.type
    `,
    prisma.$queryRaw<
      Array<{ brand: string; count: string; total: string | null }>
    >`
      SELECT
        c.brand          AS brand,
        COUNT(*)         AS count,
        SUM(p.amount)    AS total
      FROM payment p
      JOIN electronic_payment ep ON ep.paymentId = p.paymentId
      JOIN card c                ON c.cardId      = ep.cardId
      JOIN \`order\` o           ON p.orderId     = o.orderId
      WHERE o.paymentStatus = 'paid'
        AND o.timestamp >= ${from}
        AND o.timestamp <= ${to}
        ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
      GROUP BY c.brand
      ORDER BY total DESC
    `,
  ]);

  const grandTotal = methodRows.reduce((s, r) => s + parseFloat(r.total ?? "0"), 0);

  const body: PaymentMethodsResponse = {
    methods: methodRows.map((r) => {
      const tot = parseFloat(r.total ?? "0");
      return {
        type:       r.type === "electronic" ? "card" : r.type,
        count:      parseInt(String(r.count), 10),
        total:      r2(tot),
        percentage: grandTotal > 0 ? Math.round((tot / grandTotal) * 1000) / 10 : 0,
      };
    }),
    card_brands: brandRows.map((r) => ({
      brand: r.brand,
      count: parseInt(String(r.count), 10),
      total: r2(parseFloat(r.total ?? "0")),
    })),
  };
  res.json(body);
});

// ── FR-ANALYTICS-7: Discount usage ───────────────────────────────────────────

router.get("/discounts", async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req);
  const sn = storeFilter(req);

  // Usage counts per discount
  const rows = await prisma.$queryRaw<
    Array<{
      discount_id: number;
      name:        string;
      type:        string;
      times_used:  string;
    }>
  >`
    SELECT
      d.discountId       AS discount_id,
      d.name             AS name,
      d.type             AS type,
      COUNT(od.orderId)  AS times_used
    FROM order_discount od
    JOIN discount d   ON od.discountId = d.discountId
    JOIN \`order\` o  ON od.orderId    = o.orderId
    WHERE o.paymentStatus = 'paid'
      AND o.timestamp >= ${from}
      AND o.timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
    GROUP BY d.discountId, d.name, d.type
    ORDER BY times_used DESC
  `;

  // Per-order dollar value — computed in SQL so we don't fetch unbounded rows
  const orderRows = await prisma.$queryRaw<
    Array<{
      discount_id: number;
      dtype:       string;
      dvalue:      string;
      subtotal:    string;
    }>
  >`
    SELECT
      d.discountId  AS discount_id,
      d.type        AS dtype,
      d.value       AS dvalue,
      o.subtotal    AS subtotal
    FROM order_discount od
    JOIN discount d   ON od.discountId = d.discountId
    JOIN \`order\` o  ON od.orderId    = o.orderId
    WHERE o.paymentStatus = 'paid'
      AND o.timestamp >= ${from}
      AND o.timestamp <= ${to}
      ${sn !== undefined ? Prisma.sql`AND o.storeNumber = ${sn}` : Prisma.empty}
  `;

  // Aggregate dollar value per discount
  const valueMap = new Map<number, number>();
  let totalDiscountValue = 0;
  for (const r of orderRows) {
    const id       = Number(r.discount_id);
    const dv       = parseFloat(r.dvalue);
    const subtotal = parseFloat(r.subtotal);
    const dollar   = r.dtype === "percent"
      ? Math.round(subtotal * dv / 100 * 100) / 100
      : Math.min(subtotal, dv);
    valueMap.set(id, (valueMap.get(id) ?? 0) + dollar);
    totalDiscountValue += dollar;
  }

  const body: DiscountUsageResponse = {
    discounts: rows.map((r) => ({
      discount_id: Number(r.discount_id),
      name:        r.name,
      times_used:  parseInt(String(r.times_used), 10),
      total_value: r2(valueMap.get(Number(r.discount_id)) ?? 0),
      type:        r.type,
    })),
    total_discount_value: r2(totalDiscountValue),
  };
  res.json(body);
});

export default router;
