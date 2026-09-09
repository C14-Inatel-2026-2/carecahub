import assert from 'node:assert/strict'
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { beforeEach, describe, it, vi } from 'vitest'
import { CorrelationIdService } from '@/providers/correlation-id'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys } from '@/types'
import { AllExceptionsFilter } from './exceptions.filter'

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter
  let mockArgumentsHost: ArgumentsHost
  let status: ReturnType<typeof vi.fn>
  let json: ReturnType<typeof vi.fn>

  beforeEach(() => {
    const response: Partial<Response> = {}
    status = vi.fn(() => response)
    json = vi.fn()
    response.status = status as unknown as Response['status']
    response.json = json as unknown as Response['json']

    mockArgumentsHost = {
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({ method: 'GET', url: '/test-endpoint' }) as Partial<Request>),
        getResponse: vi.fn(() => response),
      })),
    } as unknown as ArgumentsHost

    const loggerFactory = { create: vi.fn(() => ({ error: vi.fn() })) }
    const correlationIdService = { getCorrelationId: vi.fn(() => undefined) }
    filter = new AllExceptionsFilter(
      loggerFactory as unknown as LoggerFactory,
      correlationIdService as unknown as CorrelationIdService,
    )
  })

  function assertResponse(statusCode: HttpStatus, expected: Record<string, unknown>) {
    assert.deepStrictEqual(status.mock.calls[0], [statusCode])
    const body = json.mock.calls[0][0] as Record<string, unknown>
    assert.deepStrictEqual(
      Object.fromEntries(Object.keys(expected).map((key) => [key, body[key]])),
      expected,
    )
    assert.strictEqual(typeof body.timestamp, 'string')
  }

  it('should be defined', () => {
    assert.ok(filter)
  })

  it('should handle HttpException correctly', () => {
    filter.catch(new HttpException('Bad request', HttpStatus.BAD_REQUEST), mockArgumentsHost)

    assertResponse(HttpStatus.BAD_REQUEST, {
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/test-endpoint',
      errKey: ErrKeys.badRequest,
      message: 'Internal server error',
      friendlyMessage: 'Tente novamente mais tarde',
    })
  })

  it('should handle unknown exceptions with fallback values', () => {
    filter.catch(new Error('Unexpected error'), mockArgumentsHost)

    assertResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: '/test-endpoint',
      errKey: ErrKeys.internalServerError,
      message: 'Internal server error',
      friendlyMessage: 'Tente novamente mais tarde',
    })
  })

  it('should use badRequest errKey for 4xx status codes', () => {
    filter.catch(
      new HttpException('Validation failed', HttpStatus.UNPROCESSABLE_ENTITY),
      mockArgumentsHost,
    )

    assertResponse(HttpStatus.UNPROCESSABLE_ENTITY, {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errKey: ErrKeys.badRequest,
    })
  })

  it('should preserve custom 4xx response details', () => {
    const exception = new HttpException(
      {
        message: 'Custom error message',
        errKey: ErrKeys['userNotFound' as keyof ErrKeys],
        friendlyMessage: 'Usuário não encontrado',
      },
      HttpStatus.NOT_FOUND,
    )
    filter.catch(exception, mockArgumentsHost)

    assertResponse(HttpStatus.NOT_FOUND, {
      statusCode: HttpStatus.NOT_FOUND,
      path: '/test-endpoint',
      errKey: ErrKeys.badRequest,
      message: exception.message,
      friendlyMessage: 'Usuário não encontrado',
    })
  })

  it('should not expose custom server error details', () => {
    filter.catch(
      new HttpException(
        {
          message: 'Cannot create customer',
          errKey: ErrKeys['cannotCreateCustomer' as keyof ErrKeys],
          friendlyMessage: 'Não foi possível criar o cliente',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      mockArgumentsHost,
    )

    assertResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errKey: ErrKeys.internalServerError,
      message: 'Internal server error',
      friendlyMessage: 'Tente novamente mais tarde',
    })
  })
})
