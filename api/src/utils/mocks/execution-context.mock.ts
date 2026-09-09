import { ExecutionContext } from '@nestjs/common'
import { vi } from 'vitest'

const requestMock = vi.fn(() => ({ headers: { authorization: 'Bearer mock-token' } }))
const responseMock = vi.fn()

export const executionContextMock: ExecutionContext = {
  getHandler: vi.fn(),
  getClass: vi.fn(),
  getArgByIndex: vi.fn(),
  getArgs: vi.fn(),
  getType: vi.fn(),
  switchToRpc: vi.fn(),
  switchToWs: vi.fn(),
  switchToHttp: vi.fn(
    () =>
      ({
        getRequest: requestMock,
        getResponse: responseMock,
        getNext: vi.fn(),
      }) as ReturnType<ExecutionContext['switchToHttp']>,
  ) as ExecutionContext['switchToHttp'],
}
