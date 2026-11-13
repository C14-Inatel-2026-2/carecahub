import { Body, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { ActivityService } from './activity.service'
import { GradeSubmissionDto } from './dto/grade-submission.dto'
import { SubmitActivityDto } from './dto/submit-activity.dto'
import { UpsertActivityDto } from './dto/upsert-activity.dto'
import { SubmissionService } from './submission.service'

@ApiController('activities', 'Activities')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly submissionService: SubmissionService,
  ) {}

  @Post()
  @Roles(['admin', 'teacher'])
  create(@User() requester: UserMetadata, @Body() body: UpsertActivityDto) {
    return this.activityService.upsert(body, requester)
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(['admin', 'teacher'])
  grade(
    @User() requester: UserMetadata,
    @UUIDParam('submissionId') submissionId: string,
    @Body() body: GradeSubmissionDto,
  ) {
    return this.submissionService.grade(submissionId, body, requester)
  }

  @Patch(':id')
  @Roles(['admin', 'teacher'])
  update(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: UpsertActivityDto,
  ) {
    return this.activityService.upsert({ ...body, id }, requester)
  }

  @Get()
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findAll(@Query() query: QueryDto) {
    return this.activityService.findAll(query)
  }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findOne(@UUIDParam() id: string) {
    return this.activityService.findOne(id)
  }

  @Delete(':id')
  @Roles(['admin', 'teacher'])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.activityService.remove(id, requester)
  }

  @Post(':id/submissions')
  @Roles(['student'])
  submit(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: SubmitActivityDto,
  ) {
    return this.submissionService.submit(id, body, requester)
  }

  @Get(':id/submissions')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findSubmissions(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.submissionService.findByActivity(id, requester)
  }
}
