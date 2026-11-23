import { activities, activityGroups, activitySubmissions, groups, users } from '@db'
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { and, eq, isNull } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { NotificationService } from '../notification/notification.service'

const dayInMilliseconds = 24 * 60 * 60 * 1000

function saoPauloDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

function saoPauloHour(value: Date) {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(value),
  )
}

@Injectable()
export class ActivityReminderService {
  constructor(
    private readonly database: DrizzleService,
    private readonly notifications: NotificationService,
  ) {}

  @Cron('0 */15 * * * *', { timeZone: 'America/Sao_Paulo' })
  async scheduledProcessDueReminders() {
    await this.processDueReminders()
  }

  async processDueReminders(now = new Date()): Promise<number> {
    const activitiesToCheck = await this.database.db
      .select()
      .from(activities)
      .where(and(isNull(activities.deletedAt), isNull(activities.archivedAt)))
    let sent = 0
    for (const activity of activitiesToCheck) {
      if (now >= activity.dueAt) continue
      const remaining = activity.dueAt.getTime() - now.getTime()
      const type =
        remaining <= 7 * dayInMilliseconds && remaining > 3 * dayInMilliseconds
          ? 'activity_deadline_week'
          : remaining <= 3 * dayInMilliseconds && saoPauloDate(now) !== saoPauloDate(activity.dueAt)
            ? 'activity_deadline_three_days'
            : saoPauloDate(now) === saoPauloDate(activity.dueAt) && saoPauloHour(now) >= 8
              ? 'activity_deadline_today'
              : undefined
      if (!type) continue
      const audience = await this.database.db
        .select({ groupId: activityGroups.groupId })
        .from(activityGroups)
        .innerJoin(groups, eq(activityGroups.groupId, groups.id))
        .where(and(eq(activityGroups.activityId, activity.id), isNull(groups.deletedAt)))
      for (const { groupId } of audience) {
        const [submitted] = await this.database.db
          .select({ id: activitySubmissions.id })
          .from(activitySubmissions)
          .where(
            and(
              eq(activitySubmissions.activityId, activity.id),
              eq(activitySubmissions.groupId, groupId),
            ),
          )
          .limit(1)
        if (submitted) continue
        const recipients = await this.database.db
          .select({ id: users.id })
          .from(users)
          .where(
            and(eq(users.groupId, groupId), eq(users.status, 'active'), isNull(users.deletedAt)),
          )
        sent += await this.notifications.createActivityNotifications({
          type,
          activityId: activity.id,
          actorId: activity.createdById,
          groupId,
          deadlineRevision: activity.deadlineRevision,
          recipientIds: recipients.map((recipient) => recipient.id),
        })
      }
    }
    return sent
  }
}
