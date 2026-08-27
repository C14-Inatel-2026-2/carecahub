import type { Mock } from 'node:test'
import { mock } from 'node:test'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Cacheable } from 'cacheable'
import { BucketService } from '@/providers/bucket/bucket.service'
import { CacheService } from '@/providers/cache/cache.service'
import { CACHE_INSTANCE } from '@/providers/cache/cache.types'
import { CorrelationIdService } from '@/providers/correlation-id'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { MailService } from '@/providers/mail/mail.service'
import { AuthService } from '@/resources/auth/auth.service'

type MockFunction = Mock<(...args: never[]) => unknown>

// biome-ignore lint/suspicious/noExplicitAny: cant infer any here
export type Constructor<T> = new (...args: any[]) => T

function prepareMock<T>(c: Constructor<T>): T {
  // biome-ignore lint/suspicious/noExplicitAny: cant infer any here
  const mock: any = {}

  for (const key of Object.getOwnPropertyNames(c.prototype)) {
    const value = c.prototype[key as keyof T]
    if (typeof value === 'function') {
      mock[key as keyof T] = globalThisMock()
    }
  }

  return mock
}

function globalThisMock(): MockFunction {
  return mock.fn() as MockFunction
}

// Providers
export const BucketServiceMock = prepareMock<BucketService>(BucketService)
export const CacheServiceMock = prepareMock<CacheService>(CacheService)
export const MailServiceMock = prepareMock<MailService>(MailService)

// Resources

export const AuthServiceMock = prepareMock<AuthService>(AuthService)
export const JwtServiceMock = prepareMock<JwtService>(JwtService)
export const CacheManagerMock: Cacheable = prepareMock<Cacheable>(Cacheable)
export const ReflectorMock = prepareMock<Reflector>(Reflector)

export interface CorrelationIdServiceMockType {
  getCorrelationId: MockFunction
  getContext: MockFunction
  generateId: MockFunction
  run: MockFunction
  updateContext: MockFunction
}

export const CorrelationIdServiceMock: CorrelationIdServiceMockType = {
  getCorrelationId: mock.fn(() => undefined) as MockFunction,
  getContext: mock.fn(() => undefined) as MockFunction,
  generateId: mock.fn(() => 'mock-correlation-id') as MockFunction,
  run: globalThisMock(),
  updateContext: globalThisMock(),
}

export const DrizzleServiceMock = {
  db: {
    select: globalThisMock(),
    insert: globalThisMock(),
    update: globalThisMock(),
  },
  users: {
    table: {},
    columns: {},
    publicColumns: {},
    authColumns: {},
    passwordColumns: {},
    select: globalThisMock(),
    insert: globalThisMock(),
    update: globalThisMock(),
  },
  posts: {
    table: {},
    columns: {},
    select: globalThisMock(),
    insert: globalThisMock(),
    update: globalThisMock(),
  },
  bucketFiles: {
    table: {},
    columns: {},
    select: globalThisMock(),
    insert: globalThisMock(),
    update: globalThisMock(),
  },
  systemParams: {
    table: {},
    columns: {},
    select: globalThisMock(),
    insert: globalThisMock(),
    update: globalThisMock(),
  },
}

export const serviceMocks = [
  { provide: JwtService, useValue: JwtServiceMock },
  { provide: CorrelationIdService, useValue: CorrelationIdServiceMock },
  { provide: MailService, useValue: MailServiceMock },
  { provide: AuthService, useValue: AuthServiceMock },
  { provide: DrizzleService, useValue: DrizzleServiceMock },
  { provide: CACHE_INSTANCE, useValue: CacheManagerMock },
  { provide: Reflector, useValue: ReflectorMock },
  { provide: BucketService, useValue: BucketServiceMock },
  { provide: CacheService, useValue: CacheServiceMock },
  {
    provide: LoggerFactory,
    useValue: {
      create: () => new CustomLogger('Test'),
    },
  },
]
