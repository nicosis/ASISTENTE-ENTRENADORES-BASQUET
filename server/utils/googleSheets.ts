import { createSign } from 'node:crypto'
import {
  blockExercises,
  defaultTrainingCatalog,
  exercises,
  homeSessions,
  phaseSessions,
  planPhases,
  plans,
  resolvePlan,
  sessionBlocks,
  tests,
  type AgeCategory,
  type BlockExerciseRecord,
  type CompetitiveLevel,
  type ExerciseRecord,
  type Frequency,
  type HomeSessionRecord,
  type PhaseSessionRecord,
  type PhaseType,
  type PlanPhaseRecord,
  type PlanRecord,
  type SessionBlockRecord,
  type TestRecord,
  type TrainingCatalogTables,
  type TrainingDay,
} from '../../app/shared/training'

export interface GoogleSheetsCredentials {
  spreadsheetId: string
  clientEmail: string
  privateKey: string
}

export interface SheetCoachInput {
  id: string
  name: string
  role: 'admin' | 'coach'
}

export interface SheetPlayerInput {
  id: string
  name: string
}

export interface SheetTeamInput {
  id: string
  coachId: string
  name: string
  club: string
  players: SheetPlayerInput[]
  status: 'active' | 'archived'
}

export interface SheetSeasonInput {
  id: string
  teamId: string
  planId?: string
  name: string
  category: string
  ageCategory: AgeCategory
  competitiveLevel: CompetitiveLevel
  startsAt: string
  endsAt: string
  trainingDays: string[]
  context: string
  status: 'active' | 'closed'
}

export interface SheetWeeklyReviewInput {
  id: string
  seasonId: string
  weekStart: string
  text: string
  createdAt: string
}

export interface OperationalTablesPayload {
  coaches?: SheetCoachInput[]
  teams?: SheetTeamInput[]
  seasons?: SheetSeasonInput[]
  reviews?: SheetWeeklyReviewInput[]
  includeCatalog?: boolean
}

export interface SheetsDatabaseSnapshot {
  source: 'google-sheets' | 'local-fallback'
  fetchedAt: string
  spreadsheetId: string
  spreadsheetUrl: string
  catalog: TrainingCatalogTables
  operational: {
    coaches: SheetCoachInput[]
    teams: SheetTeamInput[]
    seasons: SheetSeasonInput[]
    reviews: SheetWeeklyReviewInput[]
  }
}

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface SheetProperties {
  sheetId?: number
  title?: string
}

interface SpreadsheetMetadata {
  spreadsheetId?: string
  properties?: {
    title?: string
  }
  sheets?: Array<{
    properties?: SheetProperties
  }>
  error?: {
    message?: string
  }
}

export interface SheetTableDefinition {
  title: string
  headers: string[]
  rows: Array<Array<string | number>>
  rgbColor: { red: number; green: number; blue: number }
}

export interface SyncSheetsResult {
  spreadsheetId: string
  spreadsheetTitle: string
  spreadsheetUrl: string
  syncedTables: Array<{
    table: string
    rowCount: number
  }>
}

