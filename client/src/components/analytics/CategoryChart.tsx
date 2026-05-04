import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

import type { CategoryRow } from '../../types/api'

// Palette — semantic tokens mapped to hex for Recharts (which can't read CSS vars)
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#F97316', '#EC4899']

interface Props {
  categories: CategoryRow[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-surface-2 border border-default rounded px-3 py-2 text-sm">
      <p className="text-primary font-medium">{d.name}</p>
      <p className="text-secondary font-mono tabular-nums">${Number(d.value).toFixed(2)}</p>
      <p className="text-muted">{d.payload.percentage_of_revenue}% of revenue</p>
    </div>
  )
}

export default function CategoryChart({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm">
        No category data for this period.
      </div>
    )
  }

  const chartData = categories.map(c => ({
    name: c.category,
    value: parseFloat(c.revenue),
    percentage_of_revenue: c.percentage_of_revenue,
    quantity_sold: c.quantity_sold,
  }))

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Donut */}
      <div className="shrink-0 w-full md:w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / table */}
      <div className="flex-1 w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle">
              <th className="px-2 py-1.5 text-left text-xs font-medium text-secondary uppercase tracking-wide">Category</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-secondary uppercase tracking-wide">Revenue</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-secondary uppercase tracking-wide">Qty</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-secondary uppercase tracking-wide">Share</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={c.type_id} className="border-b border-subtle hover:bg-surface-2 transition-colors duration-150">
                <td className="px-2 py-2 flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-primary">{c.category}</span>
                </td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-primary">${c.revenue}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-secondary">{c.quantity_sold}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums text-secondary">{c.percentage_of_revenue}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
