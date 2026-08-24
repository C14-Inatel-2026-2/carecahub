import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { user_role, user_status } from '@/providers/database/generated/prisma/enums'

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

  @ApiProperty({ example: 'admin', enum: user_role })
  role: user_role

  @ApiProperty({ example: 'active', enum: user_status })
  status: user_status

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
