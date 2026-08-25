import { Global, Module } from '@nestjs/common'
import { DrizzleService } from './drizzle.service'

@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
@Global()
export class DatabaseModule {}
