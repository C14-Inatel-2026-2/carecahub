import { USER_ROLES, type UserRole } from '@db'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string

  @ApiProperty({ required: false })
  @ValidateIf(
    (dto: CreateUserDto, value: unknown) =>
      ['mentor', 'student'].includes(dto.role) || value !== undefined,
  )
  @IsInt()
  registration?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(39)
  githubName?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  classroom?: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  password: string

  @ApiProperty({ enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role: UserRole
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {}
