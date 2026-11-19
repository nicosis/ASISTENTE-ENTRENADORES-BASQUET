import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildTrainingSheetTables } from '../server/utils/googleSheets.ts'

const catalog = JSON.parse(await readFile(new URL('../odd/plan-data/catalog.json', import.meta.url), 'utf8'))

test('builds a complete Sheets snapshot from the 42-week PDF catalog', () => {
  const tables = buildTrainingSheetTables({ catalog, includeCatalog: true })
  const tableByName = new Map(tables.map(table => [table.title, table]))
  assert.equal(tables.length, 16)
  assert.equal(tableByName.get('macrocycles').rows.length, 1)
  assert.equal(tableByName.get('mesocycles').rows.length, 13)
  assert.equal(tableByName.get('mesocycle_sessions').rows.length, 30)
  assert.equal(tableByName.get('training_blocks').rows.length, 120)
  assert.equal(tableByName.get('block_exercises').rows.length, 300)
  assert.equal(tableByName.get('exercises').rows.length, 68)
  assert.equal(tableByName.get('home_sessions').rows.length, 34)
  assert.equal(tableByName.get('tests').rows.length, 7)
  for (const table of tables) {
    assert.ok(table.rows.every(row => row.length === table.headers.length), `${table.title} row width`)
  }
})

test('serializes week-specific and holiday-week doses as Sheets JSON columns', () => {
  const tables = new Map(buildTrainingSheetTables({ catalog, includeCatalog: true }).map(table => [table.title, table]))
  const blockExercises = tables.get('block_exercises')
  assert.equal(blockExercises.headers.at(-1), 'week_doses_json')
  assert.deepEqual(JSON.parse(blockExercises.rows[0].at(-1)), { 1: 'World\'s greatest stretch · 3 por lado', 2: 'World\'s greatest stretch · 3 por lado', 3: 'World\'s greatest stretch · 3 por lado' })
  const home = tables.get('home_sessions')
  assert.equal(home.headers.at(-2), 'week_numbers_json')
  assert.deepEqual(JSON.parse(home.rows[0].at(-2)), [19, 20])
  assert.deepEqual(JSON.parse(home.rows[0].at(-1)), { 19: '10 por pierna · sin peso', 20: '10 por pierna · sin peso' })
})

test('keeps the assessment phase separate from training and holidays', () => {
  const assessment = catalog.mesocycles.find(phase => phase.type === 'assessment')
  assert.deepEqual([assessment.weekStart, assessment.weekEnd], [42, 42])
  assert.equal(catalog.tests.every(item => item.milestoneWeeks.join('|') === 'S1|S21|S42'), true)
})

test('refuses catalog replacement without the explicit flag and leaves the catalog unchanged', async () => {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const catalogPath = resolve(repositoryRoot, 'odd/plan-data/catalog.json')
  const hash = value => createHash('sha256').update(value).digest('hex')
  const before = hash(await readFile(catalogPath))
  const result = spawnSync(process.execPath, ['odd/plan-data/importCatalog.mjs'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })
  const after = hash(await readFile(catalogPath))
  assert.equal(result.status, 2)
  assert.match(result.stderr, /without --replace-catalog/)
  assert.equal(result.stdout, '')
  assert.equal(after, before)
})
