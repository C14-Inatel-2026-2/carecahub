import { randomBytes } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CookieOptions, Request as ExpressRequest, Response } from 'express'
import { CacheService } from '@/providers/cache/cache.service'
import { CacheKey } from '@/providers/cache/cache.types'
import { env } from '@/providers/config/env'
import { PrismaService } from '@/providers/database/prisma.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { MailService } from '@/providers/mail/mail.service'
import {
  ErrKeys,
  headersDictionary,
  ONE_DAY_IN_MS,
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_MS,
  ONE_MINUTE_IN_SECONDS,
  ServiceOutput,
  UserMetadata,
} from '@/types'
import { comparePassword, hashPassword } from '@/utils/password'
import { IAuthService } from './auth.interface'
import { LoginDto, LoginResponseDto, LogoutDto, TwoFactorAuthDto } from './dtos/login.dto'
import { GetMeDto, UpdateMeDto } from './dtos/me.dto'
import { ChangePasswordDto, RecoverPasswordDto, ResetPasswordDto } from './dtos/password.dto'
import { AuthTokens, RefreshTokenDto } from './dtos/tokens.dto'

const sameSiteDict: Record<typeof env.ENV_SCOPE, CookieOptions['sameSite']> = {
  local: 'lax',
  test: 'lax',
  development: 'none',
  production: 'strict',
}

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger: CustomLogger
  readonly jwtTTL = ONE_MINUTE_IN_SECONDS
  readonly refreshTokenTTL = ONE_DAY_IN_SECONDS
  readonly cacheTTL = ONE_DAY_IN_MS
  constructor(
    private database: PrismaService,
    private cache: CacheService,
    private jwtService: JwtService,
    private mailService: MailService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(AuthService.name)
  }

  private toLoggedUser(user: {
    id: string
    name: string
    email: string
    role: import('@/providers/database/generated/prisma/enums').user_role
    status: import('@/providers/database/generated/prisma/enums').user_status
    two_factor: boolean
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
  }): GetMeDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactor: user.two_factor,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at ?? undefined,
    }
  }

  async prepareNewTokens(_userId: string, payload: UserMetadata): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload, {
      secret: env.JWT_SECRET,
      expiresIn: this.jwtTTL,
    })
    const refreshToken = this.jwtService.sign(payload, {
      secret: env.JWT_SECRET,
      expiresIn: this.refreshTokenTTL,
    })

    return { accessToken, refreshToken }
  }

  setResponseWithTokens(res: Response, { accessToken, refreshToken }: AuthTokens) {
    const isProduction = env.ENV_SCOPE === 'production'
    const domain = isProduction ? new URL(env.DOMAIN_URL ?? env.API_URL).hostname : undefined

    const cookieConfig: CookieOptions = {
      domain,
      sameSite: sameSiteDict[env.ENV_SCOPE],
      secure: isProduction || env.ENV_SCOPE === 'development',
      httpOnly: true,
    }

    res.cookie(headersDictionary.accessToken, accessToken, {
      ...cookieConfig,
      maxAge: this.jwtTTL * 1000,
    })
    res.cookie(headersDictionary.refreshToken, refreshToken, {
      ...cookieConfig,
      maxAge: this.refreshTokenTTL * 1000,
    })
  }

  clearTokenCookies(res: Response, _req?: ExpressRequest) {
    const isProduction = env.ENV_SCOPE === 'production'
    const domain = isProduction ? new URL(env.DOMAIN_URL ?? env.API_URL).hostname : undefined

    const cookieConfig = {
      domain,
      sameSite: sameSiteDict[env.ENV_SCOPE],
      secure: isProduction || env.ENV_SCOPE === 'development',
      httpOnly: true,
    } as CookieOptions

    res.clearCookie(headersDictionary.accessToken, cookieConfig)
    res.clearCookie(headersDictionary.refreshToken, cookieConfig)
  }

  async login(input: LoginDto): ServiceOutput<LoginResponseDto> {
    const user = await this.database.users.findUnique({
      where: {
        email: input.username,
      },
    })

    this.logger.info('11111111111111')

    if (!user?.password || user.status !== 'active') {
      return { ok: false, errKey: ErrKeys.unauthorized }
    }

    const isPasswordValid = await comparePassword(input.password, user.password)

    if (!isPasswordValid) {
      return { ok: false, errKey: ErrKeys.unauthorized }
    }

    const jwtPayload: UserMetadata = {
      userId: user.id,
      name: user.name,
      role: user.role,
    }

    this.logger.info('22222222222222222222')

    const { accessToken, refreshToken } = await this.prepareNewTokens(user.id, jwtPayload)

    if (user.two_factor && user.email) {
      const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
      await this.cache.set({
        key: CacheKey.twoFactorAuth,
        scope: code,
        value: { code, accessToken, refreshToken, email: user.email },
        ttl: ONE_HOUR_IN_MS,
      })

      this.mailService.sendTwoFactorAuthCode({
        code,
        email: user.email,
        username: user.name,
      })

      return {
        ok: true,
        twoFactorAuth: true,
        friendlyMessage: 'Email enviado.',
      }
    }

    this.logger.info('3333333333333')

    return {
      ok: true,
      accessToken,
      refreshToken,
      user: this.toLoggedUser(user),
      twoFactorAuth: false,
      friendlyMessage: 'Login efetuado.',
    }
  }

  async refresh({ oldRefreshToken }: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<UserMetadata>(oldRefreshToken, {
      secret: env.JWT_SECRET,
    })

    delete payload.iat
    delete payload.exp

    const user = await this.me(payload.userId)
    if (!user.ok) {
      throw new UnauthorizedException()
    }

    const jwtPayload: UserMetadata = {
      userId: user.id,
      name: user.name,
      role: user.role,
    }

    const tokens = await this.prepareNewTokens(payload.userId, jwtPayload)

    if (!tokens) {
      throw new UnauthorizedException()
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      payload,
      user,
    }
  }

  async logout({ userId }: LogoutDto) {
    this.logger.log(`User ${userId} logged out`)
  }

  async me(userId: string): ServiceOutput<GetMeDto> {
    const user = await this.database.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException()
    }

    return { ok: true, ...this.toLoggedUser(user) }
  }

  async updateMe(userId: string, input: UpdateMeDto): ServiceOutput<GetMeDto> {
    const { ...userData } = input

    const user = await this.database.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { ok: false, errKey: ErrKeys.unauthorized }
    }

    const updatedUser = await this.database.users.update({
      where: { id: userId },
      data: {
        ...userData,
      },
    })

    if (!updatedUser) {
      return { ok: false, errKey: ErrKeys.notFound }
    }

    return { ok: true, ...this.toLoggedUser(updatedUser) }
  }

  async twoFactorAuth(input: TwoFactorAuthDto): ServiceOutput<AuthTokens> {
    const cachedData = await this.cache.get({
      key: CacheKey.twoFactorAuth,
      scope: input.code,
    })

    if (!cachedData || cachedData.code !== input.code || cachedData.email !== input.email) {
      return { ok: false, errKey: ErrKeys.invalidCredentials }
    }

    const { accessToken, refreshToken } = cachedData

    this.cache.delete({ key: CacheKey.twoFactorAuth, scope: input.code })

    if (!accessToken) {
      return { ok: false, errKey: ErrKeys.invalidCredentials }
    }

    return { ok: true, accessToken, refreshToken }
  }

  async recoverPassword(input: RecoverPasswordDto): Promise<void> {
    const user = await this.database.users.findFirst({
      where: { email: input.email },
    })

    if (!user) {
      this.logger.warn(`Password recovery attempt for non-existing email: ${input.email}`)
      return
    }

    const token = randomBytes(32).toString('hex')

    await this.cache.set({
      key: CacheKey.recoverPasswordToken,
      scope: token,
      value: input.email,
      ttl: ONE_HOUR_IN_MS,
    })

    this.logger.log(`Password recovery token generated for user ${user.id}`)

    if (!user.email) {
      this.logger.error(`User ${user.id} does not have an email address`)
      throw new UnauthorizedException('User does not have an email address')
    }

    await this.mailService.sendRecoverPasswordMail({
      email: user.email,
      username: user.name,
      token,
    })

    this.logger.log(`Password recovery email sent to ${user.email}`)
  }

  async resetPassword(input: ResetPasswordDto): Promise<void> {
    try {
      const cachedEmail = await this.cache.get({
        key: CacheKey.recoverPasswordToken,
        scope: input.token,
      })

      if (!input.token || !cachedEmail) {
        throw new UnauthorizedException('Invalid or expired token')
      }

      const user = await this.database.users.findFirst({
        where: { email: cachedEmail },
        select: { id: true, password: true },
      })

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      const hashedPassword = await hashPassword(input.password)

      await this.database.users.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      await this.cache.delete({
        key: CacheKey.recoverPasswordToken,
        scope: input.token,
      })

      this.logger.log(`Password reset successful for user ${user.id}`)
    } catch (error) {
      this.logger.error(
        `Password reset failed: ${input.token} - ${error instanceof Error ? error.message : String(error)}`,
      )
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    const user = await this.database.users.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })
    if (!user?.password) {
      throw new UnauthorizedException()
    }

    const isPasswordValid = await comparePassword(input.oldPassword, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException()
    }

    const hashedPassword = await hashPassword(input.newPassword)

    await this.database.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    this.logger.log(`Password changed successfully for user ${userId}`)
  }
}
