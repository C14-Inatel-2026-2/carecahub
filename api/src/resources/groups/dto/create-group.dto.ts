import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  friendlyId: string
}
