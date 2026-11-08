export type CadetePeriod = 'PT' | 'M1' | 'M2' | 'M3'
import type { TrainingCatalogTables } from './training'

export interface CadeteWeek {
  weekStart: string
  period: CadetePeriod
  holiday: boolean
  rest: boolean
}

/** Assign each whole Monday–Sunday week to the month containing its Monday. */
export function getCadeteWeeks(startDate: string, holidayWeeks: string[] = []): CadeteWeek[] {
  if (!/^\d{4}-08-\d{2}$/.test(startDate)) {
    throw new Error('La temporada de cadete debe comenzar un lunes de agosto.')
  }
  const start = new Date(`${startDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startDate || start.getUTCDay() !== 1) {
    throw new Error('La temporada de cadete debe comenzar un lunes de agosto.')
  }

  const end = Date.UTC(start.getUTCFullYear() + 1, 6, 1)
  const weeks: CadeteWeek[] = []
  let trainingWeeks = 0
  let previousPeriod: CadetePeriod | undefined
  for (let day = start.getTime(); day < end; day += 7 * 86400000) {
    const date = new Date(day)
    const month = date.getUTCMonth() + 1
    const period: CadetePeriod = month <= 3 ? 'M2' : month <= 6 ? 'M3' : month <= 9 ? 'PT' : 'M1'
    const weekStart = date.toISOString().slice(0, 10)
    if (period !== previousPeriod) trainingWeeks = 0
    const holiday = holidayWeeks.includes(weekStart)
    const rest = holiday || trainingWeeks === 3
    trainingWeeks = rest ? 0 : trainingWeeks + 1
    previousPeriod = period
    weeks.push({ weekStart, period, holiday, rest })
  }
  if (holidayWeeks.some((holiday) => !weeks.some((week) => week.weekStart === holiday))) {
    throw new Error('Las vacaciones deben corresponder a semanas de la temporada.')
  }
  return weeks
}

/** Align the four sheet-defined periods with the Mondays of a specific season. */
export function alignCadeteCatalog(catalog: TrainingCatalogTables, startDate: string, holidayWeeks: string[] = []): TrainingCatalogTables {
  const weeks = getCadeteWeeks(startDate, holidayWeeks)
  const plan = catalog.macrocycles.find(item => item.ageCategory === 'cadete')
  if (!plan) throw new Error('No hay un macrociclo de cadete en Sheets.')
  const phases = catalog.mesocycles.filter(item => item.macrocycleId === plan.id).sort((a, b) => a.phaseOrder - b.phaseOrder)
  if (phases.length !== 4 || phases.some(item => item.type !== 'training')) {
    throw new Error('El catálogo de cadete debe contener cuatro períodos de entrenamiento.')
  }
  const periods: CadetePeriod[] = ['PT', 'M1', 'M2', 'M3']
  const replacements = new Map(phases.map((phase, index) => {
    const first = weeks.findIndex(week => week.period === periods[index])
    const matching = weeks.filter(week => week.period === periods[index])
    if (first < 0) throw new Error('Falta un período de cadete en el calendario.')
    return [phase.id, {
      ...phase, weekStart: first + 1, weekEnd: first + matching.length, weeksCount: matching.length,
      weeklyLoads: matching.map(week => week.rest ? 3 : phase.weeklyLoads[0] ?? 5),
    }] as const
  }))
  const sessionPhases = new Map(catalog.mesocycleSessions.map(session => [session.id, session.mesocycleId]))
  return {
    ...catalog,
    macrocycles: catalog.macrocycles.map(item => item.id === plan.id ? { ...item, totalWeeks: weeks.length } : item),
    mesocycles: catalog.mesocycles.map(item => replacements.get(item.id) ?? item),
    sessionVariants: catalog.sessionVariants.map(variant => {
      const phase = replacements.get(sessionPhases.get(variant.mesocycleSessionId) ?? '')
      return phase ? { ...variant, weekStart: phase.weekStart, weekEnd: phase.weekEnd } : variant
    }),
  }
}
