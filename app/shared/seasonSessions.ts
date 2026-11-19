import type { MesocycleRecord, TrainingCatalogTables, TrainingDay } from './training'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS
const DAYS: readonly TrainingDay[] = ['dia1', 'dia2', 'dia3']

export interface SeasonSessionRecord {
  seasonId: string
  sessionNumber: number
  weekNumber: number
  day: TrainingDay
  mesocycleId: string
  sessionId: string
}

export interface SeasonSessionInput {
  id: string
  macrocycleId: string
  startsAt: string
  frequency: number
  holidayWeeks: string[]
}

/**
 * One row per session of the season, numbered the same way the app counts them:
 * only training weeks count, holiday weeks are skipped, and each week contributes `frequency` sessions.
 */
export function buildSeasonSessions(
  season: SeasonSessionInput,
  totalWeeks: number,
  catalog: TrainingCatalogTables,
): SeasonSessionRecord[] {
  const seasonMonday = mondayOf(season.startsAt)
  const holidays = new Set(season.holidayWeeks)
  const rows: SeasonSessionRecord[] = []

  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
    if (holidays.has(isoDate(seasonMonday + (weekNumber - 1) * WEEK_MS))) continue

    const phase = phaseForWeek(season.macrocycleId, weekNumber, catalog)
    if (phase?.type !== 'training') continue

    for (let index = 0; index < season.frequency; index++) {
      const day = DAYS[index]!
      const session = catalog.mesocycleSessions.find(
        (item) => item.mesocycleId === phase.id && item.day === day,
      )
      rows.push({
        seasonId: season.id,
        sessionNumber: rows.length + 1,
        weekNumber,
        day,
        mesocycleId: phase.id,
        sessionId: session?.id ?? '',
      })
    }
  }

  return rows
}

function phaseForWeek(
  macrocycleId: string,
  weekNumber: number,
  catalog: TrainingCatalogTables,
): MesocycleRecord | undefined {
  return catalog.mesocycles.find(
    (item) =>
      item.macrocycleId === macrocycleId &&
      weekNumber >= item.weekStart &&
      weekNumber <= item.weekEnd,
  )
}

/**
 * First exercise of a session: block with the lowest blockOrder, then its item with the lowest itemOrder.
 * Derived from the catalog on demand, so it never goes stale.
 */
export function firstExerciseIdOf(sessionId: string, catalog: TrainingCatalogTables): string | undefined {
  const block = catalog.trainingBlocks
    .filter((item) => item.sessionId === sessionId)
    .sort((first, second) => first.blockOrder - second.blockOrder)[0]
  if (!block) return undefined
  const item = catalog.blockExercises
    .filter((entry) => entry.blockId === block.id)
    .sort((first, second) => first.itemOrder - second.itemOrder)[0]
  return item?.exerciseId
}

function mondayOf(isoDate: string): number {
  const start = Date.parse(`${isoDate}T00:00:00Z`)
  return start - ((new Date(start).getUTCDay() + 6) % 7) * DAY_MS
}

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}
