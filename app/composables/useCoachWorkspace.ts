import { computed, onMounted, ref } from 'vue'
import {
  defaultTrainingCatalog,
  resolvePlan,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type TrainingCatalogTables,
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
  isCoachArray,
  isCoachProfile,
  isCoachRole,
  isCompetitiveLevel,
  isSeasonArray,
  isTeamArray,
  isTeamStatus,
  isWeeklyReviewArray,
  mondayFor,
  nextId,
  useCoachStorage,
  weekdays,
  type CoachProfile,
  type CoachRole,
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

export interface SheetsDatabaseResponse {
  source: 'google-sheets' | 'local-fallback'
  fetchedAt: string
  spreadsheetId: string
  spreadsheetUrl: string
  catalog: TrainingCatalogTables
  operational: {
    coaches: CoachProfile[]
    teams: Team[]
    seasons: Season[]
    reviews: WeeklyReview[]
  }
}

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

  const seedCoaches: CoachProfile[] = [
    {
      id: 'ENT0001',
      name: 'Nicolás',
      role: 'admin',
    },
    {
      id: 'ENT0002',
      name: 'Entrenador Invitado',
      role: 'coach',
    },
  ]

  const seedTeams: Team[] = [
    {
      id: 'EQU0001',
      coachId: 'ENT0001',
      name: 'Mike Jordan Team',
      club: 'Club Baloncesto Norte',
      status: 'active',
      players: [
        { id: 'JUG0001', name: 'Álex Martín' },
        { id: 'JUG0002', name: 'Bruno López' },
        { id: 'JUG0003', name: 'Dani Ruiz' },
      ],
    },
  ]

  const seedSeasons: Season[] = [
    {
      id: 'TEM0001',
      teamId: 'EQU0001',
      planId: 'PLN0003',
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

  const seedReviews: WeeklyReview[] = [
    {
      id: 'OBS0001',
      seasonId: 'TEM0001',
      weekStart: '2026-10-12',
      text: 'Semana 1: Evaluación inicial de patrones básicos y batería de tests CMJ/Sprint.',
      createdAt: '2026-10-12T18:00:00.000Z',
    },
  ]

  const coaches = ref<CoachProfile[]>(seedCoaches)
  const coach = ref<CoachProfile>({
    id: 'ENT0001',
    name: 'Nicolás',
    role: 'admin',
  })
  const loginName = ref('Nicolás')
  const loginRole = ref<CoachRole>('admin')
  const signedIn = ref(true)
  const view = ref<View>('home')
  const activeTeamTab = ref<TeamTab>('week')
  const showArchivedTeams = ref(false)
  const catalog = ref<TrainingCatalogTables>(defaultTrainingCatalog)
  const dbSource = ref<'google-sheets' | 'local-fallback'>('local-fallback')
  const loadingDatabase = ref(false)
  const lastSyncedAt = ref('')
  const teams = ref<Team[]>(seedTeams)
  const seasons = ref<Season[]>(seedSeasons)
  const reviews = ref<WeeklyReview[]>(seedReviews)
  const activeTeamId = ref('EQU0001')
  const activeSeasonId = ref('TEM0001')
  const currentWeekNumber = ref(1)
  const selectedDay = ref<DayId>('dia1')
  const selectedBlockIdForExplorer = ref('BLK0003')
  const session = ref<GeneratedSessionResponse | null>(null)
  const genericExerciseImage = '/images/exercise-placeholder-light-brown.png'
  const loadingSession = ref(false)
  const error = ref('')

  const isAdmin = computed(() => coach.value.role === 'admin')
  const activeTeams = computed(() =>
    teams.value.filter((team) => team.status !== 'archived'),
  )
  const archivedTeams = computed(() =>
    teams.value.filter((team) => team.status === 'archived'),
  )
  const visibleTeams = computed(() =>
    showArchivedTeams.value ? archivedTeams.value : activeTeams.value,
  )
  const teamSeasons = computed(() =>
    seasons.value.filter((item) => item.teamId === activeTeamId.value),
  )

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
  } = useTrainingPlan(planConfig, catalog)

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

  async function syncToGoogleSheets(): Promise<void> {
    try {
      await $fetch('/api/sheets-sync', {
        method: 'POST',
        body: {
          coaches: coaches.value,
          teams: teams.value,
          seasons: seasons.value,
          reviews: reviews.value,
          includeCatalog: false,
        },
      })
      dbSource.value = 'google-sheets'
      lastSyncedAt.value = new Date().toISOString()
    } catch {
      // Fallo silencioso de sincronización en segundo plano para no bloquear uso local
    }
  }

  function syncActiveCoachRoleFromCatalog(): void {
    const match =
      coaches.value.find((item) => item.id === coach.value.id) ||
      coaches.value.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          coach.value.name.trim().toLowerCase(),
      )
    if (match) {
      coach.value = {
        id: match.id,
        name: match.name,
        role: match.role,
      }
      loginRole.value = match.role
      writeStorageJson('pizarra-coach', coach.value)
    }
  }

  function ensureValidSelections(): void {
    const teamExists = teams.value.some((t) => t.id === activeTeamId.value)
    if (!teamExists) {
      const firstActive = activeTeams.value[0] || teams.value[0]
      if (firstActive) {
        activeTeamId.value = firstActive.id
      }
    }
    const seasonExistsForTeam = seasons.value.some(
      (s) => s.id === activeSeasonId.value && s.teamId === activeTeamId.value,
    )
    if (!seasonExistsForTeam) {
      const active =
        seasons.value.find(
          (item) =>
            item.teamId === activeTeamId.value && item.status === 'active',
        ) ||
        seasons.value.find((item) => item.teamId === activeTeamId.value) ||
        seasons.value[0]
      if (active) {
        activeSeasonId.value = active.id
      }
    }
  }

  async function loadDatabaseFromSheets(forceRefresh = false): Promise<void> {
    loadingDatabase.value = true
    try {
      const response = await $fetch<SheetsDatabaseResponse>('/api/sheets-db', {
        query: forceRefresh ? { refresh: '1' } : undefined,
      })
      catalog.value = response.catalog
      dbSource.value = response.source
      lastSyncedAt.value = response.fetchedAt

      if (response.source === 'google-sheets') {
        if (response.operational.coaches.length > 0) {
          coaches.value = response.operational.coaches
          writeStorageJson('pizarra-coaches-v4', coaches.value)
          syncActiveCoachRoleFromCatalog()
        }
        teams.value = response.operational.teams.map((item) => ({
          ...item,
          status: isTeamStatus(item.status) ? item.status : 'active',
        }))
        writeStorageJson('pizarra-teams-v4', teams.value)

        seasons.value = response.operational.seasons
        writeStorageJson('pizarra-seasons-v4', seasons.value)

        reviews.value = response.operational.reviews
        writeStorageJson('pizarra-reviews-v4', reviews.value)

        ensureValidSelections()
      }
    } catch {
      // Mantiene datos en caché local si no hay conexión
    } finally {
      loadingDatabase.value = false
    }
  }

  function saveState(): void {
    writeStorageJson('pizarra-coaches-v4', coaches.value)
    writeStorageJson('pizarra-teams-v4', teams.value)
    writeStorageJson('pizarra-seasons-v4', seasons.value)
    writeStorageJson('pizarra-reviews-v4', reviews.value)
    void syncToGoogleSheets()
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
    const storedCoaches = readStorageJson('pizarra-coaches-v4', isCoachArray)
    const storedTeams = readStorageJson('pizarra-teams-v4', isTeamArray)
    const storedSeasons = readStorageJson('pizarra-seasons-v4', isSeasonArray)
    const storedReviews = readStorageJson(
      'pizarra-reviews-v4',
      isWeeklyReviewArray,
    )

    if (storedCoaches && storedCoaches.length > 0) {
      coaches.value = storedCoaches.map((item) => ({
        ...item,
        role: isCoachRole(item.role) ? item.role : 'coach',
      }))
    }
    if (storedTeams) {
      teams.value = storedTeams.map((item) => ({
        ...item,
        status: isTeamStatus(item.status) ? item.status : 'active',
      }))
    }
    if (storedSeasons) {
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

    ensureValidSelections()
  }

  function loadCoach(): void {
    const saved = readStorageJson('pizarra-coach', isCoachProfile)
    if (!saved) return
    const trimmedName = saved.name.trim()
    const id =
      typeof saved.id === 'string'
        ? saved.id
        : trimmedName.toLowerCase() === 'nicolás' ||
            trimmedName.toLowerCase() === 'nicolas'
          ? 'ENT0001'
          : coachIdFor(trimmedName)
    const role: CoachRole = isCoachRole(saved.role)
      ? saved.role
      : id === 'ENT0001'
        ? 'admin'
        : 'coach'
    coach.value = {
      id,
      name: trimmedName,
      role,
    }
    loginName.value = coach.value.name
    loginRole.value = coach.value.role
  }

  function signOut(): void {
    session.value = null
    error.value = ''
    view.value = 'home'
    loginName.value = coach.value.name
    loginRole.value = coach.value.role
    writeStorageFlag('pizarra-coach-session', 'signed-out')
    signedIn.value = false
  }

  function signIn(): void {
    const name = loginName.value.trim()
    if (!name) return
    const existing = coaches.value.find(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
    )
    const id = existing
      ? existing.id
      : name.toLowerCase() === 'nicolás' || name.toLowerCase() === 'nicolas'
        ? 'ENT0001'
        : nextId(
            'ENT',
            coaches.value.map((c) => c.id),
          )
    const role: CoachRole = loginRole.value
    coach.value = { id, name, role }

    const idx = coaches.value.findIndex((item) => item.id === id)
    if (idx >= 0) {
      coaches.value[idx] = { id, name, role }
    } else {
      coaches.value.push({ id, name, role })
    }

    writeStorageJson('pizarra-coach', coach.value)
    removeStorageKey('pizarra-coach-session')
    signedIn.value = true
    saveState()
  }

  function toggleCoachRole(): void {
    const nextRole: CoachRole =
      coach.value.role === 'admin' ? 'coach' : 'admin'
    coach.value = { ...coach.value, role: nextRole }
    loginRole.value = nextRole
    const idx = coaches.value.findIndex((item) => item.id === coach.value.id)
    if (idx >= 0) {
      coaches.value[idx] = { ...coaches.value[idx]!, role: nextRole }
    } else {
      coaches.value.push({ ...coach.value })
    }
    writeStorageJson('pizarra-coach', coach.value)
    saveState()
  }

  function archiveTeam(teamId: string): void {
    const target = teams.value.find((item) => item.id === teamId)
    if (!target) return
    target.status = 'archived'
    saveState()
    if (activeTeamId.value === teamId && view.value === 'team') {
      view.value = 'home'
    }
    ensureValidSelections()
  }

  function restoreTeam(teamId: string): void {
    const target = teams.value.find((item) => item.id === teamId)
    if (!target) return
    target.status = 'active'
    saveState()
    if (archivedTeams.value.length === 0) {
      showArchivedTeams.value = false
    }
  }

  function deleteTeamCascade(teamId: string): void {
    if (coach.value.role !== 'admin') return
    const removedSeasonIds = new Set(
      seasons.value
        .filter((season) => season.teamId === teamId)
        .map((season) => season.id),
    )
    teams.value = teams.value.filter((team) => team.id !== teamId)
    seasons.value = seasons.value.filter((season) => season.teamId !== teamId)
    reviews.value = reviews.value.filter(
      (review) => !removedSeasonIds.has(review.seasonId),
    )
    if (archivedTeams.value.length === 0) {
      showArchivedTeams.value = false
    }
    if (activeTeamId.value === teamId && view.value !== 'home') {
      view.value = 'home'
    }
    ensureValidSelections()
    saveState()
  }

  function closeSeason(seasonId: string): void {
    const target = seasons.value.find((item) => item.id === seasonId)
    if (!target) return
    target.status = 'closed'
    saveState()
  }

  function reopenSeason(seasonId: string): void {
    const target = seasons.value.find((item) => item.id === seasonId)
    if (!target) return
    seasons.value
      .filter(
        (item) => item.teamId === target.teamId && item.status === 'active',
      )
      .forEach((item) => {
        item.status = 'closed'
      })
    target.status = 'active'
    activeSeasonId.value = target.id
    saveState()
  }

  function selectSeason(seasonId: string): void {
    const target = seasons.value.find((item) => item.id === seasonId)
    if (!target) return
    activeSeasonId.value = target.id
    currentWeekNumber.value = 1
    session.value = null
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
        id: `JUG${String(teams.value.flatMap((team) => team.players).length + index + 1).padStart(4, '0')}`,
        name,
      }))
    teams.value.push({
      id: teamId,
      coachId: coach.value.id,
      name: teamDraft.value.name.trim(),
      club: teamDraft.value.club.trim() || 'Sin club',
      status: 'active',
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
    const sortedDays = [...seasonDraft.value.trainingDays].sort(
      (first, second) => weekdays.indexOf(first) - weekdays.indexOf(second),
    )
    const resolvedPlan = resolvePlan(
      seasonDraft.value.ageCategory,
      catalog.value,
    )
    const newSeason: Season = {
      id: nextId(
        'TEM',
        seasons.value.map((item) => item.id),
      ),
      teamId: activeTeam.value.id,
      planId: resolvedPlan.id,
      name: seasonDraft.value.name || '2026-27',
      category: categoryLabelFor(
        seasonDraft.value.ageCategory,
        seasonDraft.value.competitiveLevel,
      ),
      ageCategory: seasonDraft.value.ageCategory,
      competitiveLevel: seasonDraft.value.competitiveLevel,
      startsAt: seasonDraft.value.startsAt,
      endsAt: seasonDraft.value.endsAt,
      trainingDays: sortedDays,
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
    void loadDatabaseFromSheets(false)
  })

  return {
    coaches,
    coach,
    isAdmin,
    loginName,
    loginRole,
    signedIn,
    view,
    activeTeamTab,
    showArchivedTeams,
    catalog,
    dbSource,
    loadingDatabase,
    lastSyncedAt,
    teams,
    activeTeams,
    archivedTeams,
    visibleTeams,
    seasons,
    teamSeasons,
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
    toggleCoachRole,
    openTeam,
    openCreateTeam,
    createTeam,
    archiveTeam,
    restoreTeam,
    deleteTeamCascade,
    toggleDraftDay,
    createSeason,
    closeSeason,
    reopenSeason,
    selectSeason,
    moveWeek,
    selectPhaseWeek,
    saveReview,
    openReviewEditor,
    closeReviewEditor,
    openHistory,
    closeHistory,
    generateSession,
    inspectDayInTables,
    refreshDatabaseFromSheets: () => loadDatabaseFromSheets(true),
  }
}
