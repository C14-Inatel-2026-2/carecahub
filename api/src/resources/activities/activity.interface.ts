import type { ServiceOutput, UserMetadata } from '@/types'
import type { List } from '@/utils/dtos/base.dto'
import type { GetGroupDto } from '../groups/dto/get-group.dto'
import type { GetProjectDto } from '../projects/dto/get-project.dto'
import type { ActivityQueryDto } from './dto/activity-query.dto'
import type { CreateActivityDto } from './dto/create-activity.dto'
import type { CreateSubmissionDto } from './dto/create-submission.dto'
import type { GetActivityDto } from './dto/get-activity.dto'
import type { UpdateActivityDto } from './dto/update-activity.dto'
import type { UpsertEvaluationDto } from './dto/upsert-evaluation.dto'

export type GetActivityOutput = ServiceOutput<GetActivityDto>
export type ListActivityOutput = ServiceOutput<List<GetActivityDto>>
export type GetActivityAttachmentDownloadOutput = ServiceOutput<{ url: string }>
export type CreateSubmissionOutput = ServiceOutput<{ id: string; version: number; isLate: boolean }>
export type InvalidateSubmissionOutput = ServiceOutput<{ invalidatedAt: Date }>
export type GetSubmissionFileDownloadOutput = ServiceOutput<{ url: string }>
export type ActivitySubmissionDetail = {
  id: string
  groupId: string
  version: number
  isLate: boolean
  invalidatedAt: Date | null
  submittedAt: Date
  score: number | null
  submittedBy: { id: string; name: string }
  links: Array<{ id: string; url: string; thumbnailUrl?: string }>
  files: Array<{ id: string; filename: string }>
}
export type ListSubmissionOutput = ServiceOutput<{ data: ActivitySubmissionDetail[] }>
export type GetGroupDeliveryOutput = ServiceOutput<{
  group: GetGroupDto
  project: GetProjectDto | null
  viewers: Array<{ id: string; name: string }>
  submissions: ActivitySubmissionDetail[]
}>
export type UpsertEvaluationOutput = ServiceOutput<{ score: number; evaluatedAt: Date }>
export type PipelineStatus = 'not_viewed' | 'viewed' | 'submitted' | 'evaluated'
export type ActivityPipelineRow = {
  group: GetGroupDto
  project: GetProjectDto | null
  viewers: string[]
  submission: {
    version: number
    submittedAt: Date
    submittedBy: string
    isLate: boolean
    score: number | null
  } | null
}
export type GetPipelineOutput = ServiceOutput<{
  metrics: { viewed: number; submitted: number; notViewed: number }
  columns: Record<PipelineStatus, ActivityPipelineRow[]>
}>

export abstract class IActivityService {
  abstract create(input: CreateActivityDto, requester: UserMetadata): Promise<GetActivityOutput>
  abstract findAll(query: ActivityQueryDto, requester: UserMetadata): Promise<ListActivityOutput>
  abstract findOne(id: string, requester: UserMetadata): Promise<GetActivityOutput>
  abstract update(
    id: string,
    input: UpdateActivityDto,
    requester: UserMetadata,
  ): Promise<GetActivityOutput>
  abstract archive(id: string, requester: UserMetadata): Promise<GetActivityOutput>
  abstract getAttachmentDownload(
    id: string,
    fileId: string,
    requester: UserMetadata,
  ): Promise<GetActivityAttachmentDownloadOutput>
  abstract createSubmission(
    activityId: string,
    input: CreateSubmissionDto,
    requester: UserMetadata,
  ): Promise<CreateSubmissionOutput>
  abstract invalidateSubmission(
    activityId: string,
    submissionId: string,
    requester: UserMetadata,
  ): Promise<InvalidateSubmissionOutput>
  abstract findSubmissions(
    activityId: string,
    requester: UserMetadata,
  ): Promise<ListSubmissionOutput>
  abstract getGroupDelivery(
    activityId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<GetGroupDeliveryOutput>
  abstract getSubmissionFileDownload(
    activityId: string,
    submissionId: string,
    fileId: string,
    requester: UserMetadata,
  ): Promise<GetSubmissionFileDownloadOutput>
  abstract upsertEvaluation(
    activityId: string,
    submissionId: string,
    input: UpsertEvaluationDto,
    requester: UserMetadata,
  ): Promise<UpsertEvaluationOutput>
  abstract getPipeline(activityId: string, requester: UserMetadata): Promise<GetPipelineOutput>
}
