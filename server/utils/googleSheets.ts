import { createSign } from 'node:crypto'
import { sheetDataRange } from './sheetRanges.ts'
import {
  defaultTrainingCatalog,
  blockExercises,
  exercises,
  homeSessions,
  mesocycleSessions,
  mesocycles,
  macrocycles,
  trainingBlocks,
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
  type TestRecord,
  type TrainingCatalogTables,
  type TrainingDay,
} from '../../app/shared/training.ts'
import type { SeasonSessionRecord } from '../../app/shared/seasonSessions.ts'

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
  frequency: Frequency
  holidayWeeks?: string[]
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
export type SheetSeasonSessionInput = SeasonSessionRecord

export interface OperationalTablesPayload {
  coaches?: SheetCoachInput[]
  teams?: SheetTeamInput[]
  players?: SheetPlayerInput[]
  teamPlayers?: SheetTeamPlayerInput[]
  seasons?: SheetSeasonInput[]
  reviews?: SheetWeeklyReviewInput[]
  microcycles?: SheetMicrocycleInput[]
  seasonSessions?: SheetSeasonSessionInput[]
  includeCatalog?: boolean
  catalog?: TrainingCatalogTables
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
    seasonSessions: SheetSeasonSessionInput[]
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
  gridProperties?: {
    rowCount?: number
    columnCount?: number
  }
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
  seasonSessions: 'season_sessions',
} as const

type SheetKey = keyof typeof SHEET_TITLES

function findExistingSheetTitle(
  key: SheetKey,
  existingTitles: ReadonlySet<string>,
): string | undefined {
  const title = SHEET_TITLES[key]
  return existingTitles.has(title) ? title : undefined
}


function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, '\n').trim()
}

async function readJsonBody<T = unknown>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T
  return (await res.json().catch(() => ({}))) as T
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

  const data = (await readJsonBody(response)) as GoogleTokenResponse
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
  const catalog = operational?.catalog ?? defaultTrainingCatalog
  const { macrocycles, mesocycles, mesocycleSessions, trainingBlocks, blockExercises, exercises, homeSessions, tests } = catalog
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
  const activeSeasonSessions =
    operational?.seasonSessions !== undefined ? operational.seasonSessions : []

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
        'week_doses_json',
      ],
      rows: blockExercises.map((item) => [
        item.id,
        item.blockId,
        item.exerciseId,
        item.itemOrder,
        item.stationLabel,
        item.doseFormacion,
        item.doseLiga,
        item.weekDoses ? JSON.stringify(item.weekDoses) : '',
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
        'movement_level',
        'movement_area',
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
        item.movementLevel ?? '',
        item.movementArea ?? '',
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
        'week_numbers_json',
        'week_doses_json',
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
        item.weekNumbers ? JSON.stringify(item.weekNumbers) : '',
        item.weekDoses ? JSON.stringify(item.weekDoses) : '',
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
        'context',
        'status',
        'holiday_weeks',
      ],
      rows: activeSeasons.map((season) => {
        const macrocycleId = season.macrocycleId ?? ''
        return [
          season.id,
          season.teamId,
          macrocycleId,
          season.name,
          season.category,
          season.ageCategory,
          season.competitiveLevel,
          season.frequency,
          season.startsAt,
          season.endsAt,
          season.context,
          season.status,
          (season.holidayWeeks || []).join(', '),
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
        'sessions_done',
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
        item.sessionsDone,
      ]),
      rgbColor: { red: 0.18, green: 0.56, blue: 0.42 },
    },
    {
      title: SHEET_TITLES.seasonSessions,
      headers: [
        'season_id',
        'session_number',
        'week_number',
        'day',
        'mesocycle_id',
        'session_id',
      ],
      rows: activeSeasonSessions.map((item) => [
        item.seasonId,
        item.sessionNumber,
        item.weekNumber,
        item.day,
        item.mesocycleId,
        item.sessionId,
      ]),
      rgbColor: { red: 0.45, green: 0.3, blue: 0.7 },
    },
  ]
}

