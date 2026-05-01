import { cn } from '../lib/cn'
import { formatMoney, isNegative } from '../lib/money'

interface MoneyProps {
  value: string | number
  muted?: boolean
  className?: string
}

export function Money({ value, muted, className }: MoneyProps) {
  const negative = isNegative(value)
  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        muted ? 'text-muted' : negative ? 'text-danger' : undefined,
        className,
      )}
    >
      {formatMoney(value)}
    </span>
  )
}
