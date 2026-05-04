import type { PaymentMethodsResponse } from '../../types/api'

interface Props {
  data: PaymentMethodsResponse
}

export default function PaymentBreakdown({ data }: Props) {
  const { methods, card_brands } = data
  const hasCardBrands = card_brands.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Method rows */}
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">By method</p>
        <div className="flex flex-col gap-2">
          {methods.map(m => (
            <div key={m.type} className="flex items-center gap-3">
              {/* Bar */}
              <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                <div
                  className="h-full bg-accent rounded transition-all duration-300"
                  style={{ width: `${m.percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-mono tabular-nums text-secondary">
                {m.percentage}%
              </span>
              <span className="w-14 text-left text-sm text-primary capitalize">{m.type}</span>
              <span className="w-24 text-right text-sm font-mono tabular-nums text-primary">${m.total}</span>
              <span className="w-16 text-right text-xs text-muted">{m.count} orders</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card brands */}
      {hasCardBrands && (
        <div>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Card brands</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-3 py-1.5 text-left text-xs font-medium text-secondary uppercase tracking-wide">Brand</th>
                <th className="px-3 py-1.5 text-right text-xs font-medium text-secondary uppercase tracking-wide">Transactions</th>
                <th className="px-3 py-1.5 text-right text-xs font-medium text-secondary uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {card_brands.map(b => (
                <tr key={b.brand} className="border-b border-subtle hover:bg-surface-2 transition-colors duration-150">
                  <td className="px-3 py-2 text-primary">{b.brand}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-secondary">{b.count}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-primary">${b.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {methods.length === 0 && (
        <p className="text-muted text-sm">No payment data for this period.</p>
      )}
    </div>
  )
}
