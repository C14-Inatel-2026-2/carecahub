import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { GitHubService } from './github.service'

function createService(response: unknown) {
  const requestedPaths: string[] = []
  const service = new GitHubService({ info() {}, error() {} } as never)
  Object.assign(service, {
    axios: {
      get: async (path: string) => {
        requestedPaths.push(path)
        return { data: response }
      },
    },
  })
  return { service, requestedPaths }
}

describe('GitHubService.getRepositoryFromUrl', () => {
  it('gets repository details after parsing a GitHub URL', async () => {
    const details = { id: 1, name: 'api', full_name: 'acme/api', private: false }
    const { service, requestedPaths } = createService(details)

    const result = await service.getRepositoryFromUrl('https://github.com/acme/api.git/')

    assert.deepEqual(requestedPaths, ['/repos/acme/api'])
    assert.deepEqual(result, { success: true, ...details })
  })

  it('rejects a GitHub URL containing a query string', async () => {
    const { service, requestedPaths } = createService({ id: 1 })

    const result = await service.getRepositoryFromUrl(
      'https://github.com/acme/api?access_token=secret',
    )

    assert.equal(result.success, false)
    assert.deepEqual(requestedPaths, [])
  })
})
