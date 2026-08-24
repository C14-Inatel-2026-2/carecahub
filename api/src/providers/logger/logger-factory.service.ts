import { Injectable } from '@nestjs/common'
import { CorrelationIdService } from '@/providers/correlation-id'
import { CustomLogger } from './custom-logger.service'

/**
 * Factory service for creating CustomLogger instances
 * Automatically injects CorrelationIdService
 */
@Injectable()
export class LoggerFactory {
  constructor(private readonly correlationIdService: CorrelationIdService) {}

  /**
   * Create a new logger instance for a specific context (usually class name)
   * @param context The context/class name for the logger
   * @returns CustomLogger instance with correlation ID support
   *
   * @example
   * constructor(private readonly loggerFactory: LoggerFactory) {
   *   this.logger = this.loggerFactory.create(MyService.name);
   * }
   */
  create(context: string): CustomLogger {
    return new CustomLogger(context, this.correlationIdService)
  }
}
