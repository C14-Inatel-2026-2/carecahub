import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsInt, IsString, IsStrongPassword, Length, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsInt()
  registration: number

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  password: string
}

export class ConfirmRegistrationDto {
  @ApiProperty()
  @IsString()
  verificationId: string

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string
}

export class ResendRegistrationCodeDto {
  @ApiProperty()
  @IsString()
  verificationId: string
}

export type RegistrationStartResponse = { verificationId: string }
