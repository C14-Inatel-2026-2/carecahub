import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { env } from '@/providers/config/env'
import { AuthService } from '@/resources/auth/auth.service'
import { headersDictionary } from '@/types'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const accessToken = this.extractTokenFromCookie(request)

    try {
      if (!accessToken) {
        if (isPublic) {
          return true
        }
        throw new UnauthorizedException()
      }
      const payload = await this.jwtService.verifyAsync(accessToken, { secret: env.JWT_SECRET })
      request.user = payload
    } catch {
      // Try to refresh token automatically
      const refreshToken = this.extractRefreshTokenFromCookie(request)
      if (refreshToken) {
        try {
          const refreshedTokens = await this.authService.refresh({ oldRefreshToken: refreshToken })
          this.authService.setResponseWithTokens(response, refreshedTokens)

          const payload = await this.jwtService.verifyAsync(refreshedTokens.accessToken, {
            secret: env.JWT_SECRET,
          })
          request.user = payload
          return true
        } catch {
          // Refresh failed, clear cookies
          this.authService.clearTokenCookies(response)
          return Boolean(isPublic)
        }
      }

      return Boolean(isPublic)
    }
    return true
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[headersDictionary.accessToken]
  }

  private extractRefreshTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[headersDictionary.refreshToken]
  }
}
