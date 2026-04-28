import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flame, CreditCard } from 'lucide-react'

import { getTab, addItem, updateItem, removeItem, fireTab } from '../../api/tabs'
import { Button } from '../../components/Button'
import { Badge } from '../../components/Badge'
import { Money } from '../../components/Money'
import { TabItemRow } from '../../components/TabItemRow'
import MenuBrowser from './MenuBrowser'

import type { TabDetail as TabDetailType, OrderItemRow } from '../../types/api'

function statusTone(s: string): 'neutral' | 'info' | 'warning' | 'success' | 'danger' {
  if (s === 'staged')    return 'neutral'
  if (s === 'fired')     return 'info'
  if (s === 'preparing') return 'warning'
  if (s === 'ready')     return 'success'
  if (s === 'voided')    return 'danger'
  return 'neutral'
}

function roundLabel(firedAt: string): string {
  return new Date(firedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function roundStatus(items: OrderItemRow[]): string {
  const active = items.filter(i => i.kitchen_status !== 'voided')
  if (active.length === 0) return 'voided'
  if (active.every(i => i.kitchen_status === 'ready')) return 'ready'
  if (active.some(i => i.kitchen_status === 'preparing')) return 'preparing'
  return 'fired'
}

export default function TabDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const id = orderId ? parseInt(orderId, 10) : null

  const [tab, setTab] = useState<TabDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [firing, setFiring] = useState(false)
  const [fireError, setFireError] = useState<string | null>(null)
  // Mobile view toggle: 'order' | 'menu'
  const [mobileView, setMobileView] = useState<'order' | 'menu'>('order')

  const fetchTab = useCallback(async () => {
    if (!id) return
    try {
      const data = await getTab(id)
      setTab(data)
      setError(null)
    } catch {
      setError('Could not load tab.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchTab()
  }, [fetchTab])

  async function handleAddItem(itemId: number) {
    if (!id) return
    await addItem(id, { item_id: itemId, quantity: 1 })
    await fetchTab()
  }

  async function handleUpdateQty(itemId: number, newQty: number) {
    if (!id) return
    if (newQty < 1) return
    try {
      await updateItem(id, itemId, { quantity: newQty })
      await fetchTab()
    } catch {
      setError('Could not update quantity.')
    }
  }

  async function handleRemove(itemId: number) {
    if (!id) return
    try {
      await removeItem(id, itemId)
      await fetchTab()
    } catch {
      setError('Could not remove item.')
    }
  }

  async function handleFire() {
    if (!id) return
    setFiring(true)
    setFireError(null)
    try {
      const updated = await fireTab(id)
      setTab(updated)
    } catch {
      setFireError('Could not fire tab. Try again.')
    } finally {
      setFiring(false)
    }
  }

  if (!id) return null

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-muted border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error && !tab) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="px-4 py-3 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary max-w-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!tab) return null

  const hasStagedItems = tab.staged.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-subtle bg-surface">
        <div>
          <span className="text-base font-semibold text-primary">
            {tab.customer_name ?? <em className="not-italic text-muted">Tab #{tab.order_id}</em>}
          </span>
          <span className="ml-3 text-xs text-muted">
            Subtotal <Money value={tab.subtotal} /> · Tax {parseFloat(tab.tax_percent).toFixed(2)}% · Total <Money value={tab.total} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="flex md:hidden rounded-md border border-edge overflow-hidden text-xs">
            <button
              onClick={() => setMobileView('order')}
              className={[
                'px-3 py-1.5 font-medium transition-colors duration-150 focus-visible:outline-none',
                mobileView === 'order' ? 'bg-accent text-inverse' : 'bg-surface-2 text-secondary',
              ].join(' ')}
            >
              Order
            </button>
            <button
              onClick={() => setMobileView('menu')}
              className={[
                'px-3 py-1.5 font-medium transition-colors duration-150 focus-visible:outline-none',
                mobileView === 'menu' ? 'bg-accent text-inverse' : 'bg-surface-2 text-secondary',
              ].join(' ')}
            >
              Menu
            </button>
          </div>

          <Button
            intent="primary"
            size="sm"
            onClick={() => void handleFire()}
            disabled={!hasStagedItems}
            loading={firing}
          >
            <Flame size={14} aria-hidden />
            Fire
          </Button>
          <Button
            intent="secondary"
            size="sm"
            onClick={() => navigate(`/server/tabs/${id}/closeout`)}
          >
            <CreditCard size={14} aria-hidden />
            Close out
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {(error || fireError) && (
        <div className="flex-shrink-0 mx-4 mt-2 px-3 py-2 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary">
          {error ?? fireError}
        </div>
      )}

      {/* Body: two-column on desktop, toggled on mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: item list — always visible on desktop, conditional on mobile */}
        <div className={[
          'flex flex-col overflow-y-auto border-r border-subtle',
          'md:flex md:w-3/5',
          mobileView === 'order' ? 'flex w-full' : 'hidden',
        ].join(' ')}>
          {/* Staged section */}
          {tab.staged.length > 0 && (
            <section>
              <div className="px-3 py-1.5 bg-surface-2 text-xs font-medium text-secondary uppercase tracking-wide border-b border-subtle">
                Staged
              </div>
              {tab.staged.map(item => (
                <TabItemRow
                  key={item.order_item_id}
                  orderItemId={item.order_item_id}
                  name={item.name}
                  itemType={item.item_type}
                  quantity={item.quantity}
                  priceAtPurchase={item.price_at_purchase}
                  kitchenStatus={item.kitchen_status}
                  onUpdateQty={q => void handleUpdateQty(item.order_item_id, q)}
                  onRemove={() => void handleRemove(item.order_item_id)}
                />
              ))}
            </section>
          )}

          {/* Previous rounds */}
          {tab.rounds.map((round, idx) => {
            const rStatus = roundStatus(round.items)
            return (
              <section key={round.fired_at}>
                <div className="px-3 py-1.5 bg-surface-2 flex items-center justify-between border-b border-subtle border-t border-t-subtle">
                  <span className="text-xs font-medium text-secondary uppercase tracking-wide">
                    Round {idx + 1} · Fired {roundLabel(round.fired_at)}
                  </span>
                  <Badge tone={statusTone(rStatus)}>{rStatus}</Badge>
                </div>
                {round.items.map(item => (
                  <TabItemRow
                    key={item.order_item_id}
                    orderItemId={item.order_item_id}
                    name={item.name}
                    itemType={item.item_type}
                    quantity={item.quantity}
                    priceAtPurchase={item.price_at_purchase}
                    kitchenStatus={item.kitchen_status}
                    onVoid={() => void handleRemove(item.order_item_id)}
                  />
                ))}
              </section>
            )
          })}

          {tab.staged.length === 0 && tab.rounds.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-muted text-sm py-12">
              No items yet. Add from the menu.
            </div>
          )}
        </div>

        {/* Right: menu browser — always visible on desktop, conditional on mobile */}
        <div className={[
          'flex flex-col overflow-hidden',
          'md:flex md:w-2/5',
          mobileView === 'menu' ? 'flex w-full' : 'hidden',
        ].join(' ')}>
          <div className="px-4 py-2 border-b border-subtle bg-surface-2 flex-shrink-0">
            <span className="text-xs font-medium text-secondary uppercase tracking-wide">Add Items</span>
          </div>
          <MenuBrowser onAdd={itemId => handleAddItem(itemId)} />
        </div>
      </div>
    </div>
  )
}
