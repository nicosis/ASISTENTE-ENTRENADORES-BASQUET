const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

/**
 * Season week (1-based) that contains `today`, clamped to the plan length.
 * Dates before the season start map to week 1; dates after its end map to the last week.
 */
export function currentSeasonWeek(startsAt: string, totalWeeks: number, today: Date = new Date()): number {
  const start = Date.parse(`${startsAt}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isInteger(totalWeeks) || totalWeeks < 1) return 1

  const startWeekday = new Date(start).getUTCDay()
  const seasonMonday = start - ((startWeekday + 6) % 7) * DAY_MS
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const elapsedWeeks = Math.floor((todayUtc - seasonMonday) / WEEK_MS)

  return Math.min(Math.max(elapsedWeeks + 1, 1), totalWeeks)
}
