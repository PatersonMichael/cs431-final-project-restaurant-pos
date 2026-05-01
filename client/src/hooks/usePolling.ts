import { useEffect, useRef, useCallback } from 'react'

export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const stop  = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (stop.current) return
    fnRef.current()
    stop.current = setInterval(() => fnRef.current(), intervalMs)
  }, [intervalMs])

  const cancel = useCallback(() => {
    if (stop.current) { clearInterval(stop.current); stop.current = null }
  }, [])

  useEffect(() => {
    if (enabled) {
      start()
    } else {
      cancel()
    }
    return cancel
  }, [enabled, start, cancel])
}
