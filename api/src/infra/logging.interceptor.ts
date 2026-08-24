import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: CustomLogger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(LoggingInterceptor.name)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
    const { method, url, user, headers } = context.switchToHttp().getRequest<Request>()

    this.logger.log(`Starting request "${method} ${url}"`)

    const now = Date.now()
    return next.handle().pipe(
      tap(() =>
        this.logger.log({
          message: 'successful-request',
          userId: user?.userId || undefined,
          origin: headers.origin,
          role: user?.role || undefined,
          method,
          url,
          spent: `${Date.now() - now}ms`,
        }),
      ),
    )
  }
}
