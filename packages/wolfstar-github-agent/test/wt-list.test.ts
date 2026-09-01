import { describe, expect, it } from 'vitest'
import { parseWtWorktrees } from '../src/worktree.ts'

function entry(branch: string | null, path: string): unknown {
  return { branch, path, kind: 'worktree', detached: branch === null ? null : false }
}

describe('parseWtWorktrees', () => {
  it('reads Worktrunk schema 2 worktree entries', () => {
    const parsed = parseWtWorktrees(
      JSON.stringify({
        schema: 2,
        repo: { default_branch: 'main' },
        collected: { ci: false, summary: false },
        items: [
          {
            branch: 'main',
            worktree: { path: '/home/wolfstar/pkg/repo', detached: false },
          },
          {
            branch: 'wolfstar-agent/review-1',
            worktree: { path: '/home/wolfstar/pkg/repo.review-1', detached: false },
          },
        ],
      }),
    )

    expect(parsed).toEqual({
      _tag: 'Ok',
      value: [
        { branch: 'main', path: '/home/wolfstar/pkg/repo' },
        { branch: 'wolfstar-agent/review-1', path: '/home/wolfstar/pkg/repo.review-1' },
      ],
    })
  })

  it('keeps every branch worktree when a detached worktree sits between them', () => {
    const parsed = parseWtWorktrees(
      JSON.stringify([
        entry('main', '/home/wolfstar/pkg/repo'),
        entry(null, '/tmp/opencode/repo-main'),
        entry('wolfstar-agent/review-1', '/home/wolfstar/pkg/repo.review-1'),
      ]),
    )

    expect(parsed).toEqual({
      _tag: 'Ok',
      value: [
        { branch: 'main', path: '/home/wolfstar/pkg/repo' },
        { branch: 'wolfstar-agent/review-1', path: '/home/wolfstar/pkg/repo.review-1' },
      ],
    })
  })

  it('keeps the claimable worktrees around an entry it cannot use', () => {
    const parsed = parseWtWorktrees(
      JSON.stringify([
        { branch: 7, path: '/home/wolfstar/pkg/repo' },
        { path: '/home/wolfstar/pkg/repo.pruned' },
        entry('main', 'pkg/repo.relative'),
        { kind: 'session', name: 'something wt grew later' },
        entry('wolfstar-agent/conflict-1', '/home/wolfstar/pkg/repo.conflict-1'),
      ]),
    )

    expect(parsed).toEqual({
      _tag: 'Ok',
      value: [{ branch: 'wolfstar-agent/conflict-1', path: '/home/wolfstar/pkg/repo.conflict-1' }],
    })
  })

  it('rejects output that is not a supported worktree collection', () => {
    expect(parseWtWorktrees('{"worktrees":[]}')._tag).toBe('Err')
    expect(parseWtWorktrees('not json')._tag).toBe('Err')
  })
})
