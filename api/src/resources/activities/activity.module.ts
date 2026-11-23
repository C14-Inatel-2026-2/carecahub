import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { GroupModule } from '../groups/group.module'
import { NotificationModule } from '../notification/notification.module'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { ActivityReminderService } from './activity-reminder.service'

@Module({
  imports: [GitHubModule, GroupModule, NotificationModule],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityReminderService],
  exports: [ActivityService],
})
export class ActivityModule {}
