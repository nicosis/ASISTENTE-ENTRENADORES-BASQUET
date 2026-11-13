import { readFile, writeFile, mkdir } from 'node:fs/promises'

// Builds the coach-facing spreadsheet template as CSV files to import into Google Sheets.
// The coach edits these sheets; the app does not read them directly.
const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'))
const outDir = new URL('./plantilla-entrenador/', import.meta.url)
await mkdir(outDir, { recursive: true })

const csvCell = (value) => {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
const toCsv = (headers, rows) =>
  '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'

const exerciseHeaders = ['Nombre', 'Área de movimiento', 'Nivel', 'Material', 'Cómo se hace', 'Indicación clave', 'Errores frecuentes', 'Versión más fácil', 'Versión más difícil']
const exerciseRows = [...catalog.exercises]
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  .map((ex) => [ex.name, ex.movementArea, ex.movementLevel, ex.material, ex.how.join(' | '), ex.cue, ex.errors.join(' | '), ex.easier, ex.harder])

const phaseById = new Map(catalog.mesocycles.map((phase) => [phase.id, phase]))
const sessionById = new Map(catalog.mesocycleSessions.map((session) => [session.id, session]))
const blockById = new Map(catalog.trainingBlocks.map((block) => [block.id, block]))
const exerciseNameById = new Map(catalog.exercises.map((ex) => [ex.id, ex.name]))
const dayOrder = { dia1: 1, dia2: 2, dia3: 3 }

// Collapses week-by-week doses into ranges: "S1: 2 × 3; S2-S3: 3 × 3".
// Source texts sometimes repeat the week label ("S1 tests 2 × 3"); the label is removed.
function formatWeeklyDoses(weekDoses = {}, exerciseName = '') {
  const weeks = Object.keys(weekDoses).map(Number).sort((a, b) => a - b)
  const groups = []
  for (const week of weeks) {
    const dose = weekDoses[week].replace(/^S\d+\s+/, '').replace(`${exerciseName} · `, '')
    const last = groups.at(-1)
    if (last && last.dose === dose && last.end === week - 1) last.end = week
    else groups.push({ dose, start: week, end: week })
  }
  return groups
    .map(({ dose, start, end }) => `${start === end ? `S${start}` : `S${start}-S${end}`}: ${dose}`)
    .join('; ')
}

const loadHeaders = ['Fase', 'Día', 'Bloque', 'Orden', 'Ejercicio', 'Dosis por semana']
const loadEntries = catalog.blockExercises.map((item) => {
  const block = blockById.get(item.blockId)
  const session = sessionById.get(block.sessionId)
  const phase = phaseById.get(session.mesocycleId)
  return {
    sort: [phase.phaseOrder, dayOrder[session.day], block.blockOrder, item.itemOrder],
    row: [phase.name, session.name, block.name, item.itemOrder, exerciseNameById.get(item.exerciseId), formatWeeklyDoses(item.weekDoses, exerciseNameById.get(item.exerciseId))],
  }
})
const loadRows = loadEntries
  .sort((a, b) => a.sort.map((value, index) => value - b.sort[index]).find((diff) => diff !== 0) ?? 0)
  .map((entry) => entry.row)

const instructions = `# Cómo completar la planilla

Hay dos hojas. Completá solo las columnas, sin cambiar los encabezados.

## Ejercicios
- Una fila por ejercicio. El nombre tiene que ser único: es el que se elige en la hoja Cargas.
- En "Cómo se hace" y "Errores frecuentes", separá los pasos con " | ".

## Cargas
- Una fila por ejercicio dentro de un bloque. Ya viene cargada con fases, días, bloques y dosis del PDF.
- Para cambiar un ejercicio, elegilo de la lista desplegable de la columna Ejercicio (cuando esté configurada).
- "Dosis por semana" sigue el formato "S1: 2 × 3; S2-S3: 3 × 3". Si una dosis cambia en una semana, escribí esa semana aparte.
`

await writeFile(new URL('Ejercicios.csv', outDir), toCsv(exerciseHeaders, exerciseRows), 'utf8')
await writeFile(new URL('Cargas.csv', outDir), toCsv(loadHeaders, loadRows), 'utf8')
await writeFile(new URL('Instrucciones.md', outDir), instructions, 'utf8')
console.log(JSON.stringify({ ejercicios: exerciseRows.length, cargas: loadRows.length }))