const OPERATIONAL_KEY_TITLES: ReadonlyArray<readonly [keyof OperationalTablesPayload, string]> = [
  ['coaches', SHEET_TITLES.coaches],
  ['teams', SHEET_TITLES.teams],
  ['players', SHEET_TITLES.players],
  ['teamPlayers', SHEET_TITLES.teamPlayers],
  ['seasons', SHEET_TITLES.seasons],
  ['reviews', SHEET_TITLES.weeklyReviews],
  ['microcycles', SHEET_TITLES.microcycles],
  ['seasonSessions', SHEET_TITLES.seasonSessions],
]

const OPERATIONAL_TABLE_TITLES = new Set([
  SHEET_TITLES.coaches,
  SHEET_TITLES.teams,
  SHEET_TITLES.players,
  SHEET_TITLES.teamPlayers,
  SHEET_TITLES.seasons,
  SHEET_TITLES.weeklyReviews,
  SHEET_TITLES.microcycles,
  SHEET_TITLES.seasonSessions,
])

const CATALOG_TABLE_TITLES = new Set([
  SHEET_TITLES.macrocycles,
  SHEET_TITLES.mesocycles,
  SHEET_TITLES.mesocycleSessions,
  SHEET_TITLES.trainingBlocks,
  SHEET_TITLES.blockExercises,
  SHEET_TITLES.exercises,
  SHEET_TITLES.homeSessions,
  SHEET_TITLES.tests,
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
  return value
}

function normalizeMesocycleId(value: string): string {
  return value
}

function normalizeTrainingBlockId(value: string): string {
  return value
}

function normalizeMicrocycleId(value: string): string {
  const legacyMatch = value.match(/^MIC(\d{4})$/)
  return legacyMatch ? `MIC${legacyMatch[1].padStart(6, '0')}` : value
}

function parseFrequency(value: number): Frequency {
  return value === 2 || value === 3 ? value : 1
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

function warnInvalidWeekCell(column: string, raw: string): void {
  console.warn(`[sheets-db] Celda ignorada en ${column}: ${raw.slice(0, 80)}`)
}

function parseWeekDoses(raw: string): Record<number, string> | undefined {
  if (!raw.trim()) return undefined
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    warnInvalidWeekCell('week_doses_json', raw)
    return undefined
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warnInvalidWeekCell('week_doses_json', raw)
    return undefined
  }
  const entries = Object.entries(value).filter(([week, dose]) =>
    /^\d+$/.test(week) && typeof dose === 'string' && dose.trim().length > 0,
  )
  return entries.length ? Object.fromEntries(entries.map(([week, dose]) => [Number(week), dose as string])) : undefined
}

function parseWeekNumbers(raw: string): number[] | undefined {
  if (!raw.trim()) return undefined
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    warnInvalidWeekCell('week_numbers_json', raw)
    return undefined
  }
  // A single week typed by hand in the sheet (e.g. "19") is read as [19].
  const list = typeof value === 'number' ? [value] : value
  if (!Array.isArray(list)) {
    warnInvalidWeekCell('week_numbers_json', raw)
    return undefined
  }
  const weeks = list.filter((week): week is number => Number.isInteger(week) && week > 0)
  return weeks.length ? weeks : undefined
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
  if (raw === 'assessment') return 'assessment'
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

function parsePlayersCell(raw: string, teamOffset = 0): SheetPlayerInput[] {
  return splitPipeList(raw).map((entry, index) => {
    const colonIdx = entry.indexOf(':')
    if (colonIdx > 0) {
      const id = entry.slice(0, colonIdx).trim()
      const name = entry.slice(colonIdx + 1).trim()
      return {
        id: id || `JUG${String(teamOffset + index + 1).padStart(4, '0')}`,
        name: name || entry,
      }
    }
    return {
      id: `JUG${String(teamOffset + index + 1).padStart(4, '0')}`,
      name: entry,
    }
  })
}

async function isSheetEmpty(
  baseUrl: string,
  authHeaders: Record<string, string>,
  title: string,
): Promise<boolean> {
  const res = await fetch(`${baseUrl}/values/${encodeURIComponent(title)}!A1:Z`, { headers: authHeaders })
  if (!res.ok) throw new Error(`No se pudo leer la pestaña ${title} (${res.status}).`)
  const body = await readJsonBody<{ values?: unknown[][] }>(res)
  return !body.values?.length
}

async function fetchRowsByTab(
  credentials: GoogleSheetsCredentials,
): Promise<Map<string, string[][]>> {
  const token = await getGoogleAccessToken(credentials)
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}`
  const authHeaders = { Authorization: `Bearer ${token}` }
  const metadataRes = await fetch(baseUrl, { headers: authHeaders })
  const metadata = (await readJsonBody(metadataRes)) as SpreadsheetMetadata
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
    params.append('ranges', sheetDataRange(range.title))
  }

  const url = `${baseUrl}/values:batchGet?${params.toString()}`
  const res = await fetch(url, {
    headers: authHeaders,
  })

  const data = (await readJsonBody(res)) as BatchGetResponse
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

  return rowsByTab
}

function parseCatalogTables(rowsByTab: Map<string, string[][]>): TrainingCatalogTables {
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
        weekDoses: parseWeekDoses(cellString(row, 7)),
      }))
    : []
  const parsedBlockExercises: BlockExerciseRecord[] = parsedSheetBlockExercises

  const exerciseRows = rowsByTab.get(SHEET_TITLES.exercises) || []
  const hasMovementClassification = exerciseRows.some(row => row.length >= 13)
  const parsedExercises: ExerciseRecord[] = exerciseRows.length
    ? exerciseRows.map((row) => ({
        id: cellString(row, 0),
        slug: cellString(row, 1),
        name: cellString(row, 2),
        category: cellString(row, 3),
        focus: cellString(row, 4),
        movementLevel: hasMovementClassification ? cellString(row, 5) : '',
        movementArea: hasMovementClassification ? cellString(row, 6) : '',
        material: cellString(row, hasMovementClassification ? 7 : 5),
        how: splitPipeList(cellString(row, hasMovementClassification ? 8 : 6)),
        cue: cellString(row, hasMovementClassification ? 9 : 7),
        errors: splitPipeList(cellString(row, hasMovementClassification ? 10 : 8)),
        easier: cellString(row, hasMovementClassification ? 11 : 9),
        harder: cellString(row, hasMovementClassification ? 12 : 10),
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
        weekNumbers: parseWeekNumbers(cellString(row, 9)),
        weekDoses: parseWeekDoses(cellString(row, 10)),
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

  return {
    macrocycles: parsedMacrocycles,
    mesocycles: parsedMesocycles,
    mesocycleSessions: parsedMesocycleSessions,
    trainingBlocks: parsedTrainingBlocks,
    blockExercises: parsedBlockExercises,
    exercises: parsedExercises,
    homeSessions: parsedHomeSessions,
    tests: parsedTests,
  }
}

function parseOperationalTables(rowsByTab: Map<string, string[][]>): SheetsDatabaseSnapshot['operational'] {
  const coachRows = rowsByTab.get(SHEET_TITLES.coaches) || []
  const parsedCoaches: SheetCoachInput[] = coachRows.length
    ? coachRows.map((row) => ({
        id: cellString(row, 0, 'ENT0001'),
        name: cellString(row, 1, 'Entrenador'),
        role: cellString(row, 2) === 'admin' ? 'admin' : 'coach',
      }))
    : []

  const teamRows = rowsByTab.get(SHEET_TITLES.teams) || []
  const parsedTeams: SheetTeamInput[] = teamRows.map((row) => {
    const col4 = cellString(row, 4)
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
      index * 1000,
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
      frequency: parseFrequency(cellNumber(row, 7, 1)),
      context: cellString(row, 10),
      status: cellString(row, 11) === 'closed' ? 'closed' : 'active',
      holidayWeeks: splitCommaStrings(cellString(row, 12)),
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
    sessionsDone: cellNumber(row, 10, 0),
  }))

  const seasonSessionRows = rowsByTab.get(SHEET_TITLES.seasonSessions) || []
  const parsedSeasonSessions: SheetSeasonSessionInput[] = seasonSessionRows.map((row) => ({
    seasonId: cellString(row, 0),
    sessionNumber: cellNumber(row, 1, 0),
    weekNumber: cellNumber(row, 2, 1),
    day: parseTrainingDay(cellString(row, 3)),
    mesocycleId: normalizeMesocycleId(cellString(row, 4)),
    sessionId: cellString(row, 5),
  }))

  return {
    coaches: parsedCoaches,
    teams: parsedTeams,
    players: uniquePlayers,
    teamPlayers: migratedTeamPlayers,
    seasons: parsedSeasons,
    reviews: parsedReviews,
    microcycles: parsedMicrocycles,
    seasonSessions: parsedSeasonSessions,
  }
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

  const rowsByTab = await fetchRowsByTab(credentials)
  const snapshot: SheetsDatabaseSnapshot = {
    source: 'google-sheets',
    fetchedAt: new Date().toISOString(),
    spreadsheetId: credentials.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${credentials.spreadsheetId}/edit`,
    catalog: parseCatalogTables(rowsByTab),
    operational: parseOperationalTables(rowsByTab),
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
  options?: { replaceCatalog?: boolean },
): Promise<SyncSheetsResult> {
  const token = await getGoogleAccessToken(credentials)
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}`
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const metaRes = await fetch(baseUrl, { headers: authHeaders })
  const metadata = (await readJsonBody(metaRes)) as SpreadsheetMetadata
  if (!metaRes.ok) {
    throw new Error(
      metadata.error?.message ||
        `Unable to read spreadsheet (${metaRes.status}).`,
    )
  }

  const includeCatalog =
    operational?.includeCatalog ??
    !(
      operational?.coaches ||
      operational?.teams ||
      operational?.players ||
      operational?.teamPlayers ||
      operational?.seasons ||
      operational?.reviews ||
      operational?.microcycles ||
      operational?.seasonSessions
    )
  if (includeCatalog && !operational?.catalog) {
    throw new Error('Para reemplazar el catálogo hay que enviar una instantánea completa del catálogo.')
  }
  if (includeCatalog && !options?.replaceCatalog) {
    throw new Error('La sustitución del catálogo solo se permite desde la herramienta de mantenimiento local.')
  }
  if (operational?.catalog && !includeCatalog) {
    throw new Error('El catálogo solo puede reemplazarse con includeCatalog=true.')
  }
  if (operational?.catalog && [
    operational.coaches, operational.teams, operational.players, operational.teamPlayers,
    operational.seasons, operational.reviews, operational.microcycles, operational.seasonSessions,
  ].some(value => value !== undefined)) {
    throw new Error('La sustitución del catálogo debe ejecutarse separada de las tablas operativas.')
  }
  const catalogOnly = includeCatalog && operational?.catalog !== undefined && options?.replaceCatalog === true
  const suppliedOperationalTitles = new Set(
    OPERATIONAL_KEY_TITLES
      .filter(([key]) => operational?.[key] !== undefined)
      .map(([, title]) => title),
  )
  const selectedTableTitles = catalogOnly
    ? CATALOG_TABLE_TITLES
    : new Set([...OPERATIONAL_TABLE_TITLES].filter((title) => suppliedOperationalTitles.has(title)))
  const allTables = buildTrainingSheetTables(operational).filter(table => selectedTableTitles.has(table.title))

  const existingByTitle = new Map<string, number>()
  for (const sheet of metadata.sheets || []) {
    const title = sheet.properties?.title
    const id = sheet.properties?.sheetId
    if (title && typeof id === 'number') {
      existingByTitle.set(title, id)
    }
  }

  const tables = allTables

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
      const errBody = (await readJsonBody(addRes)) as SpreadsheetMetadata
      throw new Error(
        errBody.error?.message || 'Failed to create missing sheets.',
      )
    }
  }

  const refreshedRes = await fetch(baseUrl, { headers: authHeaders })
  if (!refreshedRes.ok) {
    const errBody = (await readJsonBody(refreshedRes)) as SpreadsheetMetadata
    throw new Error(
      errBody.error?.message || `Unable to refresh spreadsheet (${refreshedRes.status}).`,
    )
  }
  const refreshedMeta = (await readJsonBody(refreshedRes)) as SpreadsheetMetadata
  const sheetIdsByTitle = new Map<string, number>()
  for (const sheet of refreshedMeta.sheets || []) {
    const title = sheet.properties?.title
    const id = sheet.properties?.sheetId
    if (title && typeof id === 'number') {
      sheetIdsByTitle.set(title, id)
    }
  }

  const writeRequests: Array<Record<string, unknown>> = []
  const formatRequests: Array<Record<string, unknown>> = []
  for (const table of tables) {
    const sheetId = sheetIdsByTitle.get(table.title)
    if (typeof sheetId !== 'number') {
      throw new Error(`Missing Google Sheets tab: ${table.title}.`)
    }
    if (table.rows.some((row) => row.length !== table.headers.length)) {
      throw new Error(`Invalid row width in Google Sheets table: ${table.title}.`)
    }
    const sheet = refreshedMeta.sheets?.find(
      (item) => item.properties?.title === table.title,
    )?.properties
    const clearRowCount = Math.max(
      sheet?.gridProperties?.rowCount ?? 100,
      table.rows.length + 1,
    )
    const clearColumnCount = Math.max(
      sheet?.gridProperties?.columnCount ?? table.headers.length,
      table.headers.length,
    )

    if (
      clearRowCount > (sheet?.gridProperties?.rowCount ?? 0) ||
      clearColumnCount > (sheet?.gridProperties?.columnCount ?? 0)
    ) {
      writeRequests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: {
              rowCount: clearRowCount,
              columnCount: clearColumnCount,
            },
          },
          fields: 'gridProperties.rowCount,gridProperties.columnCount',
        },
      })
    }
    writeRequests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: clearRowCount,
          startColumnIndex: 0,
          endColumnIndex: clearColumnCount,
        },
        fields: 'userEnteredValue',
      },
    })
    writeRequests.push({
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: 0 },
        rows: [table.headers, ...table.rows].map((row) => ({
          values: row.map((value) => ({
            userEnteredValue:
              typeof value === 'number'
                ? { numberValue: value }
                : { stringValue: value },
          })),
        })),
        fields: 'userEnteredValue',
      },
    })

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

  const defaultTitle = ['Hoja 1', 'Sheet1'].find((title) => sheetIdsByTitle.has(title))
  const defaultSheetId = catalogOnly || !defaultTitle ? undefined : sheetIdsByTitle.get(defaultTitle)
  if (
    typeof defaultSheetId === 'number' &&
    defaultTitle &&
    sheetIdsByTitle.size > 1 &&
    await isSheetEmpty(baseUrl, authHeaders, defaultTitle)
  ) {
    formatRequests.push({
      deleteSheet: { sheetId: defaultSheetId },
    })
  }

  const writeRes = await fetch(`${baseUrl}:batchUpdate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ requests: [...writeRequests, ...formatRequests] }),
  })
  if (!writeRes.ok) {
    const errBody = (await readJsonBody(writeRes)) as SpreadsheetMetadata
    throw new Error(
      errBody.error?.message || 'Failed to update table values and formatting in Google Sheets.',
    )
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
