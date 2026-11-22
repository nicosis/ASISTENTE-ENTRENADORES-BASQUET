import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSeasonSessionOffset } from '../app/shared/training.ts'

const phase = (overrides) => ({
  macrocycleId: 'plan',
  phaseOrder: 1,
  type: 'training',
  name: 'Fase',
  objective: '',
  load: 5,
  ...overrides,
})

const catalog = {
  macrocycles: [{ id: 'plan', name: 'Plan', ageCategory: 'cadete', totalWeeks: 4 }],
  mesocycles: [
    phase({ id: 'a', phaseOrder: 1, weekStart: 1, weekEnd: 2, load: 5 }),
    phase({ id: 'b', phaseOrder: 2, type: 'holiday', weekStart: 3, weekEnd: 3, load: 0 }),
    phase({ id: 'c', phaseOrder: 3, weekStart: 4, weekEnd: 4, load: 5 }),
  ],
  // Other tables are not read by this helper.
  sessions: [], variants: [], blocks: [], blockExercises: [], exercises: [], homeSessions: [], tests: [],
}

const noHoliday = () => false

test('the first session of the season is numbered 1 with no earlier sessions', () => {
  assert.equal(getSeasonSessionOffset('plan', 1, 2, noHoliday, catalog), 0)
})

test('sessions accumulate across training weeks of the season', () => {
  // Week 2 starts after week 1 (2 sessions), so its sessions are 3 and 4.
  assert.equal(getSeasonSessionOffset('plan', 2, 2, noHoliday, catalog), 2)
})

test('holiday weeks add no sessions', () => {
  // Week 3 is a holiday phase; week 4 starts after weeks 1 and 2 only.
  assert.equal(getSeasonSessionOffset('plan', 4, 2, noHoliday, catalog), 4)
})

test('weeks marked as holidays on the season are skipped', () => {
  const holidayWeek2 = (week) => week === 2
  assert.equal(getSeasonSessionOffset('plan', 3, 2, holidayWeek2, catalog), 2)
})
