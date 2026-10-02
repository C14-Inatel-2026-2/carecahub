import type { ServiceOutput, UserMetadata } from '@/types'
import type { List } from '@/utils/dtos/base.dto'
import type { QueryDto } from '@/utils/dtos/query.dto'
import type { GetUserDto } from '../users/dto/get-user.dto'
import type { GetNotificationDto } from './dto/get-notification.dto'
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
export type ListGroupInviteCandidatesOutput = ServiceOutput<List<GetUserDto>>
export type RespondGroupInviteOutput = ServiceOutput<RespondGroupInviteResult>

export abstract class INotificationService {
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
