export type CadetePeriod = 'PT' | 'M1' | 'M2' | 'M3'
import type { TrainingCatalogTables } from './training'
import { getAnnualPlanWeek } from './cadeteAnnualPlan.ts'

export interface CadeteWeek {
  weekStart: string
  period: CadetePeriod
  holiday: boolean
  rest: boolean
}

/** Assign each whole Monday–Sunday week to the month containing its Monday. */
export function getCadeteWeeks(startDate: string, holidayWeeks: string[] = [], annualPlan = false): CadeteWeek[] {
  if (!/^\d{4}-08-\d{2}$/.test(startDate)) {
    throw new Error('La temporada de cadete debe comenzar un lunes de agosto.')
  }
  const start = new Date(`${startDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startDate || start.getUTCDay() !== 1) {
    throw new Error('La temporada de cadete debe comenzar un lunes de agosto.')
  }

  if (annualPlan) {
    const weeks = Array.from({ length: 42 }, (_, index): CadeteWeek => {
      const number = index + 1
      const kind = getAnnualPlanWeek(number).kind
      const weekStart = new Date(start.getTime() + index * 7 * 86400000).toISOString().slice(0, 10)
      const holiday = kind === 'christmas' || kind === 'easter' || holidayWeeks.includes(weekStart)
      const period: CadetePeriod = number <= 6 ? 'PT' : number <= 20 ? 'M1' : number <= 33 ? 'M2' : 'M3'
      return { weekStart, period, holiday, rest: holiday }
    })
    if (holidayWeeks.some(holiday => !weeks.some(week => week.weekStart === holiday))) {
      throw new Error('Las vacaciones deben corresponder a semanas de la temporada.')
    }
    return weeks
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
  const plan = catalog.macrocycles.find(item => item.ageCategory === 'cadete')
  if (!plan) throw new Error('No hay un macrociclo de cadete en Sheets.')
  const weeks = getCadeteWeeks(startDate, holidayWeeks, plan.totalWeeks === 42)
  const phases = catalog.mesocycles.filter(item => item.macrocycleId === plan.id).sort((a, b) => a.phaseOrder - b.phaseOrder)
  if (plan.totalWeeks === 42) {
    let nextWeek = 1
    for (const phase of phases) {
      if (phase.weekStart !== nextWeek || phase.weekEnd < phase.weekStart || phase.weeksCount !== phase.weekEnd - phase.weekStart + 1) {
        throw new Error('Las fases del plan cadete deben cubrir las 42 semanas sin huecos ni solapamientos.')
      }
      nextWeek = phase.weekEnd + 1
    }
    if (nextWeek !== 43) throw new Error('Las fases del plan cadete deben cubrir las 42 semanas sin huecos ni solapamientos.')
    return catalog
  }
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
  return {
    ...catalog,
    macrocycles: catalog.macrocycles.map(item => item.id === plan.id ? { ...item, totalWeeks: weeks.length } : item),
    mesocycles: catalog.mesocycles.map(item => replacements.get(item.id) ?? item),
  }
}
