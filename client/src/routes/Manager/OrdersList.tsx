import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import { getOrders, type OrderFilters } from '../../api/orders'
import { getEmployees } from '../../api/employees'
import { Card, CardBody } from '../../components/Card'
import { Input } from '../../components/Input'
import { Badge, statusTone } from '../../components/Badge'
import { Money } from '../../components/Money'
import type { OrderSummary, EmployeeResponse } from '../../types/api'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS = [
  { value: '',           label: 'All statuses' },
  { value: 'open',       label: 'Open'         },
  { value: 'completed',  label: 'Completed'    },
  { value: 'cancelled',  label: 'Cancelled'    },
]

export default function OrdersList() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [from, setFrom]           = useState(todayIso())
  const [to, setTo]               = useState(todayIso())
  const [status, setStatus]       = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [orders, setOrders]       = useState<OrderSummary[]>([])
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (session?.store_number != null) {
      getEmployees(session.store_number).then(setEmployees).catch(() => {})
    }
  }, [session?.store_number])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: OrderFilters = {
        from:        from ? `${from}T00:00:00.000Z` : undefined,
        to:          to   ? `${to}T23:59:59.999Z`   : undefined,
        status:      status || undefined,
        employee_id: employeeId ? Number(employeeId) : undefined,
        store_number: session?.store_number,
      }
      setOrders(await getOrders(filters))
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [from, to, status, employeeId, session?.store_number])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-primary">Orders</h1>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-secondary mb-1">From</label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">To</label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Server</label>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">All</option>
                {employees.map(emp => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle text-left">
                  <th className="px-4 py-2 font-medium text-secondary">Order #</th>
                  <th className="px-4 py-2 font-medium text-secondary">Customer</th>
                  <th className="px-4 py-2 font-medium text-secondary">Date & Time</th>
                  <th className="px-4 py-2 font-medium text-secondary">Status</th>
                  <th className="px-4 py-2 font-medium text-secondary">Server</th>
                  <th className="px-4 py-2 font-medium text-secondary text-right">Subtotal</th>
                  <th className="px-4 py-2 font-medium text-secondary text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted text-sm">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr
                      key={o.order_id}
                      onClick={() => navigate(`/manager/orders/${o.order_id}`)}
                      className="border-b border-subtle hover:bg-surface-2 cursor-pointer transition-colors duration-100"
                    >
                      <td className="px-4 py-3 font-mono text-primary">#{o.order_id}</td>
                      <td className="px-4 py-3 text-primary">
                        {o.customer_name ?? <span className="text-muted italic">Guest</span>}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {new Date(o.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(o.preparation_status)}>
                          {o.preparation_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-secondary">{o.employee_name ?? '—'}</td>
                      <td className="px-4 py-3 text-right"><Money value={o.subtotal} /></td>
                      <td className="px-4 py-3 text-right font-medium"><Money value={o.total} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
