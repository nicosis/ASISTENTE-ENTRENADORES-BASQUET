import { readFile } from 'node:fs/promises'
import { createJiti } from 'jiti'

if (!process.argv.includes('--replace-catalog')) {
  console.error('Refusing to write Google Sheets without --replace-catalog.')
  process.exitCode = 2
} else {
  const { GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env
  if (!GOOGLE_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('Missing GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_PRIVATE_KEY.')
    process.exitCode = 2
  } else {
    const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'))
    const jiti = createJiti(import.meta.url)
    const { syncTrainingTablesToGoogleSheets } = await jiti.import('../../server/utils/googleSheets.ts')
    const result = await syncTrainingTablesToGoogleSheets(
      {
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        clientEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: GOOGLE_PRIVATE_KEY,
      },
      { includeCatalog: true, catalog },
      { replaceCatalog: true },
    )
    console.log(JSON.stringify({
      spreadsheetTitle: result.spreadsheetTitle,
      spreadsheetUrl: result.spreadsheetUrl,
      replacedTables: result.syncedTables,
    }, null, 2))
  }
}
