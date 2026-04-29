import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { getOrderDetail } from '../../api/orders'
import { Card, CardHeader, CardBody } from '../../components/Card'
import { Badge, statusTone } from '../../components/Badge'
import { Money } from '../../components/Money'
import { Spinner } from '../../components/Spinner'
import type { OrderDetail as OrderDetailType } from '../../types/api'

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [order, setOrder]   = useState<OrderDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    getOrderDetail(Number(orderId))
      .then(setOrder)
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="lg" />
    </div>
  )
  if (error)   return <p className="text-sm text-danger">{error}</p>
  if (!order)  return <p className="text-sm text-muted">Order not found.</p>

  const subtotal  = Number(order.subtotal)
  const taxAmt    = subtotal * (Number(order.tax_percent) / 100)
  const tip       = order.tip ? Number(order.tip) : 0
  const total     = Number(order.total)

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => navigate('/manager/orders')}
        className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Orders
      </button>

      {/* Header */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-secondary mb-0.5">Order</p>
              <p className="text-lg font-mono font-semibold text-primary">#{order.order_id}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-0.5">Customer</p>
              <p className="text-sm text-primary">{order.customer_name ?? <span className="italic text-muted">Guest</span>}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-0.5">Server</p>
              <p className="text-sm text-primary">{order.employee_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-0.5">Opened</p>
              <p className="text-sm text-primary">{new Date(order.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-0.5">Status</p>
              <Badge tone={statusTone(order.preparation_status)}>{order.preparation_status}</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Staged items (if any remain unfired) */}
      {order.staged.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-secondary">Staged (unfired)</span>
          </CardHeader>
          <ItemTable items={order.staged} />
        </Card>
      )}

      {/* Fired rounds */}
      {order.rounds.map((round, i) => (
        <Card key={round.fired_at}>
          <CardHeader>
            <span className="text-sm font-medium text-secondary">
              Round {i + 1} — fired {new Date(round.fired_at).toLocaleString()}
            </span>
          </CardHeader>
          <ItemTable items={round.items} />
        </Card>
      ))}

      {/* Discounts */}
      {order.discounts.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-secondary">Discounts</span>
          </CardHeader>
          <CardBody>
            <div className="space-y-1">
              {order.discounts.map(d => (
                <div key={d.discount_id} className="flex justify-between text-sm">
                  <span className="text-primary">{d.name}</span>
                  <span className="text-secondary">
                    {d.type === 'percent' ? `${d.value}%` : <Money value={d.value} />}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payments */}
      {order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-secondary">Payments</span>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {order.payments.map(p => (
                <div key={p.payment_id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-primary capitalize">{p.type}</span>
                    {p.card && (
                      <span className="text-secondary ml-2">
                        {p.card.brand} ···{p.card.last_four}
                      </span>
                    )}
                  </div>
                  <Money value={p.amount} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Totals */}
      <Card>
        <CardBody>
          <div className="space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-secondary">Subtotal</span>
              <Money value={order.subtotal} />
            </div>
            {order.discounts.length > 0 && (
              <div className="flex justify-between text-danger">
                <span>Discounts</span>
                <span>—</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary">Tax ({order.tax_percent}%)</span>
              <Money value={taxAmt.toFixed(2)} />
            </div>
            {tip > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Tip</span>
                <Money value={order.tip!} />
              </div>
            )}
            <div className="flex justify-between font-semibold text-primary border-t border-subtle pt-1 mt-1">
              <span>Total</span>
              <Money value={total.toFixed(2)} />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function ItemTable({ items }: { items: OrderDetailType['staged'] }) {
  return (
    <div className="divide-y divide-subtle">
      {items.map(item => (
        <div key={item.order_item_id} className="flex justify-between items-center px-4 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-secondary w-6 text-right">{item.quantity}×</span>
            <span className="text-primary">{item.name}</span>
            {item.kitchen_status === 'voided' && (
              <Badge tone="danger">voided</Badge>
            )}
          </div>
          <Money value={(Number(item.price_at_purchase) * item.quantity).toFixed(2)} />
        </div>
      ))}
    </div>
  )
}
