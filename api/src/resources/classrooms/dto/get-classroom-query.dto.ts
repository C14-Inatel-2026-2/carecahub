import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, Matches } from 'class-validator'
import { QueryDto } from '@/utils/dtos/query.dto'

export class GetClassroomQueryDto extends QueryDto {
  @ApiPropertyOptional({ example: '2026.2' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}\.[12]$/)
  semester?: string

  @ApiPropertyOptional({ enum: ['active', 'archived'] })
  @IsOptional()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived'
}
