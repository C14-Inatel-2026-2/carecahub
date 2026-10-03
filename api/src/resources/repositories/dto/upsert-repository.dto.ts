import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class UpsertRepositoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(11)
  url: string

  @ApiProperty()
  @IsUUID()
  ownerId: string

  @ApiProperty()
  @IsUUID()
  projectId: string
}
