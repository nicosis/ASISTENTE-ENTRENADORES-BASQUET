import {
  getFallbackDatabaseSnapshot,
  readDatabaseFromGoogleSheets,
} from '../utils/googleSheets'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const spreadsheetId = config.googleSpreadsheetId
  const clientEmail = config.googleServiceAccountEmail
  const privateKey = config.googlePrivateKey

  const query = getQuery(event)
  const forceRefresh = query.refresh === '1' || query.refresh === 'true'

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return getFallbackDatabaseSnapshot(spreadsheetId)
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
  } catch {
    return getFallbackDatabaseSnapshot(spreadsheetId)
  }
})
