import { pgEnum } from 'drizzle-orm/pg-core'

export const GROUP_INVITE_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const
export type GroupInviteStatus = (typeof GROUP_INVITE_STATUSES)[number]
export const groupInviteStatusEnum = pgEnum('group_invite_status', GROUP_INVITE_STATUSES)

export const NOTIFICATION_TYPES = [
  'group_invite',
  'activity_published',
  'activity_updated',
  'activity_deadline_week',
  'activity_deadline_three_days',
  'activity_deadline_today',
  'activity_submission_created',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPES)
