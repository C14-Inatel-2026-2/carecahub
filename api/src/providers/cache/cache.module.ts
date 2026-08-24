import { createKeyv } from '@keyv/redis'
import { Global, Module } from '@nestjs/common'
import { Cacheable } from 'cacheable'
import { env } from '@/providers/config/env'
import { ONE_HOUR_IN_MS } from '@/types'
import { CacheService } from './cache.service'
import { CACHE_INSTANCE } from './cache.types'

@Module({
  providers: [
    {
      provide: CACHE_INSTANCE,
      useFactory: () => {
        const secondary = createKeyv(env.CACHE_ADDR)
        return new Cacheable({ secondary, ttl: ONE_HOUR_IN_MS })
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
@Global()
export class CacheModule {}
