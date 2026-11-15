import { computed, type Ref } from 'vue'
import { alignCadeteCatalog } from '~/shared/cadeteCalendar'
import { addDays, mondayFor } from '~/composables/useCoachStorage'
import {
  getTrainingDataStatus,
  getHydratedSession,
  getMesocycleForWeek,
  getMesocycles,
  getSeasonSessionOffset,
  getWeeklySessionsForMesocycle,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type MesocycleRecord,
  type MesocycleWeekContext,
  type MacrocycleRecord,
  type TrainingCatalogTables,
  type TrainingDay,
} from '~/shared/training'

export interface SeasonPlanConfig {
  macrocycleId?: string
  mesocycleId?: string
  ageCategory: AgeCategory
  competitiveLevel: CompetitiveLevel
  frequency: Frequency
  weekNumber: number
  selectedDay: TrainingDay
  startsAt?: string
  holidayWeeks?: string[]
}

export function useTrainingPlan(
  config: Ref<SeasonPlanConfig>,
  catalogRef: Ref<TrainingCatalogTables>,
) {
  const catalog = computed(() => {
    if (config.value.ageCategory !== 'cadete' || !config.value.startsAt) return catalogRef.value
    const plan = catalogRef.value.macrocycles.find(item => item.id === config.value.macrocycleId && item.ageCategory === 'cadete')
    const phases = catalogRef.value.mesocycles.filter(item => item.macrocycleId === plan?.id)
    if (!plan || (phases.length !== 4 && plan.totalWeeks !== 42)) return catalogRef.value
    try {
      return alignCadeteCatalog(catalogRef.value, config.value.startsAt, config.value.holidayWeeks)
    } catch {
      return { ...catalogRef.value, macrocycles: [] }
    }
  })

  const emptyMacrocycle = computed<MacrocycleRecord>(() => ({
    id: '',
    name: '',
    ageCategory: config.value.ageCategory,
    totalWeeks: 0,
  }))
  const emptyMesocycle = computed<MesocycleRecord>(() => ({
    id: '',
    macrocycleId: '',
    phaseOrder: 0,
    type: 'training',
    name: '',
    weeksCount: 0,
    weekStart: 0,
    weekEnd: 0,
    color: '#4f7cac',
    objective: '',
    loadRules: [],
    plioRule: '',
    weeklyProgressionNote: '',
    weeklyLoads: [],
  }))

  const trainingDataStatus = computed(() =>
    getTrainingDataStatus(
      {
        ageCategory: config.value.ageCategory,
        macrocycleId: config.value.macrocycleId,
        mesocycleId: config.value.mesocycleId,
        weekNumber: config.value.weekNumber,
        day: config.value.selectedDay,
      },
      catalog.value,
    ),
  )

  const activePlan = computed(() => catalog.value.macrocycles.find(
    (item) =>
      (config.value.macrocycleId !== undefined
        ? item.id === config.value.macrocycleId
        : item.ageCategory === config.value.ageCategory) &&
      item.ageCategory === config.value.ageCategory,
  ) ?? emptyMacrocycle.value)

  const phases = computed(() =>
    getMesocycles(activePlan.value.id, catalog.value),
  )

  const currentWeekContext = computed<MesocycleWeekContext>(() => {
    if (!activePlan.value.id) {
      return {
        phase: emptyMesocycle.value,
        weekNumber: config.value.weekNumber,
        weekInPhase: 0,
        loadIndex: 0,
        isDeload: false,
      }
    }
    try {
      return getMesocycleForWeek(
        activePlan.value.id,
        config.value.weekNumber,
        catalog.value,
        config.value.mesocycleId,
      )
    } catch {
      return {
        phase: emptyMesocycle.value,
        weekNumber: config.value.weekNumber,
        weekInPhase: 0,
        loadIndex: 0,
        isDeload: false,
      }
    }
  })

  const currentPhase = computed(() => currentWeekContext.value.phase)

  const weeklySessions = computed(() =>
    currentPhase.value.id && currentPhase.value.type === 'training'
      ? getWeeklySessionsForMesocycle(
          currentPhase.value.id,
          config.value.frequency,
          config.value.competitiveLevel,
          catalog.value,
        )
      : [],
  )

  const seasonSessionOffset = computed(() => {
    if (!activePlan.value.id || !config.value.startsAt) return 0
    const holidays = new Set(config.value.holidayWeeks ?? [])
    const seasonMonday = mondayFor(config.value.startsAt)
    return getSeasonSessionOffset(
      activePlan.value.id,
      config.value.weekNumber,
      config.value.frequency,
      (week) => holidays.has(addDays(seasonMonday, (week - 1) * 7)),
      catalog.value,
    )
  })

  const hydratedPreviewSession = computed(() =>
    trainingDataStatus.value.available
      ? getHydratedSession(
          {
            ageCategory: config.value.ageCategory,
            macrocycleId: config.value.macrocycleId,
            mesocycleId: config.value.mesocycleId,
            competitiveLevel: config.value.competitiveLevel,
            frequency: config.value.frequency,
            weekNumber: config.value.weekNumber,
            day: config.value.selectedDay,
          },
          catalog.value,
        )
      : null,
  )

  return {
    trainingDataStatus,
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    seasonSessionOffset,
    hydratedPreviewSession,
  }
}
