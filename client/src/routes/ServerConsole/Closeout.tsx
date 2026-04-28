import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Delete, Trash2 } from 'lucide-react'

import { getTab, applyDiscount, addPayment, deletePayment, deleteDiscount, closeTab, patchTab } from '../../api/tabs'
import { getDiscounts } from '../../api/menu'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Label } from '../../components/Label'
import { Modal } from '../../components/Modal'
import { Money } from '../../components/Money'
import { Badge } from '../../components/Badge'
import { cn } from '../../lib/cn'

import type { TabDetail, DiscountListItem } from '../../types/api'

type PaymentType = 'cash' | 'electronic'
type CardBrand   = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other'

interface CardForm {
  cardholderName:    string
  lastFour:          string
  brand:             CardBrand
  expirationMonth:   string
  expirationYear:    string
}

const EMPTY_CARD: CardForm = {
  cardholderName: '', lastFour: '', brand: 'visa',
  expirationMonth: '', expirationYear: '',
}

const CASH_DENOMS = [5, 10, 20, 50, 100] // dollars

function rowLabel(type: string, value: string) {
  return type === 'percent'
    ? `${parseFloat(value).toFixed(0)}% off`
    : `-$${parseFloat(value).toFixed(2)}`
}

function sumPayments(payments: TabDetail['payments']) {
  return payments.reduce((acc, p) => acc + parseFloat(p.amount), 0)
}

/** Format integer cents as "$12.34" */
function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

// ─── Keypad ───────────────────────────────────────────────────────────────────

interface KeypadProps {
  cents:     number
  onChange:  (next: number) => void
}

