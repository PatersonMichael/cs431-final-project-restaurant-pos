import { cn } from '../lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        className={cn(
          'bg-input border text-primary rounded-md px-3 py-2 text-sm w-full',
          'focus:outline-none focus:ring-2 focus:ring-accent/30',
          'placeholder:text-muted',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error ? 'border-danger' : 'border-edge focus:border-strong',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <select
        className={cn(
          'bg-input border text-primary rounded-md px-3 py-2 text-sm w-full',
          'focus:outline-none focus:ring-2 focus:ring-accent/30',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error ? 'border-danger' : 'border-edge focus:border-strong',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
