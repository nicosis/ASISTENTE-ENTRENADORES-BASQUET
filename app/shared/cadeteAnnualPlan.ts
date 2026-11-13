import type { TrainingDay } from './training'

export type AnnualWeekKind =
  | 'reunion' | 'construction' | 'base-strength' | 'strength-power' | 'power-speed'
  | 'christmas' | 'return-strength' | 'reactive-power' | 'peak' | 'easter'
  | 'transfer' | 'finals' | 'combine'

export interface AnnualPlanWeek {
  week: number
  kind: AnnualWeekKind
}

/** The plan starts on the third Monday in August of the starting year. */
export function getAnnualSeasonStart(year: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError('Season year must be a four-digit year.')
  }
  const augustFirst = new Date(Date.UTC(year, 7, 1))
  const firstMonday = 1 + ((8 - augustFirst.getUTCDay()) % 7)
  return new Date(Date.UTC(year, 7, firstMonday + 14)).toISOString().slice(0, 10)
}

export function getCurrentSeasonStart(today: Date = new Date()): string {
  const year = today.getFullYear() - (today.getMonth() < 7 ? 1 : 0)
  return getAnnualSeasonStart(year)
}

const ranges: ReadonlyArray<{ start: number; end: number; kind: AnnualWeekKind }> = [
  { start: 1, end: 3, kind: 'reunion' },
  { start: 4, end: 6, kind: 'construction' },
  { start: 7, end: 10, kind: 'base-strength' },
  { start: 11, end: 14, kind: 'strength-power' },
  { start: 15, end: 18, kind: 'power-speed' },
  { start: 19, end: 20, kind: 'christmas' },
  { start: 21, end: 24, kind: 'return-strength' },
  { start: 25, end: 28, kind: 'reactive-power' },
  { start: 29, end: 32, kind: 'peak' },
  { start: 33, end: 33, kind: 'easter' },
  { start: 34, end: 37, kind: 'transfer' },
  { start: 38, end: 41, kind: 'finals' },
  { start: 42, end: 42, kind: 'combine' },
]

export function getAnnualPlanWeek(week: number): AnnualPlanWeek {
  if (!Number.isInteger(week) || week < 1 || week > 42) {
    throw new RangeError('Annual plan week must be an integer from 1 to 42.')
  }
  const range = ranges.find((item) => week >= item.start && week <= item.end)!
  return { week, kind: range.kind }
}

export function getAnnualCalendar(year: number): Array<AnnualPlanWeek & { weekStart: string }> {
  const start = new Date(`${getAnnualSeasonStart(year)}T00:00:00Z`).getTime()
  return Array.from({ length: 42 }, (_, index) => ({
    ...getAnnualPlanWeek(index + 1),
    weekStart: new Date(start + index * 7 * 86400000).toISOString().slice(0, 10),
  }))
}

/** Minutes for Activa, Rápido, Fuerte and Juega, in that order. */
export const annualSessionBlocks: Readonly<Record<TrainingDay, readonly number[]>> = {
  dia1: [5, 5, 12, 3],
  dia2: [5, 6, 9, 5],
  dia3: [5, 7, 5, 8],
}
