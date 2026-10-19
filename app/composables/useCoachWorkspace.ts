import { computed, onMounted, ref } from 'vue'
import {
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
} from '~/shared/training'
import {
  addDays,
  ageCategoryOptions,
  asLocalDate,
  blockPalette,
  categoryLabelFor,
  coachIdFor,
  competitiveLevelOptions,
  formattedDate,
  isAgeCategory,
  isCoachProfile,
  isCompetitiveLevel,
  isSeasonArray,
  isTeamArray,
  isWeeklyReviewArray,
  mondayFor,
  nextId,
  useCoachStorage,
  weekdays,
  type CoachProfile,
  type DayId,
  type GeneratedSessionResponse,
  type Season,
  type Team,
  type TeamTab,
  type View,
  type WeeklyReview,
} from '~/composables/useCoachStorage'
import { useTrainingPlan } from '~/composables/useTrainingPlan'
import { useWeeklyReviews } from '~/composables/useWeeklyReviews'

export {
  ageCategoryOptions,
  blockPalette,
  competitiveLevelOptions,
  formattedDate,
  weekdays,
}

export function useCoachWorkspace() {
  const {
    readStorageJson,
    writeStorageJson,
    readStorageFlag,
    writeStorageFlag,
    removeStorageKey,
  } = useCoachStorage()

  const seedTeams: Team[] = [
    {
      id: 'EQU001',
      coachId: 'ENT001',
      name: 'Mike Jordan Team',
      club: 'Club Baloncesto Norte',
      players: [
        { id: 'JUG001', name: 'Álex Martín' },
        { id: 'JUG002', name: 'Bruno López' },
        { id: 'JUG003', name: 'Dani Ruiz' },
      ],
    },
  ]

  const seedSeasons: Season[] = [
    {
      id: 'TEM001',
      teamId: 'EQU001',
      name: '2026-27',
      category: 'Cadete (U16) · Equipo Liga',
      ageCategory: 'cadete',
      competitiveLevel: 'liga',
      startsAt: '2026-10-12',
      endsAt: '2027-05-30',
      trainingDays: ['Lunes', 'Miércoles', 'Viernes'],
      context: 'Plan anual periodizado por fases según metodología MBSC.',
      status: 'active',
    },
  ]

  const coach = ref<CoachProfile>({ id: 'ENT001', name: 'Nicolás' })
  const loginName = ref('Nicolás')
  const signedIn = ref(true)
  const view = ref<View>('home')
  const activeTeamTab = ref<TeamTab>('week')
  const teams = ref<Team[]>(seedTeams)
  const seasons = ref<Season[]>(seedSeasons)
  const reviews = ref<WeeklyReview[]>([])
  const activeTeamId = ref('EQU001')
  const activeSeasonId = ref('TEM001')
  const currentWeekNumber = ref(1)
  const selectedDay = ref<DayId>('dia1')
  const selectedBlockIdForExplorer = ref('BLK_F1_D1_03')
  const session = ref<GeneratedSessionResponse | null>(null)
  const genericExerciseImage = '/images/exercise-placeholder-light-brown.png'
  const loadingSession = ref(false)
  const error = ref('')

  const teamDraft = ref({ name: '', club: '', players: '' })
  const seasonDraft = ref<{
    name: string
    ageCategory: AgeCategory
    competitiveLevel: CompetitiveLevel
    startsAt: string
    endsAt: string
    trainingDays: string[]
    context: string
  }>({
    name: '2026-27',
    ageCategory: 'cadete',
    competitiveLevel: 'liga',
    startsAt: '2026-10-12',
    endsAt: '2027-05-30',
    trainingDays: ['Lunes', 'Miércoles', 'Viernes'],
    context: '',
  })

  const activeTeam = computed(() =>
    teams.value.find((team) => team.id === activeTeamId.value),
  )
  const activeSeason = computed(() =>
    seasons.value.find((item) => item.id === activeSeasonId.value),
  )

  const frequency = computed<Frequency>(
    () =>
      Math.min(
        3,
        Math.max(1, activeSeason.value?.trainingDays.length || 1),
      ) as Frequency,
  )

  const planConfig = computed(() => ({
    ageCategory: activeSeason.value?.ageCategory || 'cadete',
    competitiveLevel: activeSeason.value?.competitiveLevel || 'liga',
    frequency: frequency.value,
    weekNumber: currentWeekNumber.value,
    selectedDay: selectedDay.value,
  }))

  const {
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    hydratedPreviewSession,
    homeWorkouts,
    seasonTests,
  } = useTrainingPlan(planConfig)

  const activeExplorerBlock = computed(() => {
    const blocks = hydratedPreviewSession.value.blocks
    return (
      blocks.find((block) => block.id === selectedBlockIdForExplorer.value) ||
      blocks[2] ||
      blocks[0]
    )
  })

  const seasonStartMonday = computed(() =>
    mondayFor(activeSeason.value?.startsAt || '2026-10-12'),
  )

  const displayedWeekStart = computed(() =>
    addDays(seasonStartMonday.value, (currentWeekNumber.value - 1) * 7),
  )

  const canGoToPreviousWeek = computed(() => currentWeekNumber.value > 1)
  const canGoToNextWeek = computed(
    () => currentWeekNumber.value < activePlan.value.totalWeeks,
  )

  const weekLabel = computed(() => {
    const start = asLocalDate(displayedWeekStart.value)
    const end = asLocalDate(addDays(displayedWeekStart.value, 6))
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    })
    return `${formatter.format(start).replace('.', '')} – ${formatter.format(end).replace('.', '')}`
  })

  const sessionDates = computed(() =>
    weeklySessions.value.map((_, index) => {
      const dayName = activeSeason.value?.trainingDays[index]
      const dayOffset = Math.max(0, weekdays.indexOf(dayName || 'Lunes'))
      return addDays(displayedWeekStart.value, dayOffset)
    }),
  )

  function saveState(): void {
    writeStorageJson('pizarra-teams-v3', teams.value)
    writeStorageJson('pizarra-seasons-v3', seasons.value)
    writeStorageJson('pizarra-reviews-v3', reviews.value)
  }

  const {
    reviewDraft,
    reviewEditorOpen,
    historyModalOpen,
    selectedHistoryReviewId,
    activeWeekReview,
    seasonReviews,
    selectedHistoryReview,
    openReviewEditor,
    closeReviewEditor,
    saveReview,
    openHistory,
    closeHistory,
  } = useWeeklyReviews({
    reviews,
    activeSeasonId,
    activeSeason,
    displayedWeekStart,
    onSave: saveState,
  })

  function loadState(): void {
    const storedTeams = readStorageJson('pizarra-teams-v3', isTeamArray)
    const storedSeasons = readStorageJson('pizarra-seasons-v3', isSeasonArray)
    const storedReviews = readStorageJson(
      'pizarra-reviews-v3',
      isWeeklyReviewArray,
    )

    if (storedTeams && storedTeams.length > 0) {
      teams.value = storedTeams
    }
    if (storedSeasons && storedSeasons.length > 0) {
      seasons.value = storedSeasons.map((item) => ({
        ...item,
        ageCategory: isAgeCategory(item.ageCategory)
          ? item.ageCategory
          : 'cadete',
        competitiveLevel: isCompetitiveLevel(item.competitiveLevel)
          ? item.competitiveLevel
          : 'liga',
      }))
    }
    if (storedReviews) {
      reviews.value = storedReviews
    }

    if (teams.value[0]) {
      activeTeamId.value = teams.value[0].id
    }
    const active =
      seasons.value.find(
        (item) =>
          item.teamId === activeTeamId.value && item.status === 'active',
      ) || seasons.value[0]
    if (active) {
      activeSeasonId.value = active.id
    }
  }

  function loadCoach(): void {
    const saved = readStorageJson('pizarra-coach', isCoachProfile)
    if (!saved) return
    const trimmedName = saved.name.trim()
    coach.value = {
      id: typeof saved.id === 'string' ? saved.id : coachIdFor(trimmedName),
      name: trimmedName,
    }
    loginName.value = coach.value.name
  }

  function signOut(): void {
    session.value = null
    error.value = ''
    view.value = 'home'
    loginName.value = coach.value.name
    writeStorageFlag('pizarra-coach-session', 'signed-out')
    signedIn.value = false
  }

  function signIn(): void {
    const name = loginName.value.trim()
    if (!name) return
    coach.value = { id: coachIdFor(name), name }
    writeStorageJson('pizarra-coach', coach.value)
    removeStorageKey('pizarra-coach-session')
    signedIn.value = true
  }

  function openTeam(teamId: string): void {
    activeTeamId.value = teamId
    const foundSeason =
      seasons.value.find(
        (item) => item.teamId === teamId && item.status === 'active',
      ) || seasons.value.find((item) => item.teamId === teamId)
    if (foundSeason) activeSeasonId.value = foundSeason.id
    selectedDay.value = 'dia1'
    currentWeekNumber.value = 1
    session.value = null
    view.value = 'team'
  }

  function openCreateTeam(): void {
    teamDraft.value = { name: '', club: '', players: '' }
    view.value = 'create-team'
  }

  function createTeam(): void {
    if (!teamDraft.value.name.trim()) return
    const teamId = nextId(
      'EQU',
      teams.value.map((item) => item.id),
    )
    const players = teamDraft.value.players
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name, index) => ({
        id: `JUG${String(teams.value.flatMap((team) => team.players).length + index + 1).padStart(3, '0')}`,
        name,
      }))
    teams.value.push({
      id: teamId,
      coachId: coach.value.id,
      name: teamDraft.value.name.trim(),
      club: teamDraft.value.club.trim() || 'Sin club',
      players,
    })
    activeTeamId.value = teamId
    seasonDraft.value = {
      name: '2026-27',
      ageCategory: 'cadete',
      competitiveLevel: 'liga',
      startsAt: '2026-10-12',
      endsAt: '2027-05-30',
      trainingDays: ['Lunes', 'Miércoles', 'Viernes'],
      context: '',
    }
    saveState()
    view.value = 'create-season'
  }

  function toggleDraftDay(day: string): void {
    const current = seasonDraft.value.trainingDays
    if (current.includes(day)) {
      if (current.length === 1) return
      seasonDraft.value.trainingDays = current.filter((item) => item !== day)
    } else if (current.length < 3) {
      seasonDraft.value.trainingDays = [...current, day].sort(
        (first, second) => weekdays.indexOf(first) - weekdays.indexOf(second),
      )
    }
  }

  function createSeason(): void {
    if (
      !activeTeam.value ||
      !seasonDraft.value.startsAt ||
      !seasonDraft.value.endsAt
    ) {
      return
    }
    const newSeason: Season = {
      id: nextId(
        'TEM',
        seasons.value.map((item) => item.id),
      ),
      teamId: activeTeam.value.id,
      name: seasonDraft.value.name || '2026-27',
      category: categoryLabelFor(
        seasonDraft.value.ageCategory,
        seasonDraft.value.competitiveLevel,
      ),
      ageCategory: seasonDraft.value.ageCategory,
      competitiveLevel: seasonDraft.value.competitiveLevel,
      startsAt: seasonDraft.value.startsAt,
      endsAt: seasonDraft.value.endsAt,
      trainingDays: [...seasonDraft.value.trainingDays].sort(
        (first, second) => weekdays.indexOf(first) - weekdays.indexOf(second),
      ),
      context: seasonDraft.value.context.trim(),
      status: 'active',
    }
    seasons.value
      .filter(
        (item) =>
          item.teamId === activeTeam.value?.id && item.status === 'active',
      )
      .forEach((item) => {
        item.status = 'closed'
      })
    seasons.value.push(newSeason)
    activeSeasonId.value = newSeason.id
    currentWeekNumber.value = 1
    saveState()
    view.value = 'team'
  }

  function moveWeek(direction: -1 | 1): void {
    if (direction === -1 && !canGoToPreviousWeek.value) return
    if (direction === 1 && !canGoToNextWeek.value) return
    closeReviewEditor()
    currentWeekNumber.value += direction
  }

  function selectPhaseWeek(weekNumber: number): void {
    closeReviewEditor()
    currentWeekNumber.value = weekNumber
  }

  async function generateSession(day: DayId): Promise<void> {
    selectedDay.value = day
    loadingSession.value = true
    error.value = ''
    try {
      session.value = await $fetch<GeneratedSessionResponse>(
        '/api/generate-training',
        {
          method: 'POST',
          body: {
            day,
            frequency: frequency.value,
            weekNumber: currentWeekNumber.value,
            ageCategory: activeSeason.value?.ageCategory || 'cadete',
            competitiveLevel: activeSeason.value?.competitiveLevel || 'liga',
          },
        },
      )
      view.value = 'session'
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      error.value = message
        ? `No se pudo preparar la sesión: ${message}`
        : 'No se pudo preparar la sesión. Inténtalo de nuevo.'
    } finally {
      loadingSession.value = false
    }
  }

  function inspectDayInTables(day: DayId): void {
    selectedDay.value = day
    const firstCircuit =
      hydratedPreviewSession.value.blocks[2] ||
      hydratedPreviewSession.value.blocks[0]
    if (firstCircuit) {
      selectedBlockIdForExplorer.value = firstCircuit.id
    }
    activeTeamTab.value = 'tables'
  }

  onMounted(() => {
    loadCoach()
    signedIn.value = readStorageFlag('pizarra-coach-session') !== 'signed-out'
    loadState()
  })

  return {
    coach,
    loginName,
    signedIn,
    view,
    activeTeamTab,
    teams,
    seasons,
    reviews,
    activeTeam,
    activeSeason,
    frequency,
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    hydratedPreviewSession,
    homeWorkouts,
    seasonTests,
    activeExplorerBlock,
    currentWeekNumber,
    selectedDay,
    selectedBlockIdForExplorer,
    displayedWeekStart,
    canGoToPreviousWeek,
    canGoToNextWeek,
    weekLabel,
    sessionDates,
    activeWeekReview,
    seasonReviews,
    selectedHistoryReview,
    reviewDraft,
    reviewEditorOpen,
    historyModalOpen,
    selectedHistoryReviewId,
    teamDraft,
    seasonDraft,
    session,
    genericExerciseImage,
    loadingSession,
    error,
    signIn,
    signOut,
    openTeam,
    openCreateTeam,
    createTeam,
    toggleDraftDay,
    createSeason,
    moveWeek,
    selectPhaseWeek,
    saveReview,
    openReviewEditor,
    closeReviewEditor,
    openHistory,
    closeHistory,
    generateSession,
    inspectDayInTables,
  }
}
