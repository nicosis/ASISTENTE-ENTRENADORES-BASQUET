/** Read all rows after the header, including catalogs larger than 499 rows. */
export function sheetDataRange(title: string): string {
  return `'${title.replace(/'/g, "''")}'!A2:Z`
}
