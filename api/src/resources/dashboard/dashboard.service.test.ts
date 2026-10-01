import assert from 'node:assert/strict'
import { afterEach, describe, it, vi } from 'vitest'
import { DashboardService } from './dashboard.service'

class QueryResult<T> implements PromiseLike<T> {
  constructor(private readonly result: T) {}
  from() {
    return this
  }
  innerJoin() {
    return this
  }
  where() {
    return this
  }
  // biome-ignore lint/suspicious/noThenProperty: query builders are intentionally awaitable
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

function createService(
  results: unknown[],
  getStats: (url: string, since: Date, until: Date) => Promise<unknown>,
) {
  const next = () => new QueryResult(results.shift())
  return new DashboardService(
    { db: { select: next } } as never,
    { getRepositoryDashboardStatsFromUrl: getStats } as never,
  )
}

afterEach(() => vi.useRealTimers())

describe('DashboardService.getDashboard', () => {
  it('aggregates database totals, recent activity, classrooms, ranking, and partial failures', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T15:00:00.000Z'))
    const service = createService(
      [
        [{ count: 12 }],
        [{ count: 4 }],
        [{ count: 3 }],
        [{ count: 2 }],
        [
          { id: 'repo-1', url: 'https://github.com/acme/one', projectId: 'p1', projectName: 'One' },
          { id: 'repo-2', url: 'https://github.com/acme/two', projectId: 'p2', projectName: 'Two' },
        ],
        [{ githubName: 'ada', classroom: 'A1' }],
      ],
      async (url) =>
        url.endsWith('/one')
          ? {
              success: true,
              historicalCommitCount: 10,
              recentCommits: [
                { sha: '1', authoredAt: '2026-09-10T12:00:00Z', authorLogin: 'ADA' },
                { sha: '2', authoredAt: '2026-09-11T12:00:00Z', authorLogin: null },
              ],
            }
          : { success: false, errKey: 'error', message: 'offline' },
    )

    const result = await service.getDashboard()

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(result.metrics, { students: 12, groups: 4, projects: 3, repositories: 2 })
    assert.equal(result.commitsByDay.length, 30)
    assert.deepEqual(result.commitsByDay[0], { date: '2026-09-01', count: 0 })
    assert.deepEqual(result.commitsByDay.at(-1), { date: '2026-09-30', count: 0 })
    assert.equal(result.commitsByDay.find(({ date }) => date === '2026-09-10')?.count, 1)
    assert.deepEqual(result.commitsByClassroom, [
      { classroom: 'A1', count: 1 },
      { classroom: 'Não identificada', count: 1 },
    ])
    assert.deepEqual(result.projectRanking, [
      { projectId: 'p1', projectName: 'One', commitCount: 10 },
      { projectId: 'p2', projectName: 'Two', commitCount: 0 },
    ])
    assert.equal(result.githubDataComplete, false)
  })

  it('processes at most five repositories concurrently', async () => {
    let active = 0
    let maximumActive = 0
    const repositories = Array.from({ length: 7 }, (_, index) => ({
      id: `repo-${index}`,
      url: `https://github.com/acme/${index}`,
      projectId: `p${index}`,
      projectName: `Project ${index}`,
    }))
    const service = createService(
      [[{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 7 }], repositories, []],
      async () => {
        active += 1
        maximumActive = Math.max(maximumActive, active)
        await new Promise((resolve) => setTimeout(resolve, 5))
        active -= 1
        return { success: true, historicalCommitCount: 0, recentCommits: [] }
      },
    )

    const result = await service.getDashboard()

    assert.equal(result.ok, true)
    assert.equal(maximumActive, 5)
  })
})
