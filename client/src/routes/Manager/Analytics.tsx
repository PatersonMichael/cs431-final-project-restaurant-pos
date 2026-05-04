import { useState, useEffect, useCallback } from 'react'
import { BarChart2 } from 'lucide-react'

import { Card, CardHeader, CardBody } from '../../components/Card'
import { Spinner } from '../../components/Spinner'
import DateRangeFilter, { type DateRange } from '../../components/analytics/DateRangeFilter'
import KpiCard from '../../components/analytics/KpiCard'
import SalesTable, { type SalesColumn } from '../../components/analytics/SalesTable'
import RevenueChart from '../../components/analytics/RevenueChart'
import CategoryChart from '../../components/analytics/CategoryChart'
import PaymentBreakdown from '../../components/analytics/PaymentBreakdown'
import DiscountReport from '../../components/analytics/DiscountReport'

import {
  getSummary,
  getSalesByEmployee,
  getTopProducts,
  getRevenueOverTime,
  getSalesByCategory,
  getPaymentMethods,
  getDiscountUsage,
} from '../../api/analytics'

import type {
  AnalyticsSummaryResponse,
  SalesByEmployeeResponse,
  TopProductsResponse,
  RevenueOverTimeResponse,
  SalesByCategoryResponse,
  PaymentMethodsResponse,
  DiscountUsageResponse,
  EmployeeSalesRow,
  TopProductRow,
} from '../../types/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultRange(): DateRange {
  const today = new Date()
  const from  = new Date(today)
  from.setDate(from.getDate() - 29)
  return { from: toIsoDate(from), to: toIsoDate(today) }
}

/** Shift a range back by its own length to get the prior period. */
function priorPeriod(range: DateRange): DateRange {
  const fromMs  = new Date(range.from).getTime()
  const toMs    = new Date(range.to).getTime()
  const lenMs   = toMs - fromMs + 86_400_000 // inclusive day count × ms
  return {
    from: toIsoDate(new Date(fromMs - lenMs)),
    to:   toIsoDate(new Date(toMs   - lenMs)),
  }
}

