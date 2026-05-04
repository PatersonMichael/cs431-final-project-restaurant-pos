import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import type { RevenueDataPoint } from '../../types/api'

interface Props {
  data: RevenueDataPoint[]
  comparisonData?: RevenueDataPoint[]
  granularity: 'hour' | 'day'
}

function formatPeriod(period: string, granularity: 'hour' | 'day'): string {
  if (granularity === 'hour') {
    // period: "2026-04-01T11:00:00" — show "11 AM"
    const hour = parseInt(period.slice(11, 13), 10)
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
  }
  // period: "2026-04-01" — show "Apr 1"
  const [, month, day] = period.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[(month ?? 1) - 1]} ${day}`
}

interface ChartRow {
  label: string
  current: number
  prior?: number
}

function buildRows(
  data: RevenueDataPoint[],
  comparisonData: RevenueDataPoint[] | undefined,
  granularity: 'hour' | 'day',
): ChartRow[] {
  const map = new Map<string, ChartRow>()

  data.forEach((d, i) => {
    const label = formatPeriod(d.period, granularity)
    const key = String(i) // keep ordering by current period index
    map.set(key, { label, current: parseFloat(d.revenue) })
  })

  if (comparisonData) {
    comparisonData.forEach((d, i) => {
      const key = String(i)
      const existing = map.get(key)
      if (existing) {
        existing.prior = parseFloat(d.revenue)
      } else {
        map.set(key, {
          label: formatPeriod(d.period, granularity),
          current: 0,
          prior: parseFloat(d.revenue),
        })
      }
    })
  }

  return Array.from(map.values())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-default rounded px-3 py-2 text-sm">
      <p className="text-secondary mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-mono tabular-nums">
          {entry.name}: ${Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

export default function RevenueChart({ data, comparisonData, granularity }: Props) {
  const rows = buildRows(data, comparisonData, granularity)

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm">
        No revenue data for this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPrior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B7A90" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6B7A90" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2A38" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6B7A90', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6B7A90', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        {comparisonData && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#A8B5C7' }}
          />
        )}
        {comparisonData && (
          <Area
            type="monotone"
            dataKey="prior"
            name="Prior period"
            stroke="#6B7A90"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="url(#gradPrior)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="current"
          name="Current period"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#gradCurrent)"
          dot={false}
          activeDot={{ r: 4, fill: '#3B82F6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
