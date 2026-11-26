import { type AnyPgColumn, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { classrooms } from './classroom'
import { users } from './user'

const groupTable = pgTable('Group', {
  id: uuid('id').defaultRandom().primaryKey(),
  friendlyId: varchar('friendly_id', { length: 30 }).notNull(),
  leaderId: uuid('leader_id')
    .references((): AnyPgColumn => users.id)
    .notNull(),
  classroomId: uuid('classroom_id').references((): AnyPgColumn => classrooms.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const groupPublicColumns = {
  id: groupTable.id,
  friendlyId: groupTable.friendlyId,
  leaderId: groupTable.leaderId,
  classroomId: groupTable.classroomId,
  createdAt: groupTable.createdAt,
  updatedAt: groupTable.updatedAt,
  deletedAt: groupTable.deletedAt,
}

export { groupTable as groups }
