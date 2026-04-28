import { useState, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { getArchive, reopenTicket } from '../../api/kitchen'
import { cn } from '../../lib/cn'
import { Button } from '../../components/Button'

import type { TicketResponse } from '../../types/api'

const POLL_INTERVAL_MS = 10_000

function ticketKey(t: TicketResponse): string {
  return `${t.order_id}_${t.fired_at}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── ArchiveCard ──────────────────────────────────────────────────────────────

interface ArchiveCardProps {
  ticket: TicketResponse
  onReopen: () => void
  reopening: boolean
}

function ArchiveCard({ ticket, onReopen, reopening }: ArchiveCardProps) {
  return (
    <div className="flex flex-col bg-surface rounded-lg border border-edge overflow-hidden opacity-70">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-subtle">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-secondary truncate">
            {'#'}{ticket.order_id}
            {ticket.customer_name ? ` · ${ticket.customer_name}` : ''}
          </span>
          <span className="text-xs text-muted font-mono tabular-nums">
            Bumped at {formatTime(ticket.fired_at)}
          </span>
        </div>
        <Button
          size="sm"
          intent="ghost"
          loading={reopening}
          onClick={onReopen}
          className="shrink-0 ml-2 gap-1 text-secondary hover:text-primary"
        >
          <RotateCcw size={13} />
          Reopen
        </Button>
      </div>

      <ul className="divide-y divide-subtle px-3">
        {ticket.items.map(item => (
          <li key={item.order_item_id} className="py-2 text-sm text-secondary">
            <span className="text-muted text-xs mr-1.5">{item.quantity}×</span>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── ExpediterArchive ─────────────────────────────────────────────────────────

export default function ExpediterArchive() {
  const { session } = useAuth()
  const [tickets, setTickets]       = useState<TicketResponse[]>([])
  const [error, setError]           = useState<string | null>(null)
  const [reopeningKey, setReopening] = useState<string | null>(null)

  const fetchArchive = useCallback(async () => {
    if (!session) return
    try {
      const data = await getArchive(session.store_number)
      setError(null)
      setTickets(data)
    } catch {
      setError('Unable to load archive.')
    }
  }, [session])

  usePolling(fetchArchive, POLL_INTERVAL_MS)

  const handleReopen = useCallback(async (ticket: TicketResponse) => {
    const key = ticketKey(ticket)
    setReopening(key)
    try {
      await reopenTicket(ticket.order_id, ticket.fired_at)
      // Remove from archive immediately — it will appear on the board
      setTickets(prev => prev.filter(t => ticketKey(t) !== key))
    } catch {
      // next poll will reconcile
    } finally {
      setReopening(null)
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-danger text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4')}>
      <p className="text-xs text-muted">
        Today&apos;s bumped tickets. Reopen to return a ticket to the board.
      </p>

      {tickets.length === 0 ? (
        <p className="text-sm text-muted">No bumped tickets yet today.</p>
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(272px,1fr))] items-start">
          {tickets.map(ticket => {
            const key = ticketKey(ticket)
            return (
              <ArchiveCard
                key={key}
                ticket={ticket}
                reopening={reopeningKey === key}
                onReopen={() => { void handleReopen(ticket) }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
