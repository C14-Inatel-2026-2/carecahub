import { relations, sql } from 'drizzle-orm'
import { integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { groupInviteStatusEnum, notificationTypeEnum } from '../enums/notificationEnums'
import { activities, activitySubmissions } from './activity'
import { groups } from './group'
import { users } from './user'

const groupInviteTable = pgTable(
  'GroupInvite',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    inviterId: uuid('inviter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    inviteeId: uuid('invitee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: groupInviteStatusEnum('status').notNull().default('pending'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('GroupInvite_pending_group_invitee_unique')
      .on(table.groupId, table.inviteeId)
      .where(sql`${table.status} = 'pending' and ${table.deletedAt} is null`),
  ],
)

const notificationTable = pgTable(
  'Notification',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: notificationTypeEnum('type').notNull(),
    groupInviteId: uuid('group_invite_id')
      .unique()
      .references(() => groupInviteTable.id, { onDelete: 'restrict' }),
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'restrict' }),
    submissionId: uuid('submission_id').references(() => activitySubmissions.id, {
      onDelete: 'restrict',
    }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'restrict' }),
    deadlineRevision: integer('deadline_revision'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('Notification_activity_reminder_unique')
      .on(table.userId, table.activityId, table.groupId, table.type, table.deadlineRevision)
      .where(
        sql`${table.activityId} is not null and ${table.groupId} is not null and ${table.deadlineRevision} is not null`,
      ),
  ],
)

export const groupInvitePublicColumns = {
  id: groupInviteTable.id,
  groupId: groupInviteTable.groupId,
  inviterId: groupInviteTable.inviterId,
  inviteeId: groupInviteTable.inviteeId,
  status: groupInviteTable.status,
  respondedAt: groupInviteTable.respondedAt,
  createdAt: groupInviteTable.createdAt,
  updatedAt: groupInviteTable.updatedAt,
  deletedAt: groupInviteTable.deletedAt,
}

export const notificationPublicColumns = {
  id: notificationTable.id,
  userId: notificationTable.userId,
  type: notificationTable.type,
  groupInviteId: notificationTable.groupInviteId,
  activityId: notificationTable.activityId,
  submissionId: notificationTable.submissionId,
  actorId: notificationTable.actorId,
  groupId: notificationTable.groupId,
  deadlineRevision: notificationTable.deadlineRevision,
  readAt: notificationTable.readAt,
  createdAt: notificationTable.createdAt,
  updatedAt: notificationTable.updatedAt,
  deletedAt: notificationTable.deletedAt,
}

export const groupInviteRelations = relations(groupInviteTable, ({ one }) => ({
  group: one(groups, {
    fields: [groupInviteTable.groupId],
    references: [groups.id],
  }),
  inviter: one(users, {
    relationName: 'groupInviteInviter',
    fields: [groupInviteTable.inviterId],
    references: [users.id],
  }),
  invitee: one(users, {
    relationName: 'groupInviteInvitee',
    fields: [groupInviteTable.inviteeId],
    references: [users.id],
  }),
  notification: one(notificationTable),
}))

export const notificationRelations = relations(notificationTable, ({ one }) => ({
  user: one(users, {
    fields: [notificationTable.userId],
    references: [users.id],
  }),
  groupInvite: one(groupInviteTable, {
    fields: [notificationTable.groupInviteId],
    references: [groupInviteTable.id],
  }),
}))

export { groupInviteTable as groupInvites, notificationTable as notifications }
