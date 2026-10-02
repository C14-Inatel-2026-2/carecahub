import type { GroupInviteStatus, NotificationType } from '@db'
import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export type NotificationGroupInviteRecord = {
  id: string
  groupId: string
  inviterId: string
  inviteeId: string
  status: GroupInviteStatus
  respondedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type GetNotificationDtoRecord = {
  notification: {
    id: string
    userId: string
    type: NotificationType
    groupInviteId: string | null
    readAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }
  groupInvite: NotificationGroupInviteRecord | null
  group: { id: string; friendlyId: string } | null
  inviter: { id: string; name: string } | null
}

export type GroupInviteNotification = {
  id: string
  status: GroupInviteStatus
  respondedAt: Date | null
  group: { id: string; friendlyId: string }
  inviter: { id: string; name: string }
}

export class GetNotificationDto extends BaseDto<GetNotificationDto> {
  @ApiProperty()
  type: NotificationType

  @ApiProperty({ nullable: true })
  readAt: Date | null

  @ApiProperty({ nullable: true })
  groupInvite: GroupInviteNotification | null

  static toDto(record: GetNotificationDtoRecord): GetNotificationDto {
    const { notification, groupInvite, group, inviter } = record

    return {
      id: notification.id,
      type: notification.type,
      readAt: notification.readAt,
      groupInvite:
        groupInvite && group && inviter
          ? {
              id: groupInvite.id,
              status: groupInvite.status,
              respondedAt: groupInvite.respondedAt,
              group,
              inviter,
            }
          : null,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      deletedAt: notification.deletedAt ?? undefined,
    }
  }
}
