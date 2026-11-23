export type Frequency = 1 | 2 | 3
export type TrainingDay = 'dia1' | 'dia2' | 'dia3'
export type AgeCategory = 'alevin' | 'infantil' | 'cadete' | 'juvenil'
export type PhaseType = 'training' | 'holiday' | 'assessment'

export interface ExerciseRecord {
  id: string
  name: string
  category: string
  focus: string
  movementLevel?: string
  movementArea?: string
  material: string
  how: string[]
  cue: string
  errors: string[]
  easier: string
  harder: string
}

export interface MacrocycleRecord {
  id: string
  name: string
  ageCategory: AgeCategory
  totalWeeks: number
}

export interface MesocycleRecord {
  id: string
  macrocycleId: string
  phaseOrder: number
  type: PhaseType
  name: string
  weekStart: number
  weekEnd: number
  objective: string
  load: number
}

export type MicrocycleStatus = 'planned' | 'active' | 'completed'

export interface MicrocycleRecord {
  id: string
  seasonId: string
  macrocycleId: string
  mesocycleId: string
  weekNumber: number
  weekStart: string
  weekEnd: string
  objective: string
  loadIndex: number
  status: MicrocycleStatus
  /** Sesiones completadas de la semana, contadas en orden (0 … frequency). */
  sessionsDone: number
}

export interface MesocycleSessionRecord {
  id: string
  mesocycleId: string
  day: TrainingDay
  order: number
  name: string
  focus: string
  totalMinutes: number
}

export interface TrainingBlockRecord {
  id: string
  sessionId: string
  blockOrder: number
  name: string
  minutes: number
  format: string
}

export interface BlockExerciseRecord {
  id: string
  blockId: string
  exerciseId: string
  itemOrder: number
  stationLabel: string
  weekDoses: Record<number, string>
}

export interface HomeSessionRecord {
  id: string
  macrocycleId: string
  code: 'A' | 'B' | 'C'
  name: string
  minutes: number
  format: string
  exerciseId: string
  doseHoliday1: string
  weekNumbers?: number[]
  weekDoses?: Record<number, string>
}

export interface TestRecord {
  id: string
  macrocycleId: string
  testOrder: number
  name: string
  protocol: string
  milestoneWeeks: string[]
}

export interface HydratedBlockExercise {
  id: string
  blockId: string
  exerciseId: string
  itemOrder: number
  stationLabel: string
  dose: string
  exercise: ExerciseRecord
}

export interface HydratedSessionBlock {
  id: string
  sessionId: string
  blockOrder: number
  name: string
  minutes: number
  format: string
  items: HydratedBlockExercise[]
}

export interface HydratedPhaseSession {
  plan: MacrocycleRecord
  phase: MesocycleRecord
  weekNumber: number
  weekInPhase: number
  loadIndex: number
  isDeload: boolean
  session: MesocycleSessionRecord
  blocks: HydratedSessionBlock[]
}

// ============================================================================
// TABLA 1: ejercicios (Catálogo maestro de ejercicios - sin dosis ni minutos)
// ============================================================================
export const exercises: ExerciseRecord[] = []

export const macrocycles: MacrocycleRecord[] = []

export const mesocycles: MesocycleRecord[] = []

export const mesocycleSessions: MesocycleSessionRecord[] = []

export const trainingBlocks: TrainingBlockRecord[] = []

export const blockExercises: BlockExerciseRecord[] = []

export const homeSessions: HomeSessionRecord[] = []

export const tests: TestRecord[] = []

export interface TrainingCatalogTables {
  macrocycles: MacrocycleRecord[]
  mesocycles: MesocycleRecord[]
  mesocycleSessions: MesocycleSessionRecord[]
  trainingBlocks: TrainingBlockRecord[]
  blockExercises: BlockExerciseRecord[]
  exercises: ExerciseRecord[]
  homeSessions: HomeSessionRecord[]
  tests: TestRecord[]
}

export const defaultTrainingCatalog: TrainingCatalogTables = {
  macrocycles,
  mesocycles,
  mesocycleSessions,
  trainingBlocks,
  blockExercises,
  exercises,
  homeSessions,
  tests,
}

