import type { DiscountUsageResponse } from '../../types/api'

interface Props {
  data: DiscountUsageResponse
}

export default function DiscountReport({ data }: Props) {
  const { discounts, total_discount_value } = data

  if (discounts.length === 0) {
    return <p className="text-muted text-sm">No discounts applied in this period.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2 border-b border-subtle">
            <th className="px-3 py-2 text-left text-xs font-medium text-secondary uppercase tracking-wide">Discount</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-secondary uppercase tracking-wide">Type</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-secondary uppercase tracking-wide">Times Used</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-secondary uppercase tracking-wide">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map(d => (
            <tr key={d.discount_id} className="border-b border-subtle hover:bg-surface-2 transition-colors duration-150">
              <td className="px-3 py-2 text-primary">{d.name}</td>
              <td className="px-3 py-2 text-secondary capitalize">{d.type}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-secondary">{d.times_used}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-primary">${d.total_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end px-3">
        <span className="text-xs text-secondary mr-3">Total discount value</span>
        <span className="text-sm font-mono tabular-nums font-semibold text-danger">${total_discount_value}</span>
      </div>
    </div>
  )
}
