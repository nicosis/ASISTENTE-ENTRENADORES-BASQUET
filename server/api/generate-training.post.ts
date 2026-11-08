import {
  getTrainingDataStatus,
  getHydratedSession,
  TrainingDataUnavailableError,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type TrainingCatalogTables,
  type TrainingDay,
} from '../../app/shared/training'
import { readDatabaseFromGoogleSheets } from '../utils/googleSheets'
import { alignCadeteCatalog, getCadeteWeeks } from '../../app/shared/cadeteCalendar'

interface GenerateTrainingBody {
  day?: TrainingDay
  frequency?: Frequency
  weekNumber?: number
  macrocycleId?: string
  mesocycleId?: string
  ageCategory?: AgeCategory
  competitiveLevel?: CompetitiveLevel
  startsAt?: string
  holidayWeeks?: string[]
  seasonId?: string
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event)
    const spreadsheetId = config.googleSpreadsheetId
    const clientEmail = config.googleServiceAccountEmail
    const privateKey = config.googlePrivateKey

    if (!spreadsheetId || !clientEmail || !privateKey) {
      throw createError({
        statusCode: 503,
        statusMessage:
          'Google Sheets no está configurado. No se puede generar una sesión sin datos de planificación.',
      })
    }
    let catalog: TrainingCatalogTables
    let sheetSeasons: Awaited<ReturnType<typeof readDatabaseFromGoogleSheets>>['operational']['seasons']
    try {
      const db = await readDatabaseFromGoogleSheets({
        spreadsheetId,
        clientEmail,
        privateKey,
      })
      catalog = db.catalog
      sheetSeasons = db.operational.seasons
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron leer los datos de Google Sheets.'
      throw createError({
        statusCode: 503,
        statusMessage: `No se puede generar una sesión: ${message}`,
      })
    }

    const body = await readBody<GenerateTrainingBody>(event)
    const sheetSeason = body.seasonId ? sheetSeasons.find(item => item.id === body.seasonId) : undefined
    if (body.seasonId && !sheetSeason) throw createError({ statusCode: 422, statusMessage: 'No existe la temporada en Google Sheets.' })
    const frequency: Frequency =
      body.frequency === 1 || body.frequency === 2 || body.frequency === 3
        ? body.frequency
        : 3
    const day: TrainingDay =
      body.day === 'dia1' || body.day === 'dia2' || body.day === 'dia3'
        ? body.day
        : 'dia1'
    const weekNumber =
      typeof body.weekNumber === 'number' && Number.isFinite(body.weekNumber)
        ? body.weekNumber
        : 1
    const macrocycleId = sheetSeason?.macrocycleId ?? (typeof body.macrocycleId === 'string' ? body.macrocycleId : undefined)
    const mesocycleId = typeof body.mesocycleId === 'string' ? body.mesocycleId : undefined
    const ageCategory: AgeCategory =
      body.ageCategory === 'alevin' ||
      body.ageCategory === 'infantil' ||
      body.ageCategory === 'cadete' ||
      body.ageCategory === 'juvenil'
        ? body.ageCategory
        : 'cadete'
    const competitiveLevel: CompetitiveLevel =
      body.competitiveLevel === 'formacion' || body.competitiveLevel === 'liga'
        ? body.competitiveLevel
        : 'liga'

    let cadeteRestWeek = false
    const startsAt = sheetSeason?.startsAt ?? body.startsAt
    if (ageCategory === 'cadete' && startsAt) {
      const phaseCount = catalog.mesocycles.filter(item => item.macrocycleId === macrocycleId).length
      if (phaseCount === 4) {
        try {
          const holidays = sheetSeason?.holidayWeeks ?? (Array.isArray(body.holidayWeeks) ? body.holidayWeeks : [])
          catalog = alignCadeteCatalog(catalog, startsAt, holidays)
          const week = getCadeteWeeks(startsAt, holidays)[weekNumber - 1]
          if (!week) throw createError({ statusCode: 422, statusMessage: 'La semana está fuera de la temporada.' })
          if (week.holiday) throw createError({ statusCode: 422, statusMessage: 'Esta semana está marcada como vacaciones.' })
          cadeteRestWeek = week.rest
        } catch {
          throw createError({ statusCode: 422, statusMessage: 'No se puede generar la sesión: revisa la fecha, la semana y las vacaciones.' })
        }
      }
    }

    const trainingDataStatus = getTrainingDataStatus(
      {
        ageCategory,
        macrocycleId,
        mesocycleId,
        weekNumber,
        day,
      },
      catalog,
    )
    if (!trainingDataStatus.available) {
      throw createError({
        statusCode: 422,
        statusMessage:
          trainingDataStatus.message ||
          'No hay información suficiente para generar esta sesión.',
      })
    }

    const hydrated = getHydratedSession(
      {
        ageCategory,
        macrocycleId,
        mesocycleId,
        competitiveLevel,
        frequency,
        weekNumber,
        day,
      },
      catalog,
    )

    if (!hydrated.session) {
      throw createError({
        statusCode: 400,
        statusMessage: 'La sesión solicitada no existe para esta configuración.',
      })
    }

    return {
      plan: hydrated.plan,
      phase: hydrated.phase,
      weekNumber: hydrated.weekNumber,
      weekInPhase: hydrated.weekInPhase,
      loadIndex: hydrated.loadIndex,
      isDeload: cadeteRestWeek || hydrated.isDeload,
      session: hydrated.session,
      objective: hydrated.session.name,
      duration: hydrated.session.totalMinutes,
      rationale: `${hydrated.phase.name} (Semana ${hydrated.weekNumber} · Carga ${hydrated.loadIndex}/10): ${hydrated.phase.objective}`,
      trainingBlocks: cadeteRestWeek ? hydrated.blocks.map(block => ({
        ...block,
        items: block.items.map(item => ({ ...item, dose: `${item.dose.replace(/^\d+\s*×/, '2 ×').replace(/\s*\+\s*contraste/gi, '')} · descanso activo: sin saltos nuevos` })),
      })) : hydrated.blocks,
    }
  } catch (error) {
    if (error instanceof TrainingDataUnavailableError) {
      throw createError({
        statusCode: 422,
        statusMessage: error.message,
      })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno al generar la sesión de entrenamiento.',
    })
  }
})
