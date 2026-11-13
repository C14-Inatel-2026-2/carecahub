import { Module } from '@nestjs/common'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { SubmissionService } from './submission.service'

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, SubmissionService],
  exports: [ActivityService, SubmissionService],
})
export class ActivityModule {}
