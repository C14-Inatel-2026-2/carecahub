import type { DrizzleTransactionClient } from '@/providers/database/drizzle.service'
import type { ServiceOutput, UserMetadata } from '@/types'
import type { List } from '@/utils/dtos/base.dto'
import type { QueryDto } from '@/utils/dtos/query.dto'
import type { GetUserWithGitHubDetails } from '../users/user.interface'
import type { GetNotificationDto } from './dto/get-notification.dto'

export type CreateActivityNotificationsInput = {
  type:
    | 'activity_published'
    | 'activity_updated'
    | 'activity_deadline_week'
    | 'activity_deadline_three_days'
    | 'activity_deadline_today'
    | 'activity_submission_created'
  activityId: string
  actorId: string
  recipientIds: string[]
  groupId?: string
  submissionId?: string
  deadlineRevision?: number
}

import type { CreateGroupInviteDto, RespondGroupInviteDto } from './dto/group-invite.dto'

export type NotificationList = {
  data: GetNotificationDto[]
  totalCount: number
  unreadCount: number
}

export type RespondGroupInviteResult = {
  id: string
  status: 'accepted' | 'rejected'
  groupId: string | null
}

export type ListNotificationOutput = ServiceOutput<NotificationList>
export type MarkAllNotificationsReadOutput = ServiceOutput<{ updatedCount: number }>
export type GetNotificationOutput = ServiceOutput<GetNotificationDto>
export type ListGroupInviteCandidatesOutput = ServiceOutput<List<GetUserWithGitHubDetails>>
export type RespondGroupInviteOutput = ServiceOutput<RespondGroupInviteResult>

export abstract class INotificationService {
  abstract createActivityNotifications(
    input: CreateActivityNotificationsInput,
    tx?: DrizzleTransactionClient,
  ): Promise<number>
  abstract findAll(query: QueryDto, requester: UserMetadata): Promise<ListNotificationOutput>
  abstract markAllAsRead(requester: UserMetadata): Promise<MarkAllNotificationsReadOutput>
  abstract markAsRead(
    notificationId: string,
    requester: UserMetadata,
  ): Promise<GetNotificationOutput>
  abstract findGroupInviteCandidates(
    query: QueryDto,
    requester: UserMetadata,
  ): Promise<ListGroupInviteCandidatesOutput>
  abstract createGroupInvite(
    input: CreateGroupInviteDto,
    requester: UserMetadata,
  ): Promise<GetNotificationOutput>
  abstract respondToGroupInvite(
    inviteId: string,
    input: RespondGroupInviteDto,
    requester: UserMetadata,
  ): Promise<RespondGroupInviteOutput>
}
