import { Global, Module } from '@nestjs/common'
import { CustomLogger } from './custom-logger.service'
import { LoggerFactory } from './logger-factory.service'

@Global()
@Module({
  providers: [CustomLogger, LoggerFactory],
  exports: [CustomLogger, LoggerFactory],
})
export class LoggerModule {}
