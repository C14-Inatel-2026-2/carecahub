import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import { CorrelationIdService } from '@/providers/correlation-id'

/**
 * Custom logger that automatically includes correlation ID in all log messages
 * Usage: this.logger = new CustomLogger(MyClass.name);
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  constructor(
    context: string = 'Application',
    private readonly correlationIdService?: CorrelationIdService,
  ) {
    super(
      context,
      process.env.PRETTY_LOG === 'true'
        ? { colors: true, json: false, timestamp: true }
        : { colors: false, json: true, compact: true },
    )
  }

  /**
   * Enhances log message with correlation ID if available
   */
  private enhanceMessage(message: unknown): unknown {
    if (!this.correlationIdService) {
      return message
    }

    const correlationId = this.correlationIdService.getCorrelationId()

    // If message is already an object, add correlationId to it
    if (typeof message === 'object' && message !== null) {
      return { correlationId, ...message }
    }

    // If message is a string, return object with correlationId
    if (typeof message === 'string') {
      return { correlationId, message }
    }

    // For other types, wrap in object
    return { correlationId, data: message }
  }

  log(message: unknown, context?: string) {
    if (
      context === 'RouterExplorer' ||
      context === 'InstanceLoader' ||
      context === 'RoutesResolver'
    ) {
      return
    }
    super.log(this.enhanceMessage(message), context || this.context)
  }

  info(message: unknown, context?: string) {
    super.log(this.enhanceMessage(message), context || this.context)
  }

  error(message: unknown, stackOrContext?: string, context?: string) {
    super.error(this.enhanceMessage(message), stackOrContext, context || this.context)
  }

  warn(message: unknown, context?: string) {
    super.warn(this.enhanceMessage(message), context || this.context)
  }

  debug(message: unknown, context?: string) {
    super.debug(this.enhanceMessage(message), context || this.context)
  }

  verbose(message: unknown, context?: string) {
    super.verbose(this.enhanceMessage(message), context || this.context)
  }

  fatal(message: unknown, context?: string) {
    super.fatal(this.enhanceMessage(message), context || this.context)
  }
}
