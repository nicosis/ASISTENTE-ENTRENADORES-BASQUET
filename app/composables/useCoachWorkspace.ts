import { computed, onMounted, ref } from 'vue'
import {
  getHolidayDataStatus,
  type AgeCategory,
  type Frequency,
  type MicrocycleRecord,
  type TrainingCatalogTables,
} from '~/shared/training'
import {
  addDays,
  ageCategoryOptions,
  asLocalDate,
  blockPalette,
  categoryLabelFor,
  formattedDate,
  isAgeCategory,
  isTeamStatus,
  mondayFor,
  nextId,
  nextMicrocycleId,
  type CoachProfile,
  type CoachRole,
  type DayId,
  type GeneratedSessionResponse,
  type Player,
  type Season,
  type Team,
  type TeamPlayer,
  type TeamCoach,
  type TeamTab,
  type View,
  type WeeklyReview,
} from '~/composables/useCoachStorage'
import { useTrainingPlan } from '~/composables/useTrainingPlan'
import { alignCadeteCatalog, getCadeteWeeks, holidayLabelForWeek, suggestedHolidayWeeks } from '~/shared/cadeteCalendar'
import { getCurrentSeasonStart } from '~/shared/cadeteAnnualPlan'
import { currentSeasonWeek } from '~/shared/seasonWeek'
import { buildSeasonSessions, type SeasonSessionRecord } from '~/shared/seasonSessions'
import { createSerialTaskQueue } from '~/shared/serialTaskQueue'
import { useWeeklyReviews } from '~/composables/useWeeklyReviews'

export interface SheetsDatabaseResponse {
  source: 'google-sheets'
  fetchedAt: string
  spreadsheetId: string
  spreadsheetUrl: string
  catalog: TrainingCatalogTables
  operational: {
    coaches: CoachProfile[]
    teams: Team[]
    players: Player[]
    teamPlayers: TeamPlayer[]
    teamCoaches: TeamCoach[]
    seasons: Season[]
    reviews: WeeklyReview[]
    microcycles: MicrocycleRecord[]
  }
}

export {
  ageCategoryOptions,
  blockPalette,
  formattedDate,
}

