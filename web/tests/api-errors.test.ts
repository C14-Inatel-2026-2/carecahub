import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiErrorMessages, getApiErrorMessage } from '../src/api/errors'
import { writer } from '../src/api/writer'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

afterEach(() => vi.unstubAllGlobals())

describe('API error messages', () => {
  it('maps every known error to user-facing text', () => {
    for (const [errKey, message] of Object.entries(apiErrorMessages)) {
      expect(getApiErrorMessage({ errKey })).toBe(message)
      expect(message).not.toContain('ErrKey')
    }
  })

  it('handles unknown keys and HTTP permission errors safely', () => {
    expect(getApiErrorMessage({ errKey: 'technical-stack-trace' })).toBe(
      'Não foi possível concluir a ação. Tente novamente.'
    )
    expect(getApiErrorMessage({ errKey: 'toString' })).toBe(
      'Não foi possível concluir a ação. Tente novamente.'
    )
    expect(getApiErrorMessage({ statusCode: 403 })).toBe(apiErrorMessages.forbiddenErrKey)
  })

  it('converts an API validation error instead of exposing its technical message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errKey: 'alreadyExistsErrKey',
            message: 'duplicate key constraint',
            friendlyMessage: 'SQL error',
          }),
          { status: 409 }
        )
      )
    )
    const result = await writer('POST /groups', { body: { friendlyId: 'Grupo' }, silent: true })
    expect(result).toEqual({
      ok: false,
      error: {
        errKey: 'alreadyExistsErrKey',
        message: apiErrorMessages.alreadyExistsErrKey,
        friendlyMessage: apiErrorMessages.alreadyExistsErrKey,
      },
    })
  })

  it('keeps a forbidden response available for inline presentation', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ errKey: 'forbiddenErrKey' }), { status: 403 })
        )
    )
    const result = await writer('POST /groups', { body: { friendlyId: 'Grupo' }, silent: true })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toBe(apiErrorMessages.forbiddenErrKey)
  })

  it('explains network failure without exposing the browser exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const result = await writer('POST /groups', { body: { friendlyId: 'Grupo' }, silent: true })
    if (result.ok) throw new Error('Expected failure')
    expect(result.error.message).toBe(apiErrorMessages.NETWORK_ERROR)
  })
})
