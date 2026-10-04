import { z } from 'zod'

export const GROUP_INVITE_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const
export type GroupInviteStatus = (typeof GROUP_INVITE_STATUSES)[number]

export const NOTIFICATION_TYPES = ['group_invite'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const createGroupInviteSchema = z.object({
  inviteeId: z.uuid('Selecione um aluno válido.'),
})
export type CreateGroupInviteRequest = z.infer<typeof createGroupInviteSchema>

export const respondGroupInviteSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})
export type RespondGroupInviteRequest = z.infer<typeof respondGroupInviteSchema>
export type GroupInviteResponseStatus = RespondGroupInviteRequest['status']

export type GroupInvite = {
  id: string
  status: GroupInviteStatus
  respondedAt: string | null
  group: {
    id: string
    friendlyId: string
  }
  inviter: {
    id: string
    name: string
  }
}

export type Notification = {
  id: string
  type: NotificationType
  readAt: string | null
  groupInvite: GroupInvite | null
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type RespondGroupInviteResponse = {
  id: string
  status: 'accepted' | 'rejected'
  groupId: string | null
}
