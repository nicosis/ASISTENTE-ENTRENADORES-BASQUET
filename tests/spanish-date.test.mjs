import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isoToSpanishDate, spanishDateToIso } from '../app/shared/spanishDate.ts'

test('converts a valid dd/mm/yyyy date to ISO', () => {
  assert.equal(spanishDateToIso('01/09/2026'), '2026-09-01')
  assert.equal(spanishDateToIso(' 31/12/2026 '), '2026-12-31')
})

test('rejects impossible or malformed dates', () => {
  assert.equal(spanishDateToIso('31/02/2026'), null)
  assert.equal(spanishDateToIso('2026-09-01'), null)
  assert.equal(spanishDateToIso('1/9/2026'), null)
  assert.equal(spanishDateToIso(''), null)
})

test('formats ISO dates as dd/mm/yyyy and leaves invalid input empty', () => {
  assert.equal(isoToSpanishDate('2026-09-01'), '01/09/2026')
  assert.equal(isoToSpanishDate(''), '')
})
