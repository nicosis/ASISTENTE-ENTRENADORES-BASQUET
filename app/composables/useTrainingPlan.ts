import { computed, type Ref } from 'vue'
import {
  getTrainingDataStatus,
  getHydratedSession,
  getMesocycleForWeek,
  getMesocycles,
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
}

export function useTrainingPlan(
  config: Ref<SeasonPlanConfig>,
  catalogRef: Ref<TrainingCatalogTables>,
) {
  const catalog = computed(() => catalogRef.value)

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

  const currentWeekContext = computed(() =>
    activePlan.value.id
      ? getMesocycleForWeek(
          activePlan.value.id,
          config.value.weekNumber,
          catalog.value,
          config.value.mesocycleId,
        )
      : {
          phase: emptyMesocycle.value,
          weekNumber: config.value.weekNumber,
          weekInPhase: 0,
          loadIndex: 0,
          isDeload: false,
        } satisfies MesocycleWeekContext,
  )

  const currentPhase = computed(() => currentWeekContext.value.phase)

  const weeklySessions = computed(() =>
    currentPhase.value.id
      ? getWeeklySessionsForMesocycle(
          currentPhase.value.id,
          config.value.frequency,
          config.value.competitiveLevel,
          catalog.value,
        )
      : [],
  )

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
    hydratedPreviewSession,
  }
}
