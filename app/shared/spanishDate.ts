const SPANISH_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/

export function isoToSpanishDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

// Returns the ISO date (yyyy-mm-dd) for a valid dd/mm/yyyy string, or null.
export function spanishDateToIso(value: string): string | null {
  const match = SPANISH_DATE.exec(value.trim())
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  return valid ? `${match[3]}-${match[2]}-${match[1]}` : null
}
