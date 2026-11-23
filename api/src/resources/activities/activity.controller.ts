import { Body, Get, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import type { UserMetadata } from '@/types'
import { ActivityService } from './activity.service'
import { ActivityQueryDto } from './dto/activity-query.dto'
import { CreateActivityDto } from './dto/create-activity.dto'
import { CreateSubmissionDto } from './dto/create-submission.dto'
import { UpdateActivityDto } from './dto/update-activity.dto'
import { UpsertEvaluationDto } from './dto/upsert-evaluation.dto'

@ApiController('activities', 'Activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @Roles(['admin', 'teacher', 'mentor'])
  create(@User() requester: UserMetadata, @Body() body: CreateActivityDto) {
    return this.activityService.create(body, requester)
  }

  @Get()
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findAll(@User() requester: UserMetadata, @Query() query: ActivityQueryDto) {
    return this.activityService.findAll(query, requester)
  }

  @Get(':id/group-delivery')
  @Roles(['admin', 'teacher', 'mentor'])
  getGroupDelivery(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Query('groupId', new ParseUUIDPipe()) groupId: string,
  ) {
    return this.activityService.getGroupDelivery(id, groupId, requester)
  }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.activityService.findOne(id, requester)
  }

  @Get(':id/attachments/:fileId/download')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  getAttachmentDownload(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @UUIDParam('fileId') fileId: string,
  ) {
    return this.activityService.getAttachmentDownload(id, fileId, requester)
  }

  @Post(':id/submissions')
  @Roles(['student'])
  createSubmission(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: CreateSubmissionDto,
  ) {
    return this.activityService.createSubmission(id, body, requester)
  }

  @Get(':id/submissions')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findSubmissions(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.activityService.findSubmissions(id, requester)
  }

  @Get(':id/pipeline')
  @Roles(['admin', 'teacher', 'mentor'])
  getPipeline(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.activityService.getPipeline(id, requester)
  }

  @Get(':id/submissions/:submissionId/files/:fileId/download')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  getSubmissionFileDownload(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @UUIDParam('submissionId') submissionId: string,
    @UUIDParam('fileId') fileId: string,
  ) {
    return this.activityService.getSubmissionFileDownload(id, submissionId, fileId, requester)
  }

  @Put(':id/submissions/:submissionId/evaluation')
  @Roles(['teacher', 'mentor'])
  upsertEvaluation(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @UUIDParam('submissionId') submissionId: string,
    @Body() body: UpsertEvaluationDto,
  ) {
    return this.activityService.upsertEvaluation(id, submissionId, body, requester)
  }

  @Patch(':id')
  @Roles(['teacher', 'mentor'])
  update(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: UpdateActivityDto,
  ) {
    return this.activityService.update(id, body, requester)
  }

  @Patch(':id/archive')
  @Roles(['teacher', 'mentor'])
  archive(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.activityService.archive(id, requester)
  }
}
