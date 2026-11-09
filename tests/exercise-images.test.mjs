import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { getExerciseImages } from '../app/shared/exerciseImages.ts'

test('each configured exercise resolves to two distinct existing images', () => {
  for (let number = 1; number <= 18; number++) {
    const id = `EJE${String(number).padStart(4, '0')}`
    const images = getExerciseImages(id)
    assert.ok(images, `Missing image mapping for ${id}`)
    assert.notEqual(images.initial, images.final)
    for (const url of [images.initial, images.final]) {
      assert.ok(existsSync(`public${decodeURIComponent(url)}`), `Missing file: ${url}`)
    }
  }
  assert.equal(getExerciseImages('unknown'), undefined)
})
