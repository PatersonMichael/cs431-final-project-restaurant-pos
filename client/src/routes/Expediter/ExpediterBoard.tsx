import { useState, useRef, useCallback } from 'react'
import { CheckCheck } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { useElapsed } from '../../hooks/useElapsed'
import { getTimeBand, formatElapsed } from '../../lib/time'
import { getTickets, bumpTicket } from '../../api/kitchen'
import { cn } from '../../lib/cn'
import { Spinner } from '../../components/Spinner'

import type { TicketResponse } from '../../types/api'

const POLL_INTERVAL_MS = 5_000
const DOUBLE_TAP_MS    = 400

function ticketKey(t: TicketResponse): string {
  return `${t.order_id}_${t.fired_at}`
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

// ─── TicketCard ───────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: TicketResponse
  onBump: () => void
}

function TicketCard({ ticket, onBump }: TicketCardProps) {
  const secs = useElapsed(ticket.fired_at)
  const band = getTimeBand(secs)
  const lastTapRef = useRef(0)
  const [tapHint, setTapHint] = useState(false)

  function handleTap() {
    const now = Date.now()
    if (now - lastTapRef.current <= DOUBLE_TAP_MS) {
      lastTapRef.current = 0
      setTapHint(false)
      onBump()
    } else {
      lastTapRef.current = now
      // Briefly show the double-tap hint so the user knows what to do next
      setTapHint(true)
      setTimeout(() => setTapHint(false), DOUBLE_TAP_MS + 100)
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      onDoubleClick={e => { e.preventDefault(); onBump() }}
      className={cn(
        'w-full text-left flex flex-col bg-surface rounded-lg border border-edge border-l-4 overflow-hidden',
        'transition-colors duration-150 cursor-pointer',
        'hover:bg-surface-2 active:scale-[0.98] transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        bandBorderClass[band],
        tapHint && 'ring-2 ring-accent',
      )}
      aria-label={`Ticket for order #${ticket.order_id}${ticket.customer_name ? `, ${ticket.customer_name}` : ''}. Double-tap to bump.`}
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
        <div className="flex items-center gap-1 shrink-0 ml-2 text-xs text-muted">
          <CheckCheck size={12} />
          <span>double-tap</span>
        </div>
      </div>

      {/* Item list */}
      <ul className="divide-y divide-subtle px-3">
        {ticket.items.map(item => (
          <li key={item.order_item_id} className="py-2 text-sm text-primary">
            <span className="text-muted text-xs mr-1.5">{item.quantity}×</span>
            {item.name}
          </li>
        ))}
      </ul>
    </button>
  )
}

// ─── ExpediterBoard ───────────────────────────────────────────────────────────

export default function ExpediterBoard() {
  const { session } = useAuth()
  const [tickets, setTickets]   = useState<TicketResponse[]>([])
  const [error, setError]       = useState<string | null>(null)
  const [ready, setReady]       = useState(false)
  const [bumpError, setBumpError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    if (!session) return
    try {
      const data = await getTickets(session.store_number)
      setError(null)
      // Sort oldest-fired first (FR-EXP-3) — API already orders asc, but enforce client-side too
      data.sort((a, b) => new Date(a.fired_at).getTime() - new Date(b.fired_at).getTime())
      setTickets(data)
    } catch {
      setError('Unable to load kitchen tickets.')
    } finally {
      setReady(true)
    }
  }, [session])

  // FR-EXP-4: auto-refresh every 5 seconds
  usePolling(fetchTickets, POLL_INTERVAL_MS)

  const handleBump = useCallback(async (ticket: TicketResponse) => {
    // Optimistically remove from board immediately (FR-EXP-5 — no linger)
    setTickets(prev => prev.filter(t => ticketKey(t) !== ticketKey(ticket)))
    try {
      await bumpTicket(ticket.order_id, ticket.fired_at)
    } catch {
      // Restore on failure — next poll will also correct
      setTickets(prev => {
        const already = prev.some(t => ticketKey(t) === ticketKey(ticket))
        return already ? prev : [...prev, ticket].sort(
          (a, b) => new Date(a.fired_at).getTime() - new Date(b.fired_at).getTime()
        )
      })
      setBumpError('Could not bump ticket. Try again.')
      setTimeout(() => setBumpError(null), 3000)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-danger text-sm">
        {error}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted">
        <CheckCheck size={32} className="text-success opacity-60" />
        <span className="text-sm">All caught up — no active tickets</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {bumpError && (
        <p className="text-sm text-danger">{bumpError}</p>
      )}
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(272px,1fr))] items-start">
        {tickets.map(ticket => (
          <TicketCard
            key={ticketKey(ticket)}
            ticket={ticket}
            onBump={() => { void handleBump(ticket) }}
          />
        ))}
      </div>
    </div>
  )
}