export function useCoachWorkspace() {
  const emptyTrainingCatalog: TrainingCatalogTables = {
    macrocycles: [], mesocycles: [], mesocycleSessions: [],
    trainingBlocks: [], blockExercises: [], exercises: [], homeSessions: [], tests: [],
  }

  const coaches = ref<CoachProfile[]>([])
  const coach = ref<CoachProfile>({ id: '', name: '', role: 'coach' })
  const loginName = ref('')
  const loginRole = ref<CoachRole>('coach')
  const signedIn = ref(false)
  const view = ref<View>('home')
  const activeTeamTab = ref<TeamTab>('week')
  const showArchivedTeams = ref(false)
  const catalog = ref<TrainingCatalogTables>(emptyTrainingCatalog)
  const dbSource = ref<'google-sheets' | 'unavailable'>('unavailable')
  const loadingDatabase = ref(true)
  const lastSyncedAt = ref('')
  const teams = ref<Team[]>([])
  const players = ref<Player[]>([])
  const teamPlayers = ref<TeamPlayer[]>([])
  const teamCoaches = ref<TeamCoach[]>([])
  const seasons = ref<Season[]>([])
  const reviews = ref<WeeklyReview[]>([])
  const microcycles = ref<MicrocycleRecord[]>([])
  const seasonSessions = ref<SeasonSessionRecord[]>([])
  const activeTeamId = ref('')
  const activeSeasonId = ref('')
  const currentWeekNumber = ref(1)
  const selectedDay = ref<DayId>('dia1')
  const session = ref<GeneratedSessionResponse | null>(null)
  const loadingSession = ref(false)
  const error = ref('')
  const syncQueue = createSerialTaskQueue()
  let latestDatabaseRead = 0

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
  const activeTeamPlayers = computed(() =>
    teamPlayers.value.filter((membership) => membership.teamId === activeTeamId.value && membership.status === 'active'),
  )
  const activeTeamRoster = computed(() =>
    activeTeamPlayers.value.map((membership) => ({
      ...membership,
      player: players.value.find((item) => item.id === membership.playerId),
    })),
  )
  const playerCountByTeam = computed(() => new Map(
    teams.value.map((team) => [team.id, teamPlayers.value.filter((membership) => membership.teamId === team.id && membership.status === 'active').length]),
  ))

  const teamDraft = ref({ name: '', club: '' })
  const seasonDraft = ref<{
    name: string
    ageCategory: AgeCategory
    startsAt: string
    frequency: Frequency
    context: string
  }>({
    name: '2026-27',
    ageCategory: 'cadete',
    startsAt: getCurrentSeasonStart(),
    frequency: 3,
    context: '',
  })
  const draftCadeteWeeks = computed(() => {
    if (seasonDraft.value.ageCategory !== 'cadete') return []
    try {
      const annualPlan = catalog.value.macrocycles.some(plan => plan.ageCategory === 'cadete' && plan.totalWeeks === 42)
      return getCadeteWeeks(seasonDraft.value.startsAt, [], annualPlan).map((week, index) => ({
        ...week,
        weekNumber: index + 1,
        label: holidayLabelForWeek(week),
      }))
    } catch {
      return []
    }
  })

  const draftHolidaySuggestions = computed(() =>
    draftCadeteWeeks.value.filter((week) => week.label !== null),
  )

  const activeTeam = computed(() =>
    teams.value.find((team) => team.id === activeTeamId.value),
  )
  const activeSeason = computed(() =>
    seasons.value.find(
      (item) => item.id === activeSeasonId.value && item.teamId === activeTeamId.value,
    ),
  )
  const activeMicrocycle = computed(() =>
    microcycles.value.find(
      (item) =>
        item.seasonId === activeSeason.value?.id &&
        item.weekNumber === currentWeekNumber.value,
    ),
  )
  const activeSeasonEndDate = computed(() =>
    activeSeason.value
      ? addDays(activeSeason.value.startsAt, activePlan.value.totalWeeks * 7 - 1)
      : '',
  )
  const seasonDraftEndDate = computed(() => {
    if (seasonDraft.value.ageCategory === 'cadete') {
      try {
        const annualPlan = catalog.value.macrocycles.some(plan => plan.ageCategory === 'cadete' && plan.totalWeeks === 42)
        const weeks = getCadeteWeeks(seasonDraft.value.startsAt, [], annualPlan)
        return addDays(weeks[weeks.length - 1]!.weekStart, 6)
      } catch {
        return ''
      }
    }
    const totalWeeks = catalog.value.macrocycles.find(
      (item) => item.ageCategory === seasonDraft.value.ageCategory,
    )?.totalWeeks || 0
    return seasonDraft.value.startsAt && totalWeeks > 0
      ? addDays(seasonDraft.value.startsAt, totalWeeks * 7 - 1)
      : ''
  })

  const frequency = computed<Frequency>(
    () => activeSeason.value?.frequency ?? 1,
  )

  const planConfig = computed(() => ({
    macrocycleId: activeSeason.value?.macrocycleId,
    mesocycleId: activeMicrocycle.value?.mesocycleId || undefined,
    ageCategory: activeSeason.value?.ageCategory || 'cadete',
    frequency: frequency.value,
    weekNumber: currentWeekNumber.value,
    selectedDay: selectedDay.value,
    startsAt: activeSeason.value?.startsAt,
    holidayWeeks: activeSeason.value?.holidayWeeks,
  }))

  const {
    trainingDataStatus: catalogTrainingDataStatus,
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    seasonSessionOffset,
    hydratedPreviewSession,
  } = useTrainingPlan(planConfig, catalog)

  const trainingDataStatus = computed(() =>
    activeSeason.value
      ? currentPhase.value.id && isHolidayWeek.value
        ? getHolidayDataStatus(activePlan.value.id, catalog.value)
        : currentPhase.value.id && currentPhase.value.type === 'assessment'
          ? { available: catalog.value.tests.some(item => item.macrocycleId === activePlan.value.id && item.milestoneWeeks.includes(`S${currentWeekNumber.value}`)), message: 'No hay pruebas configuradas para esta semana.' }
        : catalogTrainingDataStatus.value
      : {
          available: false,
          message: activeTeam.value
            ? 'Este equipo todavía no tiene una temporada en Google Sheets.'
            : 'Selecciona un equipo con una temporada para consultar sus sesiones.',
        },
  )

  const seasonStartMonday = computed(() =>
    mondayFor(activeSeason.value?.startsAt || '2026-10-12'),
  )

  const displayedWeekStart = computed(() =>
    addDays(seasonStartMonday.value, (currentWeekNumber.value - 1) * 7),
  )
  /** Cadete holidays come only from the season's own holiday weeks; catalog holiday phases are not authoritative. */
  const isCadeteHoliday = computed(() =>
    activeSeason.value?.ageCategory === 'cadete' &&
    (activeSeason.value.holidayWeeks || []).includes(displayedWeekStart.value),
  )
  const isHolidayWeek = computed(() =>
    activeSeason.value?.ageCategory === 'cadete'
      ? isCadeteHoliday.value
      : currentPhase.value.type === 'holiday',
  )
  const isTrainingWeek = computed(() =>
    activeSeason.value?.ageCategory === 'cadete'
      ? !isCadeteHoliday.value && currentPhase.value.type !== 'assessment'
      : currentPhase.value.type === 'training',
  )
  const holidayHomeSessions = computed(() => {
    const matching = catalog.value.homeSessions.filter(item =>
      item.macrocycleId === activeSeason.value?.macrocycleId &&
      (!item.weekNumbers?.length || item.weekNumbers.includes(currentWeekNumber.value)),
    )
    const groups = new Map<string, {
      id: string
      name: string
      minutes: number
      format: string
      items: Array<{ id: string; name: string; dose: string; cue: string }>
    }>()
    for (const item of matching) {
      const groupId = `${item.macrocycleId}:${item.code}:${item.name}`
      let group = groups.get(groupId)
      if (!group) {
        group = { id: groupId, name: item.name, minutes: item.minutes, format: item.format, items: [] }
        groups.set(groupId, group)
      }
      const exercise = catalog.value.exercises.find(exercise => exercise.id === item.exerciseId)
      if (!exercise) continue
      group.items.push({
        id: item.id,
        name: exercise.name,
        dose: item.weekDoses?.[currentWeekNumber.value] || item.doseHoliday1,
        cue: exercise.cue,
      })
    }
    return [...groups.values()]
  })
  /** Season test battery grouped by the milestone weeks where each test is run (e.g. S1, S21, S42). */
  const seasonAssessments = computed(() => {
    const tests = catalog.value.tests
      .filter(item => item.macrocycleId === activePlan.value.id)
      .sort((first, second) => first.testOrder - second.testOrder)
    const weeks = [...new Set(tests.flatMap(item => item.milestoneWeeks))]
      .sort((first, second) => Number(first.slice(1)) - Number(second.slice(1)))
    return weeks.map(week => ({
      week,
      tests: tests.filter(item => item.milestoneWeeks.includes(week)),
    }))
  })

  const canGoToPreviousWeek = computed(() => currentWeekNumber.value > 1)
  const canGoToNextWeek = computed(
    () => currentWeekNumber.value < activePlan.value.totalWeeks,
  )

  const weekLabel = computed(() => {
    const start = asLocalDate(displayedWeekStart.value)
    const end = asLocalDate(addDays(displayedWeekStart.value, 6))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Fechas no disponibles'
    }
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    })
    return `${formatter.format(start).replace('.', '')} – ${formatter.format(end).replace('.', '')}`
  })

  function annualWeekLabel(weekNumber: number): string {
    const normalizedWeekNumber = Number(weekNumber)
    if (!Number.isFinite(normalizedWeekNumber)) return 'Semana no disponible'

    const weekStart = asLocalDate(
      addDays(seasonStartMonday.value, (normalizedWeekNumber - 1) * 7),
    )
    const weekEnd = asLocalDate(addDays(weekStart, 6))
    if (Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) {
      return `Semana ${normalizedWeekNumber} · fechas no disponibles`
    }
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const startLabel = formatter.format(weekStart).replace('.', '')
    const endLabel = formatter.format(weekEnd).replace('.', '')
    return `Semana ${normalizedWeekNumber} · ${startLabel} – ${endLabel}`
  }

  const nextWeekMicrocycle = computed(() =>
    microcycles.value.find(
      (item) =>
        item.seasonId === activeSeason.value?.id &&
        item.weekNumber === currentWeekNumber.value + 1,
    ),
  )

  const nextSessionIndex = computed(() => {
    const done = activeMicrocycle.value?.sessionsDone ?? 0
    return done < frequency.value ? done : -1
  })

  function setActiveWeekSessionsDone(count: number): void {
    const microcycle = activeMicrocycle.value
    if (!microcycle) return
    microcycle.sessionsDone = Math.min(frequency.value, Math.max(0, count))
    saveState()
  }

  async function syncToGoogleSheets(): Promise<void> {
    const payload = {
      coaches: coaches.value.map((item) => ({ ...item })),
      teams: teams.value.map((item) => ({ ...item })),
      players: players.value.map((item) => ({ ...item })),
      teamPlayers: teamPlayers.value.map((item) => ({ ...item })),
      teamCoaches: teamCoaches.value.map((item) => ({ ...item })),
      seasons: seasons.value.map((item) => ({
        ...item,
        holidayWeeks: item.holidayWeeks ? [...item.holidayWeeks] : undefined,
      })),
      reviews: reviews.value.map((item) => ({ ...item })),
      microcycles: microcycles.value.map((item) => ({ ...item })),
      seasonSessions: seasonSessions.value.map((item) => ({ ...item })),
      includeCatalog: false,
    }
    await syncQueue.enqueue(async ({ isLatest }) => {
      try {
        await $fetch('/api/sheets-sync', { method: 'POST', body: payload })
        if (isLatest()) {
          dbSource.value = 'google-sheets'
          lastSyncedAt.value = new Date().toISOString()
          error.value = ''
        }
      } catch (syncError) {
        if (!isLatest()) return
        const message = syncError instanceof Error ? syncError.message : ''
        dbSource.value = 'unavailable'
        await loadDatabaseFromSheets(true, isLatest)
        if (!isLatest()) return
        error.value = message
          ? `No se guardaron los cambios en Google Sheets: ${message}`
          : 'No se guardaron los cambios en Google Sheets. Se recuperaron los datos guardados.'
      }
    })
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
    }
  }

  function ensureValidSelections(): void {
    const teamExists = teams.value.some((t) => t.id === activeTeamId.value)
    if (!teamExists) {
      const firstActive = activeTeams.value[0] || teams.value[0]
      activeTeamId.value = firstActive?.id || ''
    }
    const seasonsForTeam = seasons.value.filter(
      (season) => season.teamId === activeTeamId.value,
    )
    const seasonExistsForTeam = seasonsForTeam.some(
      (season) => season.id === activeSeasonId.value,
    )
    if (!seasonExistsForTeam) {
      const active = seasonsForTeam.find((item) => item.status === 'active')
        || seasonsForTeam[0]
      activeSeasonId.value = active?.id || ''
    }
  }

  async function loadDatabaseFromSheets(
    forceRefresh = false,
    canApply: () => boolean = () => true,
  ): Promise<void> {
    const readId = ++latestDatabaseRead
    loadingDatabase.value = true
    try {
      const response = await $fetch<SheetsDatabaseResponse>('/api/sheets-db', {
        query: forceRefresh ? { refresh: '1' } : undefined,
      })
      if (readId !== latestDatabaseRead || !canApply()) return
      catalog.value = response.catalog
      dbSource.value = response.source
      lastSyncedAt.value = response.fetchedAt
      error.value = ''

      coaches.value = response.operational.coaches
      teams.value = response.operational.teams.map((item) => ({
        ...item,
        status: isTeamStatus(item.status) ? item.status : 'active',
      }))
      players.value = response.operational.players
      teamPlayers.value = response.operational.teamPlayers
      teamCoaches.value = response.operational.teamCoaches
      seasons.value = response.operational.seasons
      reviews.value = response.operational.reviews
      microcycles.value = response.operational.microcycles
      seasonSessions.value = response.operational.seasonSessions
      syncActiveCoachRoleFromCatalog()
      if (import.meta.dev && !signedIn.value) devAutoSignIn()
      ensureValidSelections()
      backfillSeasonSessions()
      syncCurrentWeekWithToday()
    } catch (loadError) {
      if (readId !== latestDatabaseRead || !canApply()) return
      dbSource.value = 'unavailable'
      catalog.value = emptyTrainingCatalog
      coaches.value = []
      teams.value = []
      players.value = []
      teamPlayers.value = []
      seasons.value = []
      reviews.value = []
      microcycles.value = []
      seasonSessions.value = []
      activeTeamId.value = ''
      activeSeasonId.value = ''
      error.value = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron cargar los datos de Google Sheets.'
    } finally {
      if (readId === latestDatabaseRead) loadingDatabase.value = false
    }
  }

  function saveState(): void {
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

  function signOut(): void {
    session.value = null
    error.value = ''
    view.value = 'home'
    loginName.value = coach.value.name
    loginRole.value = coach.value.role
    signedIn.value = false
  }

  /** Dev only: skips the login form by reusing a coach already in Sheets. Does not write to Sheets. */
  function devAutoSignIn(): void {
    const devCoach = coaches.value.find((item) => item.role === 'admin') ?? coaches.value[0]
    if (!devCoach) return
    coach.value = { ...devCoach }
    loginName.value = devCoach.name
    loginRole.value = devCoach.role
    signedIn.value = true
  }

  function signIn(): void {
    if (loadingDatabase.value || dbSource.value !== 'google-sheets') return
    const name = loginName.value.trim()
    if (!name) return
    const existing = coaches.value.find(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
    )
    const id = existing?.id || nextId(
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
    teamPlayers.value = teamPlayers.value.filter((membership) => membership.teamId !== teamId)
    seasons.value = seasons.value.filter((season) => season.teamId !== teamId)
    reviews.value = reviews.value.filter(
      (review) => !removedSeasonIds.has(review.seasonId),
    )
    microcycles.value = microcycles.value.filter(
      (microcycle) => !removedSeasonIds.has(microcycle.seasonId),
    )
    seasonSessions.value = seasonSessions.value.filter(
      (row) => !removedSeasonIds.has(row.seasonId),
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

  /** Session rows for one season, built from the catalog; empty when the season has no plan. */
  function sessionsForSeason(season: Season, catalogTables: TrainingCatalogTables): SeasonSessionRecord[] {
    if (!season.macrocycleId) return []
    const plan = catalogTables.macrocycles.find((item) => item.id === season.macrocycleId)
    if (!plan) return []
    return buildSeasonSessions(
      {
        id: season.id,
        macrocycleId: season.macrocycleId,
        startsAt: season.startsAt,
        frequency: season.frequency,
        holidayWeeks: season.holidayWeeks ?? [],
      },
      plan.totalWeeks,
      catalogTables,
    )
  }

  /** One-time fill for seasons that have no session rows in Sheets yet; the rows are then synced. */
  function backfillSeasonSessions(): void {
    let added = false
    for (const season of seasons.value) {
      if (seasonSessions.value.some((row) => row.seasonId === season.id)) continue
      const rows = sessionsForSeason(season, catalog.value)
      if (!rows.length) continue
      seasonSessions.value.push(...rows)
      added = true
    }
    if (added) saveState()
  }

  const activeSeasonSessions = computed(() =>
    seasonSessions.value
      .filter((row) => row.seasonId === activeSeasonId.value)
      .sort((first, second) => first.sessionNumber - second.sessionNumber),
  )

  /** Season session row for the session currently open (current week and selected day). */
  const selectedSeasonSession = computed(() =>
    activeSeasonSessions.value.find(
      (row) => row.weekNumber === currentWeekNumber.value && row.day === selectedDay.value,
    ),
  )

  /** Points the week selector at the season week that contains today. */
  function syncCurrentWeekWithToday(): void {
    const season = activeSeason.value
    if (!season) {
      currentWeekNumber.value = 1
      return
    }
    const plan = catalog.value.macrocycles.find((item) => item.id === season.macrocycleId)
    currentWeekNumber.value = plan ? currentSeasonWeek(season.startsAt, plan.totalWeeks) : 1
  }

  function selectSeason(seasonId: string): void {
    const target = seasons.value.find(
      (item) => item.id === seasonId && item.teamId === activeTeamId.value,
    )
    if (!target) return
    activeSeasonId.value = target.id
    syncCurrentWeekWithToday()
    session.value = null
  }

  function openTeam(teamId: string): void {
    activeTeamId.value = teamId
    activeSeasonId.value = ''
    activeTeamTab.value = 'week'
    const foundSeason =
      seasons.value.find(
        (item) => item.teamId === teamId && item.status === 'active',
      ) || seasons.value.find((item) => item.teamId === teamId)
    activeSeasonId.value = foundSeason?.id || ''
    selectedDay.value = 'dia1'
    syncCurrentWeekWithToday()
    session.value = null
    view.value = 'team'
  }

  function openCreateTeam(): void {
    teamDraft.value = { name: '', club: '' }
    view.value = 'create-team'
  }

  function createTeam(): void {
    if (dbSource.value !== 'google-sheets') return
    if (!teamDraft.value.name.trim()) return
    const teamId = nextId(
      'EQU',
      teams.value.map((item) => item.id),
    )
    teams.value.push({
      id: teamId,
      name: teamDraft.value.name.trim(),
      club: teamDraft.value.club.trim() || 'Sin club',
      status: 'active',
    })
    teamCoaches.value.push({
      id: nextId('EQC', teamCoaches.value.map((item) => item.id)),
      teamId,
      coachId: coach.value.id,
      role: 'owner',
    })
    activeTeamId.value = teamId
    seasonDraft.value = {
      name: '2026-27',
      ageCategory: 'cadete',
      startsAt: getCurrentSeasonStart(),
      frequency: 3,
      holidayWeeks: [],
      context: '',
    }
    saveState()
    view.value = 'create-season'
  }

  function createSeason(): void {
    if (dbSource.value !== 'google-sheets') return
    if (
      !activeTeam.value ||
      !seasonDraft.value.startsAt
    ) {
      return
    }
    const resolvedMacrocycle = catalog.value.macrocycles.find(
      (item) => item.ageCategory === seasonDraft.value.ageCategory,
    )
    if (!resolvedMacrocycle) {
      error.value = 'No hay un macrociclo disponible en Google Sheets para esta categoría.'
      return
    }
    if (asLocalDate(seasonDraft.value.startsAt).getDay() !== 1) {
      error.value = 'La temporada debe comenzar un lunes.'
      return
    }
    let seasonCatalog = catalog.value
    if (seasonDraft.value.ageCategory === 'cadete') {
      try {
        seasonCatalog = alignCadeteCatalog(catalog.value, seasonDraft.value.startsAt, suggestedHolidayWeeks(seasonDraft.value.startsAt))
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'No se pudo preparar el calendario de cadete.'
        return
      }
    }
    const seasonMacrocycle = seasonCatalog.macrocycles.find(item => item.id === resolvedMacrocycle.id)!
    const newSeason: Season = {
      id: nextId(
        'TEM',
        seasons.value.map((item) => item.id),
      ),
      teamId: activeTeam.value.id,
      macrocycleId: resolvedMacrocycle.id,
      name: seasonDraft.value.name || '2026-27',
      category: categoryLabelFor(seasonDraft.value.ageCategory),
      ageCategory: seasonDraft.value.ageCategory,
      startsAt: seasonDraft.value.startsAt,
      frequency: seasonDraft.value.frequency,
      holidayWeeks: seasonDraft.value.ageCategory === 'cadete' ? suggestedHolidayWeeks(seasonDraft.value.startsAt) : [],
      context: seasonDraft.value.context.trim(),
      status: 'active',
    }
    const microcycleIds = microcycles.value.map((item) => item.id)
    const generatedMicrocycles = Array.from(
      { length: seasonMacrocycle.totalWeeks },
      (_, index): MicrocycleRecord => {
        const weekNumber = index + 1
        const mesocycle = seasonCatalog.mesocycles.find(
          (item) =>
            item.macrocycleId === resolvedMacrocycle.id &&
            weekNumber >= item.weekStart &&
            weekNumber <= item.weekEnd,
        )
        const weekStart = addDays(newSeason.startsAt, index * 7)
        const id = nextMicrocycleId(microcycleIds)
        microcycleIds.push(id)
        return {
          id,
          seasonId: newSeason.id,
          macrocycleId: resolvedMacrocycle.id,
          mesocycleId: mesocycle?.id || '',
          weekNumber,
          weekStart,
          weekEnd: addDays(weekStart, 6),
          objective: mesocycle?.objective || '',
          loadIndex: mesocycle?.load || 0,
          status: 'planned',
          sessionsDone: 0,
        }
      },
    )
    seasons.value
      .filter(
        (item) =>
          item.teamId === activeTeam.value?.id && item.status === 'active',
      )
      .forEach((item) => {
        item.status = 'closed'
      })
    seasons.value.push(newSeason)
    microcycles.value.push(...generatedMicrocycles)
    seasonSessions.value.push(...sessionsForSeason(newSeason, seasonCatalog))
    activeSeasonId.value = newSeason.id
    syncCurrentWeekWithToday()
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
    activeTeamTab.value = 'week'
  }

  async function generateSession(day: DayId): Promise<void> {
    if (!activeSeason.value) {
      error.value = 'Crea una temporada en Google Sheets antes de generar una sesión.'
      return
    }
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
            seasonId: activeSeason.value?.id,
            frequency: frequency.value,
            weekNumber: currentWeekNumber.value,
            macrocycleId: activeSeason.value?.macrocycleId,
            mesocycleId: activeMicrocycle.value?.mesocycleId,
            ageCategory: activeSeason.value?.ageCategory || 'cadete',
            startsAt: activeSeason.value?.startsAt,
            holidayWeeks: activeSeason.value?.holidayWeeks,
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

  onMounted(() => {
    try {
      for (const key of [
        'pizarra-coach',
        'pizarra-coach-session',
        'pizarra-coaches-v4',
        'pizarra-teams-v4',
        'pizarra-players-v5',
        'pizarra-team-players-v5',
        'pizarra-seasons-v4',
        'pizarra-reviews-v4',
      ]) {
        localStorage.removeItem(key)
      }
    } catch {
      // La interfaz no depende del almacenamiento local.
    }
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
    players,
    teamPlayers,
    activeTeamPlayers,
    activeTeamRoster,
    playerCountByTeam,
    activeTeams,
    archivedTeams,
    visibleTeams,
    seasons,
    microcycles,
    seasonSessions,
    selectedSeasonSession,
    teamSeasons,
    reviews,
    activeTeam,
    activeSeason,
    activeMicrocycle,
    activeSeasonEndDate,
    seasonDraftEndDate,
    frequency,
    trainingDataStatus,
    activePlan,
    phases,
    currentWeekContext,
    currentPhase,
    weeklySessions,
    seasonSessionOffset,
    hydratedPreviewSession,
    currentWeekNumber,
    selectedDay,
    displayedWeekStart,
    isCadeteHoliday,
    isHolidayWeek,
    isTrainingWeek,
    holidayHomeSessions,
    seasonAssessments,
    canGoToPreviousWeek,
    canGoToNextWeek,
    weekLabel,
    annualWeekLabel,
    nextWeekMicrocycle,
    nextSessionIndex,
    setActiveWeekSessionsDone,
    activeWeekReview,
    seasonReviews,
    selectedHistoryReview,
    reviewDraft,
    reviewEditorOpen,
    historyModalOpen,
    selectedHistoryReviewId,
    teamDraft,
    seasonDraft,
    draftCadeteWeeks,
    session,
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
    draftHolidaySuggestions,
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
    refreshDatabaseFromSheets: () => loadDatabaseFromSheets(true),
  }
}
