import { groupInvites, groups, notifications, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import {
  groupInvitePublicColumns,
  notificationPublicColumns,
  userPublicColumns,
} from '@/drizzle/schema/entities'
import { DrizzleService, type DrizzleTransactionClient } from '@/providers/database/drizzle.service'
import { ErrKeys, type UserMetadata } from '@/types'
import type { QueryDto } from '@/utils/dtos/query.dto'
import { isUniqueViolation } from '@/utils/query-violations'
import { GetUserDto, type GetUserDtoRecord } from '../users/dto/get-user.dto'
import { GetNotificationDto, type GetNotificationDtoRecord } from './dto/get-notification.dto'
import type { CreateGroupInviteDto, RespondGroupInviteDto } from './dto/group-invite.dto'
import type {
  GetNotificationOutput,
  ListGroupInviteCandidatesOutput,
  ListNotificationOutput,
  MarkAllNotificationsReadOutput,
  RespondGroupInviteOutput,
} from './notification.interface'
import { INotificationService } from './notification.interface'

const inviters = alias(users, 'notification_inviter')
const notificationSelection = {
  notification: notificationPublicColumns,
  groupInvite: groupInvitePublicColumns,
  group: { id: groups.id, friendlyId: groups.friendlyId },
  inviter: { id: inviters.id, name: inviters.name },
}

@Injectable()
export class NotificationService implements INotificationService {
  constructor(private readonly database: DrizzleService) {}

  async findAll(query: QueryDto, requester: UserMetadata): Promise<ListNotificationOutput> {
    const inboxWhere = and(
      eq(notifications.userId, requester.userId),
      isNull(notifications.deletedAt),
    )

    const [rows, totalRows, unreadRows] = await Promise.all([
      this.database.db
        .select(notificationSelection)
        .from(notifications)
        .leftJoin(groupInvites, eq(notifications.groupInviteId, groupInvites.id))
        .leftJoin(groups, eq(groupInvites.groupId, groups.id))
        .leftJoin(inviters, eq(groupInvites.inviterId, inviters.id))
        .where(inboxWhere)
        .orderBy(desc(notifications.createdAt))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(notifications).where(inboxWhere),
      this.database.db
        .select({ count: count() })
        .from(notifications)
        .where(and(inboxWhere, isNull(notifications.readAt))),
    ])

    return {
      ok: true,
      totalCount: Number(totalRows[0]?.count ?? 0),
      unreadCount: Number(unreadRows[0]?.count ?? 0),
      data: rows.map((row) => GetNotificationDto.toDto(row as GetNotificationDtoRecord)),
    }
  }

  async markAsRead(
    notificationId: string,
    requester: UserMetadata,
  ): Promise<GetNotificationOutput> {
    const [record] = await this.selectNotification(notificationId)
    if (!record) return { ok: false, errKey: ErrKeys.notFound }
    if (record.notification.userId !== requester.userId) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }
    if (record.notification.readAt) {
      return { ok: true, ...GetNotificationDto.toDto(record) }
    }

    const readAt = new Date()
    await this.database.db
      .update(notifications)
      .set({ readAt, updatedAt: readAt })
      .where(eq(notifications.id, notificationId))

    return {
      ok: true,
      ...GetNotificationDto.toDto({
        ...record,
        notification: { ...record.notification, readAt, updatedAt: readAt },
      }),
    }
  }

  async markAllAsRead(requester: UserMetadata): Promise<MarkAllNotificationsReadOutput> {
    const readAt = new Date()
    const updated = await this.database.db
      .update(notifications)
      .set({ readAt, updatedAt: readAt })
      .where(
        and(
          eq(notifications.userId, requester.userId),
          isNull(notifications.readAt),
          isNull(notifications.deletedAt),
        ),
      )
      .returning({ id: notifications.id })

    return { ok: true, updatedCount: updated.length }
  }

  async findGroupInviteCandidates(
    query: QueryDto,
    requester: UserMetadata,
  ): Promise<ListGroupInviteCandidatesOutput> {
    const group = await this.findLedGroup(requester)
    if (!group) return { ok: false, errKey: ErrKeys.forbidden }

    const where = and(
      eq(users.role, 'student'),
      eq(users.status, 'active'),
      isNull(users.groupId),
      isNull(users.deletedAt),
      ne(users.id, requester.userId),
      isNull(groupInvites.id),
      query.search
        ? or(
            ilike(users.name, `%${query.search}%`),
            ilike(users.email, `%${query.search}%`),
            ilike(users.githubName, `%${query.search}%`),
          )
        : undefined,
    )
    const pendingInviteJoin = and(
      eq(groupInvites.inviteeId, users.id),
      eq(groupInvites.groupId, group.id),
      eq(groupInvites.status, 'pending'),
      isNull(groupInvites.deletedAt),
    )
    const [rows, totalRows] = await Promise.all([
      this.database.db
        .select(userPublicColumns)
        .from(users)
        .leftJoin(groupInvites, pendingInviteJoin)
        .where(where)
        .orderBy(asc(users.name))
        .offset(query.skip)
        .limit(query.take),
      this.database.db
        .select({ count: count() })
        .from(users)
        .leftJoin(groupInvites, pendingInviteJoin)
        .where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalRows[0]?.count ?? 0),
      data: rows.map((row) => GetUserDto.toDto(row as GetUserDtoRecord)),
    }
  }

  async createGroupInvite(
    input: CreateGroupInviteDto,
    requester: UserMetadata,
  ): Promise<GetNotificationOutput> {
    if (requester.role !== 'student') {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    try {
      return await this.database.db.transaction(async (tx) => {
        const [group] = await tx
          .select({ id: groups.id, friendlyId: groups.friendlyId, leaderId: groups.leaderId })
          .from(groups)
          .where(and(eq(groups.leaderId, requester.userId), isNull(groups.deletedAt)))
          .for('update')
        if (!group) return { ok: false as const, errKey: ErrKeys.forbidden }

        const [invitee] = await tx
          .select(userPublicColumns)
          .from(users)
          .where(and(eq(users.id, input.inviteeId), isNull(users.deletedAt)))
        if (!invitee) return { ok: false as const, errKey: ErrKeys.notFound }
        if (
          invitee.role !== 'student' ||
          invitee.status !== 'active' ||
          invitee.groupId ||
          invitee.id === requester.userId
        ) {
          return { ok: false as const, errKey: ErrKeys.invalidPayload }
        }

        const [memberCount] = await tx
          .select({ count: count() })
          .from(users)
          .where(
            and(eq(users.groupId, group.id), eq(users.status, 'active'), isNull(users.deletedAt)),
          )
        if (Number(memberCount?.count ?? 0) >= 6) {
          return { ok: false as const, errKey: ErrKeys.limitReached }
        }

        const [duplicate] = await tx
          .select({ id: groupInvites.id })
          .from(groupInvites)
          .where(
            and(
              eq(groupInvites.groupId, group.id),
              eq(groupInvites.inviteeId, input.inviteeId),
              eq(groupInvites.status, 'pending'),
              isNull(groupInvites.deletedAt),
            ),
          )
        if (duplicate) return { ok: false as const, errKey: ErrKeys.alreadyExists }

        const [groupInvite] = await tx
          .insert(groupInvites)
          .values({
            groupId: group.id,
            inviterId: requester.userId,
            inviteeId: input.inviteeId,
          })
          .returning(groupInvitePublicColumns)
        const [notification] = await tx
          .insert(notifications)
          .values({
            userId: input.inviteeId,
            type: 'group_invite',
            groupInviteId: groupInvite.id,
          })
          .returning(notificationPublicColumns)

        return {
          ok: true as const,
          ...GetNotificationDto.toDto({
            notification,
            groupInvite,
            group: { id: group.id, friendlyId: group.friendlyId },
            inviter: { id: requester.userId, name: requester.name },
          }),
        }
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists }
      }
      throw error
    }
  }

  async respondToGroupInvite(
    inviteId: string,
    input: RespondGroupInviteDto,
    requester: UserMetadata,
  ): Promise<RespondGroupInviteOutput> {
    if (requester.role !== 'student') {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    return this.database.db.transaction(async (tx) => {
      const [context] = await tx
        .select({
          groupInvite: {
            id: groupInvites.id,
            groupId: groupInvites.groupId,
            inviterId: groupInvites.inviterId,
            inviteeId: groupInvites.inviteeId,
            status: groupInvites.status,
          },
          notification: { id: notifications.id, userId: notifications.userId },
        })
        .from(groupInvites)
        .innerJoin(notifications, eq(notifications.groupInviteId, groupInvites.id))
        .where(
          and(
            eq(groupInvites.id, inviteId),
            isNull(groupInvites.deletedAt),
            isNull(notifications.deletedAt),
          ),
        )
      if (!context) return { ok: false as const, errKey: ErrKeys.notFound }
      if (
        context.groupInvite.inviteeId !== requester.userId ||
        context.notification.userId !== requester.userId
      ) {
        return { ok: false as const, errKey: ErrKeys.forbidden }
      }
      if (context.groupInvite.status !== 'pending') {
        return { ok: false as const, errKey: ErrKeys.invalidPayload }
      }

      const now = new Date()
      if (input.status === 'rejected') {
        const [lockedContext] = await tx
          .select({
            groupInvite: {
              id: groupInvites.id,
              inviteeId: groupInvites.inviteeId,
              status: groupInvites.status,
            },
            notification: { id: notifications.id, userId: notifications.userId },
          })
          .from(groupInvites)
          .innerJoin(notifications, eq(notifications.groupInviteId, groupInvites.id))
          .where(
            and(
              eq(groupInvites.id, inviteId),
              isNull(groupInvites.deletedAt),
              isNull(notifications.deletedAt),
            ),
          )
          .for('update')
        if (!lockedContext) return { ok: false as const, errKey: ErrKeys.notFound }
        if (
          lockedContext.groupInvite.inviteeId !== requester.userId ||
          lockedContext.notification.userId !== requester.userId
        ) {
          return { ok: false as const, errKey: ErrKeys.forbidden }
        }
        if (lockedContext.groupInvite.status !== 'pending') {
          return { ok: false as const, errKey: ErrKeys.invalidPayload }
        }

        await tx
          .update(groupInvites)
          .set({ status: 'rejected', respondedAt: now, updatedAt: now })
          .where(eq(groupInvites.id, inviteId))
        await tx
          .update(notifications)
          .set({ readAt: now, updatedAt: now })
          .where(eq(notifications.id, context.notification.id))
        return { ok: true as const, id: inviteId, status: 'rejected' as const, groupId: null }
      }

      const [invitee] = await tx
        .select({ id: users.id, groupId: users.groupId, status: users.status })
        .from(users)
        .where(and(eq(users.id, requester.userId), isNull(users.deletedAt)))
        .for('update')
      if (!invitee) return { ok: false as const, errKey: ErrKeys.notFound }
      if (invitee.status !== 'active' || invitee.groupId) {
        return { ok: false as const, errKey: ErrKeys.invalidPayload }
      }

      const [group] = await tx
        .select({ id: groups.id, friendlyId: groups.friendlyId, deletedAt: groups.deletedAt })
        .from(groups)
        .where(and(eq(groups.id, context.groupInvite.groupId), isNull(groups.deletedAt)))
        .for('update')
      if (!group) return { ok: false as const, errKey: ErrKeys.notFound }

      const [lockedContext] = await tx
        .select({
          groupInvite: {
            id: groupInvites.id,
            inviteeId: groupInvites.inviteeId,
            status: groupInvites.status,
          },
          notification: { id: notifications.id, userId: notifications.userId },
        })
        .from(groupInvites)
        .innerJoin(notifications, eq(notifications.groupInviteId, groupInvites.id))
        .where(
          and(
            eq(groupInvites.id, inviteId),
            isNull(groupInvites.deletedAt),
            isNull(notifications.deletedAt),
          ),
        )
        .for('update')
      if (!lockedContext) return { ok: false as const, errKey: ErrKeys.notFound }
      if (
        lockedContext.groupInvite.inviteeId !== requester.userId ||
        lockedContext.notification.userId !== requester.userId
      ) {
        return { ok: false as const, errKey: ErrKeys.forbidden }
      }
      if (lockedContext.groupInvite.status !== 'pending') {
        return { ok: false as const, errKey: ErrKeys.invalidPayload }
      }

      const [memberCount] = await tx
        .select({ count: count() })
        .from(users)
        .where(
          and(eq(users.groupId, group.id), eq(users.status, 'active'), isNull(users.deletedAt)),
        )
      const currentMemberCount = Number(memberCount?.count ?? 0)
      if (currentMemberCount >= 6) {
        return { ok: false as const, errKey: ErrKeys.limitReached }
      }

      await tx
        .update(users)
        .set({ groupId: group.id, updatedAt: now })
        .where(eq(users.id, requester.userId))
      await tx
        .update(groupInvites)
        .set({ status: 'accepted', respondedAt: now, updatedAt: now })
        .where(eq(groupInvites.id, inviteId))
      await tx
        .update(notifications)
        .set({ readAt: now, updatedAt: now })
        .where(eq(notifications.id, context.notification.id))

      const otherReceivedInvites = await tx
        .select({ id: groupInvites.id })
        .from(groupInvites)
        .where(
          and(
            eq(groupInvites.inviteeId, requester.userId),
            eq(groupInvites.status, 'pending'),
            ne(groupInvites.id, inviteId),
            isNull(groupInvites.deletedAt),
          ),
        )
      await this.cancelInvites(
        tx,
        otherReceivedInvites.map((invite) => invite.id),
        now,
      )

      if (currentMemberCount + 1 === 6) {
        const remainingGroupInvites = await tx
          .select({ id: groupInvites.id })
          .from(groupInvites)
          .where(
            and(
              eq(groupInvites.groupId, group.id),
              eq(groupInvites.status, 'pending'),
              ne(groupInvites.id, inviteId),
              isNull(groupInvites.deletedAt),
            ),
          )
        await this.cancelInvites(
          tx,
          remainingGroupInvites.map((invite) => invite.id),
          now,
        )
      }

      return { ok: true as const, id: inviteId, status: 'accepted' as const, groupId: group.id }
    })
  }

  private async cancelInvites(
    tx: DrizzleTransactionClient,
    inviteIds: string[],
    cancelledAt: Date,
  ) {
    if (inviteIds.length === 0) return
    await tx
      .update(groupInvites)
      .set({ status: 'cancelled', updatedAt: cancelledAt })
      .where(inArray(groupInvites.id, inviteIds))
    await tx
      .update(notifications)
      .set({ readAt: cancelledAt, updatedAt: cancelledAt })
      .where(inArray(notifications.groupInviteId, inviteIds))
  }

  private selectNotification(notificationId: string) {
    return this.database.db
      .select(notificationSelection)
      .from(notifications)
      .leftJoin(groupInvites, eq(notifications.groupInviteId, groupInvites.id))
      .leftJoin(groups, eq(groupInvites.groupId, groups.id))
      .leftJoin(inviters, eq(groupInvites.inviterId, inviters.id))
      .where(and(eq(notifications.id, notificationId), isNull(notifications.deletedAt)))
  }

  private async findLedGroup(requester: UserMetadata) {
    if (requester.role !== 'student') return undefined
    const [group] = await this.database.db
      .select({ id: groups.id, friendlyId: groups.friendlyId, leaderId: groups.leaderId })
      .from(groups)
      .where(and(eq(groups.leaderId, requester.userId), isNull(groups.deletedAt)))
    return group
  }
}
