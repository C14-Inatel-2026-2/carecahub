import { Global, Module } from '@nestjs/common'

import { BucketController } from './bucket.controller'
import { BucketService } from './bucket.service'

@Global()
@Module({
  controllers: [BucketController],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
