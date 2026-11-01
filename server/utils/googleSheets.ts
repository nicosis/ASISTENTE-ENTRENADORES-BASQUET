import { createSign } from 'node:crypto'
import {
  blockExercises,
  exercises,
  homeSessions,
  mesocycleSessions,
  mesocycles,
  macrocycles,
  trainingBlocks,
  sessionVariants,
  tests,
  type AgeCategory,
  type BlockExerciseRecord,
  type CompetitiveLevel,
  type ExerciseRecord,
  type Frequency,
  type HomeSessionRecord,
  type MicrocycleRecord,
  type MesocycleSessionRecord,
  type PhaseType,
  type MesocycleRecord,
  type MacrocycleRecord,
  type TrainingBlockRecord,
  type SessionVariantRecord,
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

export interface SheetTeamPlayerInput {
  id: string
  teamId: string
  playerId: string
  status: 'active' | 'inactive'
  joinedAt: string
  leftAt: string | null
}

export interface SheetTeamInput {
  id: string
  coachId: string
  name: string
  club: string
  status: 'active' | 'archived'
}

export interface SheetSeasonInput {
  id: string
  teamId: string
  macrocycleId?: string
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

export type SheetMicrocycleInput = MicrocycleRecord

export interface OperationalTablesPayload {
  coaches?: SheetCoachInput[]
  teams?: SheetTeamInput[]
  players?: SheetPlayerInput[]
  teamPlayers?: SheetTeamPlayerInput[]
  seasons?: SheetSeasonInput[]
  reviews?: SheetWeeklyReviewInput[]
  microcycles?: SheetMicrocycleInput[]
  includeCatalog?: boolean
}

export interface SheetsDatabaseSnapshot {
  source: 'google-sheets'
  fetchedAt: string
  spreadsheetId: string
  spreadsheetUrl: string
  catalog: TrainingCatalogTables
  operational: {
    coaches: SheetCoachInput[]
    teams: SheetTeamInput[]
    players: SheetPlayerInput[]
    teamPlayers: SheetTeamPlayerInput[]
    seasons: SheetSeasonInput[]
    reviews: SheetWeeklyReviewInput[]
    microcycles: SheetMicrocycleInput[]
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

const SHEET_TITLES = {
  macrocycles: 'macrocycles',
  mesocycles: 'mesocycles',
  mesocycleSessions: 'mesocycle_sessions',
  trainingBlocks: 'training_blocks',
  blockExercises: 'block_exercises',
  sessionVariants: 'session_variants',
  exercises: 'exercises',
  homeSessions: 'home_sessions',
  tests: 'tests',
  coaches: 'coaches',
  teams: 'teams',
  players: 'players',
  teamPlayers: 'team_players',
  seasons: 'seasons',
  weeklyReviews: 'weekly_reviews',
  microcycles: 'microcycles',
} as const

type SheetKey = keyof typeof SHEET_TITLES

const LEGACY_SHEET_TITLES: Record<SheetKey, readonly string[]> = {
  macrocycles: ['plans', 'plantillas_macrociclo'],
  mesocycles: ['plan_phases', 'mesociclos'],
  mesocycleSessions: ['phase_sessions', 'sesiones_planificadas'],
  trainingBlocks: ['session_blocks', 'bloques_sesion'],
  blockExercises: ['ejercicios_bloque'],
  sessionVariants: ['variantes_sesion'],
  exercises: ['ejercicios'],
  homeSessions: ['sesiones_transitorias'],
  tests: ['evaluaciones'],
  coaches: ['entrenadores'],
  teams: ['equipos'],
  players: ['jugadores'],
  teamPlayers: ['equipo_jugadores'],
  seasons: ['macrociclos'],
  weeklyReviews: ['revisiones_microciclo'],
  microcycles: ['microciclos'],
}

function findExistingSheetTitle(
  key: SheetKey,
  existingTitles: ReadonlySet<string>,
): string | undefined {
  return [SHEET_TITLES[key], ...LEGACY_SHEET_TITLES[key]].find((title) =>
    existingTitles.has(title),
  )
}

function getSheetKeyForTitle(title: string): SheetKey | undefined {
  return (Object.keys(SHEET_TITLES) as SheetKey[]).find(
    (key) => SHEET_TITLES[key] === title,
  )
}

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
    operational?.coaches !== undefined ? operational.coaches : []
  const activeTeams =
    operational?.teams !== undefined ? operational.teams : []
  const activePlayers =
    operational?.players !== undefined ? operational.players : []
  const activeTeamPlayers =
    operational?.teamPlayers !== undefined ? operational.teamPlayers : []
  const activeSeasons =
    operational?.seasons !== undefined ? operational.seasons : []
  const activeReviews =
    operational?.reviews !== undefined ? operational.reviews : []
  const activeMicrocycles =
    operational?.microcycles !== undefined ? operational.microcycles : []

  return [
    {
      title: SHEET_TITLES.macrocycles,
      headers: [
        'id',
        'name',
        'age_category',
        'total_weeks',
      ],
      rows: macrocycles.map((item) => [
        item.id,
        item.name,
        item.ageCategory,
        item.totalWeeks,
      ]),
      rgbColor: { red: 0.23, green: 0.51, blue: 0.96 },
    },
    {
      title: SHEET_TITLES.mesocycles,
      headers: [
        'id',
        'macrocycle_id',
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
      rows: mesocycles.map((item) => [
        item.id,
        item.macrocycleId,
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
      title: SHEET_TITLES.mesocycleSessions,
      headers: [
        'id',
        'mesocycle_id',
        'day',
        'order',
        'name',
        'focus',
        'total_minutes',
      ],
      rows: mesocycleSessions.map((item) => [
        item.id,
        item.mesocycleId,
        item.day,
        item.order,
        item.name,
        item.focus,
        item.totalMinutes,
      ]),
      rgbColor: { red: 0.96, green: 0.62, blue: 0.04 },
    },
    {
      title: SHEET_TITLES.sessionVariants,
      headers: [
        'id',
        'mesocycle_session_id',
        'variant_code',
        'name',
        'focus',
        'week_start',
        'week_end',
      ],
      rows: sessionVariants.map((item) => [
        item.id,
        item.mesocycleSessionId,
        item.variantCode,
        item.name,
        item.focus,
        item.weekStart,
        item.weekEnd,
      ]),
      rgbColor: { red: 0.17, green: 0.55, blue: 0.68 },
    },
    {
      title: SHEET_TITLES.trainingBlocks,
      headers: ['id', 'mesocycle_session_id', 'block_order', 'name', 'minutes', 'format'],
      rows: trainingBlocks.map((item) => [
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
      title: SHEET_TITLES.blockExercises,
      headers: [
        'id',
        'block_id',
        'exercise_id',
        'item_order',
        'station_label',
        'dose_formacion',
        'dose_liga',
        'variant_id',
      ],
      rows: blockExercises.map((item) => [
        item.id,
        item.blockId,
        item.exerciseId,
        item.itemOrder,
        item.stationLabel,
        item.doseFormacion,
        item.doseLiga,
        item.variantId || '',
      ]),
      rgbColor: { red: 0.94, green: 0.27, blue: 0.27 },
    },
    {
      title: SHEET_TITLES.exercises,
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
      title: SHEET_TITLES.homeSessions,
      headers: [
        'id',
        'macrocycle_id',
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
        item.macrocycleId,
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
      title: SHEET_TITLES.tests,
      headers: [
        'id',
        'macrocycle_id',
        'test_order',
        'name',
        'protocol',
        'milestone_weeks',
      ],
      rows: tests.map((item) => [
        item.id,
        item.macrocycleId,
        item.testOrder,
        item.name,
        item.protocol,
        item.milestoneWeeks.join(' | '),
      ]),
      rgbColor: { red: 0.39, green: 0.45, blue: 0.55 },
    },
    {
      title: SHEET_TITLES.coaches,
      headers: ['id', 'name', 'role'],
      rows: activeCoaches.map((coach) => [coach.id, coach.name, coach.role]),
      rgbColor: { red: 0.28, green: 0.33, blue: 0.41 },
    },
    {
      title: SHEET_TITLES.teams,
      headers: [
        'id',
        'coach_id',
        'name',
        'club',
        'status',
      ],
      rows: activeTeams.map((team) => [
        team.id,
        team.coachId,
        team.name,
        team.club,
        team.status === 'archived' ? 'archived' : 'active',
      ]),
      rgbColor: { red: 0.13, green: 0.53, blue: 0.38 },
    },
    {
      title: SHEET_TITLES.players,
      headers: ['id', 'name'],
      rows: activePlayers.map((player) => [player.id, player.name]),
      rgbColor: { red: 0.72, green: 0.35, blue: 0.18 },
    },
    {
      title: SHEET_TITLES.teamPlayers,
      headers: ['id', 'team_id', 'player_id', 'status', 'joined_at', 'left_at'],
      rows: activeTeamPlayers.map((membership) => [
        membership.id, membership.teamId, membership.playerId, membership.status,
        membership.joinedAt, membership.leftAt || '',
      ]),
      rgbColor: { red: 0.72, green: 0.35, blue: 0.18 },
    },
    {
      title: SHEET_TITLES.seasons,
      headers: [
        'id',
        'team_id',
        'macrocycle_id',
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
        const macrocycleId = season.macrocycleId
        return [
          season.id,
          season.teamId,
          macrocycleId,
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
      title: SHEET_TITLES.weeklyReviews,
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
    {
      title: SHEET_TITLES.microcycles,
      headers: [
        'id',
        'season_id',
        'macrocycle_id',
        'mesocycle_id',
        'week_number',
        'week_start',
        'week_end',
        'objective',
        'load_index',
        'status',
      ],
      rows: activeMicrocycles.map((item) => [
        item.id,
        item.seasonId,
        item.macrocycleId,
        item.mesocycleId,
        item.weekNumber,
        item.weekStart,
        item.weekEnd,
        item.objective,
        item.loadIndex,
        item.status,
      ]),
      rgbColor: { red: 0.18, green: 0.56, blue: 0.42 },
    },
  ]
}

const OPERATIONAL_TABLE_TITLES = new Set([
  SHEET_TITLES.coaches,
  SHEET_TITLES.teams,
  SHEET_TITLES.players,
  SHEET_TITLES.teamPlayers,
  SHEET_TITLES.seasons,
  SHEET_TITLES.weeklyReviews,
  SHEET_TITLES.microcycles,
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

function normalizeMacrocycleId(value: string): string {
  return value.replace(/^PLN(?=\d{4}$)/, 'MAC')
}

function normalizeMesocycleId(value: string): string {
  const normalized = value.replace(/^FAS(?=\d{4}$)/, 'MES')
  const legacyMatch = normalized.match(/^MES01(\d{2})$/)
  const legacyNumber = legacyMatch ? Number(legacyMatch[1]) : 0

  // The live catalog uses MES0001..MES0007. Keep the former MES0101..MES0107
  // range readable only as a compatibility fallback while the sheet is migrated.
  return legacyNumber >= 1 && legacyNumber <= 7
    ? `MES00${legacyMatch?.[1]}`
    : normalized
}

function normalizeTrainingBlockId(value: string): string {
  const legacyMatch = value.match(/^BLK01(\d{2})$/)
  const legacyNumber = legacyMatch ? Number(legacyMatch[1]) : 0

  // The live catalog uses BLK0001..BLK0063. Do not synthesize missing blocks;
  // this only normalizes an old persisted key when its row is actually read.
  return legacyNumber >= 1 && legacyNumber <= 63
    ? `BLK00${legacyMatch?.[1]}`
    : value
}

function normalizeMicrocycleId(value: string): string {
  const legacyMatch = value.match(/^MIC(\d{4})$/)
  return legacyMatch ? `MIC${legacyMatch[1].padStart(6, '0')}` : value
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

function parseMicrocycleStatus(raw: string): MicrocycleRecord['status'] {
  if (raw === 'active' || raw === 'completed') return raw
  return 'planned'
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
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}`
  const authHeaders = { Authorization: `Bearer ${token}` }
  const metadataRes = await fetch(baseUrl, { headers: authHeaders })
  const metadata = (await metadataRes.json()) as SpreadsheetMetadata
  if (!metadataRes.ok) {
    throw new Error(
      metadata.error?.message ||
        `Unable to read spreadsheet (${metadataRes.status}).`,
    )
  }

  const existingTitles = new Set(
    (metadata.sheets || [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  )
  const sheetKeys = Object.keys(SHEET_TITLES) as SheetKey[]
  const rangesToRead = sheetKeys.flatMap((key) => {
    const title = findExistingSheetTitle(key, existingTitles)
    return title ? [{ key, title }] : []
  })

  const params = new URLSearchParams()
  for (const range of rangesToRead) {
    params.append('ranges', `${range.title}!A2:Z500`)
  }

  const url = `${baseUrl}/values:batchGet?${params.toString()}`
  const res = await fetch(url, {
    headers: authHeaders,
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
  rangesToRead.forEach((range, idx) => {
    const rawValues = ranges[idx]?.values || []
    const nonEmptyRows = rawValues.filter((row) =>
      row.some((cell) => typeof cell === 'string' && cell.trim().length > 0),
    )
    rowsByTab.set(SHEET_TITLES[range.key], nonEmptyRows)
  })

  const macrocycleRows = rowsByTab.get(SHEET_TITLES.macrocycles) || []
  const parsedMacrocycles: MacrocycleRecord[] = macrocycleRows.length
    ? macrocycleRows.map((row) => ({
        id: normalizeMacrocycleId(cellString(row, 0)),
        name: cellString(row, 1),
        ageCategory: parseAgeCategory(cellString(row, 2)),
        totalWeeks: cellNumber(row, 3, 18),
      }))
    : []

  const mesocycleRows = rowsByTab.get(SHEET_TITLES.mesocycles) || []
  const parsedMesocycles: MesocycleRecord[] = mesocycleRows.length
    ? mesocycleRows.map((row) => ({
        id: normalizeMesocycleId(cellString(row, 0)),
        macrocycleId: normalizeMacrocycleId(cellString(row, 1)),
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
    : []

  const mesocycleSessionRows = rowsByTab.get(SHEET_TITLES.mesocycleSessions) || []
  const parsedMesocycleSessions: MesocycleSessionRecord[] = mesocycleSessionRows.length
    ? mesocycleSessionRows.map((row) => ({
        id: cellString(row, 0),
        mesocycleId: normalizeMesocycleId(cellString(row, 1)),
        day: parseTrainingDay(cellString(row, 2)),
        order: cellNumber(row, 3, 1),
        name: cellString(row, 4),
        focus: cellString(row, 5),
        totalMinutes: cellNumber(row, 6, 40),
      }))
    : []

  const variantRows = rowsByTab.get(SHEET_TITLES.sessionVariants) || []
  const parsedSheetVariants: SessionVariantRecord[] = variantRows.length
    ? variantRows.map((row) => {
        const mesocycleSessionId = cellString(row, 1)
        const variantCode = cellString(row, 2) === 'B' ? 'B' : 'A'
        return {
          id: cellString(row, 0),
          mesocycleSessionId,
          variantCode,
          name: cellString(row, 3),
          focus: cellString(row, 4),
          weekStart: cellNumber(row, 5, 1),
          weekEnd: cellNumber(row, 6, 45),
        }
      })
    : []
  const parsedVariantKeys = new Set(
    parsedSheetVariants.map(
      (variant) => `${variant.mesocycleSessionId}:${variant.variantCode}`,
    ),
  )
  const parsedVariants: SessionVariantRecord[] = [
    ...parsedSheetVariants,
    ...sessionVariants.filter(
      (variant) =>
        !parsedVariantKeys.has(
          `${variant.mesocycleSessionId}:${variant.variantCode}`,
        ),
    ),
  ]

  const trainingBlockRows = rowsByTab.get(SHEET_TITLES.trainingBlocks) || []
  const parsedTrainingBlocks: TrainingBlockRecord[] = trainingBlockRows.length
    ? trainingBlockRows.map((row) => ({
        id: normalizeTrainingBlockId(cellString(row, 0)),
        sessionId: cellString(row, 1),
        blockOrder: cellNumber(row, 2, 1),
        name: cellString(row, 3),
        minutes: cellNumber(row, 4, 8),
        format: cellString(row, 5),
      }))
    : []

  const blockExerciseRows = rowsByTab.get(SHEET_TITLES.blockExercises) || []
  const parsedSheetBlockExercises: BlockExerciseRecord[] = blockExerciseRows.length
    ? blockExerciseRows.map((row) => ({
        id: cellString(row, 0),
        blockId: normalizeTrainingBlockId(cellString(row, 1)),
        exerciseId: cellString(row, 2),
        itemOrder: cellNumber(row, 3, 1),
        stationLabel: cellString(row, 4),
        doseFormacion: cellString(row, 5),
        doseLiga: cellString(row, 6, cellString(row, 5)),
        variantId:
          cellString(row, 7) ||
          blockExercises.find((item) => item.id === cellString(row, 0))?.variantId ||
          parsedVariants.find((variant) => {
            const block = parsedTrainingBlocks.find(
              (candidate) => candidate.id === cellString(row, 1),
            )
            return (
              variant.variantCode === 'A' &&
              block?.sessionId === variant.mesocycleSessionId
            )
          })?.id,
      }))
    : []
  const parsedBlockExerciseIds = new Set(
    parsedSheetBlockExercises.map((item) => item.id),
  )
  const migratedVariantExercises = parsedVariants
    .filter((variant) => variant.variantCode === 'B')
    .flatMap((variant) => {
      const defaultVariant = sessionVariants.find(
        (candidate) =>
          candidate.mesocycleSessionId === variant.mesocycleSessionId &&
          candidate.variantCode === 'B',
      )
      const assignedBlocks = new Set(
        parsedSheetBlockExercises
          .filter((item) => item.variantId === variant.id)
          .map((item) => item.blockId),
      )
      return parsedTrainingBlocks
        .filter((block) => block.sessionId === variant.mesocycleSessionId)
        .filter((block) => !assignedBlocks.has(block.id))
        .flatMap((block) => {
          const bibleItems = blockExercises.filter(
            (item) => item.blockId === block.id && item.variantId === defaultVariant?.id,
          )
          const baseItems = parsedSheetBlockExercises.filter(
            (item) => item.blockId === block.id,
          )
          const sourceItems = bibleItems.length ? bibleItems : baseItems
          return sourceItems.map((item) => ({
            ...item,
            id: bibleItems.length ? item.id : `${item.id}-${variant.id}`,
            variantId: variant.id,
          }))
        })
    })
    .filter((item) => !parsedBlockExerciseIds.has(item.id))
  const parsedBlockExercises: BlockExerciseRecord[] = [
    ...parsedSheetBlockExercises,
    ...migratedVariantExercises,
  ]

  const exerciseRows = rowsByTab.get(SHEET_TITLES.exercises) || []
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
    : []

  const homeRows = rowsByTab.get(SHEET_TITLES.homeSessions) || []
  const parsedHomeSessions: HomeSessionRecord[] = homeRows.length
    ? homeRows.map((row) => ({
        id: cellString(row, 0),
        macrocycleId: normalizeMacrocycleId(cellString(row, 1)),
        code: parseHomeCode(cellString(row, 2)),
        name: cellString(row, 3),
        minutes: cellNumber(row, 4, 20),
        format: cellString(row, 5),
        exerciseId: cellString(row, 6),
        doseHoliday1: cellString(row, 7),
        doseHoliday2: cellString(row, 8),
      }))
    : []

  const testRows = rowsByTab.get(SHEET_TITLES.tests) || []
  const parsedTests: TestRecord[] = testRows.length
    ? testRows.map((row) => ({
        id: cellString(row, 0),
        macrocycleId: normalizeMacrocycleId(cellString(row, 1)),
        testOrder: cellNumber(row, 2, 1),
        name: cellString(row, 3),
        protocol: cellString(row, 4),
        milestoneWeeks: splitPipeList(cellString(row, 5)),
      }))
    : []

  const coachRows = rowsByTab.get(SHEET_TITLES.coaches) || []
  const parsedCoaches: SheetCoachInput[] = coachRows.length
    ? coachRows.map((row) => ({
        id: cellString(row, 0, 'ENT0001'),
        name: cellString(row, 1, 'Nicolás'),
        role: cellString(row, 2) === 'admin' ? 'admin' : 'coach',
      }))
    : []

  const teamRows = rowsByTab.get(SHEET_TITLES.teams) || []
  const parsedTeams: SheetTeamInput[] = teamRows.map((row) => {
    const col4 = cellString(row, 4)
    const hasStatusCol = col4 === 'active' || col4 === 'archived'
    const status: 'active' | 'archived' =
      col4 === 'archived' ? 'archived' : 'active'
    return {
      id: cellString(row, 0),
      coachId: cellString(row, 1, 'ENT0001'),
      name: cellString(row, 2),
      club: cellString(row, 3),
      status,
    }
  })

  const playerRows = rowsByTab.get(SHEET_TITLES.players) || []
  const parsedPlayers: SheetPlayerInput[] = playerRows.map((row) => ({
    id: cellString(row, 0), name: cellString(row, 1),
  })).filter((player) => player.id && player.name)
  const membershipRows = rowsByTab.get(SHEET_TITLES.teamPlayers) || []
  const parsedTeamPlayers: SheetTeamPlayerInput[] = membershipRows.map((row) => ({
    id: cellString(row, 0), teamId: cellString(row, 1), playerId: cellString(row, 2),
    status: cellString(row, 3) === 'inactive' ? 'inactive' : 'active',
    joinedAt: cellString(row, 4), leftAt: cellString(row, 5) || null,
  })).filter((membership) => membership.id && membership.teamId && membership.playerId)

  // Legacy `equipos.players` data is read once and projected into the normalized
  // tables when the new tabs have not yet been written to the spreadsheet.
  const legacyPlayersByTeam = teamRows.map((row, index) => ({
    teamId: parsedTeams[index]?.id || '',
    players: parsePlayersCell(
      cellString(row, 4) === 'active' || cellString(row, 4) === 'archived'
        ? cellString(row, 6)
        : cellString(row, 5),
    ),
  }))
  const legacyPlayers = legacyPlayersByTeam.flatMap((item) => item.players)
  // Mixed migrations are expected while Sheets is being upgraded. Merge both
  // representations and let the normalized table win for duplicate IDs.
  const uniquePlayers = Array.from(
    new Map([...legacyPlayers, ...parsedPlayers].map((player) => [player.id, player])).values(),
  )
  const legacyTeamPlayers = legacyPlayersByTeam.flatMap((item, teamIndex) =>
    item.players.map((player, playerIndex) => ({ id: `EJU${String(teamIndex * 1000 + playerIndex + 1).padStart(4, '0')}`, teamId: item.teamId, playerId: player.id, status: 'active' as const, joinedAt: '', leftAt: null })),
  )
  const validPlayerIds = new Set(uniquePlayers.map((player) => player.id))
  const validTeamIds = new Set(parsedTeams.map((team) => team.id))
  const migratedTeamPlayers = Array.from(
    new Map(
      [...legacyTeamPlayers, ...parsedTeamPlayers].map((membership) => [
        `${membership.teamId}:${membership.playerId}`,
        membership,
      ]),
    ).values(),
  ).filter((membership) => validPlayerIds.has(membership.playerId) && validTeamIds.has(membership.teamId))

  const seasonRows = rowsByTab.get(SHEET_TITLES.seasons) || []
  const parsedSeasons: SheetSeasonInput[] = seasonRows.map((row) => {
    const ageCategory = parseAgeCategory(cellString(row, 5))
    return {
      id: cellString(row, 0),
      teamId: cellString(row, 1),
      macrocycleId: normalizeMacrocycleId(cellString(row, 2)),
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

  const reviewRows = rowsByTab.get(SHEET_TITLES.weeklyReviews) || []
  const parsedReviews: SheetWeeklyReviewInput[] = reviewRows.map((row) => ({
    id: cellString(row, 0),
    seasonId: cellString(row, 1),
    weekStart: cellString(row, 2),
    text: cellString(row, 3),
    createdAt: cellString(row, 4),
  }))

  const microcycleRows = rowsByTab.get(SHEET_TITLES.microcycles) || []
  const parsedMicrocycles: SheetMicrocycleInput[] = microcycleRows.map((row) => ({
    id: normalizeMicrocycleId(cellString(row, 0)),
    seasonId: cellString(row, 1),
    macrocycleId: normalizeMacrocycleId(cellString(row, 2)),
    mesocycleId: normalizeMesocycleId(cellString(row, 3)),
    weekNumber: cellNumber(row, 4, 1),
    weekStart: cellString(row, 5),
    weekEnd: cellString(row, 6),
    objective: cellString(row, 7),
    loadIndex: cellNumber(row, 8, 0),
    status: parseMicrocycleStatus(cellString(row, 9)),
  }))

  const snapshot: SheetsDatabaseSnapshot = {
    source: 'google-sheets',
    fetchedAt: new Date().toISOString(),
    spreadsheetId: credentials.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${credentials.spreadsheetId}/edit`,
    catalog: {
      macrocycles: parsedMacrocycles,
      mesocycles: parsedMesocycles,
      mesocycleSessions: parsedMesocycleSessions,
      sessionVariants: parsedVariants,
      trainingBlocks: parsedTrainingBlocks,
      blockExercises: parsedBlockExercises,
      exercises: parsedExercises,
      homeSessions: parsedHomeSessions,
      tests: parsedTests,
    },
    operational: {
      coaches: parsedCoaches,
      teams: parsedTeams,
      players: uniquePlayers,
      teamPlayers: migratedTeamPlayers,
      seasons: parsedSeasons,
      reviews: parsedReviews,
      microcycles: parsedMicrocycles,
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
      operational?.players ||
      operational?.teamPlayers ||
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

  const renameRequests: Array<Record<string, unknown>> = []
  for (const table of allTables) {
    if (existingByTitle.has(table.title)) continue
    const tableKey = getSheetKeyForTitle(table.title)
    if (!tableKey) continue
    const legacyTitle = findExistingSheetTitle(tableKey, new Set(existingByTitle.keys()))
    const legacySheetId = legacyTitle ? existingByTitle.get(legacyTitle) : undefined
    if (legacyTitle && typeof legacySheetId === 'number') {
      renameRequests.push({
        updateSheetProperties: {
          properties: { sheetId: legacySheetId, title: table.title },
          fields: 'title',
        },
      })
      existingByTitle.delete(legacyTitle)
      existingByTitle.set(table.title, legacySheetId)
    }
  }

  if (renameRequests.length > 0) {
    const renameRes = await fetch(`${baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ requests: renameRequests }),
    })
    if (!renameRes.ok) {
      const errBody = (await renameRes.json()) as SpreadsheetMetadata
      throw new Error(
        errBody.error?.message || 'Failed to rename legacy sheets.',
      )
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
