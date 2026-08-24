import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, exceptionsDictionary } from '@/types'

interface Response {
  ok: boolean
  errKey?: ErrKeys
  data?: unknown
}

export function throwErrKey(errKey: ErrKeys) {
  const { message, friendlyMessage, type } = exceptionsDictionary[errKey]

  switch (type) {
    case 'bad_request':
      throw new BadRequestException({
        message,
        friendlyMessage,
        errKey,
      })
    case 'unauthorized':
      throw new UnauthorizedException({
        message,
        friendlyMessage,
        errKey,
      })
    case 'not_found':
      throw new NotFoundException({
        message,
        friendlyMessage,
        errKey,
      })
    case 'conflict':
      throw new ConflictException({
        message,
        friendlyMessage,
        errKey,
      })
    case 'internal_server_error':
      throw new InternalServerErrorException({
        message,
        friendlyMessage,
        errKey,
      })
    default:
      throw new InternalServerErrorException({
        message: 'Invalid error type',
        friendlyMessage: 'Internal server error',
        errKey: ErrKeys.internalServerError,
      })
  }
}

@Injectable()
export class ResponseValidatorInterceptor implements NestInterceptor {
  private readonly logger: CustomLogger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(ResponseValidatorInterceptor.name)
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<Response> {
    return next.handle().pipe(
      map((response: Response) => {
        if (response === undefined || response === null || typeof response !== 'object') {
          return response
        }

        if (response.ok === false) {
          if (!response.errKey) {
            this.logger.error({
              message: 'Response indicates failure but no errKey was provided',
              response,
            })
            throw new InternalServerErrorException({
              message: 'Invalid response format',
              friendlyMessage: 'Erro interno do servidor',
            })
          }

          throwErrKey(response.errKey)
        }

        return response
      }),
    )
  }
}
