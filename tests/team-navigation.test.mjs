import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('opening a team resets the selected tab to the weekly sessions', () => {
  const source = readFileSync(new URL('../app/composables/useCoachWorkspace.ts', import.meta.url), 'utf8')
  const openTeam = source.match(/function openTeam\(teamId: string\): void \{([\s\S]*?)\n  \}/)

  assert.ok(openTeam, 'openTeam must exist')
  assert.match(openTeam[1], /activeTeamTab\.value\s*=\s*'week'/)
})
