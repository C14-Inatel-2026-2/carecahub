import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string

  @ApiProperty()
  @IsInt()
  registration: number

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
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {}
