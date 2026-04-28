import { cn } from '../lib/cn'
import { useElapsed } from '../hooks/useElapsed'
import { formatElapsed } from '../lib/time'

interface ElapsedTimeProps {
  since: string | Date
  compact?: boolean
  className?: string
}

export function ElapsedTime({ since, compact = false, className }: ElapsedTimeProps) {
  const seconds = useElapsed(since)
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {formatElapsed(seconds, compact)}
    </span>
  )
}
