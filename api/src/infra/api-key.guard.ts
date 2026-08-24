import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { env } from '@/providers/config/env'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class ApiSecretGuard implements CanActivate {
  private readonly logger: CustomLogger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(ApiSecretGuard.name)
  }

  canActivate(context: ExecutionContext) {
    const secret = env.API_SECRET

    const token = this.extractSecretFromHeader(context.switchToHttp().getRequest())

    if (!secret) {
      this.logger.debug({
        message: 'API Secret not found in environment',
        hasSecret: !!secret,
        hasToken: !!token,
      })
      return false
    }

    if (!token || token !== secret) {
      this.logger.debug({
        message: 'API Secret not valid',
        hasToken: !!token,
      })
      return false
    }

    return true
  }

  extractSecretFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}

export function ApiSecret() {
  return applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), UseGuards(ApiSecretGuard))
}
