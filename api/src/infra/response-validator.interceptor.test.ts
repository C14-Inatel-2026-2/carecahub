import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErrKeys } from '@/types'
import { throwErrKey } from './response-validator.interceptor'

describe('throwErrKey', () => {
  it('maps forbidden service results to HTTP 403', () => {
    assert.throws(
      () => throwErrKey('forbiddenErrKey' as ErrKeys),
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'getStatus' in error &&
        typeof error.getStatus === 'function' &&
        error.getStatus() === 403,
    )
  })
})
