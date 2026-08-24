import { mock } from 'node:test'
import { ExecutionContext } from '@nestjs/common'

const requestMock = mock.fn(() => ({ headers: { authorization: 'Bearer mock-token' } }))
const responseMock = mock.fn()

export const executionContextMock: ExecutionContext = {
  getHandler: mock.fn(),
  getClass: mock.fn(),
  getArgByIndex: mock.fn(),
  getArgs: mock.fn(),
  getType: mock.fn(),
  switchToRpc: mock.fn(),
  switchToWs: mock.fn(),
  switchToHttp: mock.fn(() => ({ getRequest: requestMock, getResponse: responseMock })),
}
