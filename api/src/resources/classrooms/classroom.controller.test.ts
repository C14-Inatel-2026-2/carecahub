import 'reflect-metadata'
import { describe, expect, it, vi } from 'vitest'
import { IS_PUBLIC_KEY } from '@/infra/public.decorator'
import { ClassroomController } from './classroom.controller'

describe('ClassroomController', () => {
  it('exposes public registration options before the dynamic room route', () => {
    const service = {
      findRegistrationOptions: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      archive: vi.fn(),
    }
    const controller = new ClassroomController(service as never)

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.registrationOptions)).toBe(true)
    expect(Object.getOwnPropertyNames(ClassroomController.prototype)).toEqual([
      'constructor',
      'registrationOptions',
      'findAll',
      'findOne',
      'create',
      'archive',
    ])
  })
})