export type TrainingDataIssueCode =
  | 'missing-plan'
  | 'missing-phase'
  | 'missing-session'
  | 'missing-block'
  | 'missing-block-exercise'
  | 'missing-exercise'

export interface TrainingDataStatus {
  available: boolean
  code?: TrainingDataIssueCode
  message?: string
}

export function getHolidayDataStatus(
  macrocycleId: string,
  catalog: Pick<TrainingCatalogTables, 'homeSessions' | 'exercises'>,
): TrainingDataStatus {
  const activities = catalog.homeSessions.filter(item => item.macrocycleId === macrocycleId)
  if (!activities.length) return { available: false, code: 'missing-session', message: 'No hay actividades de vacaciones configuradas.' }
  const missing = activities.find(item => !catalog.exercises.some(exercise => exercise.id === item.exerciseId))
  if (missing) return { available: false, code: 'missing-exercise', message: `No existe el ejercicio ${missing.exerciseId} referenciado por una sesión en casa.` }
  return { available: true }
}

/**
 * Verifies the relational chain required to render one requested training
 * session. Consumers must use this before hydrating a session so missing
 * source data is never represented by another plan or exercise.
 */
export function getTrainingDataStatus(
  params: {
    ageCategory: AgeCategory
    macrocycleId?: string
    mesocycleId?: string
    weekNumber: number
    day: TrainingDay
  },
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): TrainingDataStatus {
  const plan = catalog.macrocycles.find(
    (item) =>
      (params.macrocycleId !== undefined
        ? item.id === params.macrocycleId
        : item.ageCategory === params.ageCategory) &&
      item.ageCategory === params.ageCategory,
  )
  if (!plan) {
    return {
      available: false,
      code: 'missing-plan',
      message: params.macrocycleId !== undefined
        ? `No existe el plan ${params.macrocycleId} de esta temporada.`
        : `No hay un plan disponible para la categoría ${params.ageCategory}.`,
    }
  }

  const phase = params.mesocycleId
    ? catalog.mesocycles.find(
        (item) =>
          item.id === params.mesocycleId &&
          item.macrocycleId === plan.id &&
          params.weekNumber >= item.weekStart &&
          params.weekNumber <= item.weekEnd,
      )
    : catalog.mesocycles.find(
        (item) =>
          item.macrocycleId === plan.id &&
          params.weekNumber >= item.weekStart &&
          params.weekNumber <= item.weekEnd,
      )
  if (!phase) {
    return {
      available: false,
      code: 'missing-phase',
      message: 'No hay una fase configurada para esta semana.',
    }
  }

  const session = catalog.mesocycleSessions.find(
    (item) => item.mesocycleId === phase.id && item.day === params.day,
  )
  if (!session) {
    return {
      available: false,
      code: 'missing-session',
      message: 'No hay una sesión configurada para el día seleccionado.',
    }
  }

  const blocks = catalog.trainingBlocks.filter(
    (item) => item.sessionId === session.id,
  )
  if (!blocks.length) {
    return {
      available: false,
      code: 'missing-block',
      message: 'No hay bloques configurados para esta sesión.',
    }
  }

  for (const block of blocks) {
    const blockItems = catalog.blockExercises.filter(
      (item) => item.blockId === block.id,
    )
    if (!blockItems.length) {
      return {
        available: false,
        code: 'missing-block-exercise',
        message: `No hay ejercicios configurados para el bloque ${block.name}.`,
      }
    }
    const missingExercise = blockItems.find(
      (item) => !catalog.exercises.some((exercise) => exercise.id === item.exerciseId),
    )
    if (missingExercise) {
      return {
        available: false,
        code: 'missing-exercise',
        message: `No existe el ejercicio ${missingExercise.exerciseId} referenciado por la sesión.`,
      }
    }
  }

  const missingHomeExercise = catalog.homeSessions
    .filter((item) => item.macrocycleId === plan.id)
    .find(
      (item) =>
        !catalog.exercises.some((exercise) => exercise.id === item.exerciseId),
    )
  if (missingHomeExercise) {
    return {
      available: false,
      code: 'missing-exercise',
      message: `No existe el ejercicio ${missingHomeExercise.exerciseId} referenciado por una sesión en casa.`,
    }
  }

  return { available: true }
}

