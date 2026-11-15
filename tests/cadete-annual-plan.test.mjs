import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAnnualPlanWeek, annualSessionBlocks, getAnnualSeasonStart, getCurrentSeasonStart, getAnnualCalendar } from '../app/shared/cadeteAnnualPlan.ts'
import { alignCadeteCatalog, getCadeteWeeks } from '../app/shared/cadeteCalendar.ts'

test('starts automatically on the third Monday of August', () => {
  assert.equal(getAnnualSeasonStart(2026), '2026-08-17')
  assert.equal(getAnnualSeasonStart(2027), '2027-08-16')
  assert.equal(getAnnualSeasonStart(2028), '2028-08-21')
  assert.equal(getCurrentSeasonStart(new Date('2027-01-15T12:00:00Z')), '2026-08-17')
  assert.equal(getCurrentSeasonStart(new Date('2027-08-01T12:00:00Z')), '2027-08-16')
})

test('builds 42 consecutive weeks with the guide’s nominal holiday weeks', () => {
  const weeks = getAnnualCalendar(2026)
  assert.equal(weeks.length, 42)
  assert.deepEqual(weeks[0], { week: 1, weekStart: '2026-08-17', kind: 'reunion' })
  assert.deepEqual(weeks[18], { week: 19, weekStart: '2026-12-21', kind: 'christmas' })
  assert.deepEqual(weeks[32], { week: 33, weekStart: '2027-03-29', kind: 'easter' })
  assert.deepEqual(weeks[41], { week: 42, weekStart: '2027-05-31', kind: 'combine' })
})

test('preserves phase loads and week ranges for a 42-week catalog', () => {
  const bounds = [[1,3],[4,6],[7,10],[11,14],[15,18],[19,20],[21,24],[25,28],[29,32],[33,33],[34,37],[38,41],[42,42]]
  const catalog = {
    macrocycles: [{ id: 'plan', ageCategory: 'cadete', totalWeeks: 42 }],
    mesocycles: bounds.map(([start, end], index) => ({ id: `phase${index}`, macrocycleId: 'plan', phaseOrder: index + 1, weekStart: start, weekEnd: end, weeksCount: end - start + 1, type: index === 5 || index === 9 ? 'holiday' : 'training', weeklyLoads: [5, 6, 7] })),
    mesocycleSessions: [{ id: 'session', mesocycleId: 'phase0' }],
  }
  const result = alignCadeteCatalog(catalog, '2026-08-17')
  assert.deepEqual(result.mesocycles, catalog.mesocycles)
  assert.equal(result.macrocycles[0].totalWeeks, 42)
})

test('annual calendar identifies holidays and ends with the final combine', () => {
  const weeks = getCadeteWeeks('2026-08-17', [], true)
  assert.equal(weeks.length, 42)
  assert.deepEqual([19, 20, 33].map(week => weeks[week - 1].holiday), [false, false, false])
  assert.equal(weeks[41].weekStart, '2027-05-31')
  assert.equal(weeks[3].rest, false)
})

test('maps the 42 model weeks to the phases and special weeks in the guide', () => {
  assert.deepEqual([1, 3, 4, 6, 7, 10, 11, 14, 15, 18, 19, 20, 21, 24, 25, 28, 29, 32, 33, 34, 37, 38, 41, 42].map((week) => getAnnualPlanWeek(week).kind), [
    'reunion', 'reunion', 'construction', 'construction', 'base-strength', 'base-strength',
    'strength-power', 'strength-power', 'power-speed', 'power-speed', 'christmas', 'christmas',
    'return-strength', 'return-strength', 'reactive-power', 'reactive-power', 'peak', 'peak',
    'easter', 'transfer', 'transfer', 'finals', 'finals', 'combine',
  ])
  for (const week of [0, 43, 1.5, NaN]) assert.throws(() => getAnnualPlanWeek(week))
})

test('sets the four block durations to 25 minutes for each training day', () => {
  assert.deepEqual(annualSessionBlocks.dia1, [5, 5, 12, 3])
  assert.deepEqual(annualSessionBlocks.dia2, [5, 6, 9, 5])
  assert.deepEqual(annualSessionBlocks.dia3, [5, 7, 5, 8])
  for (const durations of Object.values(annualSessionBlocks)) {
    assert.equal(durations.reduce((total, minutes) => total + minutes, 0), 25)
  }
})
