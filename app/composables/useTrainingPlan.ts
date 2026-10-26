import { computed, type Ref } from 'vue'
import {
  defaultTrainingCatalog,
  getTrainingDataStatus,
  getHydratedSession,
  getPhaseForWeek,
  getPlanHomeSessions,
  getPlanPhases,
  getPlanTests,
  getWeeklySessionsForPhase,
  resolvePlan,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type TrainingCatalogTables,
  type TrainingDay,
} from '~/shared/training'

export interface SeasonPlanConfig {
  planId?: string
  ageCategory: AgeCategory
  competitiveLevel: CompetitiveLevel
  frequency: Frequency
  weekNumber: number
  selectedDay: TrainingDay
}

export function useTrainingPlan(
  config: Ref<SeasonPlanConfig>,
  catalogRef?: Ref<TrainingCatalogTables>,
) {
  const catalog = computed(() => catalogRef?.value ?? defaultTrainingCatalog)

  const trainingDataStatus = computed(() =>
    getTrainingDataStatus(
      {
        ageCategory: config.value.ageCategory,
        planId: config.value.planId,
        weekNumber: config.value.weekNumber,
        day: config.value.selectedDay,
      },
      catalog.value,
    ),
  )

  const activePlan = computed(() =>
    resolvePlan(
      config.value.ageCategory,
      catalog.value,
      config.value.planId,
    ),
  )

  const phases = computed(() =>
    getPlanPhases(activePlan.value.id, catalog.value),
  )

  const currentWeekContext = computed(() =>
    getPhaseForWeek(
      activePlan.value.id,
      config.value.weekNumber,
      catalog.value,
    ),
  )

  const currentPhase = computed(() => currentWeekContext.value.phase)

  const weeklySessions = computed(() =>
    getWeeklySessionsForPhase(
      currentPhase.value.id,
      config.value.frequency,
      config.value.competitiveLevel,
      catalog.value,
    ),
  )

  const hydratedPreviewSession = computed(() =>
    getHydratedSession(
      {
        ageCategory: config.value.ageCategory,
        planId: config.value.planId,
        competitiveLevel: config.value.competitiveLevel,
        frequency: config.value.frequency,
        weekNumber: config.value.weekNumber,
        day: config.value.selectedDay,
      },
      catalog.value,
    ),
  )

  const homeWorkouts = computed(() =>
    getPlanHomeSessions(activePlan.value.id, catalog.value),
  )
  const seasonTests = computed(() =>
    getPlanTests(activePlan.value.id, catalog.value),
  )

  const allWeeksTimeline = computed(() => {
    const timeline: Array<{
      weekNumber: number
      phaseId: string
      phaseName: string
      phaseColor: string
      phaseType: 'training' | 'holiday'
      loadIndex: number
      isDeload: boolean
    }> = []

    for (const phase of phases.value) {
      for (let w = phase.weekStart; w <= phase.weekEnd; w++) {
        const idx = w - phase.weekStart
        const loadIndex = phase.weeklyLoads[idx] ?? 5
        const isDeload =
          phase.type === 'training' &&
          idx + 1 === phase.weeksCount &&
          loadIndex <= 4
        timeline.push({
          weekNumber: w,
          phaseId: phase.id,
          phaseName: phase.name,
          phaseColor: phase.color,
          phaseType: phase.type,
          loadIndex,
          isDeload,
        })
      }
    }
    return timeline
  })

  const rawTables = computed(() => ({
    plans: catalog.value.plans,
    planPhases: catalog.value.planPhases,
    phaseSessions: catalog.value.phaseSessions,
    sessionVariants: catalog.value.sessionVariants,
    sessionBlocks: catalog.value.sessionBlocks,
    blockExercises: catalog.value.blockExercises,
    exercises: catalog.value.exercises,
  }))

  return {
    trainingDataStatus,
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    hydratedPreviewSession,
    homeWorkouts,
    seasonTests,
    allWeeksTimeline,
    rawTables,
  }
}
