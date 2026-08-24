import { mock } from 'node:test'
import { InjectionToken } from '@nestjs/common'
import { serviceMocks } from './services.mock'

export function handleModuleDependencies(token?: InjectionToken) {
  const existentMock = serviceMocks.find((svc) => svc.provide === token)
  if (existentMock) return existentMock.useValue

  if (typeof token === 'function') return mock.fn()
}
