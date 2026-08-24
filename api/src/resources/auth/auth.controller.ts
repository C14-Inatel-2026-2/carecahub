import { Body, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'
import { ApiController } from '@/infra/controller.decorator'
import { Public } from '@/infra/public.decorator'
import { User } from '@/infra/user.decorator'
import { ErrKeys, headersDictionary, UserMetadata } from '@/types'
import { AuthGuard } from '../../infra/auth.guard'
import { AuthService } from './auth.service'
import { LoginDto, LoginResponseDto, TwoFactorAuthDto } from './dtos/login.dto'
import { UpdateMeDto } from './dtos/me.dto'
import { ChangePasswordDto, RecoverPasswordDto, ResetPasswordDto } from './dtos/password.dto'
import { RefreshTokenResponseDto } from './dtos/tokens.dto'

@ApiController('auth', 'Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiResponse({ type: LoginResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Res({ passthrough: true }) response: Response, @Body() body: LoginDto) {
    const serviceResponse = await this.authService.login(body)

    if (!serviceResponse.ok) {
      return serviceResponse
    }

    const { accessToken, refreshToken, ...responseWithoutTokens } = serviceResponse

    if (responseWithoutTokens.twoFactorAuth) {
      return responseWithoutTokens
    }

    if (accessToken && refreshToken) {
      this.authService.setResponseWithTokens(response, {
        accessToken,
        refreshToken,
      })
    }

    return responseWithoutTokens
  }

  @Post('two-factor-auth')
  @Public()
  async twoFactorAuth(@Body() body: TwoFactorAuthDto) {
    const serviceResponse = await this.authService.twoFactorAuth(body)
    if (!serviceResponse.ok) {
      return { ok: false, errKey: ErrKeys.invalidCredentials }
    }
    return serviceResponse
  }

  @Post('refresh-token')
  @Public()
  @ApiResponse({ type: RefreshTokenResponseDto })
  async refreshToken(@Res({ passthrough: true }) response: Response, @Req() request: Request) {
    const oldRefreshToken = request.cookies?.[headersDictionary.refreshToken]
    if (!oldRefreshToken) {
      return { ok: false, errKey: ErrKeys.invalidCredentials }
    }

    const { accessToken, refreshToken, user } = await this.authService.refresh({
      oldRefreshToken,
    })
    this.authService.setResponseWithTokens(response, {
      accessToken,
      refreshToken,
    })

    return user
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @User() user: UserMetadata,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = request.cookies?.[headersDictionary.accessToken]
    if (accessToken) {
      await this.authService.logout({ userId: user.userId, accessToken })
    }

    this.authService.clearTokenCookies(response, request)

    return { ok: true }
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@User() user: UserMetadata) {
    return this.authService.me(user.userId)
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  async updateMe(@User() user: UserMetadata, @Body() body: UpdateMeDto) {
    return this.authService.updateMe(user.userId, body)
  }

  @Post('recover-password')
  @Public()
  async recoverPassword(@Body() body: RecoverPasswordDto) {
    await this.authService.recoverPassword(body)
    return { ok: true }
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body)
    return { ok: true }
  }

  @Post('change-password')
  async changePassword(@User() user: UserMetadata, @Body() body: ChangePasswordDto) {
    await this.authService.changePassword(user.userId, body)
    return { ok: true }
  }
}
