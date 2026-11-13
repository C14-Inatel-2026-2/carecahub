import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetActivityDto } from './dto/get-activity.dto'
import { GetSubmissionDto } from './dto/get-submission.dto'
import { GradeSubmissionDto } from './dto/grade-submission.dto'
import { SubmitActivityDto } from './dto/submit-activity.dto'
import { UpsertActivityDto } from './dto/upsert-activity.dto'

export type GetActivityOutput = ServiceOutput<GetActivityDto>
export type ListActivityOutput = ServiceOutput<List<GetActivityDto>>
export type RemoveActivityOutput = ServiceOutput<object>
export type GetSubmissionOutput = ServiceOutput<GetSubmissionDto>
export type ListSubmissionOutput = ServiceOutput<List<GetSubmissionDto>>

export abstract class IActivityService {
  abstract upsert(input: UpsertActivityDto, requester: UserMetadata): Promise<GetActivityOutput>
  abstract findAll(query: QueryDto): Promise<ListActivityOutput>
  abstract findOne(id: string): Promise<GetActivityOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<RemoveActivityOutput>
}

export abstract class ISubmissionService {
  abstract submit(
    activityId: string,
    input: SubmitActivityDto,
    requester: UserMetadata,
  ): Promise<GetSubmissionOutput>
  abstract findByActivity(
    activityId: string,
    requester: UserMetadata,
  ): Promise<ListSubmissionOutput>
  abstract grade(
    submissionId: string,
    input: GradeSubmissionDto,
    requester: UserMetadata,
  ): Promise<GetSubmissionOutput>
}
