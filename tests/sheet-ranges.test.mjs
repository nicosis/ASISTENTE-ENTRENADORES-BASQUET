import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sheetDataRange } from '../server/utils/sheetRanges.ts'

test('requests every populated data row and safely quotes sheet names', () => {
  assert.equal(sheetDataRange('block_exercises'), "'block_exercises'!A2:Z")
  assert.equal(sheetDataRange("Coach's plan"), "'Coach''s plan'!A2:Z")
})
