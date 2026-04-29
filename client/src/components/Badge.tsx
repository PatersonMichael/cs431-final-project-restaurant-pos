import { cn } from '../lib/cn'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  tone: BadgeTone
  children: React.ReactNode
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger:  'bg-danger-bg text-danger',
  info:    'bg-info-bg text-info',
  neutral: 'bg-surface-2 text-secondary',
}

export function Badge({ tone, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Maps kitchen_status / preparation_status strings to badge tone
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'ready':     return 'success'
    case 'preparing': return 'warning'
    case 'fired':     return 'info'
    case 'voided':    return 'danger'
    case 'open':        return 'info'
    case 'completed':   return 'success'
    case 'closed':      return 'success'
    case 'paid':        return 'success'
    case 'cancelled':   return 'danger'
    default:            return 'neutral'
  }
}
