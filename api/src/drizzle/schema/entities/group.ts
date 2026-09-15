import { type AnyPgColumn, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './user'

const groupTable = pgTable('Group', {
  id: uuid('id').defaultRandom().primaryKey(),
  friendlyId: varchar('friendly_id', { length: 30 }).notNull(),
  creatorId: uuid('creator_id').references((): AnyPgColumn => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})


export { groupTable as groups }
