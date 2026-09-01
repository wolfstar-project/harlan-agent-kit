import { describe, expect, it } from 'vitest'
import { loadGitIdentity } from '../src/git-identity.ts'
import { err, ok } from '../src/result.ts'

describe('git identity', () => {
  it('loads the commit identity from global Git configuration', async () => {
    const result = await loadGitIdentity((key) =>
      Promise.resolve(ok(key === 'user.name' ? 'Wolfstar Project' : 'contact@wolfstar.rocks')),
    )

    expect(result).toEqual({ _tag: 'Ok', value: { name: 'Wolfstar Project', email: 'contact@wolfstar.rocks' } })
  })

  it('rejects an incomplete global Git identity', async () => {
    const result = await loadGitIdentity((key) =>
      Promise.resolve(key === 'user.name' ? ok('Wolfstar Project') : err('Global Git user.email is not configured.')),
    )

    expect(result).toEqual({ _tag: 'Err', error: 'Global Git user.email is not configured.' })
  })
})