export class TrainingDataUnavailableError extends Error {
  readonly code: TrainingDataIssueCode

  constructor(code: TrainingDataIssueCode, message: string) {
    super(message)
    this.code = code
    this.name = 'TrainingDataUnavailableError'
  }
}

function unavailable(
  code: TrainingDataIssueCode,
  message: string,
): never {
  throw new TrainingDataUnavailableError(code, message)
}

export function resolveMacrocycle(
  ageCategory: AgeCategory = 'cadete',
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
  macrocycleId?: string,
): MacrocycleRecord {
  const exact = catalog.macrocycles.find(
    (plan) =>
      (macrocycleId !== undefined ? plan.id === macrocycleId : plan.ageCategory === ageCategory) &&
      plan.ageCategory === ageCategory,
  )
  if (exact) return exact
  return unavailable(
    'missing-plan',
    macrocycleId !== undefined
      ? `No existe el plan ${macrocycleId} de esta temporada.`
      : `No hay un plan disponible para la categoría ${ageCategory}.`,
  )
}

export interface MesocycleWeekContext {
  phase: MesocycleRecord
  weekNumber: number
  weekInPhase: number
  loadIndex: number
  isDeload: boolean
}

export interface HydratedHomeSessionRecord extends HomeSessionRecord {
  exercise: ExerciseRecord
}

export function getMesocycles(
  macrocycleId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): MesocycleRecord[] {
  const direct = catalog.mesocycles.filter((phase) => phase.macrocycleId === macrocycleId)
  return [...direct].sort((a, b) => a.phaseOrder - b.phaseOrder)
}

export function getMesocycleForWeek(
  macrocycleId: string,
  weekNumber: number,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
  mesocycleId?: string,
): MesocycleWeekContext {
  const phases = getMesocycles(macrocycleId, catalog)
  const plan = catalog.macrocycles.find((item) => item.id === macrocycleId)
  if (!plan) return unavailable('missing-plan', `No existe el plan ${macrocycleId}.`)
  const maxWeeks = plan.totalWeeks
  const clampedWeek = Math.max(1, Math.min(maxWeeks, weekNumber))
  const phase = mesocycleId
    ? phases.find(
        (item) =>
          item.id === mesocycleId &&
          clampedWeek >= item.weekStart &&
          clampedWeek <= item.weekEnd,
      )
    : phases.find(
        (item) => clampedWeek >= item.weekStart && clampedWeek <= item.weekEnd,
      )
  if (!phase) {
    return unavailable(
      'missing-phase',
      `No hay una fase configurada para la semana ${clampedWeek}.`,
    )
  }
  const weekInPhase = Math.max(1, clampedWeek - phase.weekStart + 1)
  const weeksInPhase = phase.weekEnd - phase.weekStart + 1
  const loadIndex = phase.load
  const isDeload =
    phase.type === 'training' &&
    weekInPhase === weeksInPhase &&
    loadIndex <= 4
  return {
    phase,
    weekNumber: clampedWeek,
    weekInPhase,
    loadIndex,
    isDeload,
  }
}

// Sessions already scheduled in the season before weekNumber: every training week
// before it adds `frequency` sessions, while holiday or rest weeks add none.
export function getSeasonSessionOffset(
  macrocycleId: string,
  weekNumber: number,
  frequency: Frequency,
  isHolidayWeek: (week: number) => boolean,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): number {
  let sessions = 0
  for (let week = 1; week < weekNumber; week++) {
    if (isHolidayWeek(week)) continue
    try {
      if (getMesocycleForWeek(macrocycleId, week, catalog).phase.type === 'training') {
        sessions += frequency
      }
    } catch {
      continue
    }
  }
  return sessions
}

