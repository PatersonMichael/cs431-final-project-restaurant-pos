import { cn } from '../lib/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm:  'w-3.5 h-3.5 border',
  md:  'w-4 h-4 border-2',
  lg:  'w-5 h-5 border-2',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-muted border-t-transparent animate-spin',
        sizeClass[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
