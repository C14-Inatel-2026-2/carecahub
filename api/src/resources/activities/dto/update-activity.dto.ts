import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator'
import { ACTIVITY_SUBMISSION_TYPES, type ActivitySubmissionType } from '@/drizzle'

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  title?: string

  @IsOptional()
  @IsString()
  @Length(1, 10_000)
  description?: string

  @IsOptional()
  @IsISO8601()
  dueAt?: string

  @IsOptional()
  @IsBoolean()
  allowLateSubmissions?: boolean

  @IsOptional()
  @IsEnum(ACTIVITY_SUBMISSION_TYPES)
  submissionType?: ActivitySubmissionType

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  attachmentIds?: string[]
}
