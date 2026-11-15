import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import {
  EXERCISE_IMAGE_PLACEHOLDER_URL,
  exerciseImagesInConstruction,
} from '../app/shared/exerciseImages.ts'

test('every exercise uses the existing placeholder image while images are in construction', () => {
  assert.equal(exerciseImagesInConstruction.initial, EXERCISE_IMAGE_PLACEHOLDER_URL)
  assert.equal(exerciseImagesInConstruction.final, EXERCISE_IMAGE_PLACEHOLDER_URL)
  assert.ok(existsSync(`public${EXERCISE_IMAGE_PLACEHOLDER_URL}`), 'Missing placeholder image')
})
