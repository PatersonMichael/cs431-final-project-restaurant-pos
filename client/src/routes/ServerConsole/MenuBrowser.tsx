import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

import { getMenu, getProductTypes } from '../../api/menu'
import { Money } from '../../components/Money'
import { cn } from '../../lib/cn'

import type { MenuItemResponse, ProductTypeResponse } from '../../types/api'

interface MenuBrowserProps {
  onAdd: (itemId: number) => Promise<void>
  disabled?: boolean
}

export default function MenuBrowser({ onAdd, disabled = false }: MenuBrowserProps) {
  const [items, setItems] = useState<MenuItemResponse[]>([])
  const [types, setTypes] = useState<ProductTypeResponse[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [menuData, typeData] = await Promise.all([getMenu(), getProductTypes()])
        setItems(menuData)
        setTypes(typeData)
      } catch {
        setError('Could not load menu.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const available = items.filter(i => i.is_available)
  const filtered = selectedTypeId == null
    ? available
    : available.filter(i => i.product_type_id === selectedTypeId)

  async function handleAdd(itemId: number) {
    if (disabled || adding !== null) return
    setAdding(itemId)
    try {
      await onAdd(itemId)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Type filter chips */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-subtle overflow-x-auto">
        <button
          onClick={() => setSelectedTypeId(null)}
          className={cn(
            'flex-shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            selectedTypeId === null
              ? 'bg-accent text-inverse'
              : 'bg-surface-2 text-secondary hover:bg-surface-3',
          )}
        >
          All
        </button>
        {types.map(t => (
          <button
            key={t.product_type_id}
            onClick={() => setSelectedTypeId(t.product_type_id)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              selectedTypeId === t.product_type_id
                ? 'bg-accent text-inverse'
                : 'bg-surface-2 text-secondary hover:bg-surface-3',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 rounded-full border-2 border-muted border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="px-3 py-2 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No items in this category.</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(item => {
              const isAdding = adding === item.item_id
              return (
                <button
                  key={item.item_id}
                  onClick={() => void handleAdd(item.item_id)}
                  disabled={disabled || adding !== null}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-md border border-edge bg-surface-2 text-left',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    disabled || adding !== null
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-surface-3 hover:border-strong',
                  )}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <span className="text-sm text-primary font-medium leading-tight">{item.name}</span>
                    {isAdding ? (
                      <div className="w-4 h-4 rounded-full border-2 border-muted border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Plus size={14} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-xs text-muted">{item.product_type_name ?? item.item_type}</span>
                    <Money value={item.price} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
