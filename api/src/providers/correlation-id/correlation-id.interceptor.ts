import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { CorrelationIdService } from './correlation-id.service'

/**
 * Interceptor that generates and maintains correlation IDs across requests
 * Uses AsyncLocalStorage to maintain context without passing IDs explicitly
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly correlationIdService: CorrelationIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    // Try to get correlation ID from header, otherwise generate new one
    const correlationId =
      (request.headers['x-correlation-id'] as string) || this.correlationIdService.generateId()

    // Set correlation ID in response header
    response.setHeader('X-Correlation-Id', correlationId)

    // Run the request handler within correlation context
    return new Observable((observer) => {
      this.correlationIdService.run(
        {
          correlationId,
          timestamp: Date.now(),
          userId: request.user?.userId,
          role: request.user?.role,
        },
        () => {
          const subscription = next.handle().subscribe({
            next: (value) => observer.next(value),
            error: (error) => observer.error(error),
            complete: () => observer.complete(),
          })

          return () => subscription.unsubscribe()
        },
      )
    })
  }
}
