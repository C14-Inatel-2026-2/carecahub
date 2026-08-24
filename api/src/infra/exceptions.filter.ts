import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { CorrelationIdService } from '@/providers/correlation-id'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys } from '@/types'

export interface CustomException {
  response?: {
    errKey?: string
    message?: string
    friendlyMessage?: string
  }
  name?: string
  message?: string
  status?: number
}

// {
//   "response": {
//       "message": "Email already registered",
//       "friendlyMessage": "Email já cadastrado",
//       "errKey": "emailAlreadyExistsErrKey"
//   },
//   "status": 409,
//   "options": {},
//   "message": "Email already registered",
//   "name": "ConflictException"
// }

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: CustomLogger

  constructor(
    loggerFactory: LoggerFactory,
    private readonly correlationIdService: CorrelationIdService,
  ) {
    this.logger = loggerFactory.create(AllExceptionsFilter.name)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.

    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    // const status = exception.getStatus();

    const correlationId = this.correlationIdService.getCorrelationId()

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse = (exception as CustomException)?.response

    const isServerError = statusCode >= 500
    const backupErrKey = statusCode > 499 ? ErrKeys.internalServerError : ErrKeys.badRequest

    const summary = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      errKey: exceptionResponse?.errKey || backupErrKey,
      message: exceptionResponse?.message || 'Internal server error',
      friendlyMessage: exceptionResponse?.friendlyMessage || 'Tente novamente mais tarde',
    }

    const serverErrorSummary = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      errKey: ErrKeys.internalServerError,
      message: 'Internal server error',
      friendlyMessage: 'Tente novamente mais tarde',
    }

    const exceptionDetails =
      exception instanceof Error
        ? { name: exception.name, message: exception.message, stack: exception.stack }
        : exception

    this.logger.error({
      exception: JSON.stringify(exceptionDetails),
      summary: JSON.stringify(summary),
    })

    response.status(statusCode).json(isServerError ? serverErrorSummary : summary)
  }
}
