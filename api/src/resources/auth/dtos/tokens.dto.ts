import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AuthTokens {
  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'The old token' })
  @IsNotEmpty()
  @IsString()
  oldRefreshToken: string
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string
}
