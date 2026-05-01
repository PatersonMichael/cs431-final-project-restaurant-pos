import { forwardRef } from 'react'

import { cn } from '../lib/cn'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full rounded-md bg-input border px-3 py-2 text-sm text-primary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'appearance-none',
        error ? 'border-danger' : 'border-edge focus:border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
