import { cn } from '../../lib/cn'

export interface DateRange {
  from: string
  to: string
}

interface Props {
  range: DateRange
  compareEnabled: boolean
  onRangeChange: (r: DateRange) => void
  onCompareChange: (enabled: boolean) => void
}

type Preset = 'today' | '7d' | '30d' | 'custom'

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function presetRange(preset: Preset): DateRange | null {
  const today = new Date()
  const todayStr = toIsoDate(today)
  if (preset === 'today') return { from: todayStr, to: todayStr }
  if (preset === '7d') {
    const from = new Date(today)
    from.setDate(from.getDate() - 6)
    return { from: toIsoDate(from), to: todayStr }
  }
  if (preset === '30d') {
    const from = new Date(today)
    from.setDate(from.getDate() - 29)
    return { from: toIsoDate(from), to: todayStr }
  }
  return null
}

function detectPreset(range: DateRange): Preset {
  const today = toIsoDate(new Date())
  const p7  = presetRange('7d')
  const p30 = presetRange('30d')
  if (range.from === today && range.to === today) return 'today'
  if (p7  && range.from === p7.from  && range.to === p7.to)  return '7d'
  if (p30 && range.from === p30.from && range.to === p30.to) return '30d'
  return 'custom'
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today'     },
  { key: '7d',    label: 'Last 7 d'  },
  { key: '30d',   label: 'Last 30 d' },
  { key: 'custom', label: 'Custom'   },
]

export default function DateRangeFilter({ range, compareEnabled, onRangeChange, onCompareChange }: Props) {
  const active = detectPreset(range)

  function handlePreset(preset: Preset) {
    if (preset === 'custom') return
    const r = presetRange(preset)
    if (r) onRangeChange(r)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {PRESETS.filter(p => p.key !== 'custom').map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={cn(
              'px-3 py-1.5 text-sm rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active === key
                ? 'bg-accent text-inverse font-medium'
                : 'bg-surface-2 text-secondary hover:text-primary hover:bg-surface-3 border border-default',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={range.from}
          max={range.to}
          onChange={e => onRangeChange({ ...range, from: e.target.value })}
          className="bg-input border border-default text-primary text-sm rounded px-2 py-1.5 focus:outline-none focus:border-strong focus:ring-2 focus:ring-accent/30"
        />
        <span className="text-muted text-sm">–</span>
        <input
          type="date"
          value={range.to}
          min={range.from}
          max={toIsoDate(new Date())}
          onChange={e => onRangeChange({ ...range, to: e.target.value })}
          className="bg-input border border-default text-primary text-sm rounded px-2 py-1.5 focus:outline-none focus:border-strong focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Compare toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={compareEnabled}
          onChange={e => onCompareChange(e.target.checked)}
          className="w-4 h-4 rounded border-default bg-input text-accent focus:ring-accent/30"
        />
        <span className="text-sm text-secondary">Compare to prior period</span>
      </label>
    </div>
  )
}
