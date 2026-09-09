import { InjectionToken } from '@nestjs/common'
import { vi } from 'vitest'
import { serviceMocks } from './services.mock'

export function handleModuleDependencies(token?: InjectionToken) {
  const existentMock = serviceMocks.find((svc) => svc.provide === token)
  if (existentMock) return existentMock.useValue

  if (typeof token === 'function') return vi.fn()
}
