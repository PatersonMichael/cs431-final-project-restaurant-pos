import { cn } from '../lib/cn'

export type ButtonIntent = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize   = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: ButtonIntent
  size?:   ButtonSize
  loading?: boolean
}

const intentClasses: Record<ButtonIntent, string> = {
  primary:   'bg-accent hover:bg-accent-hover text-inverse',
  secondary: 'bg-surface-2 hover:bg-surface-3 text-primary border border-edge',
  danger:    'bg-danger hover:bg-danger-hover text-inverse',
  ghost:     'bg-transparent hover:bg-surface-2 text-secondary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-base',
}

export function Button({
  intent = 'secondary',
  size   = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        intentClasses[intent],
        sizeClasses[size],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin size-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" />
    </svg>
  )
}
