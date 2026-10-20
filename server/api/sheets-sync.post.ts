import {
  syncTrainingTablesToGoogleSheets,
  type OperationalTablesPayload,
} from '../utils/googleSheets'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event)
    const spreadsheetId = config.googleSpreadsheetId
    const clientEmail = config.googleServiceAccountEmail
    const privateKey = config.googlePrivateKey

    if (!spreadsheetId || !clientEmail || !privateKey) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Missing Google Sheets credentials in .env (GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY).',
      })
    }

    const body = await readBody<OperationalTablesPayload>(event).catch(
      () => undefined,
    )

    const result = await syncTrainingTablesToGoogleSheets(
      {
        spreadsheetId,
        clientEmail,
        privateKey,
      },
      body,
    )

    return result
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message =
      error instanceof Error
        ? error.message
        : 'Unexpected error syncing tables to Google Sheets.'
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
})
