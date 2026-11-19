import assert from 'node:assert/strict'
import { test } from 'node:test'
import { currentSeasonWeek } from '../app/shared/seasonWeek.ts'

test('returns the season week that contains today', () => {
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2026, 10, 19)), 14)
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2026, 7, 17)), 1)
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2026, 7, 23)), 1)
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2026, 7, 24)), 2)
})

test('keeps week 1 before the season starts', () => {
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2026, 6, 1)), 1)
})

test('clamps to the last week after the season ends', () => {
  assert.equal(currentSeasonWeek('2026-08-17', 42, new Date(2028, 0, 1)), 42)
})

test('aligns a non-Monday start to the Monday of its week', () => {
  // 2026-08-19 is a Wednesday; its week begins on Monday 2026-08-17.
  assert.equal(currentSeasonWeek('2026-08-19', 42, new Date(2026, 7, 23)), 1)
  assert.equal(currentSeasonWeek('2026-08-19', 42, new Date(2026, 7, 24)), 2)
})
