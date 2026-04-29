import { useState, useEffect, useCallback } from 'react'

import { getInventory, getInventoryHistory, adjustInventory, setAvailability } from '../../api/inventory'
import { getProductTypes } from '../../api/menu'
import { Card, CardHeader, CardBody, CardFooter } from '../../components/Card'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { Money } from '../../components/Money'
import { cn } from '../../lib/cn'
import type { InventoryRow, InventoryHistoryResponse, ProductTypeResponse } from '../../types/api'

const REASONS = ['restock', 'waste', 'adjustment', 'correction'] as const
type Reason = typeof REASONS[number]

export default function Inventory() {
  const [rows, setRows]             = useState<InventoryRow[]>([])
  const [types, setTypes]           = useState<ProductTypeResponse[]>([])
  const [filterTypeId, setFilterTypeId] = useState<number | undefined>(undefined)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Adjust modal
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null)
  const [adjQty, setAdjQty]         = useState('')
  const [adjReason, setAdjReason]   = useState<Reason>('restock')
  const [adjNote, setAdjNote]       = useState('')
  const [adjError, setAdjError]     = useState<string | null>(null)
  const [adjLoading, setAdjLoading] = useState(false)

  // History modal
  const [histTarget, setHistTarget] = useState<InventoryRow | null>(null)
  const [history, setHistory]       = useState<InventoryHistoryResponse | null>(null)
  const [histLoading, setHistLoading] = useState(false)

  // Availability toggle
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    getProductTypes().then(setTypes).catch(() => {})
  }, [])

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await getInventory(filterTypeId))
    } catch {
      setError('Failed to load inventory.')
    } finally {
      setLoading(false)
    }
  }, [filterTypeId])

  useEffect(() => { void fetchInventory() }, [fetchInventory])

  async function toggleAvailability(row: InventoryRow) {
    setTogglingId(row.product_id)
    try {
      await setAvailability(row.product_id, !row.is_available)
      void fetchInventory()
    } catch {
      // silently ignore — row will not visually change
    } finally {
      setTogglingId(null)
    }
  }

  function openAdjust(row: InventoryRow) {
    setAdjustTarget(row)
    setAdjQty('')
    setAdjReason('restock')
    setAdjNote('')
    setAdjError(null)
  }

  async function submitAdjust() {
    if (!adjustTarget) return
    const qty = parseInt(adjQty, 10)
    if (isNaN(qty) || qty === 0) {
      setAdjError('Enter a non-zero integer.')
      return
    }
    setAdjLoading(true)
    setAdjError(null)
    try {
      await adjustInventory(adjustTarget.product_id, {
        quantity_change: qty,
        reason: adjReason,
        note: adjNote || undefined,
      })
      setAdjustTarget(null)
      void fetchInventory()
    } catch {
      setAdjError('Adjustment failed.')
    } finally {
      setAdjLoading(false)
    }
  }

  async function openHistory(row: InventoryRow) {
    setHistTarget(row)
    setHistory(null)
    setHistLoading(true)
    try {
      setHistory(await getInventoryHistory(row.product_id))
    } catch {
      // leave history null — modal shows error state
    } finally {
      setHistLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-primary">Inventory</h1>

      {/* Product type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTypeId(undefined)}
          className={cn(
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            filterTypeId === undefined
              ? 'bg-accent text-white'
              : 'bg-surface border border-edge text-secondary hover:text-primary',
          )}
        >
          All
        </button>
        {types.map(t => (
          <button
            key={t.product_type_id}
            onClick={() => setFilterTypeId(t.product_type_id)}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              filterTypeId === t.product_type_id
                ? 'bg-accent text-white'
                : 'bg-surface border border-edge text-secondary hover:text-primary',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle text-left">
                  <th className="px-4 py-2 font-medium text-secondary">Product</th>
                  <th className="px-4 py-2 font-medium text-secondary">Type</th>
                  <th className="px-4 py-2 font-medium text-secondary text-right">Base Price</th>
                  <th className="px-4 py-2 font-medium text-secondary text-right">On Hand</th>
                  <th className="px-4 py-2 font-medium text-secondary">Available</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
                    <tr
                      key={row.product_id}
                      className={cn(
                        'border-b border-subtle transition-colors',
                        row.on_hand <= 0 ? 'bg-danger-bg/30' : '',
                      )}
                    >
                      <td className="px-4 py-3 text-primary font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-secondary">{row.product_type_name}</td>
                      <td className="px-4 py-3 text-right">
                        <Money value={row.base_price} />
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-mono font-semibold',
                        row.on_hand <= 0 ? 'text-danger' : 'text-primary',
                      )}>
                        {row.on_hand}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-medium',
                          row.is_available ? 'text-success' : 'text-muted',
                        )}>
                          {row.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            intent="ghost"
                            size="sm"
                            onClick={() => openHistory(row)}
                          >
                            History
                          </Button>
                          <Button
                            intent={row.is_available ? 'danger' : 'secondary'}
                            size="sm"
                            loading={togglingId === row.product_id}
                            onClick={() => void toggleAvailability(row)}
                          >
                            {row.is_available ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            intent="secondary"
                            size="sm"
                            onClick={() => openAdjust(row)}
                          >
                            Adjust
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Adjust modal */}
      <Modal
        open={adjustTarget !== null}
        onClose={() => setAdjustTarget(null)}
        title={`Adjust — ${adjustTarget?.name ?? ''}`}
        footer={
          <>
            <Button intent="secondary" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button intent="primary" loading={adjLoading} onClick={() => void submitAdjust()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-secondary mb-1">
              Quantity change <span className="text-muted">(negative to reduce)</span>
            </label>
            <Input
              type="number"
              value={adjQty}
              onChange={e => setAdjQty(e.target.value)}
              placeholder="e.g. 24 or -3"
              error={adjError ?? undefined}
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Reason</label>
            <select
              value={adjReason}
              onChange={e => setAdjReason(e.target.value as Reason)}
              className="w-full bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Note (optional)</label>
            <Input
              value={adjNote}
              onChange={e => setAdjNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
        </div>
      </Modal>

      {/* History modal */}
      <Modal
        open={histTarget !== null}
        onClose={() => setHistTarget(null)}
        title={`History — ${histTarget?.name ?? ''}`}
        size="md"
      >
        {histLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : history === null ? (
          <p className="text-sm text-danger">Failed to load history.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Current on hand</span>
              <span className={cn(
                'font-mono font-semibold',
                history.on_hand <= 0 ? 'text-danger' : 'text-primary',
              )}>
                {history.on_hand}
              </span>
            </div>
            <div className="border-t border-subtle pt-3 space-y-1 max-h-80 overflow-y-auto">
              {history.transactions.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No transactions yet.</p>
              ) : (
                history.transactions.map(t => (
                  <div
                    key={t.transaction_id}
                    className="flex justify-between items-center text-sm py-1.5 border-b border-subtle last:border-0"
                  >
                    <div>
                      <span className={cn(
                        'font-mono font-medium mr-3',
                        t.quantity_change > 0 ? 'text-success' : 'text-danger',
                      )}>
                        {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                      </span>
                      <span className="text-secondary capitalize">{t.reason}</span>
                    </div>
                    <span className="text-muted text-xs">
                      {new Date(t.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
