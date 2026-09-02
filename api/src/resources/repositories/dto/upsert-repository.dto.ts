import { REPOSITORY_TYPES, type RepositoryType } from '@db'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class UpsertRepositoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(11)
  url: string

  @ApiProperty({ enum: REPOSITORY_TYPES })
  @IsIn(REPOSITORY_TYPES)
  repositoryType: RepositoryType

  @ApiProperty()
  @IsUUID()
  ownerId: string

  @ApiProperty()
  @IsUUID()
  projectId: string
}
