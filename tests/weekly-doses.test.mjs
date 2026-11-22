import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getHydratedSession, getHolidayDataStatus } from '../app/shared/training.ts'

test('validates holiday activities without requiring a court session', () => {
  const catalog = { homeSessions: [{ macrocycleId: 'plan', exerciseId: 'e1' }], exercises: [{ id: 'e1' }] }
  assert.equal(getHolidayDataStatus('plan', catalog).available, true)
  assert.equal(getHolidayDataStatus('plan', { ...catalog, exercises: [] }).available, false)
  assert.equal(getHolidayDataStatus('plan', { ...catalog, homeSessions: [] }).available, false)
})

test('selects the exercise dose belonging to the requested week', () => {
  const catalog = {
    macrocycles: [{ id: 'plan', ageCategory: 'cadete', totalWeeks: 42 }],
    mesocycles: [{ id: 'phase', macrocycleId: 'plan', phaseOrder: 1, type: 'training', weekStart: 7, weekEnd: 10, load: 6 }],
    mesocycleSessions: [{ id: 'session', mesocycleId: 'phase', day: 'dia1', order: 1 }],
    trainingBlocks: [{ id: 'block', sessionId: 'session', blockOrder: 1 }],
    blockExercises: [{ id: 'item', blockId: 'block', exerciseId: 'exercise', itemOrder: 1, doseFormacion: 'legacy formation', doseLiga: 'legacy league', weekDoses: { 7: 'S7 3 × 8', 8: 'S8 3 × 8', 9: 'S9 3 × 8', 10: 'S10 2 × 8' } }],
    exercises: [{ id: 'exercise', name: 'Example' }], homeSessions: [], tests: [],
  }
  for (const week of [7, 8, 9, 10]) {
    const session = getHydratedSession({ frequency: 3, day: 'dia1', weekNumber: week, }, catalog)
    assert.equal(session.blocks[0].items[0].dose, week === 10 ? 'S10 2 × 8' : `S${week} 3 × 8`)
  }
})
