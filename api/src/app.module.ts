import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { ApiSecretGuard } from './infra/api-key.guard'
import { AllExceptionsFilter } from './infra/exceptions.filter'
import { LoggingInterceptor } from './infra/logging.interceptor'
import { ResponseValidatorInterceptor } from './infra/response-validator.interceptor'
import { CacheModule } from './providers/cache/cache.module'
import { CorrelationIdInterceptor, CorrelationIdModule } from './providers/correlation-id'
import { DatabaseModule } from './providers/database/database.module'
import { LoggerModule } from './providers/logger/logger.module'
import { MailModule } from './providers/mail/mail.module'
import { AuthModule } from './resources/auth/auth.module'
import { PostsModule } from './resources/posts/post.module'
import { UsersModule } from './resources/users/user.module'

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    CorrelationIdModule,
    LoggerModule,
    MailModule,
    AuthModule,
    PostsModule,
    UsersModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 30,
      },
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 300,
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 10000,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AllExceptionsFilter,
    CorrelationIdInterceptor,
    LoggingInterceptor,
    ResponseValidatorInterceptor,
    ApiSecretGuard,
  ],
})
export class AppModule {}
