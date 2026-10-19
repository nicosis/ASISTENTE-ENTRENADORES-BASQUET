import { computed, type Ref } from 'vue'
import {
  blockExercises,
  exercises,
  getHydratedSession,
  getPhaseForWeek,
  getPlanHomeSessions,
  getPlanPhases,
  getPlanTests,
  getWeeklySessionsForPhase,
  phaseSessions,
  planPhases,
  plans,
  resolvePlan,
  sessionBlocks,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type TrainingDay,
} from '~/shared/training'

export interface SeasonPlanConfig {
  ageCategory: AgeCategory
  competitiveLevel: CompetitiveLevel
  frequency: Frequency
  weekNumber: number
  selectedDay: TrainingDay
}

export function useTrainingPlan(config: Ref<SeasonPlanConfig>) {
  const activePlan = computed(() =>
    resolvePlan(
      config.value.ageCategory,
      config.value.competitiveLevel,
      config.value.frequency,
    ),
  )

  const phases = computed(() => getPlanPhases(activePlan.value.id))

  const currentWeekContext = computed(() =>
    getPhaseForWeek(activePlan.value.id, config.value.weekNumber),
  )

  const currentPhase = computed(() => currentWeekContext.value.phase)

  const weeklySessions = computed(() =>
    getWeeklySessionsForPhase(
      currentPhase.value.id,
      config.value.frequency,
      config.value.competitiveLevel,
    ),
  )

  const hydratedPreviewSession = computed(() =>
    getHydratedSession({
      ageCategory: config.value.ageCategory,
      competitiveLevel: config.value.competitiveLevel,
      frequency: config.value.frequency,
      weekNumber: config.value.weekNumber,
      day: config.value.selectedDay,
    }),
  )

  const homeWorkouts = computed(() => getPlanHomeSessions(activePlan.value.id))
  const seasonTests = computed(() => getPlanTests(activePlan.value.id))

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

  return {
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    hydratedPreviewSession,
    homeWorkouts,
    seasonTests,
    allWeeksTimeline,
    rawTables: {
      plans,
      planPhases,
      phaseSessions,
      sessionBlocks,
      blockExercises,
      exercises,
    },
  }
}
