import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './user'

const activityTable = pgTable('Activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  allowLateSubmissions: boolean('allow_late_submissions').notNull().default(false),
  createdById: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

const activityRelations = relations(activityTable, ({ one }) => ({
  createdBy: one(users, {
    fields: [activityTable.createdById],
    references: [users.id],
  }),
}))

export { activityRelations, activityTable as activities }
