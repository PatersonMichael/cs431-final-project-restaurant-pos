import { Trash2, Ban, Minus, Plus } from 'lucide-react'

import { cn } from '../lib/cn'
import { Money } from './Money'

interface TabItemRowProps {
  orderItemId: number
  name: string
  itemType: string
  quantity: number
  priceAtPurchase: string
  kitchenStatus: string
  onUpdateQty?: (newQty: number) => void
  onRemove?: () => void
  onVoid?: () => void
  disabled?: boolean
}

export function TabItemRow({
  name,
  itemType,
  quantity,
  priceAtPurchase,
  kitchenStatus,
  onUpdateQty,
  onRemove,
  onVoid,
  disabled = false,
}: TabItemRowProps) {
  const isStaged   = kitchenStatus === 'staged'
  const isVoided   = kitchenStatus === 'voided'
  const isReady    = kitchenStatus === 'ready'
  const lineTotal  = (parseFloat(priceAtPurchase) * quantity).toFixed(2)

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 border-b border-subtle text-sm',
        isVoided && 'opacity-50',
        isReady  && 'border-l-4 border-l-success',
      )}
    >
      {/* Qty stepper */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isStaged && !disabled ? (
          <>
            <button
              onClick={() => onUpdateQty?.(quantity - 1)}
              disabled={quantity <= 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-edge bg-surface-2 text-secondary hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-mono tabular-nums text-primary">{quantity}</span>
            <button
              onClick={() => onUpdateQty?.(quantity + 1)}
              disabled={quantity >= 99}
              className="w-6 h-6 flex items-center justify-center rounded border border-edge bg-surface-2 text-secondary hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </>
        ) : (
          <span className="w-16 text-center font-mono tabular-nums text-secondary">×{quantity}</span>
        )}
      </div>

      {/* Name + type */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-primary', isVoided && 'line-through')}>{name}</span>
        <span className="ml-2 text-muted text-xs">{itemType}</span>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0">
        <Money value={lineTotal} />
      </div>

      {/* Action */}
      <div className="flex-shrink-0 w-7">
        {!isVoided && !disabled && (
          isStaged ? (
            <button
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-danger transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label="Remove item"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={onVoid}
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-danger transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label="Void item"
            >
              <Ban size={14} />
            </button>
          )
        )}
      </div>
    </div>
  )
}