function pctChange(current: number, prior: number): { label: string; positive: boolean } | undefined {
  if (prior === 0) return undefined
  const pct = ((current - prior) / prior) * 100
  const sign = pct >= 0 ? '+' : ''
  return { label: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

// ─── Column definitions ───────────────────────────────────────────────────────

const employeeColumns: SalesColumn<EmployeeSalesRow & Record<string, unknown>>[] = [
  { key: 'name',           label: 'Employee',      align: 'left'  },
  { key: 'order_count',    label: 'Orders',        align: 'right' },
  { key: 'total_sales',    label: 'Total Sales',   align: 'right', render: v => `$${v}` },
  { key: 'average_ticket', label: 'Avg Ticket',    align: 'right', render: v => `$${v}` },
  { key: 'total_tips',     label: 'Tips',          align: 'right', render: v => `$${v}` },
]

const productQuantityColumns: SalesColumn<TopProductRow & Record<string, unknown>>[] = [
  { key: 'name',          label: 'Product',   align: 'left'  },
  { key: 'category',      label: 'Category',  align: 'left'  },
  { key: 'quantity_sold', label: 'Qty Sold',  align: 'right' },
  { key: 'revenue',       label: 'Revenue',   align: 'right', render: v => `$${v}` },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageData {
  summary:       AnalyticsSummaryResponse
  employees:     SalesByEmployeeResponse
  products:      TopProductsResponse
  revenue:       RevenueOverTimeResponse
  categories:    SalesByCategoryResponse
  payments:      PaymentMethodsResponse
  discounts:     DiscountUsageResponse
  priorSummary?: AnalyticsSummaryResponse
  priorRevenue?: RevenueOverTimeResponse
}

export default function Analytics() {
  const [range, setRange]             = useState<DateRange>(defaultRange)
  const [compareEnabled, setCompare]  = useState(false)
  const [data, setData]               = useState<PageData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [topBy, setTopBy]             = useState<'quantity' | 'revenue'>('quantity')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const prior = priorPeriod(range)
      const [summary, employees, products, revenue, categories, payments, discounts, ...rest] =
        await Promise.all([
          getSummary(range.from, range.to),
          getSalesByEmployee(range.from, range.to),
          getTopProducts(range.from, range.to, 10),
          getRevenueOverTime(range.from, range.to),
          getSalesByCategory(range.from, range.to),
          getPaymentMethods(range.from, range.to),
          getDiscountUsage(range.from, range.to),
          ...(compareEnabled
            ? [getSummary(prior.from, prior.to), getRevenueOverTime(prior.from, prior.to)]
            : []),
        ])

      setData({
        summary,
        employees,
        products,
        revenue,
        categories,
        payments,
        discounts,
        priorSummary: compareEnabled ? (rest[0] as AnalyticsSummaryResponse) : undefined,
        priorRevenue: compareEnabled ? (rest[1] as RevenueOverTimeResponse) : undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }, [range, compareEnabled])

  useEffect(() => { void load() }, [load])

  // ── KPI change helpers ────────────────────────────────────────────────────
  function kpiChange(currentStr: string, priorStr?: string) {
    if (!priorStr) return {}
    const result = pctChange(parseFloat(currentStr), parseFloat(priorStr))
    if (!result) return {}
    return { change: result.label, changePositive: result.positive }
  }

  function kpiChangeInt(current: number, prior?: number) {
    if (prior == null) return {}
    const result = pctChange(current, prior)
    if (!result) return {}
    return { change: result.label, changePositive: result.positive }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-2">
        <BarChart2 size={20} className="text-accent" />
        <h1 className="text-lg font-semibold text-primary">Analytics</h1>
      </div>

      {/* Filter bar */}
      <DateRangeFilter
        range={range}
        compareEnabled={compareEnabled}
        onRangeChange={r => setRange(r)}
        onCompareChange={v => setCompare(v)}
      />

      {/* Error */}
      {error && (
        <div className="bg-danger-bg border-l-4 border-danger rounded px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="md" />
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="flex flex-col gap-6">
          {/* KPI summary row — FR-ANALYTICS-1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Total Revenue"
              value={data.summary.total_revenue}
              prefix="$"
              {...kpiChange(data.summary.total_revenue, data.priorSummary?.total_revenue)}
            />
            <KpiCard
              label="Total Orders"
              value={String(data.summary.total_orders)}
              {...kpiChangeInt(data.summary.total_orders, data.priorSummary?.total_orders)}
            />
            <KpiCard
              label="Avg Order Value"
              value={data.summary.average_order_value}
              prefix="$"
              {...kpiChange(data.summary.average_order_value, data.priorSummary?.average_order_value)}
            />
            <KpiCard
              label="Total Tips"
              value={data.summary.total_tips}
              prefix="$"
              {...kpiChange(data.summary.total_tips, data.priorSummary?.total_tips)}
            />
          </div>

          {/* Revenue over time — FR-ANALYTICS-4 */}
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-primary">Revenue Over Time</span>
              {compareEnabled && data.priorRevenue && (
                <span className="ml-2 text-xs text-muted">(vs prior period)</span>
              )}
            </CardHeader>
            <CardBody>
              <RevenueChart
                data={data.revenue.data}
                comparisonData={compareEnabled ? data.priorRevenue?.data : undefined}
                granularity={data.revenue.granularity}
              />
            </CardBody>
          </Card>

          {/* Two-column row: employee table + category donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by employee — FR-ANALYTICS-2 */}
            <Card>
              <CardHeader>
                <span className="text-sm font-semibold text-primary">Sales by Employee</span>
              </CardHeader>
              <CardBody className="p-0">
                <SalesTable<EmployeeSalesRow & Record<string, unknown>>
                  columns={employeeColumns}
                  rows={data.employees.employees as (EmployeeSalesRow & Record<string, unknown>)[]}
                  defaultSortKey="total_sales"
                  defaultSortDir="desc"
                  emptyMessage="No employee sales data for this period."
                />
              </CardBody>
            </Card>

            {/* Sales by category — FR-ANALYTICS-5 */}
            <Card>
              <CardHeader>
                <span className="text-sm font-semibold text-primary">Sales by Category</span>
              </CardHeader>
              <CardBody>
                <CategoryChart categories={data.categories.categories} />
              </CardBody>
            </Card>
          </div>

          {/* Top products — FR-ANALYTICS-3 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Top Products</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTopBy('quantity')}
                    className={`px-2.5 py-1 text-xs rounded transition-colors duration-150 ${
                      topBy === 'quantity'
                        ? 'bg-accent text-inverse font-medium'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    By Qty
                  </button>
                  <button
                    onClick={() => setTopBy('revenue')}
                    className={`px-2.5 py-1 text-xs rounded transition-colors duration-150 ${
                      topBy === 'revenue'
                        ? 'bg-accent text-inverse font-medium'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    By Revenue
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <SalesTable<TopProductRow & Record<string, unknown>>
                columns={productQuantityColumns}
                rows={(topBy === 'quantity' ? data.products.by_quantity : data.products.by_revenue) as (TopProductRow & Record<string, unknown>)[]}
                defaultSortKey={topBy === 'quantity' ? 'quantity_sold' : 'revenue'}
                defaultSortDir="desc"
                emptyMessage="No product sales data for this period."
              />
            </CardBody>
          </Card>

          {/* Two-column row: payment breakdown + discount report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment methods — FR-ANALYTICS-6 */}
            <Card>
              <CardHeader>
                <span className="text-sm font-semibold text-primary">Payment Methods</span>
              </CardHeader>
              <CardBody>
                <PaymentBreakdown data={data.payments} />
              </CardBody>
            </Card>

            {/* Discount usage — FR-ANALYTICS-7 */}
            <Card>
              <CardHeader>
                <span className="text-sm font-semibold text-primary">Discount Usage</span>
              </CardHeader>
              <CardBody className="p-0">
                <DiscountReport data={data.discounts} />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
