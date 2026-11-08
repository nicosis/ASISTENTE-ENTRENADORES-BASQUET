import assert from 'node:assert/strict'
import test from 'node:test'
import { createSerialTaskQueue } from '../app/shared/serialTaskQueue.ts'

test('a stale recovery cannot apply after a newer save is queued', async () => {
  const queue = createSerialTaskQueue()
  const events = []
  let markRecoveryStarted
  let finishRecovery
  const recoveryStarted = new Promise((resolve) => {
    markRecoveryStarted = resolve
  })
  const recovery = new Promise((resolve) => {
    finishRecovery = resolve
  })

  const recoveryTask = queue.enqueue(async ({ isLatest }) => {
    events.push('recovery-started')
    markRecoveryStarted()
    await recovery
    if (isLatest()) events.push('stale-recovery-applied')
    events.push('recovery-finished')
  })

  await recoveryStarted
  const latestSave = queue.enqueue(async ({ isLatest }) => {
    assert.equal(isLatest(), true)
    events.push('latest-save')
  })
  finishRecovery()
  await Promise.all([recoveryTask, latestSave])

  assert.deepEqual(events, [
    'recovery-started',
    'recovery-finished',
    'latest-save',
  ])
})
