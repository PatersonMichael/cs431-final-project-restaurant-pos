import { useState, useEffect } from 'react'

import { elapsedSeconds } from '../lib/time'

// Single global 1-second ticker — all ElapsedTime instances share it
// to avoid N independent setIntervals when many tickets are visible.
let listeners: Set<() => void> | null = null
let intervalId: ReturnType<typeof setInterval> | null = null

function subscribe(cb: () => void) {
  if (!listeners) listeners = new Set()
  listeners.add(cb)
  if (!intervalId) {
    intervalId = setInterval(() => {
      listeners?.forEach(fn => fn())
    }, 1000)
  }
  return () => {
    listeners?.delete(cb)
    if (listeners?.size === 0) {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
      listeners = null
    }
  }
}

export function useElapsed(since: string | Date): number {
  const [secs, setSecs] = useState(() => elapsedSeconds(since))

  useEffect(() => {
    setSecs(elapsedSeconds(since))
    return subscribe(() => setSecs(elapsedSeconds(since)))
  }, [since])

  return secs
}
