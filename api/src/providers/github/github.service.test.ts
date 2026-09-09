import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { GitHubService } from './github.service'

type GitHubResponse = {
  data: unknown
  headers?: Record<string, string>
}

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

describe('GitHubService.getRepositoryFromUrl', () => {
  it('gets repository details after parsing a GitHub URL', async () => {
    const details = {
      id: 1,
      name: 'api',
      full_name: 'acme/api',
      private: false,
      default_branch: 'main',
    }
    const { service, requestedPaths } = createService({
      '/repos/acme/api': { data: details },
      '/repos/acme/api/branches?per_page=100': {
        data: [
          { name: 'main', protected: true },
          { name: 'feature/example', protected: false },
        ],
      },
      '/repos/acme/api/commits?sha=main&per_page=1': {
        data: [{ sha: 'main-head' }],
        headers: {
          link: '<https://api.github.com/repositories/1/commits?sha=main&per_page=1&page=42>; rel="last"',
        },
      },
      '/repos/acme/api/commits?sha=feature%2Fexample&per_page=1': {
        data: [{ sha: 'feature-head' }],
        headers: {
          link: '<https://api.github.com/repositories/1/commits?sha=feature%2Fexample&per_page=1&page=7>; rel="last"',
        },
      },
    })

    const result = await service.getRepositoryFromUrl('https://github.com/acme/api.git/')

    assert.deepEqual(requestedPaths, [
      '/repos/acme/api',
      '/repos/acme/api/branches?per_page=100',
      '/repos/acme/api/commits?sha=main&per_page=1',
      '/repos/acme/api/commits?sha=feature%2Fexample&per_page=1',
    ])
    assert.deepEqual(result, {
      success: true,
      ...details,
      commitCount: 42,
      branches: [
        { name: 'main', protected: true, default: true, commitCount: 42 },
        { name: 'feature/example', protected: false, default: false, commitCount: 7 },
      ],
    })
  })

  it('rejects a GitHub URL containing a query string', async () => {
    const { service, requestedPaths } = createService({})

    const result = await service.getRepositoryFromUrl(
      'https://github.com/acme/api?access_token=secret',
    )

    assert.equal(result.success, false)
    assert.deepEqual(requestedPaths, [])
  })

  it('counts branches returned on subsequent GitHub pages', async () => {
    const nextBranchesPage = 'https://api.github.com/repos/acme/api/branches?per_page=100&page=2'
    const { service } = createService({
      '/repos/acme/api': {
        data: {
          id: 1,
          name: 'api',
          full_name: 'acme/api',
          private: false,
          default_branch: 'main',
        },
      },
      '/repos/acme/api/branches?per_page=100': {
        data: [{ name: 'main', protected: true }],
        headers: { link: `<${nextBranchesPage}>; rel="next"` },
      },
      [nextBranchesPage]: {
        data: [{ name: 'release', protected: false }],
      },
      '/repos/acme/api/commits?sha=main&per_page=1': {
        data: [{ sha: 'main-head' }],
      },
      '/repos/acme/api/commits?sha=release&per_page=1': {
        data: [],
      },
    })

    const result = await service.getRepositoryFromUrl('https://github.com/acme/api')

    assert.equal(result.success, true)
    if (!result.success) return
    assert.deepEqual(result.branches, [
      { name: 'main', protected: true, default: true, commitCount: 1 },
      { name: 'release', protected: false, default: false, commitCount: 0 },
    ])
  })

  it('limits simultaneous commit count requests', async () => {
    const service = new GitHubService({ info() {}, error() {} } as never)
    const repositoryBranches = Array.from({ length: 12 }, (_, index) => ({
      name: `branch-${index}`,
      protected: false,
    }))
    let activeCommitRequests = 0
    let maximumActiveCommitRequests = 0

    Object.assign(service, {
      axios: {
        get: async (path: string) => {
          if (path === '/repos/acme/api') {
            return {
              data: {
                id: 1,
                name: 'api',
                full_name: 'acme/api',
                private: false,
                default_branch: 'branch-0',
              },
              headers: {},
            }
          }
          if (path === '/repos/acme/api/branches?per_page=100') {
            return { data: repositoryBranches, headers: {} }
          }

          activeCommitRequests += 1
          maximumActiveCommitRequests = Math.max(maximumActiveCommitRequests, activeCommitRequests)
          await new Promise((resolve) => setTimeout(resolve, 5))
          activeCommitRequests -= 1
          return { data: [{ sha: 'head' }], headers: {} }
        },
      },
    })

    const result = await service.getRepositoryFromUrl('https://github.com/acme/api')

    assert.equal(result.success, true)
    assert.equal(maximumActiveCommitRequests <= 5, true)
  })
})
