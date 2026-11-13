import { relations } from 'drizzle-orm'
import { boolean, pgTable, real, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { activities } from './activity'
import { groups } from './group'
import { users } from './user'

const submissionTable = pgTable(
  'Submission',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity')
      .notNull()
      .references(() => activities.id),
    groupId: uuid('group')
      .notNull()
      .references(() => groups.id),
    submittedById: uuid('submitted_by')
      .notNull()
      .references(() => users.id),
    url: varchar('url', { length: 500 }).notNull(),
    isLate: boolean('is_late').notNull().default(false),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    grade: real('grade'),
    feedback: text('feedback'),
    gradedById: uuid('graded_by').references(() => users.id),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('Submission_activity_group_unique').on(table.activityId, table.groupId)],
)

const submissionRelations = relations(submissionTable, ({ one }) => ({
  activity: one(activities, {
    fields: [submissionTable.activityId],
    references: [activities.id],
  }),
  group: one(groups, {
    fields: [submissionTable.groupId],
    references: [groups.id],
  }),
  submittedBy: one(users, {
    fields: [submissionTable.submittedById],
    references: [users.id],
  }),
}))

export { submissionRelations, submissionTable as submissions }
