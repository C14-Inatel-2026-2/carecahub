import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { LoggedUser } from './login.dto'

export class GetMeDto extends LoggedUser {}

export class UpdateMeDto {
  @ApiProperty({ description: 'Name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ description: 'Email', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string
}
