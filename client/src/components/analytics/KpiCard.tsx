import { cn } from '../../lib/cn'

interface Props {
  label: string
  value: string
  /** Optional: prefix for the value (e.g. "$") */
  prefix?: string
  /** Optional: change vs comparison period, e.g. "+12.3%" */
  change?: string
  /** Whether the change direction is positive (green) or negative (red) */
  changePositive?: boolean
}

export default function KpiCard({ label, value, prefix, change, changePositive }: Props) {
  return (
    <div className="bg-surface border border-default rounded-md p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold font-mono tabular-nums text-primary">
        {prefix}{value}
      </span>
      {change != null && (
        <span
          className={cn(
            'text-xs font-medium',
            changePositive ? 'text-success' : 'text-danger',
          )}
        >
          {change} vs prior period
        </span>
      )}
    </div>
  )
}
