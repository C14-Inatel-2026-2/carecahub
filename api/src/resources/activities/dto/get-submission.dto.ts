import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export type GetSubmissionDtoRecord = {
  id: string
  activityId: string
  groupId: string
  submittedById: string
  url: string
  isLate: boolean
  submittedAt: Date
  grade: number | null
  feedback: string | null
  gradedById: string | null
  gradedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class GetSubmissionDto extends BaseDto<GetSubmissionDto> {
  @ApiProperty()
  activityId: string

  @ApiProperty()
  groupId: string

  @ApiProperty()
  submittedById: string

  @ApiProperty()
  url: string

  @ApiProperty()
  isLate: boolean

  @ApiProperty()
  submittedAt: Date

  @ApiProperty({ nullable: true })
  grade: number | null

  @ApiProperty({ nullable: true })
  feedback: string | null

  @ApiProperty({ nullable: true })
  gradedById: string | null

  @ApiProperty({ nullable: true })
  gradedAt: Date | null

  static toDto(submission: GetSubmissionDtoRecord): GetSubmissionDto {
    return {
      id: submission.id,
      activityId: submission.activityId,
      groupId: submission.groupId,
      submittedById: submission.submittedById,
      url: submission.url,
      isLate: submission.isLate,
      submittedAt: submission.submittedAt,
      grade: submission.grade,
      feedback: submission.feedback,
      gradedById: submission.gradedById,
      gradedAt: submission.gradedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    }
  }
}
