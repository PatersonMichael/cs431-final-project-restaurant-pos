const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(n)) return '$0.00'
  return fmt.format(n)
}

export function isNegative(value: string | number): boolean {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return isFinite(n) && n < 0
}
