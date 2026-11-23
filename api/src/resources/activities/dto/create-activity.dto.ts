import { Transform } from 'class-transformer'
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

export class CreateActivityDto {
  @IsString()
  @Length(3, 255)
  title: string

  @IsString()
  @Length(1, 10_000)
  description: string

  @IsISO8601()
  dueAt: string

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  allowLateSubmissions: boolean

  @IsEnum(ACTIVITY_SUBMISSION_TYPES)
  submissionType: ActivitySubmissionType

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  attachmentIds: string[] = []
}
