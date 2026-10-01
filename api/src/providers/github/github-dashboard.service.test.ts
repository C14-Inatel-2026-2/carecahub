import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { GitHubService } from './github.service'

type GitHubResponse = { data: unknown; headers?: Record<string, string> }

function createService(responses: Record<string, GitHubResponse>) {
  const requestedPaths: string[] = []
  const service = new GitHubService({ info() {}, error() {} } as never)
  Object.assign(service, {
    axios: {
      get: async (path: string) => {
        requestedPaths.push(path)
        const response = responses[path]
        if (!response) throw new Error(`Unexpected GitHub request: ${path}`)
        return { headers: {}, ...response }
      },
    },
  })
  return { service, requestedPaths }
}

describe('GitHubService.getRepositoryDashboardStatsFromUrl', () => {
  it('returns historical count and paginated recent commits with nullable authors', async () => {
    const since = new Date('2026-09-01T03:00:00.000Z')
    const until = new Date('2026-10-01T02:59:59.999Z')
    const recentPath =
      '/repos/acme/api/commits?sha=main&since=2026-09-01T03%3A00%3A00.000Z&until=2026-10-01T02%3A59%3A59.999Z&per_page=100'
    const nextPage = `${recentPath}&page=2`
    const { service, requestedPaths } = createService({
      '/repos/acme/api': { data: { default_branch: 'main' } },
      '/repos/acme/api/commits?sha=main&per_page=1': {
        data: [{ sha: 'head' }],
        headers: { link: '<https://api.github.com/commits?page=250>; rel="last"' },
      },
      [recentPath]: {
        data: [
          {
            sha: 'one',
            author: { login: 'Ada' },
            commit: { author: { date: '2026-09-10T12:00:00Z' } },
          },
        ],
        headers: { link: `<${nextPage}>; rel="next"` },
      },
      [nextPage]: {
        data: [
          {
            sha: 'two',
            author: null,
            commit: { author: { date: '2026-09-11T12:00:00Z' } },
          },
        ],
      },
    })

    const result = await service.getRepositoryDashboardStatsFromUrl(
      'https://github.com/acme/api',
      since,
      until,
    )

    assert.deepEqual(requestedPaths, [
      '/repos/acme/api',
      '/repos/acme/api/commits?sha=main&per_page=1',
      recentPath,
      nextPage,
    ])
    assert.deepEqual(result, {
      success: true,
      historicalCommitCount: 250,
      recentCommits: [
        { sha: 'one', authoredAt: '2026-09-10T12:00:00Z', authorLogin: 'Ada' },
        { sha: 'two', authoredAt: '2026-09-11T12:00:00Z', authorLogin: null },
      ],
    })
  })

  it('returns a failure without partial statistics when GitHub is unavailable', async () => {
    const service = new GitHubService({ info() {}, error() {} } as never)
    Object.assign(service, { axios: { get: async () => Promise.reject(new Error('offline')) } })

    const result = await service.getRepositoryDashboardStatsFromUrl(
      'https://github.com/acme/api',
      new Date('2026-09-01T00:00:00Z'),
      new Date('2026-09-30T23:59:59Z'),
    )

    assert.equal(result.success, false)
  })
})
