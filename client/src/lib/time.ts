export function elapsedSeconds(since: string | Date): number {
  const start = typeof since === 'string' ? new Date(since).getTime() : since.getTime()
  return Math.floor((Date.now() - start) / 1000)
}

export function formatElapsed(totalSeconds: number, compact = false): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (compact) return `${m}m`
  return `${m}m ${s}s`
}

// Expediter time-band thresholds in seconds (STYLE §2.4)
export const TICKET_WARNING_SECS = 5 * 60   // 5 min
export const TICKET_LATE_SECS    = 10 * 60  // 10 min

export type TimeBand = 'fresh' | 'warning' | 'late'

export function getTimeBand(totalSeconds: number): TimeBand {
  if (totalSeconds >= TICKET_LATE_SECS) return 'late'
  if (totalSeconds >= TICKET_WARNING_SECS) return 'warning'
  return 'fresh'
}
