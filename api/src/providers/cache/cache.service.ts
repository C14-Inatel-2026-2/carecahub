import { Inject, Injectable } from '@nestjs/common'
import { Cacheable } from 'cacheable'
import { env } from '@/providers/config/env'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ONE_MINUTE_IN_MS } from '@/types'
import { CACHE_INSTANCE, CacheKey, CachePayloads } from './cache.types'

@Injectable()
export class CacheService {
  private readonly logger: CustomLogger

  constructor(
    @Inject(CACHE_INSTANCE) private readonly cache: Cacheable,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(CacheService.name)
  }

  private getScopedKey(key: CacheKey, scope?: string) {
    return scope ? `${env.ENV_SCOPE}:${key}:${scope}` : `${env.ENV_SCOPE}:${key}`
  }

  get<K extends CacheKey>({ key, scope }: { key: K; scope?: string }) {
    const builtKey = this.getScopedKey(key, scope)

    this.logger.log(`Trying to get cache key ${builtKey}`)
    return this.cache.get<CachePayloads[K]>(builtKey)
  }

  set<K extends CacheKey>({
    key,
    scope,
    value,
    ttl,
  }: {
    key: K
    scope?: string
    value: CachePayloads[K]
    ttl?: number
  }) {
    const builtKey = this.getScopedKey(key, scope)
    this.logger.log(`Setting cache key ${builtKey} with ttl ${ttl || ONE_MINUTE_IN_MS}`)

    return this.cache.set(builtKey, value, ttl || ONE_MINUTE_IN_MS)
  }

  delete({ key, scope }: { key: CacheKey; scope?: string }) {
    const builtKey = this.getScopedKey(key, scope)
    this.logger.log(`Deleting cache key ${builtKey}`)
    return this.cache.delete(builtKey)
  }

  reset() {
    this.logger.log('Resetting all cache')
    return this.cache.clear()
  }
}
