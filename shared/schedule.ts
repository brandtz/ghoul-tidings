// Raffle schedule. Draw k of N is due at started + paused + D * k / (N + 1).
export const dueOffsetMs = (k: number, n: number, durationMin: number) => (durationMin * 60000 * k) / (n + 1)

export const dueAt = (k: number, n: number, startedAt: number, pausedMs: number, durationMin: number) =>
  startedAt + pausedMs + dueOffsetMs(k, n, durationMin)

/** Index (0-based) of the midnight draw. Ties pick the earlier draw. */
export function midnightIndex(n: number, flagged?: number) {
  if (flagged !== undefined && flagged >= 0) return flagged
  if (n <= 0) return -1
  let best = 0; let bestDist = Infinity
  for (let k = 1; k <= n; k++) {
    const dist = Math.abs(k / (n + 1) - 0.5)
    if (dist < bestDist - 1e-9) { bestDist = dist; best = k - 1 }
  }
  return best
}

export const scheduleProgress = (now: number, startedAt: number, pausedMs: number, durationMin: number) =>
  Math.min(1, Math.max(0, (now - startedAt - pausedMs) / (durationMin * 60000)))

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
