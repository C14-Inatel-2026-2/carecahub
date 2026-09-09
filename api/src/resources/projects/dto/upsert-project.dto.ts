import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'

export class UpsertProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  projectName: string
}
