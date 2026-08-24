import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator'

export class RecoverPasswordDto {
  @ApiProperty({ description: 'Email to recover password', example: 'contato@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token to reset password', example: '98127391239b9u1b2' })
  @IsNotEmpty()
  @IsString()
  token: string

  @ApiProperty({ description: 'New password', example: 'Ignite@123' })
  @IsStrongPassword()
  password: string
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Old password', example: 'Ignite@123' })
  @IsNotEmpty()
  @IsString()
  oldPassword: string

  @ApiProperty({ description: 'New password', example: 'Ignite@123' })
  @IsStrongPassword()
  newPassword: string
}
