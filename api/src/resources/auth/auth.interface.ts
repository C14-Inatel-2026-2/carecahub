import { Request as ExpressRequest, Response } from 'express'
import { ServiceOutput, UserMetadata } from '@/types'
import { LoginDto, LoginResponseDto, LogoutDto, TwoFactorAuthDto } from './dtos/login.dto'
import { GetMeDto, UpdateMeDto } from './dtos/me.dto'
import { RecoverPasswordDto, ResetPasswordDto } from './dtos/password.dto'
import { AuthTokens, RefreshTokenDto } from './dtos/tokens.dto'

export abstract class IAuthService {
  abstract login(input: LoginDto): ServiceOutput<LoginResponseDto>
  abstract me(userId: string): ServiceOutput<GetMeDto>
  abstract updateMe(userId: string, input: UpdateMeDto): ServiceOutput<GetMeDto>
  abstract twoFactorAuth(input: TwoFactorAuthDto): ServiceOutput<AuthTokens>
  abstract refresh(
    input: RefreshTokenDto,
  ): Promise<AuthTokens & { payload: UserMetadata; user: GetMeDto }>
  abstract logout(input: LogoutDto): Promise<void>
  abstract recoverPassword(input: RecoverPasswordDto): Promise<void>
  abstract resetPassword(input: ResetPasswordDto): Promise<void>
  abstract setResponseWithTokens(response: Response, tokens: AuthTokens): void
  abstract clearTokenCookies(response: Response, req?: ExpressRequest): void
  abstract prepareNewTokens(userId: string, payload: UserMetadata): Promise<AuthTokens>
}
