export type CadetePeriod = 'PT' | 'M1' | 'M2' | 'M3'
import type { TrainingCatalogTables } from './training'

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
      const weekStart = new Date(start.getTime() + index * 7 * 86400000).toISOString().slice(0, 10)
      const holiday = holidayWeeks.includes(weekStart)
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

const DAY_MS = 86400000

/** Easter Sunday (UTC midnight) for a Gregorian year, anonymous Gregorian algorithm. */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

export type HolidayLabel = 'Navidad' | 'Semana Santa'

/**
 * Suggested break for a cadete week, by real date:
 * Christmas = any day from 22 Dec to 6 Jan; Semana Santa = Monday of Holy Week to Easter Sunday.
 */
export function holidayLabelForWeek(week: CadeteWeek): HolidayLabel | null {
  const monday = Date.parse(`${week.weekStart}T00:00:00Z`)
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(monday + offset * DAY_MS)
    const month = day.getUTCMonth() + 1
    const date = day.getUTCDate()
    if ((month === 12 && date >= 22) || (month === 1 && date <= 6)) return 'Navidad'
    const easter = easterSunday(day.getUTCFullYear()).getTime()
    if (day.getTime() >= easter - 6 * DAY_MS && day.getTime() <= easter) return 'Semana Santa'
  }
  return null
}
