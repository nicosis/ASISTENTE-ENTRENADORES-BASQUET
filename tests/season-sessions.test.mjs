import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildSeasonSessions, firstExerciseIdOf } from '../app/shared/seasonSessions.ts'

const catalog = JSON.parse(readFileSync(fileURLToPath(new URL('../odd/plan-data/catalog.json', import.meta.url)), 'utf8'))
const macrocycleId = catalog.macrocycles[0].id

const season = (overrides = {}) => ({
  id: 'TEM-1',
  macrocycleId,
  startsAt: '2026-08-17',
  frequency: 3,
  holidayWeeks: [],
  ...overrides,
})

test('numbers the first session of the season as week 1, day 1 with its first block exercise', () => {
  const rows = buildSeasonSessions(season(), 42, catalog)
  assert.deepEqual(rows[0], {
    seasonId: 'TEM-1',
    sessionNumber: 1,
    weekNumber: 1,
    day: 'dia1',
    mesocycleId: 'CAD42-P01',
    sessionId: 'CAD42-P01-D1',
  })
})

test('numbers sessions by frequency per training week', () => {
  const rows = buildSeasonSessions(season(), 42, catalog)
  assert.deepEqual(rows.slice(0, 4).map((row) => [row.sessionNumber, row.weekNumber, row.day]), [
    [1, 1, 'dia1'],
    [2, 1, 'dia2'],
    [3, 1, 'dia3'],
    [4, 2, 'dia1'],
  ])
})

test('skips holiday weeks when counting sessions', () => {
  // With the season starting 2026-08-17, week 19 starts 2026-12-21.
  const rows = buildSeasonSessions(season({ holidayWeeks: ['2026-12-21', '2026-12-28', '2027-03-22'] }), 42, catalog)
  const session40 = rows.find((row) => row.sessionNumber === 40)
  assert.equal(session40.weekNumber, 14)
  assert.equal(session40.day, 'dia1')
  assert.equal(session40.mesocycleId, 'CAD42-P04')
  assert.equal(session40.sessionId, 'CAD42-P04-D1')
  assert.equal(rows.some((row) => row.weekNumber === 19), false)
})

test('derives the first exercise of a session from block 1, item 1', () => {
  assert.equal(firstExerciseIdOf('CAD42-P04-D1', catalog), 'CAD42-E017')
  assert.equal(firstExerciseIdOf('NO-EXISTE', catalog), undefined)
})

test('uses the season frequency to number sessions', () => {
  const rows = buildSeasonSessions(season({ frequency: 2 }), 42, catalog)
  assert.deepEqual(rows.slice(0, 3).map((row) => [row.sessionNumber, row.weekNumber, row.day]), [
    [1, 1, 'dia1'],
    [2, 1, 'dia2'],
    [3, 2, 'dia1'],
  ])
})

test('does not add rows for weeks that are not training weeks', () => {
  const trainingWeeks = new Set(catalog.mesocycles
    .filter((item) => item.type === 'training')
    .flatMap((item) => Array.from({ length: item.weekEnd - item.weekStart + 1 }, (_, index) => item.weekStart + index)))
  const rows = buildSeasonSessions(season(), 42, catalog)
  assert.ok(rows.every((row) => trainingWeeks.has(row.weekNumber)))
})