const defaultCoaches: SheetCoachInput[] = [
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

const defaultTeams: SheetTeamInput[] = [
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

const defaultSeasons: SheetSeasonInput[] = [
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

const defaultReviews: SheetWeeklyReviewInput[] = [
  {
    id: 'OBS0001',
    seasonId: 'TEM0001',
    weekStart: '2026-10-12',
    text: 'Semana 1: Evaluación inicial de patrones básicos y batería de tests CMJ/Sprint.',
    createdAt: '2026-10-12T18:00:00.000Z',
  },
]

function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, '\n').trim()
}

export async function getGoogleAccessToken(
  credentials: GoogleSheetsCredentials,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  ).toString('base64url')

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const signature = signer.sign(
    normalizePrivateKey(credentials.privateKey),
    'base64url',
  )

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${signature}`,
    }),
  })

  const data = (await response.json()) as GoogleTokenResponse
  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        'Failed to obtain Google OAuth2 access token.',
    )
  }

  return data.access_token
}

export function buildTrainingSheetTables(
  operational?: OperationalTablesPayload,
): SheetTableDefinition[] {
  const activeCoaches =
    operational?.coaches !== undefined ? operational.coaches : defaultCoaches
  const activeTeams =
    operational?.teams !== undefined ? operational.teams : defaultTeams
  const activeSeasons =
    operational?.seasons !== undefined ? operational.seasons : defaultSeasons
  const activeReviews =
    operational?.reviews !== undefined ? operational.reviews : defaultReviews

  return [
    {
      title: 'plans',
      headers: [
        'id',
        'name',
        'age_category',
        'total_weeks',
      ],
      rows: plans.map((item) => [
        item.id,
        item.name,
        item.ageCategory,
        item.totalWeeks,
      ]),
      rgbColor: { red: 0.23, green: 0.51, blue: 0.96 },
    },
    {
      title: 'plan_phases',
      headers: [
        'id',
        'plan_id',
        'phase_order',
        'type',
        'name',
        'weeks_count',
        'week_start',
        'week_end',
        'color',
        'objective',
        'load_rules',
        'plio_rule',
        'weekly_progression_note',
        'weekly_loads',
      ],
      rows: planPhases.map((item) => [
        item.id,
        item.planId,
        item.phaseOrder,
        item.type,
        item.name,
        item.weeksCount,
        item.weekStart,
        item.weekEnd,
        item.color,
        item.objective,
        item.loadRules.join(' | '),
        item.plioRule,
        item.weeklyProgressionNote,
        item.weeklyLoads.join(', '),
      ]),
      rgbColor: { red: 0.06, green: 0.73, blue: 0.51 },
    },
    {
      title: 'phase_sessions',
      headers: [
        'id',
        'phase_id',
        'day',
        'order',
        'name',
        'focus',
        'total_minutes',
      ],
      rows: phaseSessions.map((item) => [
        item.id,
        item.phaseId,
        item.day,
        item.order,
        item.name,
        item.focus,
        item.totalMinutes,
      ]),
      rgbColor: { red: 0.96, green: 0.62, blue: 0.04 },
    },
    {
      title: 'session_blocks',
      headers: ['id', 'session_id', 'block_order', 'name', 'minutes', 'format'],
      rows: sessionBlocks.map((item) => [
        item.id,
        item.sessionId,
        item.blockOrder,
        item.name,
        item.minutes,
        item.format,
      ]),
      rgbColor: { red: 0.55, green: 0.36, blue: 0.96 },
    },
    {
      title: 'block_exercises',
      headers: [
        'id',
        'block_id',
        'exercise_id',
        'item_order',
        'station_label',
        'dose_formacion',
        'dose_liga',
      ],
      rows: blockExercises.map((item) => [
        item.id,
        item.blockId,
        item.exerciseId,
        item.itemOrder,
        item.stationLabel,
        item.doseFormacion,
        item.doseLiga,
      ]),
      rgbColor: { red: 0.94, green: 0.27, blue: 0.27 },
    },
    {
      title: 'exercises',
      headers: [
        'id',
        'slug',
        'name',
        'category',
        'focus',
        'material',
        'how',
        'cue',
        'errors',
        'easier',
        'harder',
      ],
      rows: exercises.map((item) => [
        item.id,
        item.slug,
        item.name,
        item.category,
        item.focus,
        item.material,
        item.how.join(' | '),
        item.cue,
        item.errors.join(' | '),
        item.easier,
        item.harder,
      ]),
      rgbColor: { red: 0.93, green: 0.28, blue: 0.6 },
    },
    {
      title: 'home_sessions',
      headers: [
        'id',
        'plan_id',
        'code',
        'name',
        'minutes',
        'format',
        'exercise_id',
        'dose_holiday_1',
        'dose_holiday_2',
      ],
      rows: homeSessions.map((item) => [
        item.id,
        item.planId,
        item.code,
        item.name,
        item.minutes,
        item.format,
        item.exerciseId,
        item.doseHoliday1,
        item.doseHoliday2,
      ]),
      rgbColor: { red: 0.02, green: 0.71, blue: 0.83 },
    },
    {
      title: 'tests',
      headers: [
        'id',
        'plan_id',
        'test_order',
        'name',
        'protocol',
        'milestone_weeks',
      ],
      rows: tests.map((item) => [
        item.id,
        item.planId,
        item.testOrder,
        item.name,
        item.protocol,
        item.milestoneWeeks.join(' | '),
      ]),
      rgbColor: { red: 0.39, green: 0.45, blue: 0.55 },
    },
    {
      title: 'coaches',
      headers: ['id', 'name', 'role'],
      rows: activeCoaches.map((coach) => [coach.id, coach.name, coach.role]),
      rgbColor: { red: 0.28, green: 0.33, blue: 0.41 },
    },
    {
      title: 'teams',
      headers: [
        'id',
        'coach_id',
        'name',
        'club',
        'status',
        'players_count',
        'players',
      ],
      rows: activeTeams.map((team) => [
        team.id,
        team.coachId,
        team.name,
        team.club,
        team.status === 'archived' ? 'archived' : 'active',
        team.players.length,
        team.players.map((p) => `${p.id}: ${p.name}`).join(' | '),
      ]),
      rgbColor: { red: 0.13, green: 0.53, blue: 0.38 },
    },
    {
      title: 'seasons',
      headers: [
        'id',
        'team_id',
        'plan_id',
        'name',
        'category',
        'age_category',
        'competitive_level',
        'frequency',
        'starts_at',
        'ends_at',
        'training_days',
        'context',
        'status',
      ],
      rows: activeSeasons.map((season) => {
        const freq = Math.min(
          3,
          Math.max(1, season.trainingDays.length || 1),
        ) as Frequency
        const planId =
          season.planId ||
          resolvePlan(season.ageCategory).id
        return [
          season.id,
          season.teamId,
          planId,
          season.name,
          season.category,
          season.ageCategory,
          season.competitiveLevel,
          freq,
          season.startsAt,
          season.endsAt,
          season.trainingDays.join(', '),
          season.context,
          season.status,
        ]
      }),
      rgbColor: { red: 0.16, green: 0.38, blue: 0.68 },
    },
    {
      title: 'weekly_reviews',
      headers: ['id', 'season_id', 'week_start', 'text', 'created_at'],
      rows: activeReviews.map((review) => [
        review.id,
        review.seasonId,
        review.weekStart,
        review.text,
        review.createdAt,
      ]),
      rgbColor: { red: 0.78, green: 0.45, blue: 0.18 },
    },
  ]
}

const OPERATIONAL_TABLE_TITLES = new Set([
  'coaches',
  'teams',
  'seasons',
  'weekly_reviews',
])

interface CachedDatabaseEntry {
  expiresAt: number
  snapshot: SheetsDatabaseSnapshot
}

let cachedDatabase: CachedDatabaseEntry | null = null
const CACHE_TTL_MS = 15_000

export function invalidateSheetsDatabaseCache(): void {
  cachedDatabase = null
}

export function getFallbackDatabaseSnapshot(
  spreadsheetId = '',
): SheetsDatabaseSnapshot {
  return {
    source: 'local-fallback',
    fetchedAt: new Date().toISOString(),
    spreadsheetId,
    spreadsheetUrl: spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      : '',
    catalog: defaultTrainingCatalog,
    operational: {
      coaches: defaultCoaches,
      teams: defaultTeams,
      seasons: defaultSeasons,
      reviews: defaultReviews,
    },
  }
}

interface BatchGetValueRange {
  range?: string
  values?: string[][]
}

interface BatchGetResponse {
  valueRanges?: BatchGetValueRange[]
  error?: {
    message?: string
  }
}

function cellString(row: string[], index: number, fallback = ''): string {
  const val = row[index]
  return typeof val === 'string' ? val.trim() : fallback
}

function cellNumber(row: string[], index: number, fallback = 0): number {
  const raw = cellString(row, index)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function splitPipeList(raw: string): string[] {
  if (!raw.trim()) return []
  return raw
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitCommaNumbers(raw: string): number[] {
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num))
}

function splitCommaStrings(raw: string): string[] {
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseAgeCategory(raw: string): AgeCategory {
  if (
    raw === 'alevin' ||
    raw === 'infantil' ||
    raw === 'cadete' ||
    raw === 'juvenil'
  ) {
    return raw
  }
  return 'cadete'
}

function parseCompetitiveLevel(raw: string): CompetitiveLevel {
  return raw === 'formacion' ? 'formacion' : 'liga'
}

function parsePhaseType(raw: string): PhaseType {
  return raw === 'holiday' ? 'holiday' : 'training'
}

function parseTrainingDay(raw: string): TrainingDay {
  if (raw === 'dia1' || raw === 'dia2' || raw === 'dia3') {
    return raw
  }
  return 'dia1'
}

function parseHomeCode(raw: string): 'A' | 'B' | 'C' {
  if (raw === 'A' || raw === 'B' || raw === 'C') {
    return raw
  }
  return 'A'
}

function parsePlayersCell(raw: string): SheetPlayerInput[] {
  return splitPipeList(raw).map((entry, index) => {
    const colonIdx = entry.indexOf(':')
    if (colonIdx > 0) {
      const id = entry.slice(0, colonIdx).trim()
      const name = entry.slice(colonIdx + 1).trim()
      return {
        id: id || `JUG${String(index + 1).padStart(4, '0')}`,
        name: name || entry,
      }
    }
    return {
      id: `JUG${String(index + 1).padStart(4, '0')}`,
      name: entry,
    }
  })
}

export async function readDatabaseFromGoogleSheets(
  credentials: GoogleSheetsCredentials,
  options?: { forceRefresh?: boolean },
): Promise<SheetsDatabaseSnapshot> {
  if (
    !options?.forceRefresh &&
    cachedDatabase &&
    cachedDatabase.expiresAt > Date.now() &&
    cachedDatabase.snapshot.spreadsheetId === credentials.spreadsheetId
  ) {
    return cachedDatabase.snapshot
  }

  const token = await getGoogleAccessToken(credentials)
  const tabOrder = [
    'plans',
    'plan_phases',
    'phase_sessions',
    'session_blocks',
    'block_exercises',
    'exercises',
    'home_sessions',
    'tests',
    'coaches',
    'teams',
    'seasons',
    'weekly_reviews',
  ] as const

  const params = new URLSearchParams()
  for (const tab of tabOrder) {
    params.append('ranges', `${tab}!A2:Z500`)
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}/values:batchGet?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = (await res.json()) as BatchGetResponse
  if (!res.ok) {
    throw new Error(
      data.error?.message ||
        `Unable to read tables from Google Sheets (${res.status}).`,
    )
  }

  const rowsByTab = new Map<string, string[][]>()
  const ranges = data.valueRanges || []
  tabOrder.forEach((tab, idx) => {
    const rawValues = ranges[idx]?.values || []
    const nonEmptyRows = rawValues.filter((row) =>
      row.some((cell) => typeof cell === 'string' && cell.trim().length > 0),
    )
    rowsByTab.set(tab, nonEmptyRows)
  })

  const planRows = rowsByTab.get('plans') || []
  const parsedPlans: PlanRecord[] = planRows.length
    ? planRows.map((row) => ({
        id: cellString(row, 0),
        name: cellString(row, 1),
        ageCategory: parseAgeCategory(cellString(row, 2)),
        totalWeeks: cellNumber(row, 3, 18),
      }))
    : defaultTrainingCatalog.plans

  const phaseRows = rowsByTab.get('plan_phases') || []
  const parsedPhases: PlanPhaseRecord[] = phaseRows.length
    ? phaseRows.map((row) => ({
        id: cellString(row, 0),
        planId: cellString(row, 1),
        phaseOrder: cellNumber(row, 2, 1),
        type: parsePhaseType(cellString(row, 3)),
        name: cellString(row, 4),
        weeksCount: cellNumber(row, 5, 4),
        weekStart: cellNumber(row, 6, 1),
        weekEnd: cellNumber(row, 7, 4),
        color: cellString(row, 8, '#4f7cac'),
        objective: cellString(row, 9),
        loadRules: splitPipeList(cellString(row, 10)),
        plioRule: cellString(row, 11),
        weeklyProgressionNote: cellString(row, 12),
        weeklyLoads: splitCommaNumbers(cellString(row, 13)),
      }))
    : defaultTrainingCatalog.planPhases

  const sessionRows = rowsByTab.get('phase_sessions') || []
  const parsedSessions: PhaseSessionRecord[] = sessionRows.length
    ? sessionRows.map((row) => ({
        id: cellString(row, 0),
        phaseId: cellString(row, 1),
        day: parseTrainingDay(cellString(row, 2)),
        order: cellNumber(row, 3, 1),
        name: cellString(row, 4),
        focus: cellString(row, 5),
        totalMinutes: cellNumber(row, 6, 40),
      }))
    : defaultTrainingCatalog.phaseSessions

  const blockRows = rowsByTab.get('session_blocks') || []
  const parsedBlocks: SessionBlockRecord[] = blockRows.length
    ? blockRows.map((row) => ({
        id: cellString(row, 0),
        sessionId: cellString(row, 1),
        blockOrder: cellNumber(row, 2, 1),
        name: cellString(row, 3),
        minutes: cellNumber(row, 4, 8),
        format: cellString(row, 5),
      }))
    : defaultTrainingCatalog.sessionBlocks

  const blockExerciseRows = rowsByTab.get('block_exercises') || []
  const parsedBlockExercises: BlockExerciseRecord[] = blockExerciseRows.length
    ? blockExerciseRows.map((row) => ({
        id: cellString(row, 0),
        blockId: cellString(row, 1),
        exerciseId: cellString(row, 2),
        itemOrder: cellNumber(row, 3, 1),
        stationLabel: cellString(row, 4),
        doseFormacion: cellString(row, 5),
        doseLiga: cellString(row, 6, cellString(row, 5)),
      }))
    : defaultTrainingCatalog.blockExercises

  const exerciseRows = rowsByTab.get('exercises') || []
  const parsedExercises: ExerciseRecord[] = exerciseRows.length
    ? exerciseRows.map((row) => ({
        id: cellString(row, 0),
        slug: cellString(row, 1),
        name: cellString(row, 2),
        category: cellString(row, 3),
        focus: cellString(row, 4),
        material: cellString(row, 5),
        how: splitPipeList(cellString(row, 6)),
        cue: cellString(row, 7),
        errors: splitPipeList(cellString(row, 8)),
        easier: cellString(row, 9),
        harder: cellString(row, 10),
      }))
    : defaultTrainingCatalog.exercises

  const homeRows = rowsByTab.get('home_sessions') || []
  const parsedHomeSessions: HomeSessionRecord[] = homeRows.length
    ? homeRows.map((row) => ({
        id: cellString(row, 0),
        planId: cellString(row, 1),
        code: parseHomeCode(cellString(row, 2)),
        name: cellString(row, 3),
        minutes: cellNumber(row, 4, 20),
        format: cellString(row, 5),
        exerciseId: cellString(row, 6),
        doseHoliday1: cellString(row, 7),
        doseHoliday2: cellString(row, 8),
      }))
    : defaultTrainingCatalog.homeSessions

  const testRows = rowsByTab.get('tests') || []
  const parsedTests: TestRecord[] = testRows.length
    ? testRows.map((row) => ({
        id: cellString(row, 0),
        planId: cellString(row, 1),
        testOrder: cellNumber(row, 2, 1),
        name: cellString(row, 3),
        protocol: cellString(row, 4),
        milestoneWeeks: splitPipeList(cellString(row, 5)),
      }))
    : defaultTrainingCatalog.tests

  const coachRows = rowsByTab.get('coaches') || []
  const parsedCoaches: SheetCoachInput[] = coachRows.length
    ? coachRows.map((row) => ({
        id: cellString(row, 0, 'ENT0001'),
        name: cellString(row, 1, 'Nicolás'),
        role: cellString(row, 2) === 'admin' ? 'admin' : 'coach',
      }))
    : defaultCoaches

  const teamRows = rowsByTab.get('teams') || []
  const parsedTeams: SheetTeamInput[] = teamRows.map((row) => {
    const col4 = cellString(row, 4)
    const hasStatusCol = col4 === 'active' || col4 === 'archived'
    const status: 'active' | 'archived' =
      col4 === 'archived' ? 'archived' : 'active'
    const playersCell = hasStatusCol ? cellString(row, 6) : cellString(row, 5)
    return {
      id: cellString(row, 0),
      coachId: cellString(row, 1, 'ENT0001'),
      name: cellString(row, 2),
      club: cellString(row, 3),
      status,
      players: parsePlayersCell(playersCell),
    }
  })

  const seasonRows = rowsByTab.get('seasons') || []
  const parsedSeasons: SheetSeasonInput[] = seasonRows.map((row) => {
    const ageCategory = parseAgeCategory(cellString(row, 5))
    return {
      id: cellString(row, 0),
      teamId: cellString(row, 1),
      planId:
        cellString(row, 2) ||
        resolvePlan(ageCategory, {
          ...defaultTrainingCatalog,
          plans: parsedPlans,
        }).id,
      name: cellString(row, 3),
      category: cellString(row, 4),
      ageCategory,
      competitiveLevel: parseCompetitiveLevel(cellString(row, 6)),
      startsAt: cellString(row, 8, '2026-10-12'),
      endsAt: cellString(row, 9, '2027-05-30'),
      trainingDays: splitCommaStrings(cellString(row, 10)),
      context: cellString(row, 11),
      status: cellString(row, 12) === 'closed' ? 'closed' : 'active',
    }
  })

  const reviewRows = rowsByTab.get('weekly_reviews') || []
  const parsedReviews: SheetWeeklyReviewInput[] = reviewRows.map((row) => ({
    id: cellString(row, 0),
    seasonId: cellString(row, 1),
    weekStart: cellString(row, 2),
    text: cellString(row, 3),
    createdAt: cellString(row, 4),
  }))

  const snapshot: SheetsDatabaseSnapshot = {
    source: 'google-sheets',
    fetchedAt: new Date().toISOString(),
    spreadsheetId: credentials.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${credentials.spreadsheetId}/edit`,
    catalog: {
      plans: parsedPlans,
      planPhases: parsedPhases,
      phaseSessions: parsedSessions,
      sessionBlocks: parsedBlocks,
      blockExercises: parsedBlockExercises,
      exercises: parsedExercises,
      homeSessions: parsedHomeSessions,
      tests: parsedTests,
    },
    operational: {
      coaches: parsedCoaches,
      teams: parsedTeams,
      seasons: parsedSeasons,
      reviews: parsedReviews,
    },
  }

  cachedDatabase = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    snapshot,
  }

  return snapshot
}

