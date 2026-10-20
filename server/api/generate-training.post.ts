import {
  defaultTrainingCatalog,
  getHydratedSession,
  type AgeCategory,
  type CompetitiveLevel,
  type Frequency,
  type TrainingCatalogTables,
  type TrainingDay,
} from '../../app/shared/training'
import { readDatabaseFromGoogleSheets } from '../utils/googleSheets'

interface GenerateTrainingBody {
  day?: TrainingDay
  frequency?: Frequency
  weekNumber?: number
  ageCategory?: AgeCategory
  competitiveLevel?: CompetitiveLevel
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event)
    const spreadsheetId = config.googleSpreadsheetId
    const clientEmail = config.googleServiceAccountEmail
    const privateKey = config.googlePrivateKey

    let catalog: TrainingCatalogTables = defaultTrainingCatalog
    if (spreadsheetId && clientEmail && privateKey) {
      try {
        const db = await readDatabaseFromGoogleSheets({
          spreadsheetId,
          clientEmail,
          privateKey,
        })
        catalog = db.catalog
      } catch {
        catalog = defaultTrainingCatalog
      }
    }

    const body = await readBody<GenerateTrainingBody>(event)
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

    const hydrated = getHydratedSession(
      {
        ageCategory,
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
      isDeload: hydrated.isDeload,
      session: hydrated.session,
      objective: hydrated.session.name,
      duration: hydrated.session.totalMinutes,
      rationale: `${hydrated.phase.name} (Semana ${hydrated.weekNumber} · Carga ${hydrated.loadIndex}/10): ${hydrated.phase.objective}`,
      sessionBlocks: hydrated.blocks,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno al generar la sesión de entrenamiento.',
    })
  }
})