function Keypad({ cents, onChange }: KeypadProps) {
  function press(digit: number) {
    // Shift existing digits left (×10) and append new digit
    const next = cents * 10 + digit
    if (next > 99999999) return // cap at $999,999.99
    onChange(next)
  }
  function backspace() { onChange(Math.floor(cents / 10)) }
  function clear()     { onChange(0) }

  const keys: Array<number | 'back' | 'clear'> = [
    7, 8, 9,
    4, 5, 6,
    1, 2, 3,
    'clear', 0, 'back',
  ]

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k, i) => {
        if (k === 'back') return (
          <button
            key={i}
            onClick={backspace}
            className="h-12 flex items-center justify-center rounded-md bg-surface-3 text-secondary hover:bg-surface-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Backspace"
          >
            <Delete size={16} />
          </button>
        )
        if (k === 'clear') return (
          <button
            key={i}
            onClick={clear}
            className="h-12 flex items-center justify-center rounded-md bg-surface-3 text-muted text-sm font-medium hover:bg-surface-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            CLR
          </button>
        )
        return (
          <button
            key={i}
            onClick={() => press(k)}
            className="h-12 flex items-center justify-center rounded-md bg-surface-2 text-primary text-lg font-medium hover:bg-surface-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Closeout() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const id = orderId ? parseInt(orderId, 10) : null

  const [tab,          setTab]          = useState<TabDetail | null>(null)
  const [discountList, setDiscountList] = useState<DiscountListItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // Tip
  const [tipInput,   setTipInput]   = useState('')
  const [savingTip,  setSavingTip]  = useState(false)

  // Discount
  const [selectedDiscountId, setSelectedDiscountId] = useState('')
  const [applyingDiscount,   setApplyingDiscount]   = useState(false)

  // Payment — amount tracked in integer cents for precision
  const [payType,        setPayType]        = useState<PaymentType>('cash')
  const [centAmount,     setCentAmount]     = useState(0)
  const [keypadOpen,     setKeypadOpen]     = useState(false)
  const [cardForm,       setCardForm]       = useState<CardForm>(EMPTY_CARD)
  const [payError,        setPayError]        = useState<string | null>(null)
  const [addingPayment,    setAddingPayment]    = useState(false)
  const [deletingPayment,  setDeletingPayment]  = useState<number | null>(null)
  const [deletingDiscount, setDeletingDiscount] = useState<number | null>(null)

  // Close
  const [closing,       setClosing]       = useState(false)
  const [changeModal,   setChangeModal]   = useState(0)  // cents of change to confirm, 0 = closed
  const [pendingChange, setPendingChange] = useState(0)  // change owed from last cash payment

  const fetchTab = useCallback(async () => {
    if (!id) return
    try {
      const data = await getTab(id)
      setTab(data)
      if (data.tip) setTipInput(data.tip)
      setError(null)
      // Pre-fill with remaining balance
      const paid      = sumPayments(data.payments)
      const remaining = Math.max(0, parseFloat(data.total) - paid)
      setCentAmount(Math.round(remaining * 100))
    } catch {
      setError('Could not load tab.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    async function init() {
      if (!id) return
      const [, discounts] = await Promise.allSettled([fetchTab(), getDiscounts()])
      if (discounts.status === 'fulfilled') setDiscountList(discounts.value)
    }
    void init()
  }, [id, fetchTab])

  // Reset centAmount to remaining whenever payType changes
  useEffect(() => {
    if (!tab) return
    const paid      = sumPayments(tab.payments)
    const remaining = Math.max(0, parseFloat(tab.total) - paid)
    setCentAmount(Math.round(remaining * 100))
    setKeypadOpen(false)
    setPayError(null)
  }, [payType]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveTip() {
    if (!id) return
    setSavingTip(true)
    try {
      const updated = await patchTab(id, { tip: tipInput || '0.00' })
      setTab(updated)
    } catch {
      setError('Could not update tip.')
    } finally {
      setSavingTip(false)
    }
  }

  async function handleApplyDiscount() {
    if (!id || !selectedDiscountId) return
    setApplyingDiscount(true)
    try {
      const updated = await applyDiscount(id, { discount_id: parseInt(selectedDiscountId, 10) })
      setTab(updated)
      setSelectedDiscountId('')
      setPendingChange(0)
      const newPaid      = sumPayments(updated.payments)
      const newRemaining = Math.max(0, parseFloat(updated.total) - newPaid)
      setCentAmount(Math.round(newRemaining * 100))
    } catch {
      setError('Could not apply discount.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  function validatePayment(remainingCents: number): string | null {
    if (centAmount <= 0) return 'Enter a valid amount.'
    if (payType === 'electronic' && centAmount > remainingCents) return 'Amount cannot exceed balance owed for card payments.'
    if (payType === 'electronic') {
      if (!cardForm.cardholderName.trim()) return 'Cardholder name is required.'
      if (!/^\d{4}$/.test(cardForm.lastFour)) return 'Last four digits must be exactly 4 digits.'
      const month = parseInt(cardForm.expirationMonth, 10)
      const year  = parseInt(cardForm.expirationYear, 10)
      if (!cardForm.expirationMonth || isNaN(month) || month < 1 || month > 12)
        return 'Valid expiration month required (1–12).'
      if (!cardForm.expirationYear || isNaN(year) || year < 2024)
        return 'Valid expiration year required.'
    }
    return null
  }

  async function handleAddPayment(remainingCents: number) {
    const err = validatePayment(remainingCents)
    if (err) { setPayError(err); return }
    if (!id) return

    setAddingPayment(true)
    setPayError(null)
    try {
      // For cash, record only what was owed (not the overpayment — change stays with cashier)
      const chargeAmount = payType === 'cash'
        ? Math.min(centAmount, remainingCents)
        : centAmount
      const updated = await addPayment(id, {
        type:   payType,
        amount: (chargeAmount / 100).toFixed(2),
        ...(payType === 'electronic' ? {
          card: {
            cardholder_name:   cardForm.cardholderName.trim(),
            last_four:         cardForm.lastFour,
            brand:             cardForm.brand,
            expiration_month:  parseInt(cardForm.expirationMonth, 10),
            expiration_year:   parseInt(cardForm.expirationYear, 10),
          },
        } : {}),
      })
      // Capture change before resetting centAmount
      if (payType === 'cash' && centAmount > remainingCents) {
        setPendingChange(centAmount - remainingCents)
      } else {
        setPendingChange(0)
      }
      setTab(updated)
      setCardForm(EMPTY_CARD)
      setKeypadOpen(false)
      // Pre-fill next payment with new remaining
      const newPaid      = sumPayments(updated.payments)
      const newRemaining = Math.max(0, parseFloat(updated.total) - newPaid)
      setCentAmount(Math.round(newRemaining * 100))
    } catch {
      setPayError('Could not add payment. Try again.')
    } finally {
      setAddingPayment(false)
    }
  }

  async function handleDeletePayment(paymentId: number) {
    if (!id) return
    setDeletingPayment(paymentId)
    try {
      const updated = await deletePayment(id, paymentId)
      setTab(updated)
      setPendingChange(0)
      const newPaid      = sumPayments(updated.payments)
      const newRemaining = Math.max(0, parseFloat(updated.total) - newPaid)
      setCentAmount(Math.round(newRemaining * 100))
    } catch {
      setError('Could not remove payment.')
    } finally {
      setDeletingPayment(null)
    }
  }

  async function handleDeleteDiscount(discountId: number) {
    if (!id) return
    setDeletingDiscount(discountId)
    try {
      const updated = await deleteDiscount(id, discountId)
      setTab(updated)
      setPendingChange(0)
      const newPaid      = sumPayments(updated.payments)
      const newRemaining = Math.max(0, parseFloat(updated.total) - newPaid)
      setCentAmount(Math.round(newRemaining * 100))
    } catch {
      setError('Could not remove discount.')
    } finally {
      setDeletingDiscount(null)
    }
  }

  function handleClose(pendingChangeCents: number) {
    if (pendingChangeCents > 0) {
      setChangeModal(pendingChangeCents)
    } else {
      void doClose()
    }
  }

  async function doClose() {
    if (!id) return
    setChangeModal(0)
    setClosing(true)
    try {
      await closeTab(id)
      navigate('/server')
    } catch {
      setError('Could not close tab. Ensure full payment is collected.')
      setClosing(false)
    }
  }

  if (!id) return null

  if (loading) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-muted border-t-transparent animate-spin" />
    </div>
  )

  if (!tab) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="px-4 py-3 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary">
        {error ?? 'Tab not found.'}
      </div>
    </div>
  )

  const totalPaid       = sumPayments(tab.payments)
  const total           = parseFloat(tab.total)
  const remaining       = Math.max(0, total - totalPaid)
  const remainingCents  = Math.round(remaining * 100)
  const isFullyPaid     = totalPaid >= total

  // Discount total for tax-after-discount display
  const subtotalNum = parseFloat(tab.subtotal)
  const discountTotal = tab.discounts.reduce((acc, d) => {
    return acc + (d.type === 'percent'
      ? subtotalNum * parseFloat(d.value) / 100
      : parseFloat(d.value))
  }, 0)
  const taxableSubtotal = Math.max(0, subtotalNum - discountTotal)

  // Cash overpayment
  const changeCents     = payType === 'cash' && centAmount > remainingCents
    ? centAmount - remainingCents
    : 0

  // Electronic overpayment guard
  const isOverpaid      = payType === 'electronic' && centAmount > remainingCents

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-subtle bg-surface">
        <button
          onClick={() => navigate(`/server/tabs/${id}`)}
          className="text-muted hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          aria-label="Back to tab"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-base font-semibold text-primary">
          Close out — {tab.customer_name ?? `Tab #${tab.order_id}`}
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary flex-shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-4 space-y-6">

        {/* Totals summary */}
        <section className="bg-surface rounded-md border border-edge divide-y divide-subtle">
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-secondary">Subtotal</span>
            <Money value={tab.subtotal} />
          </div>
          {tab.discounts.map(d => (
            <div key={d.discount_id} className="flex justify-between px-4 py-2 text-sm">
              <span className="text-secondary">{d.name}</span>
              <span className="font-mono tabular-nums text-success text-sm">{rowLabel(d.type, d.value)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-secondary">Tax ({parseFloat(tab.tax_percent).toFixed(2)}%)</span>
            <Money value={(taxableSubtotal * parseFloat(tab.tax_percent) / 100).toFixed(2)} />
          </div>
          {tab.tip && parseFloat(tab.tip) > 0 && (
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="text-secondary">Tip</span>
              <Money value={tab.tip} />
            </div>
          )}
          <div className="flex justify-between px-4 py-3 font-bold">
            <span className="text-primary text-base">Total</span>
            <span className="font-mono tabular-nums text-xl text-primary">
              <Money value={tab.total} />
            </span>
          </div>
          {(changeCents > 0 || pendingChange > 0) && (
            <div className="flex justify-between px-4 py-3 bg-success-bg">
              <span className="text-sm font-semibold text-success">Change due</span>
              <span className="font-mono tabular-nums text-lg font-bold text-success">
                {fmtCents(changeCents > 0 ? changeCents : pendingChange)}
              </span>
            </div>
          )}
        </section>

        {/* Tip */}
        <section className="bg-surface rounded-md border border-edge p-4 space-y-3">
          <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">Tip</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="tip-input">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <Input
                  id="tip-input"
                  type="text"
                  inputMode="decimal"
                  value={tipInput}
                  onChange={e => setTipInput(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="pl-6 text-right"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button intent="secondary" size="sm" loading={savingTip} onClick={() => void handleSaveTip()}>
                Apply
              </Button>
            </div>
          </div>
        </section>

        {/* Discounts */}
        <section className="bg-surface rounded-md border border-edge p-4 space-y-3">
          <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">Discounts</h3>
          {tab.discounts.length > 0 && (
            <div className="space-y-1">
              {tab.discounts.map(d => (
                <div key={d.discount_id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-primary">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone="success">{rowLabel(d.type, d.value)}</Badge>
                    <button
                      onClick={() => void handleDeleteDiscount(d.discount_id)}
                      disabled={deletingDiscount !== null}
                      className="text-muted hover:text-danger transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded disabled:opacity-40"
                      aria-label="Remove discount"
                    >
                      {deletingDiscount === d.discount_id
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-muted border-t-transparent animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                value={selectedDiscountId}
                onChange={e => setSelectedDiscountId(e.target.value)}
                className="block w-full rounded-md bg-input border border-edge px-3 py-2 text-sm text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-strong"
              >
                <option value="">Select discount…</option>
                {discountList.map(d => (
                  <option key={d.discount_id} value={d.discount_id}>
                    {d.name} ({rowLabel(d.type, d.value)})
                  </option>
                ))}
              </select>
            </div>
            <Button
              intent="secondary" size="sm"
              loading={applyingDiscount}
              disabled={!selectedDiscountId}
              onClick={() => void handleApplyDiscount()}
            >
              Apply
            </Button>
          </div>
        </section>

        {/* Payments collected */}
        {tab.payments.length > 0 && (
          <section className="bg-surface rounded-md border border-edge divide-y divide-subtle">
            <div className="px-4 py-2 text-xs font-medium text-secondary uppercase tracking-wide">
              Payments collected
            </div>
            {tab.payments.map(p => (
              <div key={p.payment_id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{p.type}</Badge>
                  {p.card && (
                    <span className="text-muted text-xs">{p.card.brand} ···{p.card.last_four}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Money value={p.amount} />
                  <button
                    onClick={() => void handleDeletePayment(p.payment_id)}
                    disabled={deletingPayment !== null}
                    className="text-muted hover:text-danger transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded disabled:opacity-40"
                    aria-label="Remove payment"
                  >
                    {deletingPayment === p.payment_id
                      ? <div className="w-3.5 h-3.5 rounded-full border-2 border-muted border-t-transparent animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 text-sm font-medium">
              <span className="text-secondary">Remaining</span>
              <span className={cn('font-mono tabular-nums', remaining > 0 ? 'text-warning' : 'text-success')}>
                {remaining > 0 ? `$${remaining.toFixed(2)}` : 'Paid in full'}
              </span>
            </div>
          </section>
        )}

        {/* Add payment */}
        {!isFullyPaid && (
          <section className="bg-surface rounded-md border border-edge p-4 space-y-4">
            <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">Add Payment</h3>

            {/* Type toggle */}
            <div className="flex rounded-md border border-edge overflow-hidden text-sm w-fit">
              {(['cash', 'electronic'] as PaymentType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setPayType(t) }}
                  className={cn(
                    'px-4 py-2 font-medium capitalize transition-colors duration-150 focus-visible:outline-none',
                    payType === t ? 'bg-accent text-inverse' : 'bg-surface-2 text-secondary hover:bg-surface-3',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount display — tap to open/close keypad */}
            <div>
              <div className="text-xs font-medium text-secondary mb-1">
                Amount {payType === 'cash' ? '(cash tendered)' : ''}
              </div>
              <button
                onClick={() => setKeypadOpen(o => !o)}
                className={cn(
                  'w-full text-right px-4 py-3 rounded-md border font-mono tabular-nums text-3xl font-bold',
                  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isOverpaid
                    ? 'border-danger bg-danger-bg text-danger'
                    : keypadOpen
                      ? 'border-strong bg-input text-primary'
                      : 'border-edge bg-input text-primary hover:border-strong',
                )}
                aria-label="Enter payment amount"
              >
                {fmtCents(centAmount)}
              </button>
              {isOverpaid && (
                <p className="text-xs text-danger mt-1">
                  Amount exceeds balance. Reduce or switch to cash.
                </p>
              )}
            </div>

            {/* Keypad */}
            {keypadOpen && (
              <Keypad cents={centAmount} onChange={setCentAmount} />
            )}

            {/* Cash denomination buttons */}
            {payType === 'cash' && (
              <div className="space-y-2">
                <div className="text-xs text-muted">Quick amount</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Exact */}
                  <button
                    onClick={() => { setCentAmount(remainingCents); setKeypadOpen(false) }}
                    className="h-10 px-2 rounded-md border border-edge bg-surface-2 text-sm font-medium text-accent hover:bg-surface-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Exact<br />
                    <span className="text-xs font-mono">{fmtCents(remainingCents)}</span>
                  </button>
                  {CASH_DENOMS.map(d => (
                    <button
                      key={d}
                      onClick={() => { setCentAmount(c => c + d * 100); setKeypadOpen(false) }}
                      className="h-10 rounded-md border border-edge bg-surface-2 text-sm font-medium text-secondary hover:bg-surface-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      +${d}
                    </button>
                  ))}
                </div>

                {/* Change due */}
                {changeCents > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-md bg-success-bg border border-success/30">
                    <span className="text-sm font-medium text-success">Change due</span>
                    <span className="font-mono tabular-nums text-xl font-bold text-success">
                      {fmtCents(changeCents)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {payError && (
              <div className="px-3 py-2 border-l-4 border-danger bg-danger-bg rounded text-sm text-primary">
                {payError}
              </div>
            )}

            {/* Card fields */}
            {payType === 'electronic' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="card-name">Cardholder name *</Label>
                  <Input
                    id="card-name"
                    value={cardForm.cardholderName}
                    onChange={e => setCardForm(f => ({ ...f, cardholderName: e.target.value }))}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="card-last4">Last 4 digits *</Label>
                    <Input
                      id="card-last4"
                      value={cardForm.lastFour}
                      onChange={e => setCardForm(f => ({ ...f, lastFour: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="1234"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-brand">Brand *</Label>
                    <select
                      id="card-brand"
                      value={cardForm.brand}
                      onChange={e => setCardForm(f => ({ ...f, brand: e.target.value as CardBrand }))}
                      className="block w-full rounded-md bg-input border border-edge px-3 py-2 text-sm text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-strong"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">Amex</option>
                      <option value="discover">Discover</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="card-month">Exp month *</Label>
                    <Input
                      id="card-month"
                      value={cardForm.expirationMonth}
                      onChange={e => setCardForm(f => ({ ...f, expirationMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                      placeholder="MM"
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-year">Exp year *</Label>
                    <Input
                      id="card-year"
                      value={cardForm.expirationYear}
                      onChange={e => setCardForm(f => ({ ...f, expirationYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="YYYY"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              intent="primary"
              size="md"
              className="w-full"
              loading={addingPayment}
              disabled={isOverpaid || centAmount === 0}
              onClick={() => void handleAddPayment(remainingCents)}
            >
              Add Payment
            </Button>
          </section>
        )}

        {/* Close tab */}
        <div className="pb-4">
          <Button
            intent={isFullyPaid ? 'primary' : 'secondary'}
            size="lg"
            className="w-full"
            disabled={!isFullyPaid}
            loading={closing}
            onClick={() => handleClose(pendingChange)}
          >
            Close Tab
          </Button>
          {!isFullyPaid && (
            <p className="text-xs text-muted text-center mt-2">
              Collect ${remaining.toFixed(2)} more to close.
            </p>
          )}
        </div>

      </div>

      {/* Change-due confirmation modal */}
      <Modal
        open={changeModal > 0}
        onClose={() => setChangeModal(0)}
        title="Return change to customer"
      >
        <div className="text-center space-y-3">
          <p className="text-sm text-secondary">Give the customer their change before closing the tab.</p>
          <div className="py-4">
            <span className="font-mono tabular-nums text-5xl font-bold text-success">
              {fmtCents(changeModal)}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button intent="secondary" onClick={() => setChangeModal(0)}>Cancel</Button>
          <Button intent="primary" loading={closing} onClick={() => void doClose()}>
            Change given — Close Tab
          </Button>
        </div>
      </Modal>

    </div>
  )
}