export function getWeeklySessionsForMesocycle(
  mesocycleId: string,
  frequency: Frequency,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): MesocycleSessionRecord[] {
  const direct = catalog.mesocycleSessions
    .filter((session) => session.mesocycleId === mesocycleId)
    .sort((a, b) => a.order - b.order)

  if (!direct.length) {
    return unavailable(
      'missing-session',
      `No hay sesiones configuradas para la fase ${mesocycleId}.`,
    )
  }

  return direct.slice(0, frequency)
}

export function getHydratedSession(
  params: {
    ageCategory?: AgeCategory
    macrocycleId?: string
    mesocycleId?: string
    frequency: Frequency
    weekNumber?: number
    day: TrainingDay
  },
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedPhaseSession {
  const ageCategory = params.ageCategory || 'cadete'
  const plan = resolveMacrocycle(ageCategory, catalog, params.macrocycleId)
  const weekNumber = params.weekNumber || 1
  const { phase: resolvedPhase, weekInPhase, loadIndex, isDeload } =
    getMesocycleForWeek(plan.id, weekNumber, catalog, params.mesocycleId)

  const weeklySessions = getWeeklySessionsForMesocycle(
    resolvedPhase.id,
    params.frequency,
    catalog,
  )
  const session = weeklySessions.find((item) => item.day === params.day)
  if (!session) {
    return unavailable(
      'missing-session',
      'No hay una sesión configurada para el día seleccionado.',
    )
  }

  const directBlocks = catalog.trainingBlocks
    .filter((block) => block.sessionId === session.id)
    .sort((a, b) => a.blockOrder - b.blockOrder)

  if (!directBlocks.length) {
    return unavailable(
      'missing-block',
      `No hay bloques configurados para la sesión ${session.id}.`,
    )
  }

  const blocks: HydratedSessionBlock[] = directBlocks.map((block) => {
    const rawItems = catalog.blockExercises
      .filter((item) => item.blockId === block.id)
      .sort((a, b) => a.itemOrder - b.itemOrder)

    if (!rawItems.length) {
      return unavailable(
        'missing-block-exercise',
        `No hay ejercicios configurados para el bloque ${block.name}.`,
      )
    }

    const items: HydratedBlockExercise[] = rawItems.map((item) => {
      const exercise = catalog.exercises.find(
        (ex) => ex.id === item.exerciseId,
      )
      if (!exercise) {
        return unavailable(
          'missing-exercise',
          `No existe el ejercicio ${item.exerciseId} referenciado por la sesión.`,
        )
      }
      const baseDose = item.weekDoses[weekNumber] ?? ''

      return {
        ...item,
        dose: baseDose,
        exercise,
      }
    })

    return {
      ...block,
      items,
    }
  })

  return {
    plan,
    phase: resolvedPhase,
    weekNumber,
    weekInPhase,
    loadIndex,
    isDeload,
    session,
    blocks,
  }
}

export function getPlanHomeSessions(
  macrocycleId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedHomeSessionRecord[] {
  const direct = catalog.homeSessions.filter((item) => item.macrocycleId === macrocycleId)
  return direct.map((item) => {
    const exercise = catalog.exercises.find(
      (ex) => ex.id === item.exerciseId,
    )
    if (!exercise) {
      return unavailable(
        'missing-exercise',
        `No existe el ejercicio ${item.exerciseId} referenciado por una sesión en casa.`,
      )
    }
    return {
      ...item,
      exercise,
    }
  })
}

export function getPlanTests(
  macrocycleId: string,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): TestRecord[] {
  return catalog.tests.filter((item) => item.macrocycleId === macrocycleId)
}

export function getWeeklyPlan(
  frequency: Frequency,
  weekNumber = 1,
  ageCategory: AgeCategory = 'cadete',
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): MesocycleSessionRecord[] {
  const plan = resolveMacrocycle(ageCategory, catalog)
  const { phase } = getMesocycleForWeek(plan.id, weekNumber, catalog)
  return getWeeklySessionsForMesocycle(
    phase.id,
    frequency,
    catalog,
  )
}

export function getSessionTemplate(
  frequency: Frequency,
  day: TrainingDay,
  catalog: TrainingCatalogTables = defaultTrainingCatalog,
): HydratedPhaseSession {
  return getHydratedSession({ frequency, day, weekNumber: 1 }, catalog)
}
