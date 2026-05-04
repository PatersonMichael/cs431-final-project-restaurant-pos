import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '../../lib/cn'

export interface SalesColumn<T> {
  key: keyof T
  label: string
  align?: 'left' | 'right'
  /** Render cell; defaults to String(value) */
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
}

interface Props<T extends Record<string, unknown>> {
  columns: SalesColumn<T>[]
  rows: T[]
  defaultSortKey?: keyof T
  defaultSortDir?: 'asc' | 'desc'
  emptyMessage?: string
}

export default function SalesTable<T extends Record<string, unknown>>({
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = 'desc',
  emptyMessage = 'No data for this period.',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = sortKey == null
    ? rows
    : [...rows].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        let cmp = 0
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        }
        return sortDir === 'asc' ? cmp : -cmp
      })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2 border-b border-subtle">
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-3 py-2 text-xs font-medium text-secondary uppercase tracking-wide whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : 'text-left',
                  col.sortable !== false && 'cursor-pointer select-none hover:text-primary',
                )}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable !== false && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="border-b border-subtle hover:bg-surface-2 transition-colors duration-150">
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      'px-3 py-2 text-primary',
                      col.align === 'right' && 'text-right font-mono tabular-nums',
                    )}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
