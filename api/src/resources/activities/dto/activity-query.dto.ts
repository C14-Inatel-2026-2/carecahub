import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'
import { QueryDto } from '@/utils/dtos/query.dto'

export class ActivityQueryDto extends QueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean
}
