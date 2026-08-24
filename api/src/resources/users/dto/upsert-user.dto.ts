import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  password: string
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {}
