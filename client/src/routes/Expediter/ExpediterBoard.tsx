import { useState, useRef, useCallback } from 'react'
import { CheckCheck } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { useElapsed } from '../../hooks/useElapsed'
import { getTimeBand, formatElapsed } from '../../lib/time'
import { getTickets, updateItemStatus, bumpTicket } from '../../api/kitchen'
import { cn } from '../../lib/cn'
import { Button } from '../../components/Button'

import type { TicketResponse } from '../../types/api'

const READY_LINGER_MS = 60_000
const POLL_INTERVAL_MS = 5_000

function ticketKey(t: TicketResponse): string {
  return `${t.order_id}_${t.fired_at}`
}

function nextStatus(current: string): string | null {
  if (current === 'fired') return 'preparing'
  if (current === 'preparing') return 'ready'
  return null
}

// ─── TicketCard ───────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: TicketResponse
  dimmed: boolean
  onStatusChange: (itemId: number, status: string) => void
  onBump: (orderId: number, firedAt: string) => void
}

const bandBorderClass = {
  fresh:   'border-l-success',
  warning: 'border-l-warning',
  late:    'border-l-danger',
} as const

const bandTextClass = {
  fresh:   'text-success',
  warning: 'text-warning',
  late:    'text-danger',
} as const

const itemStatusClass: Record<string, string> = {
  fired:     'bg-info-bg text-info hover:bg-info hover:text-inverse cursor-pointer',
  preparing: 'bg-warning-bg text-warning hover:bg-warning hover:text-inverse cursor-pointer',
  ready:     'bg-success-bg text-success cursor-default',
}

function TicketCard({ ticket, dimmed, onStatusChange, onBump }: TicketCardProps) {
  const secs = useElapsed(ticket.fired_at)
  const band = getTimeBand(secs)
  const allReady = ticket.items.every(i => i.kitchen_status === 'ready')

  return (
    <div
      className={cn(
        'flex flex-col bg-surface rounded-lg border border-edge border-l-4 overflow-hidden transition-opacity duration-700',
        bandBorderClass[band],
        dimmed && 'opacity-30 pointer-events-none',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-subtle">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-secondary truncate">
            {'#'}{ticket.order_id}
            {ticket.customer_name ? ` · ${ticket.customer_name}` : ''}
          </span>
          <span className={cn('text-sm font-mono tabular-nums font-medium', bandTextClass[band])}>
            {formatElapsed(secs)}
          </span>
        </div>
        <Button
          size="sm"
          intent="primary"
          disabled={allReady}
          onClick={() => onBump(ticket.order_id, ticket.fired_at)}
          className="shrink-0 ml-2 gap-1"
        >
          <CheckCheck size={13} />
          Bump
        </Button>
      </div>

      {/* Item rows */}
      <ul className="divide-y divide-subtle">
        {ticket.items.map(item => {
          const next = nextStatus(item.kitchen_status)
          const statusCls = itemStatusClass[item.kitchen_status] ?? 'bg-surface-2 text-muted cursor-default'
          return (
            <li
              key={item.order_item_id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="text-sm text-primary">
                <span className="text-muted text-xs mr-1.5">{item.quantity}×</span>
                {item.name}
              </span>
              <button
                disabled={next === null}
                onClick={() => { if (next) onStatusChange(item.order_item_id, next) }}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded shrink-0',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                  'disabled:pointer-events-none',
                  statusCls,
                )}
                aria-label={next ? `Advance ${item.name} to ${next}` : undefined}
              >
                {item.kitchen_status}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── ExpediterBoard ───────────────────────────────────────────────────────────

interface LingerEntry {
  ticket: TicketResponse
  removedAt: number
}

export default function ExpediterBoard() {
  const { session } = useAuth()
  const [liveTickets, setLiveTickets] = useState<TicketResponse[]>([])
  const [error, setError]             = useState<string | null>(null)

  // Tickets recently removed from API — shown dimmed for READY_LINGER_MS (FR-EXP-5)
  const lingeringRef  = useRef<Map<string, LingerEntry>>(new Map())
  // Previous fetch result — used to detect newly-disappeared tickets
  const prevTicketsRef = useRef<TicketResponse[]>([])

  const fetchTickets = useCallback(async () => {
    if (!session) return
    try {
      const data = await getTickets(session.store_number)
      setError(null)

      const newKeys = new Set(data.map(ticketKey))
      const now = Date.now()

      // Detect tickets that just left the API response → start linger
      for (const t of prevTicketsRef.current) {
        const key = ticketKey(t)
        if (!newKeys.has(key) && !lingeringRef.current.has(key)) {
          lingeringRef.current.set(key, { ticket: t, removedAt: now })
        }
      }

      // Prune expired linger entries
      for (const [key, { removedAt }] of lingeringRef.current) {
        if (now - removedAt > READY_LINGER_MS) lingeringRef.current.delete(key)
      }

      prevTicketsRef.current = data
      setLiveTickets(data)
    } catch {
      setError('Unable to load kitchen tickets.')
    }
  }, [session])

  // FR-EXP-4: auto-refresh every 5 seconds
  usePolling(fetchTickets, POLL_INTERVAL_MS)

  const handleStatusChange = useCallback(async (itemId: number, status: string) => {
    try {
      await updateItemStatus(itemId, status)
      await fetchTickets()
    } catch {
      // next poll will correct; swallow to avoid noisy error
    }
  }, [fetchTickets])

  const handleBump = useCallback(async (orderId: number, firedAt: string) => {
    try {
      await bumpTicket(orderId, firedAt)
      await fetchTickets()
    } catch {
      // next poll will correct
    }
  }, [fetchTickets])

  // Build combined visible list: live (not dimmed) + lingering (dimmed) — FR-EXP-2, FR-EXP-3, FR-EXP-5
  const liveKeys = new Set(liveTickets.map(ticketKey))
  const combined: Array<{ ticket: TicketResponse; dimmed: boolean }> = [
    ...liveTickets.map(t => ({ ticket: t, dimmed: false })),
    ...[...lingeringRef.current.values()]
      .filter(({ ticket }) => !liveKeys.has(ticketKey(ticket))) // guard double-render
      .map(({ ticket }) => ({ ticket, dimmed: true })),
  ]

  // FR-EXP-3: oldest-fired first
  combined.sort(
    (a, b) => new Date(a.ticket.fired_at).getTime() - new Date(b.ticket.fired_at).getTime(),
  )

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-danger text-sm">
        {error}
      </div>
    )
  }

  if (combined.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted">
        <CheckCheck size={32} className="text-success opacity-60" />
        <span className="text-sm">All caught up — no active tickets</span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(272px,1fr))] items-start">
      {combined.map(({ ticket, dimmed }) => (
        <TicketCard
          key={ticketKey(ticket)}
          ticket={ticket}
          dimmed={dimmed}
          onStatusChange={handleStatusChange}
          onBump={handleBump}
        />
      ))}
    </div>
  )
}