export async function syncTrainingTablesToGoogleSheets(
  credentials: GoogleSheetsCredentials,
  operational?: OperationalTablesPayload,
): Promise<SyncSheetsResult> {
  const token = await getGoogleAccessToken(credentials)
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}`
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const metaRes = await fetch(baseUrl, { headers: authHeaders })
  const metadata = (await metaRes.json()) as SpreadsheetMetadata
  if (!metaRes.ok) {
    throw new Error(
      metadata.error?.message ||
        `Unable to read spreadsheet (${metaRes.status}).`,
    )
  }

  const allTables = buildTrainingSheetTables(operational)
  const includeCatalog =
    operational?.includeCatalog ??
    !(
      operational?.coaches ||
      operational?.teams ||
      operational?.seasons ||
      operational?.reviews
    )

  const existingByTitle = new Map<string, number>()
  for (const sheet of metadata.sheets || []) {
    const title = sheet.properties?.title
    const id = sheet.properties?.sheetId
    if (title && typeof id === 'number') {
      existingByTitle.set(title, id)
    }
  }

  const tables = allTables.filter(
    (table) =>
      includeCatalog ||
      OPERATIONAL_TABLE_TITLES.has(table.title) ||
      !existingByTitle.has(table.title),
  )

  const createRequests: Array<Record<string, unknown>> = []
  for (const table of tables) {
    if (!existingByTitle.has(table.title)) {
      createRequests.push({
        addSheet: {
          properties: {
            title: table.title,
            gridProperties: {
              rowCount: Math.max(100, table.rows.length + 20),
              columnCount: Math.max(15, table.headers.length + 2),
              frozenRowCount: 1,
            },
            tabColorStyle: {
              rgbColor: table.rgbColor,
            },
          },
        },
      })
    }
  }

  if (createRequests.length > 0) {
    const addRes = await fetch(`${baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ requests: createRequests }),
    })
    if (!addRes.ok) {
      const errBody = (await addRes.json()) as SpreadsheetMetadata
      throw new Error(
        errBody.error?.message || 'Failed to create missing sheets.',
      )
    }
  }

  const refreshedRes = await fetch(baseUrl, { headers: authHeaders })
  const refreshedMeta = (await refreshedRes.json()) as SpreadsheetMetadata
  const sheetIdsByTitle = new Map<string, number>()
  for (const sheet of refreshedMeta.sheets || []) {
    const title = sheet.properties?.title
    const id = sheet.properties?.sheetId
    if (title && typeof id === 'number') {
      sheetIdsByTitle.set(title, id)
    }
  }

  const valueData = tables.map((table) => ({
    range: `${table.title}!A1`,
    majorDimension: 'ROWS',
    values: [table.headers, ...table.rows],
  }))

  const clearRanges = tables.map((table) => `${table.title}!A1:Z500`)
  await fetch(`${baseUrl}/values:batchClear`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ranges: clearRanges }),
  })

  const writeRes = await fetch(`${baseUrl}/values:batchUpdate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData,
    }),
  })
  if (!writeRes.ok) {
    const errBody = (await writeRes.json()) as SpreadsheetMetadata
    throw new Error(
      errBody.error?.message || 'Failed to write table values to Google Sheets.',
    )
  }

  const formatRequests: Array<Record<string, unknown>> = []
  for (const table of tables) {
    const sheetId = sheetIdsByTitle.get(table.title)
    if (typeof sheetId !== 'number') continue

    formatRequests.push(
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 1 },
            tabColorStyle: { rgbColor: table.rgbColor },
          },
          fields: 'gridProperties.frozenRowCount,tabColorStyle',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: table.headers.length,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: table.rgbColor,
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 },
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: table.headers.length,
          },
        },
      },
    )
  }

  const defaultSheetId =
    sheetIdsByTitle.get('Hoja 1') ?? sheetIdsByTitle.get('Sheet1')
  if (typeof defaultSheetId === 'number' && sheetIdsByTitle.size > 1) {
    formatRequests.push({
      deleteSheet: { sheetId: defaultSheetId },
    })
  }

  if (formatRequests.length > 0) {
    await fetch(`${baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ requests: formatRequests }),
    })
  }

  invalidateSheetsDatabaseCache()

  return {
    spreadsheetId: credentials.spreadsheetId,
    spreadsheetTitle: refreshedMeta.properties?.title || 'Pizarra Basquet DB',
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${credentials.spreadsheetId}/edit`,
    syncedTables: tables.map((table) => ({
      table: table.title,
      rowCount: table.rows.length,
    })),
  }
}
