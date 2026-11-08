import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCadeteWeeks } from '../app/shared/cadeteCalendar.ts'

test('assigns each week to the period of its Monday through June', () => {
  const weeks = getCadeteWeeks('2026-08-03')
  assert.equal(weeks[0].weekStart, '2026-08-03')
  assert.equal(weeks[0].period, 'PT')
  assert.equal(weeks.find((week) => week.weekStart === '2026-09-28').period, 'PT')
  assert.equal(weeks.find((week) => week.weekStart === '2026-10-05').period, 'M1')
  assert.equal(weeks.find((week) => week.weekStart === '2027-01-04').period, 'M2')
  assert.equal(weeks.find((week) => week.weekStart === '2027-04-05').period, 'M3')
  assert.equal(weeks.at(-1).weekStart, '2027-06-28')
})

test('requires a valid Monday in August', () => {
  for (const date of ['2026-08-04', '2026-07-27', '2026-08-32', 'invalid']) {
    assert.throws(() => getCadeteWeeks(date))
  }
})

test('marks selected holiday Mondays and rejects dates outside the season', () => {
  const weeks = getCadeteWeeks('2026-08-03', ['2026-12-21', '2026-12-28', '2027-03-22'])
  assert.equal(weeks.find((week) => week.weekStart === '2026-12-21').holiday, true)
  assert.equal(weeks.find((week) => week.weekStart === '2026-12-14').holiday, false)
  assert.equal(weeks.find((week) => week.weekStart === '2027-03-22').holiday, true)
  assert.throws(() => getCadeteWeeks('2026-08-03', ['2026-12-22']))
  assert.throws(() => getCadeteWeeks('2026-08-03', ['2027-07-05']))
})

test('holidays count as rest and restart the three-week training cycle', () => {
  const weeks = getCadeteWeeks('2026-08-03', ['2026-08-17'])
  assert.deepEqual(weeks.slice(0, 7).map((week) => week.rest), [false, false, true, false, false, false, true])
  assert.deepEqual(weeks.slice(0, 3).map((week) => week.holiday), [false, false, true])
})

test('a new period starts a fresh three-week cycle', () => {
  const weeks = getCadeteWeeks('2026-08-03')
  const firstM1 = weeks.findIndex((week) => week.period === 'M1')
  assert.deepEqual(weeks.slice(firstM1, firstM1 + 4).map((week) => week.rest), [false, false, false, true])
})
