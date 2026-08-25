import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { USER_ROLES, USER_STATUSES } from '@db'
import type { UserRole, UserStatus } from '@db'

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string
}

export class LoggedUser {
  @ApiProperty({ example: '1234567890' })
  id: string

  @ApiProperty({ example: 'Dr. John Doe' })
  name: string

  @ApiProperty({ example: 'john.doe@example.com' })
  email?: string

  @ApiProperty({ example: 'admin', enum: USER_ROLES })
  role: UserRole

  @ApiProperty({ example: 'active', enum: USER_STATUSES })
  status: UserStatus

  @ApiProperty({ example: false })
  twoFactor: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty({ required: false, nullable: true })
  deletedAt?: Date
}

export class LoginResponseDto {
  @ApiProperty({ example: false })
  twoFactorAuth: boolean

  @ApiProperty({ example: 'Login com sucesso' })
  friendlyMessage: string

  @ApiProperty({ type: LoggedUser })
  user?: LoggedUser

  // These fields are only used internally and not returned to client
  accessToken?: string
  refreshToken?: string
}

export class LogoutDto {
  userId: string
  accessToken: string
}

export class TwoFactorAuthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string
}
