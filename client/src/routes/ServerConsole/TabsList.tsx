import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import { getTabs, createTab } from '../../api/tabs'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Label } from '../../components/Label'
import { Modal } from '../../components/Modal'
import { Money } from '../../components/Money'
import { ElapsedTime } from '../../components/ElapsedTime'
import { Badge } from '../../components/Badge'

import type { TabSummary } from '../../types/api'

interface TabsListProps {
  onNavigate?: () => void
}

export default function TabsList({ onNavigate }: TabsListProps) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [tabs, setTabs] = useState<TabSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New tab modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchTabs = useCallback(async () => {
    if (!session) return
    try {
      const data = await getTabs(session.store_number)
      setTabs(data)
      setError(null)
    } catch {
      setError('Could not load tabs.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void fetchTabs()
    const id = setInterval(() => void fetchTabs(), 5000)
    return () => clearInterval(id)
  }, [fetchTabs])

  async function handleCreateTab() {
    if (!session) return
    setCreating(true)
    setCreateError(null)
    try {
      const tab = await createTab({
        customer_name: customerName.trim() || undefined,
        store_number: session.store_number,
        employee_id: session.employee_id,
      })
      setModalOpen(false)
      setCustomerName('')
      await fetchTabs()
      navigate(`/server/tabs/${tab.order_id}`)
      onNavigate?.()
    } catch {
      setCreateError('Could not create tab. Try again.')
    } finally {
      setCreating(false)
    }
  }

  const activeId = orderId ? parseInt(orderId, 10) : null

  return (
    <>
      {/* Rail header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle flex-shrink-0">
        <span className="text-xs font-medium text-secondary uppercase tracking-wide">Open Tabs</span>
        <Button
          intent="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          aria-label="New tab"
        >
          <Plus size={14} />
          <span>New</span>
        </Button>
      </div>

      {/* Tab list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 rounded-full border-2 border-muted border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-3 border-l-4 border-danger bg-danger-bg mx-3 mt-3 rounded text-sm text-primary">
            {error}
          </div>
        )}

        {!loading && !error && tabs.length === 0 && (
          <div className="px-4 py-8 text-center text-muted text-sm">
            No open tabs.
          </div>
        )}

        {!loading && tabs.map(tab => (
          <button
            key={tab.order_id}
            onClick={() => {
              navigate(`/server/tabs/${tab.order_id}`)
              onNavigate?.()
            }}
            className={[
              'w-full text-left px-4 py-3 border-b border-subtle transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
              activeId === tab.order_id
                ? 'bg-accent-bg border-l-2 border-l-accent'
                : 'hover:bg-surface-2',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-primary truncate">
                {tab.customer_name ?? <em className="not-italic text-muted">Tab #{tab.order_id}</em>}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {tab.has_ready_items && (
                  <Badge tone="success">Ready</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {tab.employee_name ?? '—'} · {tab.item_count} item{tab.item_count !== 1 ? 's' : ''}
              </span>
              <ElapsedTime since={tab.timestamp} compact />
            </div>
            <div className="mt-1 text-right">
              <Money value={tab.subtotal} />
            </div>
          </button>
        ))}
      </div>

      {/* New Tab modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setCustomerName(''); setCreateError(null) }}
        title="New Tab"
      >
        <div className="space-y-4">
          {createError && (
            <div className="px-3 py-2 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary">
              {createError}
            </div>
          )}
          <div>
            <Label htmlFor="customer-name">Customer name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Optional"
              onKeyDown={e => { if (e.key === 'Enter') void handleCreateTab() }}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button intent="secondary" onClick={() => { setModalOpen(false); setCustomerName('') }}>
            Cancel
          </Button>
          <Button intent="primary" loading={creating} onClick={() => void handleCreateTab()}>
            Open Tab
          </Button>
        </div>
      </Modal>
    </>
  )
}
