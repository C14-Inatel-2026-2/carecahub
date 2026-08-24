import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'

export interface CorrelationContext {
  correlationId: string
  timestamp: number
  userId?: string
  role?: string
}

@Injectable()
export class CorrelationIdService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>()

  /**
   * Run a function with correlation context
   */
  run<T>(context: CorrelationContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn)
  }

  /**
   * Generate a new correlation ID
   */
  generateId(): string {
    return randomUUID()
  }

  /**
   * Get the current correlation ID from context
   */
  getCorrelationId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.correlationId
  }

  /**
   * Get the full correlation context
   */
  getContext(): CorrelationContext | undefined {
    return this.asyncLocalStorage.getStore()
  }

  /**
   * Update the current context with additional data
   */
  updateContext(updates: Partial<Omit<CorrelationContext, 'correlationId' | 'timestamp'>>): void {
    const currentContext = this.asyncLocalStorage.getStore()
    if (currentContext) {
      Object.assign(currentContext, updates)
    }
  }
}
