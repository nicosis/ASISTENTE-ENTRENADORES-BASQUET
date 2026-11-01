import { readDatabaseFromGoogleSheets } from '../utils/googleSheets'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const spreadsheetId = config.googleSpreadsheetId
  const clientEmail = config.googleServiceAccountEmail
  const privateKey = config.googlePrivateKey

  const query = getQuery(event)
  const forceRefresh = query.refresh === '1' || query.refresh === 'true'

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Google Sheets no está configurado. Revisá las credenciales del servidor.',
    })
  }

  try {
    return await readDatabaseFromGoogleSheets(
      {
        spreadsheetId,
        clientEmail,
        privateKey,
      },
      { forceRefresh },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudieron leer los datos de Google Sheets.'
    throw createError({
      statusCode: 503,
      statusMessage: `No se pudieron cargar los datos de Google Sheets: ${message}`,
    })
  }
})
